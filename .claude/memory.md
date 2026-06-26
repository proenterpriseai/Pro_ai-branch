# ai-branch (Pro Enterprise AI 랜딩) — 세션 메모리

> 상위 규칙은 루트 `CLAUDE.md`. 이 파일은 세션 핸드오프·할 일·다음 첫 질문.
> 배포: GitHub `proenterpriseai/Pro_ai-branch` (main) → Vercel 자동배포 → **ai-branch.vercel.app** (커스텀 도메인 없음).
> 로컬 dev: `node _serve.js` (port 3098). ⚠️ **로컬은 `/api/*` 서버리스 미실행** → 챗봇·문의폼 등 API 흐름은 **배포된 사이트에서만** 작동/테스트.

---

## 2026-06-26b 세션 — A(스트리밍)+①(건강검진 버그)+③(진행 멘트) 구현 + index.html/chat.js 동시 배포

### ✅ 구현 완료 (v=20260626b) — index.html + chat.js 한 묶음
1. **A. 스트리밍 (SSE)**:
   - `api/chat.js`: `body.stream:true` 시 `streamGenerateContent?alt=sse` 호출 → 파싱 후 `data: {"text":"<delta>"}` / `data: [DONE]` 로 SSE 릴레이. **thinking(사고) 파트(`part.thought`) 제외**, generationConfig·프롬프트·thinkingBudget -1 전부 동일 = **품질 불변, 체감속도만↑**. `res.flushHeaders()` + `X-Accel-Buffering:no`. **JSON 강제 PDF 모드(coverage-pdf/healthcheck-pdf)는 `wantStream`에서 제외**(클라가 전체 JSON 파싱하므로). 마크다운 PDF 모드(insurance-calc-pdf/complete-sales-pdf)는 스트리밍 OK.
   - `index.html`: `doSend` fetch 체인 → `_solStreamReply(requestBody, text, typingId)` 단일 호출로 교체. 신규 함수 `_solStreamChat`(ReadableStream getReader+TextDecoder로 SSE 파싱) / `_solCreateStreamBubble`(rich=코칭·보험금·완판 마크다운 / plain=기본) / `_solStreamSetProgress`(평문+커서 점진) / `_solRenderReplyFallback`(실패 시 기존 getAIResponse 경로). 진행 중=평문+▍커서, **완료 시 `_solCoachRenderRich`(표·[대괄호] 색)** 적용 = 기존 타이핑완료 렌더와 동일. CTA(`_solChatAppendLockedCta`)·재확인 가드(`_solShouldShowLockedCta`) 유지. 부분응답 중 에러=받은 데까지 마무리(이중 말풍선 방지).
   - **다른 챗 위젯 4개(메인 데모 9355 / 코칭 standalone 9818 / strategy 9901 / FSS 10074)는 stream 미요청 = 비스트리밍 {reply} 그대로 = 무영향.** 서버도 stream 없으면 기존 JSON 응답.
2. **① 건강검진 답변이 질문 위에 생성**: `_solPdfInjectReportPanel`이 report 재사용(이전 시스템 분석 잔재) 시 **early-return 전에 `msgsEl.style.display='none'` 누락**이 근본 원인. 재사용 시에도 반드시 숨기도록 순서 변경. 직전 append된 [📎 질문]/[분석 시작]/summary 메시지가 report(위) 아래 남던 것 해소. (coverage 2회차 사용도 동일 증상이라 같이 고쳐짐.) 다른 챗봇은 report 패널 미사용이라 정상이었음.
3. **③ 생성 중 진행 멘트**: `appendTyping` 3-dot 옆에 `.sol-typing-ment` 회전 텍스트(🔍질문 분석→📊데이터 조회→✍️답변 작성→거의 다 됐어요) 1.4s 간격. 스트리밍 첫 토큰 도착 시 `removeTyping`으로 사라짐. `_solTypingMentInterval` removeTyping에서 클린업.

### 🔴 Web3Forms 키 교체 = 보류 (대표님 승인 대기)
- 대표님 결정: "대표님 이메일로 교체는 승인 받아야 해서 나중에." → **현재 키 `c96794c6…`(전략실장 이메일 수신) 그대로 유지하고 배포.** 승인 후 web3forms.com에서 `proenterprise@incarproent.com` 발급 → `_submitContactForm`의 키 1줄 교체.

### ⚠️ 검증 = 배포본에서만
- 챗 스트리밍/진행멘트/건강검진 = **ai-branch.vercel.app(배포)에서만 테스트** (로컬 `_serve.js` `/api/*` 미실행). node --check: chat.js(mjs) OK, index.html 인라인 스크립트 5개 전부 OK.

---

## 2026-06-26 세션 — AI 홈페이지 대규모 작업 (chat.js만 배포, index.html 미배포)

### ✅ 배포 완료 LIVE — 챗봇 Vertex AI 전환 (commit `0b04dcb`, v=20260626)
- **배경**: ai-branch 챗봇(`/api/chat`, 7대 AI 데모: 상담코칭·완전판매·보험금산출·건강검진 등)이 응답 안 됨. 원인 = `process.env.GEMINI_API_KEY`가 **6/5 도용 폐기된 공유키 `...6rBg`** 였고, 그 키를 ai-branch env에서도 삭제 → 옛 코드가 401/500.
- **해결 = Vertex AI 이전** (`api/chat.js`):
  - 인증: `?key=GEMINI_API_KEY` → **서비스계정 OAuth**. **Node 내장 `crypto`로 RS256 JWT 직접 서명** → `oauth2.googleapis.com/token` 교환 → Bearer 토큰. **외부 라이브러리·package.json 불필요**(google-auth-library 안 씀) = 로컬 `_serve.js`(CommonJS)·모듈설정 무영향.
  - 엔드포인트: `https://{region}-aiplatform.googleapis.com/v1/projects/{project}/locations/{region}/publishers/google/models/{MODEL}:generateContent`
  - 모델 `gemini-3.1-pro-preview` → **`gemini-2.5-flash`** (Vertex asia-northeast3 지원 확인. ⚠️ 2026-10-16 퇴역 예정 → 그 전 교체).
  - 보안레이어(Origin 화이트리스트·레이트리밋)·프롬프트·PDF 모드·응답 파싱 전부 그대로. `contents[].role:'user'` 이미 존재(Vertex 필수).
  - 토큰 캐시(만료 60s 전까지 재사용).
- **env (ai-branch Vercel, Production+Preview)**: `VERTEX_SA_JSON`(Sensitive, 서비스계정 JSON 전체) / `GCP_PROJECT_ID`=`youtube-482701` / `VERTEX_REGION`=`asia-northeast3`. **= 보장분석과 동일 이름·동일 인프라 재사용.**
- **서비스계정**: `vertex-proxy-sa` (프로젝트 `youtube-482701`). 기존 키(5/21) 외 **새 JSON 키 발급**해서 ai-branch에 넣음(기존 키 다운로드 불가 → 새 키, 둘 다 Active). 깃 노출 0(Vercel env만).
- **크레딧/결제**: `youtube-482701` = 개인 결제계정 `0150F6`. 무료체험 ₩401,537/54일(~8월중순) + GenAI 크레딧(~2027-05, Billing→Credits 확인). ⚠️ "활성화(유료전환)" 버튼 **지금 누르지 말 것**(카드/분쟁 정리 전). 회사 결제 `018EF1`은 해지 상태(회사 org `pro-enterprise-ai`/`gen-lang-client`는 Vertex와 무관).
- 옛 `GEMINI_API_KEY`·`ALLOWED_ORIGINS` 삭제 = **무해**(chat.js는 더 이상 GEMINI_API_KEY 안 씀 / `*.vercel.app`·`localhost`는 코드 하드코딩이라 ALLOWED_ORIGINS 없어도 ai-branch.vercel.app 허용. 커스텀 도메인 없음).
- 디버깅 교훈: env만 바꾸고 **Redeploy 안 하면 미반영**. "GCP_PROJECT_ID not configured"(content-length 41) = env 빈값/미반영 → 값 재입력+재배포로 해결. Vercel "Redeploy"는 **기존 커밋(코드)** 재배포일 뿐, 코드 변경은 **git push** 해야 함. 챗봇 부활 최종 확인됨.

### 🔴 미배포 — index.html 로컬 변경 (uncommitted, push 안 함)
오늘 UI/문구 변경이 전부 `index.html`에 있고 **아직 안 올림**. (대표님이 localhost로 검토 완료)
1. ROADMAP 뱃지 제거 + **빛 동기화 물결**(`@keyframes roadmap-rise`, 4패널 시차 0/.45/.9/1.35/1.8s, `is-playing` 게이트, reduced-motion off)
2. **뱃지 `display:none`**: PEOPLE(stories-label-pill)·SUPPORT·EXPERTISE·ROADMAP(talent-label) — 위로 올림(공간 회수), 공유클래스 안 건드리고 인라인.
3. **부분단어 파란색**: ROADMAP "단계별로"·SUPPORT "신뢰"(둘 다 `from-blue-500 to-blue-400` 클립) / PEOPLE "사람"(stories, `from-blue-500 to-blue-500`=blue-500) / CEO "서포터"만 파랑·"가 되겠습니다."는 흰색.
4. **why-pro 8카드 가독성**: 좌(기존영업) 본문 `zinc-500+light`→`zinc-300+normal`·서브 9→11px / 우(PRO해결책) 본문 `zinc-400+light`→`zinc-200+normal`(위계: 우>좌) / CEO 부제 zinc-400→zinc-300 / 성과 날짜 흰색 .6→.78.
5. **edu 패널(`edu-hp-*`)**: 텍스트 밝힘(desc .45→.7 / course p 비활성 .35→.5·활성 .6→.7 / h4 .7→.8 / tag .45→.6) + **신인/저차월 가로사진 2장 삭제**(`2026-04-12 13;45;33.PNG`·`13;46;08.PNG`) + **4:5 액자 통일**(`.edu-hp-img` matte 그라데이션·border·radius22·shadow·`.edu-hp-img img` inset18 contain).
6. **프로사업단총괄 인트로 문구 교체**: "GA 2.0…/성공의 정점에 서다" → "처음부터 정점까지 / 당신의 성장을 설계하다" + 부제 "PRO AI 시스템과 체계적인 교육으로 / 영업인이 끊임없이 성장하는 최적의 환경을 만듭니다." (쉼표 제거·`word-break:keep-all`).
7. **슬라이드쇼 로비(TWOSOME PLACE) 사진 제거** → INCAR 간판 첫 장(opacity:1). DB/교육 문구도 수정("어디서든 동일한 질의 교육 시스템…전국 거점의 평균 생산성이 향상").
8. **숫자 카운트업** 부드럽게: `tabular-nums` + duration 4000→2000ms (`[data-counter]`/`[data-counter-sub]`).
9. **문의 폼 → Web3Forms 이메일 연결**: `#contact-form` onsubmit를 알림만→실제 POST(`api.web3forms.com/submit`, `window._submitContactForm`). ⚠️ key `c96794c6-fd29-4d59-80db-e0b4e6f23666`가 **본인 이메일용** — 대표님(`proenterprise@incarproent.com`)으로 받으려면 **새 access key 발급 후 교체** 필요(Web3Forms는 수신자 인증 클릭 불필요·키 화면표시).

---

## 🔜 다음 세션 할 일 (전부 미구현 — 한 묶음으로 구현 후 index.html+chat.js 동시 배포)

대표님 결정: **셋 다 전부 구현**. 단 텍스트 누적으로 이번 세션 보류 → 새 대화에서 진행.

1. **A. 스트리밍** (품질 동일·체감속도↑, 대표님 A 선택): `api/chat.js` `generateContent`→`streamGenerateContent?alt=sse` SSE 릴레이(보장분석 `api/vertex-proxy.js` 패턴 참고) + `index.html` 챗 클라가 스트림 점진 렌더. ⚠️ **server+client 동시 필요** — chat.js만 배포하면 현재 라이브 클라(JSON `{reply}` 기대)가 깨짐 → 반드시 index.html과 같이 배포.
   - (속도 관련: thinking 끄면 품질 미세↓. 대표님은 **품질 유지** 원함 → thinking 유지 + 스트리밍으로 체감 개선 택함.)
2. **① 건강검진 분석 AI 답변이 질문 "위"에 생성되는 버그**: index.html 건강검진 PDF 결과 렌더 함수의 **메시지 삽입 순서**(append vs prepend) 점검·수정. 다른 챗봇은 정상.
3. **③ 생성 중 진행 멘트**: 답변 대기 중 "🔍 질문 분석 중→📊 데이터 조회→✍️ 작성 중→거의 다 됐어요" 회전 표시 후 실제 답변으로 교체. 클라(index.html).
4. **Web3Forms 대표님 이메일로 키 교체**: web3forms.com에서 `proenterprise@incarproent.com`으로 새 access key 발급 → index.html `_submitContactForm`의 `c96794c6…` 교체.
5. → 위 전부 + 오늘 미배포 index.html 변경(1~9)을 **한 번에 commit+push**(main) 배포. ⚠️ 챗 흐름은 **배포된 ai-branch.vercel.app에서만** 테스트(로컬 불가).

---

## 다음 대화 첫 질문 (복붙용)
"ai-branch(AI 홈페이지) 이어서 작업할게. `ai-branch/CLAUDE.md`랑 `ai-branch/.claude/memory.md` 읽고, 2026-06-26 '다음 세션 할 일'의 A(스트리밍)+①(건강검진 답변 순서 버그)+③(진행 멘트) 셋 다 구현해줘. Web3Forms 키는 대표님 이메일로 교체. 다 구현하면 index.html+chat.js 한 번에 배포하는 거고, 챗 흐름은 ai-branch.vercel.app(배포본)에서만 테스트되는 거 알지?"
