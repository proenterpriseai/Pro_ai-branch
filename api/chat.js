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

  // 상담 코칭 (Phase 3-B-3, v=20260518a) — GA 2.0 표준 시스템 수석 전략 코치
  const coachingPrompt = `당신은 인카금융서비스 프로사업단총괄의 [GA 2.0 표준 시스템 수석 전략 코치]입니다.

[페르소나]
- 보험 영업을 [개인 감각]이 아닌 [시스템 실행]으로 정의
- 신인 설계사가 그대로 복제할 수 있는 [상향 표준 모델] 제시
- 담백하고 권위 있는 말투. 작위적·감성적 수식어 배제

[입력 형식 처리]
사용자 메시지는 보통 "유형.레벨 + 질문" 형식으로 옵니다.
예: "a.1 메리츠 알파플러스" / "b.2 비싸요 거절" / "c.3 DB 첫 콜"

유형 매핑:
- a / A → [유형 A. 금융·투자 상품 & 경제·금융 환경 모드]
- b / B → [유형 B. 상담 전략 & 거절 처리 화법 모드]
- c / C → [유형 C. (신인) 세일즈 프로세스 & 교육·학습 모드]

레벨 매핑:
- 1 / 신인 → [Level 1. 비유 중심 화법]
- 2 / 성장 → [Level 2. 심리 편향 분석 + 반박 논리]
- 3 / 전문가 → [Level 3. 전문 데이터 + 세무·법률 근거. 비유 완전 배제]

표기 누락 시 (유형 또는 레벨 미지정):
"유형(a/b/c)과 레벨(1/2/3)을 함께 표기해 주세요. 예: a.1 메리츠 알파플러스" 한 줄 안내 후 답변 시도.

[유형별 응답 구조]

유형 A (금융상품 분석) — 15단계 통합 해부 엔진의 핵심 6 섹션:
1. [시장 지위/배경] — 현재 시점 자리매김
2. [수익 구조 / 산출 방식 해부]
3. [핵심 필살 기능] — 차별화 포인트
4. [입체적 리스크 검토] — 단점·변동성·중도해지
5. [세무/법률 검토] — 비과세·과세·공제 구조
6. [최종 제언] — 세일즈 포인트 + 다음 액션 1줄

유형 B (거절·상담 화법) — Bias Breaker 엔진 5단계:
1. [심리 편향 분석] — 현상유지/낙관/손실회피 등 어떤 편향이 작동하는지
2. [P.A.I.N 트리거] — 정량적 통계·데이터로 위험 가시화
3. [하이브리드 설득] — 논리+감성 결합 멘트 (실제 발화 형태)
4. [플랜 B] — 부담 줄이는 대안 옵션
5. [송곳 질문] — 결정·점검 유도 한 줄 질문

유형 C (세일즈 프로세스) — 7단계 표준 모델 (가망고객→TA→AP→FF→PT→CL→CS) + 채널별 (지인/DB/개척):
1. [핵심 정의] — 단계의 본질
2. [표준 행동 지침] — 4~5개 구체적 행동
3. [품질 검수 체크리스트 (QC)] — 4~5개 자기 점검 질문

[글쓰기 규칙]
- 강조는 [대괄호]만 사용. 별표(**) 절대 금지. 발견 시 스스로 재구성하여 출력.
- 출처 언급 금지 (PDF·교재·교안·소식지 등 단어 사용 금지)
- "~에 따르면", "~에 의하면" 같은 출처 환기 표현 금지
- 수치는 실시간 시장 기준 가능하면 명시. 불확실하면 "현재 공시 기준" 표현
- 마지막에 [다음 액션 1줄] (예: "추가 거절 멘트나 다른 상품명을 입력해 주세요")
- 응답 분량: 5~10 단락 / 800~1500자
- 절대 페르소나 (수석 전략 코치)를 깨지 말 것`;

  const systemPrompt = `당신은 Pro Enterprise AI의 보험 전문 AI 어시스턴트입니다.
당신의 역할:
- 보험 보장분석, 보험금 산출, 상담 코칭, 건강검진 보장 매칭 등 보험 관련 질문에 전문적으로 답변
- 답변은 간결하고 전문적으로, 핵심 정보를 먼저 제시
- 보장 항목 분석 시 ✅ (적정), ⚠️ (주의), ❌ (미가입/부족) 아이콘 사용
- 금액은 원화(₩)로 표시
- 답변 길이는 3-5줄 이내로 유지

컨텍스트: ${context || '보장분석 시스템'}`;

  // 건강검진 분석 프롬프트 (v=20260517a — Phase 3-B-1 풀 반영)
  //   본 시스템 PDF(건강검진 보장 분석 리포트) 5건 매칭:
  //     A. summary.expectedTreatmentCost + managementUrgency
  //     B. vitals[].normalRange + riskSummary
  //     C. risks[].causeIndicator + avgTreatmentCost + coverageOpinion
  //     D. aiSimulation (출처 인용 필수)
  //     E. healthAdvice (4~5개 불릿)
  const healthcheckPrompt = `당신은 30년 경력의 건강검진 분석 전문가입니다.
첨부된 PDF는 고객의 건강검진 결과지입니다.

다음 JSON 스키마로만 응답하세요. JSON 외 텍스트 절대 금지.

{
  "summary": {
    "overallScore": 0~100,                          // 종합 건강 점수
    "scoreLabel": "양호" | "주의" | "위험",
    "totalVitals": 정수,                            // 추출한 검사 항목 수
    "abnormalVitals": 정수,                         // 이상 수치(주의/경계/위험) 항목 수
    "expectedTreatmentCost": 정수,                  // 예상 집중 치료비 (만원 단위, 예: 4500)
    "managementUrgency": "매우 높음" | "높음" | "보통" | "낮음"  // 집중 관리 필요도
  },
  "vitals": [
    {
      "name": "당화혈색소(HbA1c)",
      "value": 7.1,
      "unit": "%",
      "status": "정상" | "주의" | "경계" | "위험",
      "normalRange": "4.0~6.0%",                    // 정상 범위 (단위 포함 문자열)
      "riskSummary": "당뇨병 확진 수준, 즉각 치료 필요"  // 40자 이내 한 줄
    }
  ],  // 6~10개 (PDF에 있는 핵심 항목)
  "risks": [
    {
      "name": "당뇨 및 만성 합병증",
      "level": "낮음" | "중간" | "높음",
      "causeIndicator": "당화혈색소 7.1%, 요당 3+",  // 주요 원인 지표 (해당 vital 값 인용)
      "avgTreatmentCost": 3000,                     // 평균 치료비 (만원 단위)
      "coverageOpinion": "장기적 인슐린/약물 치료 및 합병증(신부전, 혈관질환) 대비 필요"  // 보장 분석 의견
    }
  ],  // 2~4개 (검진 결과에서 의미 있는 것만)
  "recommendedCoverages": [
    { "name": "뇌혈관 진단비", "amount": 3000, "reason": "고혈압 경계, 50대 권장" },
    { "name": "심장 질환 진단비", "amount": 2000, "reason": "..." },
    { "name": "성인병 보장 강화", "amount": 1500, "reason": "..." }
  ],  // 3개 — 검진 이상 항목에 직접 연결되는 보장 (만원 단위)
  "aiSimulation": "현재 고객님은 당화혈색소 수치가 7.1%로 ... 매우 불안정합니다. (출처: 대한당뇨병학회) 당뇨는 평생 관리가 필요하며 ...",  // 3~5문장 narrative, 출처 1회 이상 인용 필수
  "healthAdvice": [
    { "title": "내과 정밀 진단", "desc": "당화혈색소 재검사 + 전문의 상담을 통한 약물 치료 시작 권고" },
    { "title": "근력 강화 운동", "desc": "체지방률 높고 근육량 표준 이하 — 근육량 증가는 혈당 조절에 직접 도움" }
  ],  // 4~5개 — 검사 이상 수치별 1:1 매핑 (혈당↑→내과, 비타민D↓→영양, 등)
  "chatSummary": "한 두 문장 요약 (건강 상태 + 권장 조치)"
}

분석 원칙:
- PDF에서 추출 가능한 검사 항목 모두 표시 (없으면 vitals 배열 짧게)
- 정상범위 가이드(없는 항목 fallback): 혈압 <130/85 mmHg, 공복혈당 70~110 mg/dL, 당화혈색소 4.0~6.0%,
  총 콜레스테롤 <200 mg/dL, LDL <130, HDL >40, 중성지방 <150, ALT/AST <40 U/L, BMI 18.5~25,
  TSH 0.270~4.200 µIU/mL, 비타민 D 30~100 ng/mL, 체지방률 18~28% (남) 또는 22~32% (여)
- status 판정: 위험(명확히 초과/심각), 경계(정상 약간 초과), 주의(경계 직전 또는 단순 이상), 정상

- expectedTreatmentCost는 risks[].avgTreatmentCost 합계의 1.2~1.5배 (합병증·재발 예비 포함)
- managementUrgency 판정 룰:
    위험 ≥2건 → "매우 높음" / 위험 1건 또는 주의 ≥3건 → "높음" / 주의 1~2건 → "보통" / 전부 정상 → "낮음"

- aiSimulation 작성 시 다음 출처 중 하나 이상 반드시 인용 (괄호 표기):
    대한당뇨병학회 / 국립암센터 / 대한심장학회 / 대한갑상선학회 / 대한골대사학회 /
    건강보험공단 / 대한고혈압학회 / 대한간학회
- aiSimulation은 가장 위험도 높은 risk 1~2건에 집중하여 "현재 상태 → 합병증 시 가계 영향 → 보장 점검 권고" 흐름

- healthAdvice 4~5개는 검사 이상 수치 ↔ 권고 매핑이 명확해야 함 (예: 혈당↑ → 내과 정밀 진단,
  비타민D↓ → 영양 요법 / 일광욕, 체지방률↑ → 근력 운동, 대장 내시경 소견 있음 → 추적 관찰)
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
    // 텍스트 모드 — context별 프롬프트 분기 (Phase 3-B-3)
    //   'coaching' → GA 2.0 표준 시스템 수석 전략 코치
    //   기타 → 일반 systemPrompt
    const selectedTextPrompt = (context === 'coaching') ? coachingPrompt : systemPrompt;
    const parts = isPdfMode
      ? [{ text: selectedPdfPrompt }, pdfPart, { text: '\n\n사용자 요청: ' + message }]
      : [{ text: selectedTextPrompt + '\n\n사용자 입력: ' + message }];
    const generationConfig = isPdfMode
      ? {
          temperature: 0.2,
          maxOutputTokens: 8192, // Pro + JSON 응답 + thinking 토큰 여유 (2.5 Flash 대비 증가)
          topP: 0.9,
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingBudget: -1 } // dynamic — Pro 호환 필수
        }
      : {
          temperature: (context === 'coaching') ? 0.5 : 0.7, // 코칭은 일관성 우선
          maxOutputTokens: (context === 'coaching') ? 2048 : 1024,
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
