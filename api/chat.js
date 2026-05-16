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
- top3Gaps는 가장 부족한 3개를 골라 우선순위로 정렬`;

  try {
    // 모드 분기: PDF 있으면 보장분석 모드, 없으면 기존 텍스트 채팅 모드
    const isPdfMode = !!pdfPart;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const parts = isPdfMode
      ? [{ text: pdfAnalysisPrompt }, pdfPart, { text: '\n\n사용자 요청: ' + message }]
      : [{ text: systemPrompt + '\n\n사용자 질문: ' + message }];
    const generationConfig = isPdfMode
      ? { temperature: 0.2, maxOutputTokens: 2500, topP: 0.9, responseMimeType: 'application/json' }
      : { temperature: 0.7, maxOutputTokens: 500, topP: 0.9 };

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
