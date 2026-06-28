# ai-branch (Pro Enterprise AI 랜딩) — 세션 메모리

> 상위 규칙은 루트 `CLAUDE.md`. 이 파일은 세션 핸드오프·할 일·다음 첫 질문.
> 배포: GitHub `proenterpriseai/Pro_ai-branch` (main) → Vercel 자동배포 → **ai-branch.vercel.app** (커스텀 도메인 없음).
> 로컬 dev: `node _serve.js` (port 3098). ⚠️ **로컬은 `/api/*` 서버리스 미실행** → 챗봇·문의폼 등 API 흐름은 **배포된 사이트에서만** 작동/테스트.

---

## 2026-06-28 세션 — 건강검진 PDF 종결 + 인재양성/CEO/why-pro UI 손질 (v=20260628a 배포 LIVE, tag v20260628a)

> 시작 시 후보 작업 = Web3Forms 키 교체(보류)·건강검진 PDF 시각확인. 대화 중 인재양성 카드 리디자인 논의→보류, 이어서 구체 UI 3건 요청·구현·배포.

### ✅ 건강검진 PDF 순서버그 = 시각 최종확인 완료·종결
전략실장이 ai-branch.vercel.app에서 보장분석 PDF→건강검진 PDF 순(리포트 패널 재사용 경로) 업로드, 둘 다 정상(질문·"분석 시작" 메시지 리포트 위/아래 잔존 0). v=20260626b `_solPdfInjectReportPanel` 수정 확정. **더 볼 것 없음.**

### ⏸️ 인재양성 "4축 브랜드/CFP" 카드 리디자인 = 논의 후 보류
레퍼런스(핀테크 앰비언트 글로우+글래스모피즘) 받아 브랜드 블루(#27398c)로 시안 2개 제작(아티팩트, 검은 배경 유지+카드만 발광형). **대표님 "그냥 보류" → index.html 미수정.** 시안은 아티팩트 링크에 보존. (교훈: 글래스모피즘 backdrop-filter는 뒤에 빛이 있어야 보임 → 순검정 배경에선 카드 자체 글로우 방식으로 대체.)

### ✅ v=20260628a — UI 손질 3건 (index.html 단일, main 직푸시+tag)
1. **인재양성 로드맵 아이콘·글자 키움**(대표님 요청): `.roadmap-icon`/글로우 64→74px·라운드16→18, SVG 24→30, 단계명 14→16px, 설명 11→13px. ⚠️핵심=가로 글로우 라인(`.roadmap-line top:96→101px`)을 키운 아이콘 새 중심(패딩64+절반37=101)에 **재정렬**(안 하면 라인이 아이콘 위쪽 통과). 실측 101=101·5열 유지.
2. **CEO 인사말 뱃지 삭제(위치 고정)**: `#ceo-overlay` 키커 pill(index.html:7391)에 `visibility:hidden`. **display:none 아님**(=공간 유지=제목 안 밀림, 대표님 "위치 그대로 고정" 요구 충족).
3. **why-pro "같은 시간, 다른 결과" 블루 프레임**: `#solutions-inner`과 동일 `border-gradient`+`glow-target`+`.glow-border`+`rounded-3xl`+bg`#0a0a14` 래퍼(index.html:4306). 마우스 글로우는 기존 JS(8615, `.glow-target` 전체)가 자동 인식. 허브 3컬럼·overflow0·콘솔0 실측.
- **검증**: localhost:3098 DOM 실측(why-pro 무한 애니로 preview_screenshot 타임아웃 → 실측 대체). **3건 전부 라이브 700명 요소**, 대표님 OK 후 커밋·푸시.
- 🔴 **Web3Forms 키 교체 = 여전히 보류**(승인 대기). 현재 키 `c96794c6…`(전략실장 수신) 유지.

### ✅ v=20260628b — 프로 솔루션 + 승격 구조 자동 흐름 (후속 배포 LIVE, tag v20260628b)
① "프로솔루션"→"프로 솔루션"(`index.html:6579` 카드 제목). ⚠️오버레이 뱃지 7167 "프로솔루션 · AI 인터랙티브"는 대표님 미확정으로 미변경. ② 승격 구조 자동 흐름: 두 루트(영업인/관리자) 노드 위→아래 순차 점등 wave(3.2s). `promo-flow` 클래스+스코프 style, promoDot/promoLabel/promoLink 키프레임, 비파괴(최종 노드 그라데이션 유지). 검증 localhost DOM 실측.

### ✅ v=20260628c — 승격 구조 자동 흐름 재작업 (배포 LIVE, tag v20260628c)
v=b의 글로우 wave가 대표님 의도와 달랐음 → **파란 배경 하이라이트가 단계별 하나씩 점멸·순환**(설계사→영업이사, 주기 7s 느리게, 한 번에 하나)으로 교체. promoLabelCycle(background-color+color)/promoDotCycle/promoLinkCycle. 최종 노드 그라데이션·볼드 제거(고정 하이라이트 없음). ⚠️**검증 교훈: preview_eval은 백그라운드 탭(docHidden=true)이라 CSS 애니 clock frozen** → screenshot 타임아웃·동적 backgroundColor 샘플이 전부 dim으로 나옴. `el.getAnimations()[0].currentTime` 수동 주입으로 키프레임 정상 검증함(실브라우저는 정상 작동).

### ✅ v=20260628d — STEP1 궤도 세련화 이식 + 텍스트 3건 (배포 LIVE, tag v20260628d)
①뉴럴 그래프 시안 반려 → **원형 궤도 유지+세련화로 확정·이식**: 그라데이션 가이드 링 + 회전 빛 스윕 아크 2개(conic+radial mask, 외9s/내6.5s역) + 글래스 위성 4개(역회전 정립) + 발광 글래스 코어. **중앙 아이콘→"PRO" 문구**(대표님). `s1ob-` 프리픽스+`s1obSpin/SpinRev/Pulse` 키프레임 격리, 마크업만 교체(카드 래퍼·footer 불변). STEP1만. ②히어로 뱃지 "PRO AI 영업 통합 시스템"→"PRO AI 통합 시스템"(3718). ③프로솔루션 오버레이 뱃지 "프로솔루션 · AI 인터랙티브"→"프로 솔루션 · 7대 AI 시스템"(7210). 검증 DOM 실측·콘솔0. 시안 아티팩트=step1-orbital(🛰️).
🔜 라이브 확인: STEP1 카드(메인 "시간은 절반으로" 영역)·히어로 뱃지·AI시스템 오버레이 상단 뱃지.

### ✅ v=20260628e/f — STEP1 코어 톤다운 + 아이콘 블루통일 + STEP2 문구 + 카드순서 (배포 LIVE)
- **e**: STEP1 중앙 PRO 코어 밝은블루→깊은네이비(`#2a46a2`계열), 글로우 약화(대표님: 너무 튐).
- **f**: ①궤도 위성 아이콘 **블루 모노톤 통일**(초록·흰 제거 `#8fb0f2`/`#6e92e6`). ②STEP2 리스트: 보장분석 엔진→리포트, DB영업관리→DB 영업관리, 통합금융계산기→통합 금융계산기. ③why-pro 우측 카드 순서 스왑=**보장분석 AI 최상단**(본문만 스왑, 연결선 path-r1/r2는 슬롯 고정=어긋남 방지). 
- 🧩 교훈: why-pro 우측 카드 연결선은 슬롯별 path-r*+translate로 튜닝됨 → 순서 바꿀 땐 `<li>` 통째 말고 **본문(아이콘/h3/상태/desc/footer)만 스왑**.

---

## 2026-06-27 세션 — 6/26b 검증 + 챗/UI 대폭 손질 (v=20260627a~h 전부 배포 LIVE, 최신 commit `123183c`)

> 오늘 a~h 8개 버전 배포. 요약: a=챗 볼드렌더 / b=PDF 동적멘트+점애니 / c=숨은데모 멘트(무영향) / d=PDF멘트 진행률연동·루프제거 / e=WHY PRO 허브 선명화 / f=허브 왼쪽 점 제거(B-1)+카드제목변경+path태그복구 / g=STEP카드 진입통일+리스트글자 / h=챗 인디케이터 깜빡임+시간기반문구(A-1)+부드러운 타이핑(B-1). 상세는 루트 CLAUDE.md "Version" 섹션 참조. 아래는 핵심만.

### ✅ 6/26b 배포 검증 (ai-branch.vercel.app, 전략실장이 브라우저 직접)
라이브 `v=20260626b` 확인, 신규 함수 전부 배포(`_solStreamReply`/`_solStreamChat`/`_solCreateStreamBubble`/`_solRenderReplyFallback`/`sol-typing-ment`/`_solTypingMentInterval`).
- **A. 스트리밍**: ✅ 상담코칭 응답 생성·완료→rich 렌더 전환 정상.
- **③ 진행 멘트**: ✅ 회전 확인("거의 다 됐어요"/"📊 관련 데이터를 조회하고 있어요"), 첫 토큰 시 사라짐. ⚠️ gemini-2.5-flash dynamic thinking(thinkingBudget -1) 때문에 **첫 가시 토큰까지 ~10초 지연**(thinking 파트는 스트림 제외) → 이 대기를 ③ 멘트가 메움(설계 의도 부합).
- **메시지 순서/[대괄호]/잠금카드/CTA/의도 가드**: ✅ 전부 정상.
- **① 건강검진 리포트 순서 버그**: ✅ **완전 종결 (2026-06-28 시각 검증 완료)** — 라이브 소스(`_solPdfInjectReportPanel`이 `msgsEl.style.display='none'`을 리포트 재사용 분기 **앞에서** 실행, v=20260626b) + **전략실장 배포본 육안 확인(보장분석→건강검진 순, 둘 다 정상·질문 잔존 0)**. 더 볼 것 없음.

### ✅ 볼드 렌더 수정 배포 (commit `812c55a`, v=20260627a, index.html 단일)
- **증상**: 챗 응답에서 `**5) [플랜 B]**`처럼 볼드 `**`가 리터럴 노출.
- **근본 원인**: `_solCoachRenderRich`/`_solCoachBrackets`가 **표·[대괄호]만 처리하고 마크다운 볼드(`**...**`)는 애초에 미처리**였음(대괄호가 볼드를 깨는 게 아니라 볼드 기능 자체가 없었음). CLAUDE.md에도 "표+[대괄호]"만 명시됨.
- **수정**: `_solCoachBrackets`에 `**(.+?)**`→`<strong>$1</strong>` 변환을 **대괄호 치환 앞에** 1줄 추가. 非탐욕+줄단위라 단일 `*`·글머리표·짝없는 `**`는 리터럴 유지. 챗 응답·표 셀·잠금 설명 등 공용 적용.
- **검증**: node 격리 테스트 4케이스 OK + 인라인 스크립트 5개 `node --check` OK + **배포본 브라우저 시각 확인**("5) [플랜 B]" 볼드+[]청록 정상, `**` 잔재 0, 고배율 zoom 확인).
- 🔴 **Web3Forms 키 교체 = 여전히 보류**(대표님 승인 대기). 현재 키 `c96794c6…`(전략실장 수신) 유지.

### ✅ 동적 진행 멘트 — 모든 AI 챗봇 확대 (v=20260627b + v=20260627c)
대표님 요청: "분석이 정적인데 클로드처럼 동적으로 일하는 멘트(분석 중·~하는 중·거의 다 했어요)를 모든 AI 시스템에 + PDF 진행률 `...`도 움직이게."
- **v=20260627b (PDF 흐름)**: `_solPdfHandleFile` 정적 "분석 시작" 메시지 → `appendTyping('sol-pdf-typing', SOL_PDF_PROGRESS_MENTS)` 회전 버블. 진행률 라벨 끝 `...` → `.sol-pdf-dots` opacity 펄스 점(`_solPdfShowProgress`에서 분리 렌더, '완료'는 점 없음). `appendTyping(id, ments)` 선택적 멘트 인자 추가(기존 `appendTyping(typingId)` 무영향).
- **v=20260627c (쇼케이스 데모 3개)**: 메인데모(`#typing-temp`)·코칭데모(`#coaching-typing`)·FSS데모(`#cs-typing`)는 별도 IIFE라 `appendTyping` 못 씀 → 각 typing 인디케이터에 `.pro-demo-ment` span + **self-clean 회전 interval**(typing 요소가 사라지면 스스로 clearInterval, 제거코드 다수 안 건드림=누수0) 인라인. 멘트 시스템별 맞춤. 고정높이(`h-9`/`h-10`) 제거.
- **전수 매핑(Explore)**: 회전멘트 보유=스트리밍챗+PDF / 신규적용=데모3개 / 그 외 커서타이핑(`_solCoachTypewriter`·`_solStreamSetProgress` 등)은 이미 동적이라 대상 아님.
- 검증: 인라인 스크립트 5개 `node --check` OK. ⚠️ **v=c 데모 3개는 알고보니 숨겨진 레거시 대시보드(`hidden`/offsetParent=null)라 사용자 비노출** — 무해하나 무의미. 대표님 확정: **범위=prosolution 오버레이 7개 시스템만**(숨은 데모 무시).

### ✅ v=20260627d — PDF 멘트 진행률 연동 + 루프 제거
대표님: "거의 다 됐어요가 너무 일찍·자동으로 뜨고 루프라 뒤로 돌아감." → PDF는 `appendTyping(...,{noRotate:true})`로 자동회전 끄고 `_solPdfShowProgress(percent)`가 멘트를 **진행률 %에 맞춰 단조증가**(data-mi 클램프, <22📄/<45🔍/<72📊/<90✍️/≥90 거의다). 공용 `appendTyping` 회전도 **루프 제거**(마지막서 멈춤). 라이브 검증: 32%→"🔍 핵심 정보 추출"(거의다 아님) ✅ + ① 리포트 순서버그도 더미PDF 주입으로 시각 확인됨(질문 안 남음).

### ✅ v=20260627e — WHY PRO 중앙 허브 선명화 (발광 유지)
대표님: 허브 흐릿→또렷, 발광 분위기 유지. A 동심원 링 불투명도↑(white5%→12%/3%→8%, dashed20%→40%, dotted30%→45%) / B 연결곡선 stroke 0.15·0.2→0.32·0.4 + 1.5→1.75px + 점 halo↑ / C 중앙원판 `backdrop-blur-xl→sm`(헤이즈↓). **D 발광(blur-100px·blur-2xl·conic스윕·중심점)=유지.** 데스크톱 허브(`#why-pro .hidden.lg:flex`) 한정.

### ✅ v=20260627f — 허브 왼쪽 점 제거(B-1)+카드제목+path태그 복구
대표님 합의: 왼쪽=기존(과거)=정적, 오른쪽 PRO만 흐름=가독성·내러티브↑. `path-l1~l4`의 `<g>`(점+animateMotion) 4개 제거, **빨간 연결선(path)은 유지**. 우측 파란 점 유지. 카드제목 "AI DB 추천"→**"DB 영업관리 AI"**, "코칭 AI 화법"→**"상담 코칭 AI"**. 🔴**버그수정**: v=e 빨간 stroke 일괄변경 때 path 닫는 `>` 누락(`non-scaling-stroke"</path>` malformed, 브라우저 관대렌더로 표시는 됨) → `"></path>` 4개 복구.

### ✅ v=20260627g — "시간은 절반으로" 3-STEP 카드
STEP1(교육체계)만 0.3s 지연 blur 페이드로 늦게 떠 어색 → 인라인 `fadeSlideIn` 제거 = STEP2/3처럼 즉시표시(1-A). STEP2(AI 시스템 활용) 리스트 7개 이름 `12px→13px`, Running 배지 `9px→10px`.

### ✅ v=20260627h — 챗 인디케이터 깜빡임(A-1) + 부드러운 타이핑(B-1)
대표님: "클로드처럼 왼쪽 깜빡임+오른쪽 문구, 문구가 너무 빨리 자동전환 말고 진짜 작업 중 느낌." 
- **A-1**: `appendTyping` 점3개 제거 → PRO AI 아바타 `animate-pulse` 깜빡 + **시간기반 "Ns · 상태"**(매초 경과초↑ + 임계값 `SOL_MENT_THRESH=[0,4,10,18]`s 단계전환, 빠른 자동회전 폐기). PDF는 noRotate=%구동 유지. JS로 확인: `2s·🔍 / 3s·🔍 / 4s·📊 / 5s·📊` ✅.
- **B-1**: `_solStreamReply` 부드러운 타이핑 — SSE는 `target` 누적, 화면은 `shown`이 한 자씩 따라잡으며 노출(`revealTimer` 18ms, 멀리 뒤처지면 `ceil(remaining/18)` 빨리·가까우면 1자). 뭉텅이 청크→부드러운 타이핑. `finalize()`가 따라잡기+done 시 rich+CTA. 코칭/보험금/완판 공통. 라이브 육안: 커서▍+점진 노출 ✅. (대표님 "코칭 타이핑 안됨" 해결.)

### 🔴 진행 중 논의 — 메인 히어로 "터널 인트로" (미착수)
대표님 아이디어: 메인 히어로 "보험을 넘어 성장의 정점으로" **나오기 전에 SF 터널 영상으로 빨려들어갔다 짠 나오는** 인트로. ⚠️ **첨부 `Sci-Fi Tunnel.html`=핀터레스트 페이지 통째 저장본**(비디오 `src=blob:` 핀터레스트 전용=사용불가) + Pinterest pin(타인 콘텐츠)=**저작권 문제로 직접 사용 불가**. 논의 방향: (A)라이선스/자체제작 mp4 (B)Three.js/WebGL 터널 코드 자체구현(허브 이미 Three.js) (C)CSS/Canvas 네온링 터널(첨부 이미지=동심 네온링이라 재현 쉬움, 브랜드 블루와 일치, 저작권0). UX 주의: 매방문 인트로=거슬림→sessionStorage 1회 + skip버튼 / 모바일 성능 / 콘텐츠·SEO 지연 금지. 4대규칙(Flag·독립블록·async·lazy). **대표님 방향(A/B/C) 결정 대기.**

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

## 🔜 다음 세션 할 일

> ✅ 2026-06-27 v=a~h 전부 배포 LIVE(**최신 commit `4d29b09`, git tag `v20260627h`**). 챗 볼드·동적멘트·진행률연동·허브선명화·왼쪽점제거+카드제목·STEP카드·인디케이터깜빡임+부드러운타이핑 다 완료·검증. 인트로(i)는 시도→철회=종결. 아래는 남은 일.

1. ✅❌ **메인 히어로 "터널 인트로" = 시도 후 전량 철회 (종결)** — v=20260627i로 빌드(Flag off)했으나 **대표님 결정: "보험을 넘어 성장의 정점으로가 처음부터 보이는 게 훨씬 낫다" → 전량 롤백**(index.html 인트로 블록 + `assets/video/intro-tunnel.mp4` 삭제). **히어로 인트로/스플래시는 재제안 금지.** (교훈: Pinterest 영상=저작권 불가, Pixabay는 상업무료 OK였음.)
2. 🔴 **Web3Forms 키 교체 (대표님 승인 후)** — 현재 키 `c96794c6…`=전략실장 수신 유지. 승인 시 web3forms.com에서 `proenterprise@incarproent.com` 새 키 발급 → `_submitContactForm` 키 1줄 교체·배포.
3. ✅ **① 건강검진 PDF 순서버그 시각 최종확인 = 완료·종결 (2026-06-28)** — 전략실장이 ai-branch.vercel.app 배포본에서 보장분석 PDF→건강검진 PDF 순(리포트 패널 재사용 경로) 업로드, **둘 다 정상**(리포트 위/아래에 질문·"분석 시작" 메시지 잔존 0). v=20260626b `_solPdfInjectReportPanel` `msgsEl.style.display='none'` 선실행 수정 확정. 더 볼 것 없음.
4. (선택) 스트리밍 안정화 모니터링(Vercel 타임아웃/버퍼링). SSE 실패 시 클라가 비스트리밍 폴백 → UI 안 깨짐.

---

## 다음 대화 첫 질문 (복붙용)
"ai-branch(AI 홈페이지) 이어서 작업할게. `ai-branch/CLAUDE.md`랑 `ai-branch/.claude/memory.md` 읽어줘. 2026-06-27 작업(챗 볼드·동적멘트·진행률연동·허브선명화·왼쪽점제거+카드제목·STEP카드·인디케이터깜빡임+부드러운타이핑, v=a~h) 전부 배포 완료(tag `v20260627h`). 터널 인트로는 철회로 종결. 오늘은 [Web3Forms 키 교체(승인됨/보류) / ① 건강검진 PDF 시각 최종확인 / 새 작업: ___] 중 ___ 부터 하자."
