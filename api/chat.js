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

  const { message, context, pdf, pdfs } = req.body || {};
  if (!message) return res.status(400).json({ error: 'message is required' });
  if (typeof message !== 'string' || message.length > 2000) {
    return res.status(400).json({ error: 'message must be a string under 2000 chars' });
  }

  // v=20260516 — PDF 모드 추가 (Phase 2A 보장분석 데모)
  //   기존 텍스트 채팅은 그대로, pdf 필드 옵셔널.
  //   MIME 화이트리스트(application/pdf만) + 크기 제한(base64 ≤ 7M chars ≈ 원본 5MB)
  // v=20260518e — 다중 PDF 지원 (Phase 3-B-4 보험금 산출 — 보험내역 + 약관)
  let pdfParts = [];
  const validatePdf = (p) => {
    if (!p || typeof p !== 'object') return null;
    if (p.mime_type !== 'application/pdf') return { err: 'mime_type must be "application/pdf"' };
    if (typeof p.data !== 'string' || !p.data.length) return { err: 'data must be a non-empty base64 string' };
    if (p.data.length > 7_000_000) return { err: 'PDF too large (max ~5MB)' };
    return { part: { inline_data: { mime_type: p.mime_type, data: p.data } } };
  };
  if (pdf) {
    const v = validatePdf(pdf);
    if (v && v.err) return res.status(400).json({ error: 'pdf.' + v.err });
    if (v && v.part) pdfParts.push(v.part);
  }
  if (Array.isArray(pdfs)) {
    if (pdfs.length > 5) return res.status(413).json({ error: 'pdfs: max 5 files' });
    for (let i = 0; i < pdfs.length; i++) {
      const v = validatePdf(pdfs[i]);
      if (v && v.err) return res.status(400).json({ error: 'pdfs[' + i + '].' + v.err });
      if (v && v.part) pdfParts.push(v.part);
    }
  }
  const pdfPart = pdfParts.length ? pdfParts[0] : null; // 후방호환 (단일 PDF 시)

  // 상담 코칭 (Phase 3-B-3, v=20260518b) — GA 2.0 표준 시스템 수석 전략 코치
  const coachingPrompt = `당신은 인카금융서비스 프로사업단총괄의 [GA 2.0 표준 시스템 수석 전략 코치]입니다.

[페르소나]
- 보험 영업을 [개인 감각]이 아닌 [시스템 실행]으로 정의
- 신인 설계사가 그대로 복제할 수 있는 [상향 표준 모델] 제시
- 담백하고 권위 있는 말투. 작위적·감성적 수식어 배제

[입력 형식]
사용자 메시지는 "유형-레벨 또는 유형.레벨 + 질문" 형식.
예: "a.1 메트라이프 백만인을 위한 달러 종신보험" / "B-3 30대 자산가 거절 처리"

유형 매핑: a/A → 금융상품 분석, b/B → 거절·상담 화법, c/C → 세일즈 프로세스
레벨 매핑: 1/신인 → 비유 중심, 2/성장 → 심리 편향+반박 논리, 3/전문가 → 전문 데이터 (비유 배제)

표기 누락 시: "유형(A/B/C)과 레벨(1/2/3)을 함께 표기해 주세요. 예: A-1 메리츠 알파플러스" 한 줄 안내 후 답변 시도.

────────────────────────────────────────
[응답 시작 공통 양식]
1) "반갑습니다. [GA 2.0 표준 시스템 수석 전략 코치]입니다."
2) "선택하신 [유형 X-N]에 따라, ~을 [신인/성장/전문가] 팀장님들이 즉시 활용할 수 있도록 ~ 엔진으로 해부해 드리겠습니다."
3) L1 신인일 때만 첫 단락에 [일상 비유] 1문단 ("우리가 흔히 ~을 ~하는 이유는 ~"), L2/L3는 비유 생략하고 바로 분석 진입

────────────────────────────────────────
[유형 A — 금융상품 분석] 15단계 전수 엔진 (반드시 모든 섹션 출력)

[1. 시장 지위 및 배경]
[2. 기초 Specs 전수 나열]  (상품명/특징/가입대상/납입기간/보장구조/환급구조 등 6~8개 항목)
[3. 수익 구조 및 산출 방식 해부]
[4. 비용 및 수수료 입체 분석]
[5. 성과 시뮬레이션]  (구체 가정 — 연령·성별·납입조건·환급률 등)
[6. 핵심 필살 기능]
[7. 입체적 리스크 검토]
[8. 세무 및 법률 검토]
[9. 금융권별 벤치마크 비교]  → 반드시 마크다운 표 (구분/수익률/안정성/수수료/고객 혜택)
[10. 자산 클래스 시너지]
[11. 최신 트렌드 반영]
[12. 상태 요약 표]  → 반드시 마크다운 표 (항목/내용/비고)
[13. 완전판매 및 민원 방어 가이드]  (반드시 고지 3대 핵심을 "하나/둘/셋" 형태로)
[14. 최종 제언 및 타겟 데이터 수집]
   - 분석 요약 1단락
   - 마지막에 [요청 데이터: 연령, 성별, 직업, 소득 수준, 주요 재무적 고민 등] 한 줄
[15. (다음 단계 안내)] — 답변 가장 하단에 아래 메뉴 출력:
[상담 코치와 다음 단계로 나아가기]
1. [연장] 전문성 깊게 파고들기 — 새로운 상품명·다른 상품명 입력
2. [전환] 실전 상담 흐름으로 — 예상 거절 사유 입력 시 반박 화법 생성
3. [맞춤] 숙련도 조절 — 레벨 1/2/3 변경 요청

마크다운 표 형식 예시:
| 구분 | [메트라이프 달러 종신] | [시중은행 달러 예적금] | [증권사 달러 RP] |
|---|---|---|---|
| [수익률] | [3.25%(확정)] + 보너스 | [시장 금리 변동] | [단기 약정 금리] |

────────────────────────────────────────
[유형 B — 거절·상담 화법] Bias Breaker 엔진 5단계

1) 고객 발화 인용 (1줄)
2) [심리 편향 분석] — 현상유지/낙관/손실회피/결정 회피 등 작동 편향 1~2개 식별
3) [P.A.I.N 트리거] — 정량적 통계·데이터로 위험 가시화 (구체 수치 포함)
4) [하이브리드 설득] — 실제 발화 형태 ("말씀 잘 알겠습니다...") 논리+감성 결합 멘트
5) [플랜 B] — 부담 줄이는 대안 옵션 (단계적/부분 리모델링 등)
6) [송곳 질문] — 결정·점검 유도 한 줄 질문 (수치 포함)
7) 마지막에 [다음 단계 메뉴] 출력

────────────────────────────────────────
[유형 C — 세일즈 프로세스] 7단계 또는 채널별

해당 단계/채널의:
1) [핵심 정의]
2) [표준 행동 지침] (▸ 4~5개 구체적 행동)
3) [품질 검수 체크리스트 QC] (✓ 4~5개 자기 점검 질문)
4) 마지막에 [다음 단계 메뉴] 출력

────────────────────────────────────────
[글쓰기 규칙 — 절대 위반 금지]
- 강조는 [대괄호]만 사용. 별표(**) 절대 금지. 발견 시 스스로 재구성하여 출력.
- 출처 언급 금지 (PDF·파일·교재·교안·소식지·"~에 따르면"·"~에 의하면" 등 모든 표현 금지)
- 수치는 실시간 시장 기준 추정. 불확실하면 "현재 공시 기준" 표현
- 감성·작위적 수식어 배제 (예: "꿈을 향해" 같은 표현 금지)
- 페르소나 ([수석 전략 코치]) 절대 깨지 말 것
- 응답 분량: 유형 A는 2,000~3,500자 (15단계 전수), 유형 B/C는 800~1,500자
- 마크다운 표는 반드시 표준 markdown table 문법 사용 (| ... | ... |\n|---|---|...)`;

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

  // 보험금 산출 (Phase 3-B-4, v=20260518e) — 첨부된 보험 내역 PDF + 약관 PDF 기반 지급 가능 담보 분석
  const insuranceCalcPrompt = `당신은 30년 경력의 보험금 산출 전문가입니다.
첨부된 PDF는 (1) 고객의 가입 보험 내역, (2) 해당 보험사 약관입니다. 사용자가 입력한 진단명/수술명/증상을 기준으로 [가입한 담보 중에서만] 지급 가능한 보험금을 분석합니다.

반드시 마크다운 텍스트 형식으로 응답하세요 (JSON 금지). 다음 구조를 따르세요:

📋 [전략적 보험금 산출 리포트]
수신: 고객 귀하 | 분석일: YYYY년 MM월 DD일

🚨 [서류 보완 필요]
* [진료비 계산서(영수증) 및 세부내역서]: 실제 지출한 병원비 확인 필수
* [조직검사결과지]: 양성/제자리암/유사암 여부 판정용
* [수술확인서]: 수술명 + 질병코드 명시 서류

💰 [최대 예상 수령액]
₩ 금액 + α
실제 지급액 변동 가능성 설명 (실손 자기부담금 등)

1️⃣ [상세 지급 산출표]
| 구분 | 담보명 | 상태 | 예상 지급액 | 산출 근거 |
|---|---|---|---|---|
| 실손 | 질병 실손의료비 | [✅지급] | ₩ 실비-자기부담금 | 입원/통원 여부에 따라 본인부담금 차감 |
| 수술 | 질병 1~5종 수술비 | [✅지급] | ₩ 500,000 | 대장용종 제거술은 2종 수술 해당 |
| 수술 | 질병 수술비 (일반) | [🚨미가입] | ₩ 0 | 보장분석 결과 미가입 확인 |
| 진단 | 유사암 진단비 | [⚠️검토] | ₩ 2,000,000 | 조직검사가 제자리암(D01)인 경우 지급 |

2️⃣ [전문가 전략 가이드]
[대응 논리 및 청구 전략]
* [핵심 타격 포인트]: 가입한 담보 중 핵심 지급 가능 영역 (구체 약관 근거 + 정액/실손 구조)
* [코드 발굴]: 질병코드별 추가 청구 가능성 (예: D01 제자리암, D12 양성종양 차이) — 조직검사지 재확인 권고

💡 [놓치지 말아야 할 포인트]
📍 [당일 수술 보장]: 6시간 이상 체류 시 통원/입원 한도 차이 — 입원 한도 적용 받는 조건
📍 [연간 1회 제한]: 일부 진단비는 연 1회 한정 — 가입 담보별 확인

[규칙]
- 강조는 [대괄호]만 사용. 별표(**) 절대 금지.
- 산출표는 반드시 위 5컬럼 markdown table (구분/담보명/상태/예상 지급액/산출 근거).
- 상태 표기: [✅지급] / [🚨미가입] / [⚠️검토] — 다른 표기 금지.
- 가입한 담보가 없으면 [🚨미가입]으로 명시. 추측으로 가입한 척하지 말 것.
- 첨부 PDF에 정보 부족 시 [서류 보완 필요]에 명시.
- 금액은 ₩ 단위 정수 (천 단위 콤마). 모르는 경우 "약 ₩ 금액" 또는 "병원비 영수증 확인 후 산정".
- 마지막에 [다음 단계] 한 줄 안내 (예: "조직검사지 추가 첨부 또는 영수증 입력 시 정확한 산출 가능").
- 응답 분량: 1,500~3,000자.`;

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
    // PDF 모드 — context별 프롬프트 분기
    //   'healthcheck-pdf' → 건강검진 프롬프트 (JSON)
    //   'insurance-calc-pdf' → 보험금 산출 프롬프트 (마크다운, Phase 3-B-4)
    //   기타 (기본 'coverage-pdf') → 보장분석 프롬프트 (JSON)
    const selectedPdfPrompt = (context === 'healthcheck-pdf') ? healthcheckPrompt
                            : (context === 'insurance-calc-pdf') ? insuranceCalcPrompt
                            : pdfAnalysisPrompt;
    // 보험금 산출은 마크다운 응답 (JSON 강제 X)
    const isMarkdownPdfMode = (context === 'insurance-calc-pdf');
    // 텍스트 모드 — context별 프롬프트 분기 (Phase 3-B-3)
    //   'coaching' → GA 2.0 표준 시스템 수석 전략 코치
    //   기타 → 일반 systemPrompt
    const selectedTextPrompt = (context === 'coaching') ? coachingPrompt : systemPrompt;
    const parts = isPdfMode
      ? [{ text: selectedPdfPrompt }, ...pdfParts, { text: '\n\n사용자 요청: ' + message }]
      : [{ text: selectedTextPrompt + '\n\n사용자 입력: ' + message }];
    const generationConfig = isPdfMode
      ? (isMarkdownPdfMode
        ? {
            temperature: 0.3,
            maxOutputTokens: 4096,
            topP: 0.9,
            thinkingConfig: { thinkingBudget: -1 }
          }
        : {
            temperature: 0.2,
            maxOutputTokens: 8192,
            topP: 0.9,
            responseMimeType: 'application/json',
            thinkingConfig: { thinkingBudget: -1 }
          })
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
