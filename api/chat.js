// ── IP별 레이트 리밋 (인메모리, 분당 10회) ──
// Vercel Serverless는 인스턴스 재활용 시에만 유지되지만, 기본 방어로 충분
const RATE_LIMIT = { windowMs: 60 * 1000, max: 10 };
const ipStore = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const rec = ipStore.get(ip) || { count: 0, reset: now + RATE_LIMIT.windowMs };
  if (now > rec.reset) { rec.count = 0; rec.reset = now + RATE_LIMIT.windowMs; }
  rec.count += 1;
  ipStore.set(ip, rec);
  if (ipStore.size > 5000) {
    for (const [k, v] of ipStore) if (now > v.reset) ipStore.delete(k);
  }
  return rec.count <= RATE_LIMIT.max;
}

// ── Origin 화이트리스트 ──
// 로컬 개발 + Vercel 배포 + 커스텀 도메인 + ALLOWED_ORIGINS 환경변수
function buildAllowList() {
  const list = [
    'http://localhost:3098',
    'http://127.0.0.1:3098',
  ];
  const envExtra = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  return list.concat(envExtra);
}
const VERCEL_HOST_RE = /^https:\/\/([a-z0-9-]+\.)*vercel\.app$/i;

function isOriginAllowed(origin) {
  if (!origin) return false;
  const allow = buildAllowList();
  if (allow.includes(origin)) return true;
  if (VERCEL_HOST_RE.test(origin)) return true;
  return false;
}

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  const allowed = isOriginAllowed(origin);

  // CORS — 허용된 Origin만 반사
  if (allowed) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Origin 차단
  if (!allowed) return res.status(403).json({ error: 'Origin not allowed' });

  // 레이트 리밋 (X-Forwarded-For 우선, 없으면 remoteAddress)
  const xff = (req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const ip = xff || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    res.setHeader('Retry-After', '60');
    return res.status(429).json({ error: 'Too many requests. 분당 10회 제한을 초과했습니다.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });

  const { message, context, pdf } = req.body || {};
  if (!message) return res.status(400).json({ error: 'message is required' });
  if (typeof message !== 'string' || message.length > 2000) {
    return res.status(400).json({ error: 'message must be a string under 2000 chars' });
  }

  // v=20260516 — PDF 모드 추가 (Phase 2A 보장분석 데모)
  //   기존 텍스트 채팅은 그대로, pdf 필드 옵셔널.
  //   MIME 화이트리스트(application/pdf만) + 크기 제한(base64 ≤ 7M chars ≈ 원본 5MB)
  let pdfPart = null;
  if (pdf) {
    if (!pdf.mime_type || pdf.mime_type !== 'application/pdf') {
      return res.status(400).json({ error: 'pdf.mime_type must be "application/pdf"' });
    }
    if (typeof pdf.data !== 'string' || !pdf.data.length) {
      return res.status(400).json({ error: 'pdf.data must be a non-empty base64 string' });
    }
    if (pdf.data.length > 7_000_000) {
      return res.status(413).json({ error: 'PDF too large (max ~5MB)' });
    }
    pdfPart = { inline_data: { mime_type: pdf.mime_type, data: pdf.data } };
  }

  const systemPrompt = `당신은 Pro Enterprise AI의 보험 전문 AI 어시스턴트입니다.
당신의 역할:
- 보험 보장분석, 보험금 산출, 상담 코칭, 건강검진 보장 매칭 등 보험 관련 질문에 전문적으로 답변
- 답변은 간결하고 전문적으로, 핵심 정보를 먼저 제시
- 보장 항목 분석 시 ✅ (적정), ⚠️ (주의), ❌ (미가입/부족) 아이콘 사용
- 금액은 원화(₩)로 표시
- 답변 길이는 3-5줄 이내로 유지

컨텍스트: ${context || '보장분석 시스템'}`;

  // 건강검진 분석 프롬프트 (v=20260516g — Phase 3-B-1)
  const healthcheckPrompt = `당신은 30년 경력의 건강검진 분석 전문가입니다.
첨부된 PDF는 고객의 건강검진 결과지입니다.

다음 JSON 스키마로만 응답하세요. JSON 외 텍스트 절대 금지.

{
  "summary": {
    "overallScore": 0~100,             // 종합 건강 점수 (대략적)
    "scoreLabel": "양호" | "주의" | "위험",
    "totalVitals": 정수,                // 추출한 검사 항목 수
    "abnormalVitals": 정수              // 이상 수치(주의/경계/위험) 항목 수
  },
  "vitals": [
    { "name": "수축기 혈압", "value": 130, "unit": "mmHg", "status": "정상" | "주의" | "경계" | "위험" },
    { "name": "이완기 혈압", "value": 85, "unit": "mmHg", "status": "..." },
    { "name": "공복 혈당", "value": 95, "unit": "mg/dL", "status": "..." },
    { "name": "총 콜레스테롤", "value": 240, "unit": "mg/dL", "status": "..." },
    { "name": "LDL 콜레스테롤", ... },
    { "name": "HDL 콜레스테롤", ... },
    { "name": "중성지방", ... },
    { "name": "간 수치 ALT", ... },
    { "name": "간 수치 AST", ... },
    { "name": "BMI", ... }
  ],  // 8~12개 핵심 검사 항목 (PDF에 있는 만큼)
  "risks": [
    { "name": "심혈관 질환", "level": "낮음" | "중간" | "높음", "reason": "한 줄 사유 (40자 이내)" },
    { "name": "당뇨병", "level": "...", "reason": "..." },
    { "name": "간 질환", "level": "...", "reason": "..." }
  ],  // 3~5개 (PDF 결과에서 의미 있는 것만)
  "recommendedCoverages": [
    { "name": "뇌혈관 진단비", "amount": 3000, "reason": "고혈압 경계, 50대 권장" },
    { "name": "심장 질환 진단비", "amount": 2000, "reason": "..." },
    { "name": "성인병 보장 강화", "amount": 1500, "reason": "..." }
  ],  // 3개 고정 — 검진 결과에 기반한 보험 담보 추천 (만원 단위)
  "chatSummary": "한 두 문장 요약 (건강 상태 + 권장 조치)"
}

분석 원칙:
- PDF에서 추출 가능한 검사 항목 모두 표시 (없으면 vitals 배열 짧게)
- 정상범위: 혈압 <130/85, 공복혈당 <100, 총 콜레스테롤 <200, LDL <130, HDL >40, 중성지방 <150, 간수치(ALT/AST) <40, BMI 18.5~25
- 경계: 정상범위 약간 초과, 위험: 명확히 초과
- recommendedCoverages는 검진 결과 이상 항목에 직접 연결되는 보장만 (예: 콜레스테롤 높음 → 심혈관 진단비)
- 50~60대 고객 가정`;

  const pdfAnalysisPrompt = `당신은 30년 경력의 보험 보장분석 전문가입니다.
첨부된 PDF는 고객의 보험 가입 내역(신정원 통합 PDF 또는 가입제안서)입니다.

다음 JSON 스키마로만 응답하세요. JSON 외 텍스트 절대 금지.

{
  "summary": {
    "totalContracts": 정수,
    "totalMonthlyPrem": 정수,
    "score": 0~100,
    "scoreLabel": "보강 필요" | "보통" | "충분"
  },
  "categories": [
    { "name": "사망보장", "coverage": 0~100, "status": "✅" | "⚠️" | "❌" },
    { "name": "암진단금", "coverage": 0~100, "status": "..." },
    { "name": "뇌혈관", "coverage": 0~100, "status": "..." },
    { "name": "심장", "coverage": 0~100, "status": "..." },
    { "name": "수술비", "coverage": 0~100, "status": "..." },
    { "name": "의료실비", "coverage": 0~100, "status": "..." },
    { "name": "치료비", "coverage": 0~100, "status": "..." },
    { "name": "치매간병", "coverage": 0~100, "status": "..." }
  ],
  "top3Gaps": [
    {
      "rank": 1,
      "name": "사망보장",
      "currentAmount": 0,
      "recommendedAmount": 30000,
      "reason": "한 줄 사유 (40자 이내)"
    },
    { "rank": 2, ... },
    { "rank": 3, ... }
  ],
  "chatSummary": "분석 요약 한 두 문장 (사용자에게 채팅에 보낼 친근한 톤)"
}

분석 원칙:
- 가입 보험이 적거나 보장이 비어 있으면 솔직히 표시
- 50~60대 고객 가정, 사망/암/실손/수술 우선
- 금액 단위는 항상 만원 (원 ❌)
- 8 카테고리는 위 순서 고정, 누락 금지
- top3Gaps는 가장 부족한 3개를 골라 우선순위로 정렬

⚠️ totalMonthlyPrem(월 보험료 합계) 추출 규칙 (매우 중요):
- PDF에 명시된 모든 보험사·상품의 월 납입 보험료를 정확히 합산하여 "원" 단위 정수로 표기
- 천 단위 콤마(예: 40,000원) 절대 무시하지 말 것 — 40원으로 추출하면 안 됨
- 50~60대 고객 보유 계약 4건의 월 보험료가 40원 또는 100원처럼 비현실적으로 작게 나오면 추출 실패 — 그 경우 차라리 0으로 두기
- 즉 합계가 10,000원(만원) 미만이면 그냥 0으로 표기 (정밀 추출 생략 처리)
- 합리적 추출만 신뢰함 — 의심스러우면 0`;

  try {
    // 모드 분기: PDF 있으면 보장분석 모드, 없으면 기존 텍스트 채팅 모드
    const isPdfMode = !!pdfPart;
    // v=20260516d — gemini-3.1-pro-preview로 재격상 (2026-02-13 출시 SOTA reasoning 모델).
    //   사용자가 처음 요청한 "gemini-3.0-pro" 의도와 일치하는 최신 Pro.
    //   "Our latest SOTA reasoning model with unprecedented depth and nuance,
    //    and powerful multimodal understanding and coding capabilities" (Google AI Studio)
    //   가격: ≤200K tokens — Input $2 / Output $12, >200K — Input $4 / Output $18
    //   Pro 계열 thinking 패턴 유지 (thinkingBudget=-1 dynamic).
    //   preview 모델은 안정 모델 대비 변경 가능성 있으나 SOTA reasoning 가치가 큼.
    const MODEL = 'gemini-3.1-pro-preview';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
    // PDF 모드 — context별 프롬프트 분기 (Phase 3-B-1)
    //   'healthcheck-pdf' → 건강검진 프롬프트
    //   기타 (기본 'coverage-pdf') → 보장분석 프롬프트
    const selectedPdfPrompt = (context === 'healthcheck-pdf') ? healthcheckPrompt : pdfAnalysisPrompt;
    const parts = isPdfMode
      ? [{ text: selectedPdfPrompt }, pdfPart, { text: '\n\n사용자 요청: ' + message }]
      : [{ text: systemPrompt + '\n\n사용자 질문: ' + message }];
    const generationConfig = isPdfMode
      ? {
          temperature: 0.2,
          maxOutputTokens: 8192, // Pro + JSON 응답 + thinking 토큰 여유 (2.5 Flash 대비 증가)
          topP: 0.9,
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingBudget: -1 } // dynamic — Pro 호환 필수
        }
      : {
          temperature: 0.7,
          maxOutputTokens: 1024,
          topP: 0.9,
          thinkingConfig: { thinkingBudget: -1 }
        };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: 'Gemini API error', detail: errText });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '응답을 생성할 수 없습니다.';
    return res.status(200).json({ reply: text });
  } catch (err) {
    return res.status(500).json({ error: 'Internal error', detail: err.message });
  }
}
