# AI Branch — Pro Enterprise AI Landing Page

## Overview
Pro Enterprise AI 채용/홍보 랜딩 페이지. Hero + 8섹션 스크롤 + 8대 AI 대시보드 인터랙티브 데모.
- **Deploy**: Vercel (GitHub: `proenterpriseai/Pro_ai-branch`)
- **Dev Server**: `node _serve.js` (port 3098)

## Tech Stack
| 기술 | 상세 |
|------|------|
| 3D | Three.js r128 (CDN global `<script>`) |
| Animation | GSAP 3.12.5 + ScrollTrigger (CDN) |
| CSS | Tailwind CSS (CDN) |
| Font | Pretendard Variable (CDN) |
| API | Gemini 2.0 Flash via Vercel Serverless Function |
| Deploy | Vercel (auto-deploy on push) |

## File Structure
```
index.html          — Main SPA (~3,486 lines, all JS inline)
css/style.css       — Dark theme, glass-panel, HUD footer (434 lines)
api/chat.js         — Vercel Serverless Function: Gemini API proxy + 보안 레이어 (Origin 화이트리스트 + IP 레이트리밋 + 메시지 검증)
assets/images/      — Logo SVG, CEO portrait
_serve.js           — Dev server (port 3098)
```

## 3D Digital Terrain (index.html inline, ~lines 2537-2681)
- `PlaneBufferGeometry(120,120,160,160)` + custom `ShaderMaterial` (wireframe, additive blending)
- 2개 terrain 레이어 (main + distant, intensity 0.3)
- 커서 추적 `IcosahedronGeometry(0.8, 1)` orb + `PointLight(0x00f7ff, 2, 40)`
- 250개 ambient `PointsMaterial` 파티클
- GSAP `ScrollTrigger`: 카메라 위치 + terrain intensity + scroll progress bar
- `FogExp2(0x050505, 0.02)`, `setClearColor(0x050505, 1)`
- **Post-processing 없음** (EffectComposer/Bloom 미사용)

## Dashboard 8 Panels
패널 전환: `[data-panel]` nav click → `[data-panel-content]` hidden toggle (IIFE, ~line 1912)

| Panel Key | Name | Interactivity |
|-----------|------|---------------|
| dashboard | 메인 대시보드 | Counter animation, live activity feed (4s interval), 8 system status dots |
| coverage | 보장분석 시스템 | AI chat + 리포트 뷰 토글, PDF 업로드 → 샘플 리포트 (SVG 레이더, 37/100 점수, 8카테고리, TOP10), Gemini fallback |
| dbsales | DB 영업관리 | Search filter, status toggle, add row + 전환율 분석 (CSS donut, funnel progress, 병목 badge) |
| calculator | 통합금융계산기 | 9 sub-tabs 전부 동작: 예적금/대출/은퇴/부동산(취득·보유·양도)/상속증여(증여·상속)/목적자금/달러/전월세/종합소득세 |
| coaching | 상담 코칭 | 8개 키워드셋 + free input + Gemini API fallback |
| insurance-calc | 보험금 산출 | 진단명/입원/비급여 + 사고경위 텍스트 + PDF 업로드 → 산출표 + 전략/방어 카드 + Gemini 분석 |
| healthcheck | 건강검진 분석 | PDF 업로드 → 샘플 리포트 (SVG 원형게이지, 검사항목 테이블, 질병리스크, 권장담보) + 수동 슬라이더 |
| complete-sales | 완전판매 | FSS 챗봇형: A(사전)/B(민원대응) 모드, 뱃지 시스템 (법적근거/판례/AI추론/확인불가), Gemini fallback |

## Gemini API Integration
- **Endpoint**: `/api/chat` (Vercel Serverless Function)
- **Model**: `gemini-2.0-flash`, temperature 0.7, maxOutputTokens 500
- **Env var**: `GEMINI_API_KEY` (Vercel Dashboard > Settings > Environment Variables)
- **사용처**: coverage chat + coaching chat + insurance-calc + complete-sales + prosolution-overlay (총 5곳, keyword 매칭 실패 시 fallback)
- **System prompt**: 보험 전문 AI 어시스턴트 (간결, 아이콘 사용, 원화 표시)

### 보안 레이어 (api/chat.js, v=20260418)
- **Origin 화이트리스트**: `localhost:3098` + `ALLOWED_ORIGINS` 환경변수 + `*.vercel.app` 정규식. 미허용 Origin은 403
- **CORS**: 와일드카드 금지 — 허용된 Origin만 반사 (`Access-Control-Allow-Origin: <origin>`), `Vary: Origin`
- **IP 레이트리밋**: 분당 10회 (인메모리 `Map`, X-Forwarded-For 우선). 초과 시 429 + `Retry-After: 60`
- **메시지 검증**: `typeof === 'string'` + 길이 ≤ 2000자. 미충족 시 400
- **환경변수**: `ALLOWED_ORIGINS` (쉼표 구분, 커스텀 도메인 추가 시 사용)

## Navigation System (v=20260406)
- **모든 네비 링크는 `data-nav` 속성 기반** — 인라인 onclick 금지
- 통합 클릭 핸들러 1개가 `document.addEventListener('click')` 위임 방식으로 처리
- **클릭 시 반드시 `closeAllOverlays()` 호출** → body overflow 복원 후 스크롤
- 오버레이 종류: CEO(`ceo-overlay`), AI시스템(`prosolution-overlay`), 문의하기(`contact`)
- `body.ceo-overlay-open` / `body.contact-overlay-open` → `overflow:hidden` 설정됨, **반드시 해제 필요**
- **네비 타겟 ID 매핑**: news(프로사업단총괄), about(관리자 소개), recruit(모집공고), top(로고)
- **⚠️ `#team` ID 없음** — 관리자 소개는 `#about` 섹션임. `#ceo` ID도 없음(오버레이 방식)

## ⚠️ 레이아웃 높이/패딩 규칙 (절대 원복 금지)
- **7대 핵심 AI 쇼케이스** (#ai-showcase): `min-height` 없음 (제거됨, 콘텐츠 기반 자동)
- **대시보드 패널** (#dashboard-container 내부 grid): `max-height:540px; overflow:hidden;` — 아래 빈 공간 방지
- **대시보드 섹션 패딩**: `sm:py-12` + 내부 `sm:pt-6 sm:pb-6` (기존 py-24/pt-12에서 축소)
- **네비 스크롤**: `scrollToContent()` 헬퍼가 섹션 paddingTop을 건너뛰고 콘텐츠 시작점으로 이동
- **scroll-behavior**: CSS `html.smooth-scroll`에만 적용, 페이지 로드 완료 후 JS가 클래스 추가 (새로고침 깜빡임 방지)
- 위 값들은 사용자가 직접 확인/승인한 수치임. **임의 변경 금지**

## Critical Notes
- Three.js는 CDN `<script>` (global `THREE`), **importmap/ES Module 아님**
- 모든 대시보드 JS는 `index.html` 인라인 IIFE — 외부 JS 파일 로드 없음
- Canvas: `#three-canvas`, CSS `.content-layer` z-index 1이 위에 오버레이
- CEO 오버레이: `#ceo` hash trigger → modal, body scroll lock, back 버튼 지원
- `js/three-hero.js`, `js/main.js` — **orphaned** (index.html에서 로드하지 않음)
- 모바일: terrain은 모든 사이즈에서 렌더 (별도 숨김 없음)
- **네비 배경색**: `#27398c` (파란색 계열, v=20260406 변경)
- **`html.smooth-scroll { scroll-behavior: smooth }`** — 로드 후 JS가 활성화, scrollIntoView 미사용 (scrollToContent 헬퍼 사용)

## 4대 규칙 (영구)
1. **기존 기능 불변** — 신규 코드는 완전 독립 블록. 기존 함수 내부 수정 시 사전 승인 필수
2. **Feature Flag 필수** — 검증 전 모든 신규 기능 Flag=false. Flag=false 시 기존 영향 0
3. **CDN/외부 스크립트 비동기 필수** — 신규 `<script>` 태그는 `async`/`defer` 필수
4. **Lazy Init 필수** — 외부 의존성 모듈 레벨 즉시 초기화 금지

## Section Structure (v=20260406b)
- Hero → 성과(#stats) → 7대 AI 시스템(#solutions) → **왜 PRO인가(#why-pro, 허브 레이아웃)** → 모집공고(#recruit) → 관리자 소개(#about) → 소식(#news) → 지도(#branch-map)
- **기존 대시보드 패널(#dashboard-container) 삭제됨** — display:none으로 숨김 처리, 코드 보존
- **왜 PRO인가**: 3컬럼 허브 레이아웃 (왼쪽:기존영업 빨간톤 / 중앙:PRO AI HUB 오비탈 / 오른쪽:PRO해결책 블루톤) + SVG animateMotion 라인

## ⚠️ 모바일 반응형 규칙 (v=20260407, 영구 적용)

### 핵심 원칙
- **PC 레이아웃 절대 불변** — 모든 모바일 수정은 `@media (max-width: 768px)` 안에서만
- **특정 기종이 아닌 모든 기기 대응** — 320px~768px 전체 범위, 상대 단위(%, vw, rem) 사용
- **수평 오버플로우 금지** — `html, body { overflow-x: hidden; max-width: 100vw; }`

### 모바일 CSS 블록 위치
- `index.html` 인라인 `<style>` 내 `@media (max-width: 768px)` 블록 (라인 ~932 이후)
- 수정 1~9 + 전역 겹침 방지 + 폰트/간격 조정 포함

### 모바일 전용 구조물
| 요소 | 위치 | 설명 |
|------|------|------|
| `#mobile-nav-overlay` | `</body>` 직전 | 모바일 사이드 메뉴 (#27398c 배경, 흰색 텍스트, display:none/block 토글) |
| CEO 모바일 영상 | `#ceo-overlay` 내 `lg:hidden` div | 키커 → 영상 → 제목 → 본문 순서 (PC: 좌우 2컬럼) |
| 모바일 지원하기 버튼 | 네비 내 `sm:hidden` | 햄버거 왼쪽 #27398c 버튼 |
| 오버레이 하단 푸터 | CEO/AI시스템/문의하기/관리자소개 오버레이 각 하단 | #27398c 배경 동일 푸터 (로고+TEL+회사정보+저작권) |

### 모바일 메뉴 주의사항
- `#mobile-nav-overlay`는 **반드시 `<body>` 직속** (nav 안에 넣으면 CSS 간섭으로 안 보임)
- `z-index: 99999`, `position: fixed`, `display: none/block` 직접 제어
- 메뉴 링크에 `data-nav` 속성 유지 → 통합 네비 핸들러 호환
- 각 링크 클릭 시 `display='none'` 자동 닫기

### 헤더 네비 (v=20260407)
- **구조**: Accsensia 플로팅 glass-panel pill (`position: fixed, rounded-full`)
- **Hero 상태**: `rgba(255,255,255,0.03)` + `blur(16px)` (투명 glass)
- **스크롤 상태**: `rgba(15,15,30,0.92)` + `blur(16px)` (진한 다크 블루)
- **메뉴 텍스트**: `text-[15px] font-semibold text-white` + hover 밑줄 (한글 최적화)
- **지원하기 버튼**: 그라데이션 보더 (`linear-gradient(144deg, #AF40FF, #5B42F3 50%, #00DDEB)`)

### 푸터 (v=20260407)
- **메인 + 모든 오버레이 하단** 동일 구조
- **배경**: `#27398c`, 흰색 로고, 흰색 텍스트
- **내용**: 로고+TEL / 회사정보(주소,대표,등록번호) / COPYRIGHT 가운데정렬 9px

## 프로사업단총괄 섹션 (v=20260412b)

### 오버레이 구조 (`#pro-intro-overlay`)
1. **히어로 슬라이드쇼** — 성수 본점 4장 자동 순환 (4초 크로스페이드)
2. **교육 가로 스크롤** — `#edu-horiz-scroll` (sticky + vanilla scroll, GSAP 미사용)
   - 상세 규칙: [`docs/edu-horiz-scroll.md`](docs/edu-horiz-scroll.md)
   - 4패널 × 좌측 텍스트 + 우측 사진 (3초 크로스페이드 + 과정 하이라이트 연동)
   - 400vh sticky, 자동 스냅 (200ms debounce + rAF smooth 400ms)
3. **지사 캐러셀** — 14장 CSS @keyframes 자동 순환 (사진만, 텍스트 제거됨)
4. **조직문화 섹션** — "'사람 중심' 의 조직 문화 성장" + 3열 사진 그리드 (v=20260412b 신규)
5. **푸터** — #27398c 배경

### 네비 연동
- `data-nav="pro-intro"` → `#pro-intro-overlay` 오버레이 열기
- `closeAllOverlays()`에 `pro-intro-overlay` 닫기 포함
- 모바일 메뉴에도 연동 완료

### _serve.js (v=20260418)
- MP4 MIME 타입 + **fallback 체인 3단계**:
  1. 1차: `ai-branch/AI 홈페이지/<path>` — 신입/저차월교육 사진 (`AI 홈페이지/신입/*.jpg`) 서빙
  2. 2차: 바탕화면(`DESKTOP/<path>`) — 관리자/db영업전문과과정/법인/ 등
  3. 3차: SPA fallback (`index.html`)

## ✅ Implemented (2026-05-18 — 7대 AI 시스템 풀 데모 완료, Vercel 배포 완료)

### Phase 3-B-1 ~ 3-B-6 + 후속 통일 작업 — 16 commit 누적 (2026-05-17 ~ 2026-05-18)

| Phase | Commit | 내용 | Version |
|-------|--------|------|---------|
| 3-B-1 | bf648fc | 건강검진 풀 반영 (5건: 3카드 + 5컬럼 표 + 4컬럼 표 + AI 시뮬 + 제언) | v=20260517a |
| 3-B-1 fix | a099612 | 건강검진 테이블 헤더 nowrap + center | v=20260517 |
| 3-B-2 | 365a85e → f93b250 | 통합금융계산기 9 → 11 메인 + 5 서브 (운영 매칭) | v=20260517b/c |
| 3-B-2 fix | 7909971 | 계산기 모달 키보드 입력 차단 해결 | v=20260517d |
| 3-B-3 | 4cfccee → f0dcbba → cf344f1 | 상담 코칭 GA 2.0 표준 (유형 A/B/C × Level 1/2/3) | v=20260517e ~ 20260518b |
| 3-B-3 fix | 77ddedb / aafccbf | 코칭 인사말 + 사용자 + AI 양방향 타이핑 효과 | v=20260518c/d |
| 3-B-4 | 6f9a1b5 | 보험금 산출 AI (다중 PDF 업로드 + 마크다운 리포트) | v=20260518e |
| 3-B-5 | b646f3c | 완전판매 AI (FSS 조사관 + 4 뱃지 자동 색상 + A/B 모드) | v=20260518f |
| 후속 fix | 6fe7d53 | 챗봇 잠금+CTA 누락 보강 + maxOutputTokens 8192 격상 + 프롬프트 완전 출력 강제 | v=20260518g |
| 3-B-6 | 0190f7e | DB영업관리 AI 대시보드 (개인 모드 풀, 10 섹션 + AI Simulator) | v=20260518h |
| 통일 fix | 00bb040 | 챗봇 3개 잠금+CTA 노출 타이밍 변경 (AI 응답 완료 후로) | v=20260518i |
| 통일 fix | 79711a6 | 통합금융계산기 잠금+CTA 메인 → 계산 결과 모달 안으로 이동 | v=20260518j |

### 7대 시스템 잠금+CTA 노출 시점 통일 완료

| 시스템 | 노출 시점 | 형식 |
|---|---|---|
| 건강검진 | PDF 분석 결과 안 (기준) | 패널 inline |
| 보장분석 | PDF 분석 결과 안 | 패널 inline |
| 통합금융계산기 | **모듈 계산 결과 모달 안** | 결과 카드 직후 |
| DB영업관리 | 실시간 대시보드 안 | 패널 inline |
| 상담 코칭 | AI 응답 완료 후 | 채팅 메시지 |
| 보험금 산출 | AI 응답 완료 후 | 채팅 메시지 |
| 완전판매 | AI 응답 완료 후 | 채팅 메시지 |

### Gemini API 설정 (3개 시스템 챗봇)
- 모델: `gemini-3.1-pro-preview`
- `maxOutputTokens`: **8192** (코칭/보험금산출/완전판매 모두)
- `temperature`: 0.3~0.5 (시스템별 차등)
- 프롬프트: "응답을 절대 중간에 자르지 말 것" + 분량 가이드 명시
- thinkingConfig: `{ thinkingBudget: -1 }` (dynamic)

### 옵트인 검증
```js
sessionStorage._flag_sol_pdf='true'; location.reload();
```

### Vercel 환경변수
- `GEMINI_API_KEY`: 본 시스템(보장분석) 동일 키 — Tier 1 결제 활성

## 📋 Pending Feature (Team Mode)

### Phase 3-B-6 Team Manager Active 모드 — 별도 진행
- 팀원 프로필 선택 + Excel 일괄 업로드 + 백업/복원
- Team Overview: 팀 전체 목표 달성률 / 통합 실적 / 총 합산 보험료
- 팀 실적 리더보드
- 조직 통합 영업 효율 (4단계 평균 전환율)
- 조직 통합 전환 추이 (5단계 막대 차트)
- 팀원별 종합 현황표 + 우수/관리 필요 팀원 분류
- 팀 전체 AI 진단

## 📋 (Legacy) Pending Feature — 이전 설계 (2026-05-15)

### Prosolution PDF 업로드 → 보장분석 데모 (영상 더빙용 핵심)
- **목적**: ai-branch 랜딩 prosolution-overlay 안에서 사용자가 본인 PDF 직접 업로드 → Gemini가 즉시 분석 → 채팅 요약 + 우측 리포트 카드. 영상 더빙 시 "데모가 아닌 실제 동작" 시연 가능.
- **진입점**: `#prosolution-overlay` 채팅창 + 버튼 (index.html:5612) — 현재 onclick 없음, lazy attach 예정
- **Feature Flag**: `FEATURE_PROSOLUTION_PDF_UPLOAD = false` (ai-branch에 Flag 패턴 신규 도입 — 현재 0개)
- **신규 함수**: `_solPdf*` 8개 (index.html +400~500줄)
  - `_isProsolutionPdfOn` / `_solPdfInit` / `_solPdfHandleFile` / `_solPdfCallAnalyze` / `_solPdfRenderChatResult` / `_solPdfInjectReportPanel` / `_solPdfRenderReport` / `_solPdfHandleError`
- **API 확장**: `api/chat.js` PDF inline_data 모드 (+20~30줄)
  - 옵셔널 `pdf: { mime_type, data }` body 수신, MIME 화이트리스트(`application/pdf`만), base64 크기 제한(5MB 원본 ≈ 6.7M chars), `responseMimeType: 'application/json'`, `maxOutputTokens: 2500`
- **결과**: 채팅 한 두 문장 요약 + 우측 신규 리포트 패널 (가입 요약 + 8 카테고리 SVG 레이더 + TOP 3 부족 담보)
- **재사용**: Coverage dashboard panel(index.html:3060~3319)의 SVG/카드 구조를 `_solPdfRender*` 함수에 복사. `appendMessage` 패턴 차용.
- **검증 환경**: **Vercel 배포만** (`ai-branch.vercel.app`). 로컬 `_serve.js`는 Serverless Function 미지원 → `/api/chat`이 SPA fallback으로 HTML 반환됨.
- **회귀 방지**: Flag=false 시 + 버튼 onclick 미부착 → 기존 placeholder 그대로, doSend/appendMessage/coverage 패널 모두 무수정
- **상세 설계**: [C:\Users\SAMSUNG\.claude\plans\ai-functional-garden.md](file:///C:/Users/SAMSUNG/.claude/plans/ai-functional-garden.md) "ai-branch Prosolution Overlay PDF 업로드" 섹션
- **구현 시작 전 결정 3가지**: + 버튼 UI(호버+파일 아이콘 vs 그대로) / 진행 인디케이터(스피너 vs 진행률바) / 결과 캐싱(해시 기반 vs 매번 호출)

### CLOVA Dubbing 영상 더빙 작업 (병행)
- 14분 분량 13개 장면 대본 작성 완료 (transcript 보관)
- 녹화 환경: `ai-branch.vercel.app` (Vercel 배포)
- 녹화 도구: PowerPoint 화면 녹화 또는 Win+G (Xbox Game Bar)
- Scene 9(PROSOLUTION OVERLAY) 대본은 위 PDF 업로드 기능 구현 후 보강 (Q25.5/Q26 수정/Q26.5 신규 큐 — plan 파일 참조)

## Version

- **v=20260628s** (index.html 단일, main push + tag) — 히어로 제목 크기 한 단계 축소 `md:text-7xl→md:text-6xl`(72→60px, 대표님: 살짝 정제). 모바일 `text-5xl` 유지·흰색 유지.
- **v=20260628r** (index.html 단일, main push + tag) — 전문역량특화 패널 태그 `#실적극대화→#소득극대화`(`.edu-hp-tag` 14976, v=q 후속 미세수정).
- **v=20260628q** (index.html 단일, main push + tag) — 인재양성 "전문 역량 특화 과정" 패널 태그 3건: `#데이터영업→#DB영업`, `#전환율극대화→#실적극대화`, `#심리화법→#전문가양성`(`.edu-hp-tag` 14976).
- **v=20260628p** (index.html 단일, main push + tag) — 히어로 제목 "보험을 넘어/성장의 정점으로" **그라데이션→순백색**(대표님 요청). `bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/60`(위흰→아래60% 페이드) → **`text-white`**(균일 흰색). 사이즈·트래킹·애니 유지. 검증 color rgb(255,255,255)·backgroundImage none.
- **v=20260628o** (index.html 단일, main push + tag) — STEP1 클릭→교육 섹션 이동 시 **히어로 슬라이드쇼(사무실 사진) 플리커 제거**(대표님: 클릭 후 사무실 사진 잠깐 보였다 넘어감). 원인=v=n이 `setTimeout 450ms`로 스크롤해 그 사이 scrollTop 0(히어로) 노출. 해결=`initEduScroll`이 스크롤 리셋 안 함 + 교육섹션 세로위치는 CSS 고정이라 **init 기다릴 필요 없음** → `_go()` **동기 즉시 실행 + rAF + double-rAF**로 교체. 검증: 클릭 동기 직후 scrollTop=1402(0 안 거침)·최종 edu top 정렬·콘솔0.
- **v=20260628n** (index.html 단일, main push + tag) — ①STEP1 "프로를 만드는 교육 체계" 카드 클릭 **이동 대상 변경**: `data-nav="talent-open"`(인재양성 오버레이) → **인라인 onclick: 프로사업단총괄 오버레이(`#pro-intro-overlay`) 열고 `#edu-horiz-scroll`(신인/저차월 교육)로 스크롤**. ⚠️핵심: 오버레이 **실제 스크롤러는 `#pro-intro-overlay` 자체**(overflowY:auto), `.ceo-overlay__content`는 overflow:visible=비스크롤 → `o.scrollTop` 사용(처음 `.ceo-overlay__content` 썼다가 스크롤 0으로 실패→수정). `ceo-overlay--active` 부착 시 MutationObserver(~15290)가 +300ms에 `initEduScroll` 자동실행 → +450ms에 edu top으로 `getBoundingClientRect` 상대계산 스크롤. 검증: 클릭→overlay active·scrollTop 1402·edu 상대top 0·콘솔0. ②why-pro "같은 시간**,**↵다른 결과"→쉼표 제거(4313). ③stories "압도적 격차는 사람이 만듭니다**.**"→마침표 제거(6719).
- **v=20260628m** (index.html 단일, main push + tag) — 인재양성 4축 브랜드 헤드라인 "**상담 전,** 이미 신뢰가 만들어집니다"→**"이미 신뢰가 만들어집니다"**(`.talent-headline` 14820, "상담 전, " 제거).
- **v=20260628l** (index.html 단일, main push + tag) — 문구·레이아웃 3건. ①인재양성 헤드라인 "단계별로**,** 확실하게 키웁니다"→**"단계별로 확실하게 키웁니다"**(쉼표 제거, `.talent-headline` 14732). ②문의하기 오버레이(#contact) 상단 "● 문의하기" 뱃지 **삭제** + h2 `mt-4` 제거 → 헤더 내용 뱃지 자리만큼 **위로** 올림(7035~). ③문의하기 서브 "시간은 절반으로, 소득은 두 배로 **—**"→**"시간은 절반으로, 소득은 두 배로"**(끝 em-dash 제거, 7043). 검증 실측·콘솔0.
- **v=20260628k** (index.html 단일, main push + tag) — 헤더 데스크톱 네비 손질(이미지2 참고). ①네비 링크 글자 `text-[15px]→text-[16px]`(5개 동일 클래스 replace_all) + 컨테이너 `gap-10→gap-12`(40→48px). ②"지원하기" 그라데이션 버튼: **`>` 셰브론 SVG 제거**(텍스트만), 글자 `13→14px`·`font-medium→semibold`·패딩 `py-1.5 px-3→py-2 px-4`. 모바일 네비(#mobile-nav-overlay)·모바일 지원하기 버튼 무영향. 검증 실측(navFont 16px·gap 48px·btn 14px·셰브론 없음)·콘솔0.
- **v=20260628j** (index.html + `assets/images/ceo-signature.png`, main push + tag) — CEO 오버레이 임형준 **서명 이미지 라이브 복구**. 원인=`대표님 서명.png`가 **루트 PNG라 `.gitignore`의 `/*.png`·`/*.PNG`에 막혀 추적 안 됨 → GitHub 미반영 → Vercel 404**(로컬 `_serve.js`만 디스크서 서빙돼 보였던 것, "갑자기"가 아니라 라이브엔 원래 없었음). 해결=파일을 **`assets/images/ceo-signature.png`**(ASCII명, `.gitignore`의 `!/assets/`로 un-ignore됨)로 복사 + `<img>` src `대표님 서명.png`→`assets/images/ceo-signature.png`. 한글파일명+공백 Vercel 리스크도 제거. 검증=img `naturalWidth 939`·loaded. ⚠️**교훈: 루트 PNG는 gitignore됨 → 페이지에서 쓰는 이미지는 반드시 `assets/`(또는 추적되는 폴더)에 둘 것.**
- **v=20260628i** (index.html 단일, main push + tag) — stories 캡션 문구 변경: "월례 시상식 · 교육 현장 · 1등 FA — 같은 출발선의 다른 결과." → **"AI 시스템 · 월례 시상식 · 교육 현장 · 1등 — 같은 출발선의 다른 결과."** (`.stories-caption`, "FA" 제거 + 앞에 "AI 시스템 ·" 추가).
- **v=20260628h** (index.html 단일, main push + tag) — ①히어로 아래 CTA "AI 시스템 직접 체험하기"→**"AI 시스템 체험하기"**(4295). ②STEP2 리스트 애니 **시작 잔상 수정**(대표님: 로드 시 전부 흰색→하나씩 꺼짐이 거슬림): 원인=`active-step-anim`/`active-content-reveal`의 **기본(지연 대기) 상태가 밝음**이라 첫 사이클에 전부 밝게 보임 → `.animate-step-cycle` 기본 `opacity:.4`, `.animate-content-cycle`(파란 바·RUNNING 배지) 기본 `opacity:0` **추가**(2줄) → 로드 시 **1번(보장분석 리포트)만 흰색+바+배지, 나머지 회색** → 흰 하이라이트 1개가 위→아래 순차 이동(키프레임·속도·stagger 21s/3s 불변). ⚠️!important 미사용(CSS 캐스케이드상 `!important author`가 animation보다 우선이라, 쓰면 active 시 안 밝아짐 → normal로 둬야 애니가 이김). 검증: 행 opacity@t0 `[1,.4×6]`, 바 `[1,1,0…]`.
- **v=20260628g** (index.html 단일, main push + tag) — ①프로솔루션 "시스템 현황" 클릭 활성 글로우 **cyan/teal `#06b6d4`(rgba(6,182,212)) → 브랜드 블루 `#3b82f6`(rgba(59,130,246))**(`.sol-system-item.active` bg/border-left/box-shadow, index.html ~936). 대표님이 "초록 계열"로 본 게 이 teal. ②시스템 현황 리스트 "통합금융계산기"→**"통합 금융계산기"**(7287 — STEP2 리스트(v=f)와 별개 인스턴스). ③STEP2·3 그래픽 영역 배경 → **`bg-[#05030F]`**로 STEP1과 통일(기존 STEP2·3=카드 `neutral-900/40`이라 STEP1 `#05030F`와 달라 보였음). 검증 DOM+CSS규칙 실측·콘솔0. ⚠️참고: 시스템 현황 초록 status 점(`bg-emerald-400`)·"All Live" 뱃지는 '라이브 상태' 표시라 유지(요청=클릭 글로우만). ⚠️ active border-left는 항목 인라인 `border`가 덮어 화면엔 bg+box-shadow 글로우로 표현(cyan 때와 동일 동작, 색만 블루).
- **v=20260628f** (index.html 단일, main push + tag) — ①STEP1 궤도 위성 아이콘 **블루 모노톤 통일**(초록 체크·흰색 코드 제거 → `#8fb0f2`/`#6e92e6` 2톤, 중앙 PRO 유지. 위성=장식이라 색에 의미 없음→통일이 정돈·프리미엄. 디자인 판단: 색=의미 인코딩일 때만 다색 정당). ②STEP2 카드 리스트 문구: "보장분석 엔진"→**"보장분석 리포트"**, "DB영업관리"→**"DB 영업관리"**, "통합금융계산기"→**"통합 금융계산기"**(span 6390/6395/6400). ③why-pro 우측 카드 **순서 스왑**: **보장분석 AI를 최상단으로**(기존 DB 영업관리 AI가 1번). ⚠️**본문만 스왑**(연결선 path-r1/r2+animateMotion은 슬롯 고정 유지=선 어긋남 방지, 통째 `<li>` 스왑 금지). 검증 DOM 실측(아이콘 4색 전부 블루·리스트·카드순서·콘솔0).
- **v=20260628e** (index.html 단일, main push + tag) — STEP1 궤도 **중앙 PRO 코어 톤다운**(대표님: 기존 블루 너무 밝아 튐 → 브랜드 네이비 쪽으로 한 단계 깊게). `.s1ob-core` gradient `#a8c8ff/#3b82f6/#1d3fa8` → `#5e80cf/#2a46a2/#15245a`, box-shadow glow `rgba(59,130,246,.55) 36px` → `rgba(40,68,150,.42) 26px`, 흰 하이라이트 inset .45→.28, `.s1ob-coreglow` `rgba(59,130,246,.45)`→`rgba(40,68,150,.34)`. PRO 흰 글씨 가독성 유지, 빛 아크가 주역이 되도록 코어 차분화. (CSS 색만, 구조·애니 불변.)
- **v=20260628d** (index.html 단일, main push + tag) — STEP1 위젯 세련화 이식 + 텍스트 3건. ①**STEP1 "프로를 만드는 교육 체계" 궤도 리뉴얼**: 기존 회전 궤도(`orbit`/`orbit-reverse`, 정적 링+칩 위성) → **세련된 궤도**(그라데이션 가이드 링 + 회전 빛 스윕 아크 2개[외 9s / 내 6.5s 역방향, conic+radial mask로 혜성 호] + 글래스 위성 4개[사람/책/코드/체크, 역회전으로 아이콘 정립] + 발광 글래스 코어 펄스). **중앙 사람 아이콘 → "PRO" 문구**(대표님 요청). 클래스 `s1ob-` 프리픽스 + 키프레임 `s1obSpin/s1obSpinRev/s1obPulse`로 격리(기존 orbit 키프레임 무영향, 마크업만 교체). 카드 래퍼·data-nav·STEP 배지·제목·설명 불변. **STEP1만**(STEP2 러닝리스트·3 성장차트 유지). ②히어로 뱃지 "PRO AI 영업 통합 시스템"→**"PRO AI 통합 시스템"**(`index.html:3718`). ③프로솔루션 오버레이 뱃지 "프로솔루션 · AI 인터랙티브"→**"프로 솔루션 · 7대 AI 시스템"**(7210). 검증=DOM 실측(코어 PRO·애니 바인딩 s1obSpin/SpinRev·텍스트·콘솔0. 미리보기 애니 frozen은 v=c 노트 참조).
- **v=20260628c** (index.html 단일, main push + tag) — 승격 구조 자동 흐름 **재작업**(대표님 피드백: 글로우 wave 말고 "영업이사/총괄단장의 파란 배경이 단계별로 자동 순환"+속도 느리게). promoDot/Label/Link → **promoDotCycle/promoLabelCycle/promoLinkCycle**: 라벨 `background-color`(rgba(255,255,255,.05)↔rgba(37,99,235,.30))+`color`(zinc300↔white) 애니로 **파란 배경 하이라이트가 단계별 하나씩 점멸·순환**(주기 7s, 노드 delay 0/1.4/2.8/4.2/5.6s=한 번에 하나). **고정 하이라이트 제거**(최종 노드 `background-image:none !important`+`font-weight:500`로 그라데이션·볼드 해제→전 단계 통일). 검증=DOM 실측(⚠️ preview_eval `docHidden=true`라 애니 클럭 정지→`currentTime` 수동 주입으로 5노드 전부 active 시 rgba(37,99,235,.3)+white 확인. **헤드리스 미리보기는 백그라운드 탭이라 CSS 애니 frozen=screenshot 타임아웃·동적 샘플 dim → 실브라우저는 정상. 이 한계 기억할 것**). 🔜 STEP1 위젯: 뉴럴 그래프 시안 **반려**(대표님: 별로)→**원형 궤도 유지+세련화** 방향 재시도.
- **v=20260628b** (index.html 단일, main push + tag) — ①**"프로솔루션"→"프로 솔루션"**(솔루션+승격구조 블록 카드 제목 `index.html:6579`. ⚠️ AI시스템 오버레이 상단 뱃지 `프로솔루션 · AI 인터랙티브`(7167)·aria-label은 **미변경**=대표님 미확정). ②**승격 구조 자동 흐름 애니**: 영업인/관리자 두 루트 노드를 위→아래 순차 점등하는 무한 wave(3.2s, 두 루트 동기). `promo-flow` 마커 클래스 1개 + 승격구조 카드 앞 스코프 `<style>`: `@keyframes promoDot`(점 scale1.55+글로우)/`promoLabel`(라벨 inset+글로우)/`promoLink`(연결선 brightness). 노드 delay 0/.38/.76/1.14/1.52s, 링크 .19/.57/.95/1.33s. **비파괴**(box-shadow/transform/filter만 → 최종 영업이사/총괄단장 그라데이션 rest 유지). 구조 셀렉터(`.space-y-3>.flex` / `>.w-px` nth-child)로 노드↔링크 구분(NLNLNLNLN). reduced-motion off. 검증=localhost DOM 실측(anim name·delay·패턴·콘솔0). 🔜 다음 논의=STEP1 "프로를 만드는 교육 체계" 위성/오비탈 위젯 리뉴얼(대표님: 식상·구식→세련).
- **v=20260628a** (index.html 단일, main push + tag) — 인재양성·CEO·why-pro UI 손질 3건 배포. ①**인재양성 로드맵 아이콘·글자 키움**: `#talent-overlay .roadmap-icon`/글로우 64→74px·라운드 16→18px, SVG 24→30px, 단계명 14→16px, 설명 11→13px. 가로 글로우 라인 `.roadmap-line top:96→101px`로 키운 아이콘 새 중심(패딩64+절반37=101)에 재정렬(데스크톱 5열·라인↔아이콘중심 101=101 실측 OK, 모바일은 라인 display:none이라 무관). ②**CEO 인사말 뱃지 삭제(위치 고정)**: `#ceo-overlay` 키커 pill에 `visibility:hidden`(높이28+mb24 공간 유지 → 제목 "당신을 위한…서포터" 안 밀림. display:none 아님=위로 안 올라옴). ③**why-pro "같은 시간, 다른 결과" 섹션에 블루 프레임**: 7대 AI(`#solutions-inner`)와 동일한 `border-gradient`(회전 conic `#1C49C8` 테두리)+`glow-target`+`.glow-border`(마우스 따라 도는 블루 글로우, 기존 JS가 `.glow-target` 전체 자동 인식=스크립트 추가 0)+`rounded-3xl`+bg `#0a0a14` 래퍼로 본문 감쌈. 3컬럼 허브(좌109·중앙559·우909/1216px) 정상·가로overflow 0·콘솔 에러 0. **검증=localhost:3098 DOM 실측**(why-pro 섹션 무한 애니로 preview_screenshot 캡처 타임아웃 → 실측 대체). 🔴 Web3Forms 키 교체 여전히 보류·🟢 건강검진 PDF 순서버그 시각확인 종결(2026-06-28).
- **v=20260627i (시도→철회)** — 메인 히어로 "터널 인트로"(SF 터널 3초→히어로 등장)를 Flag=false로 빌드했으나, **대표님 결정으로 전량 롤백**(commit `<revert>`): "보험을 넘어 성장의 정점으로가 처음부터 보이는 게 낫다." index.html 인트로 블록 + `assets/video/intro-tunnel.mp4` 제거. **히어로 인트로는 재제안 금지.**
- **v=20260627h** (index.html 단일, 최신 코드) — 챗 인디케이터·타이핑 클로드化(대표님 요청). **A-1**: `appendTyping` 점 3개 제거 → **PRO AI 아바타 `animate-pulse` 깜빡임** + 오른쪽 문구. 문구를 **시간 기반("Ns · 상태")**으로 — 매초 경과초↑ + 임계값(0/4/10/18s)으로 단계 전환(빠른 자동회전 폐기, "진짜 작업 중" 체감). PDF는 `noRotate`라 기존 %구동 유지. **B-1**: `_solStreamReply` 부드러운 타이핑 — SSE는 `target`에 누적, 화면은 `shown`이 한 자씩 따라잡으며 노출(`revealTimer` 18ms, 멀리 뒤처지면 `ceil(remaining/18)`로 빨리 따라잡고 가까우면 1자씩). 뭉텅이 청크 → 부드러운 타이핑. `finalize()`가 따라잡기 완료+streamDone 시 rich 렌더+CTA. 에러/빈응답 폴백 유지. 코칭·보험금·완판 공통.
- **v=20260627g** (index.html 단일) — "시간은 절반으로" 3-STEP 카드 손질. ①**STEP 1(교육 체계) 진입 효과 통일**(대표님: STEP1만 0.3s 지연 blur 페이드로 늦게 떠서 어색) → STEP1의 인라인 `style="animation: fadeSlideIn 0.8s ease-out 0.3s both"` 제거 = STEP2/3처럼 **즉시 표시**(3개 동일, 1-A안). ②**STEP 2(AI 시스템 활용) 리스트 글자 키움**: 7개 시스템 이름 `12px→13px`, "Running" 배지 `9px→10px`. (리스트는 `h-64` 스크롤 박스라 살짝 넘치면 후속 간격 트림 검토.)
- **v=20260627f** (index.html 단일) — ①**WHY PRO 허브 왼쪽(기존영업) 움직이는 점 제거**(B-1, 대표님: 왼쪽=과거는 정적, 오른쪽 PRO만 흐름=가독성·내러티브↑). `path-l1~l4`의 `<g>`(circle+animateMotion) 4개 제거, **빨간 연결선(path)은 유지**. 오른쪽 파란 점(`path-r1~r4`)은 그대로. ②**허브 오른쪽 카드 제목 변경**: "AI DB 추천"→"DB 영업관리 AI", "코칭 AI 화법"→"상담 코칭 AI". ③🔴**버그 수정**: v=20260627e의 빨간 stroke 일괄변경 때 path 닫는 `>`가 누락돼 `non-scaling-stroke"</path>`(malformed, 브라우저 관대렌더로 표시는 됐음) → `"></path>`로 4개 복구.
- **v=20260627e** (index.html 단일) — **WHY PRO 중앙 허브 또렷하게**(대표님: 흐릿함→선명, 발광 분위기는 유지). A 동심원 링 불투명도↑(white 5%→12%·3%→8% / 파란 dashed 20%→40%·dotted 30%+opacity-50→45%), B 연결 곡선 stroke 0.15/0.2→0.32/0.4·1.5→1.75px + 움직이는 점 외곽 halo 0.3/0.4→0.55/0.65, C 중앙 원판 `backdrop-blur-xl→sm`(프로스티드 헤이즈 약화로 뒤 링 선명). **D 발광 글로우(blur-[100px]·blur-2xl·conic 스윕·중심 점 발광)는 그대로 유지.** 데스크톱 허브(`#why-pro .hidden.lg:flex`) 한정.
- **v=20260627d** (index.html 단일) — **진행 멘트를 "자동 시간 회전"→"진행률 연동"으로 개선** (대표님 피드백: 분석 한참 남았는데 "거의 다 됐어요"가 너무 일찍·자동으로 뜨고, 루프라 뒤로 돌아감). ①PDF 흐름: `appendTyping(..., {noRotate:true})`로 자동 회전 끄고, `_solPdfShowProgress(percent)`가 멘트를 **진행률 %에 맞춰 단조 증가**(`data-mi` 클램프, 뒤로 안 감)로 구동 — `<22%📄 / <45%🔍 / <72%📊 / <90%✍️ / ≥90% 거의 다`. ②공용 `appendTyping` 회전도 **루프 제거**(마지막 멘트에서 멈춤, 1.4s→1.6s) — 챗(코칭/보험금/완판)도 "거의 다" 뒤 📄로 안 돌아감. `opts.noRotate` 인자 추가.
- **v=20260627c** (index.html 단일) — **회전 진행 멘트(동적 작업 표시)를 모든 AI 챗봇으로 확대**. 기존엔 prosolution 스트리밍 챗(`appendTyping`)+PDF 흐름만 회전 멘트가 있었고, **쇼케이스 카드 데모 3개**(메인 데모 `addTyping`@~9335 `#typing-temp` / 상담코칭 데모 `addBubble('typing')`@~9778 `#coaching-typing` / 완전판매·FSS 데모 `addTyping`@~10025 `#cs-typing`)는 정적 점 3개뿐이었음. 각 typing 인디케이터에 `.pro-demo-ment` span + **self-clean 회전 interval**(해당 typing 요소가 DOM에서 사라지면 스스로 `clearInterval` — 제거 코드 다수를 안 건드림, 누수 0) 추가. 멘트는 시스템별 맞춤(보장분석/코칭/FSS). 고정 높이(`h-9`/`h-10`) 제거해 멘트 한 줄 정렬. 별도 IIFE라 `appendTyping` 재사용 불가 → 인라인.
- **v=20260627b** (index.html 단일) — **PDF 분석 흐름 동적화**. ①`_solPdfHandleFile`의 정적 "분석을 시작합니다…" 메시지 → `appendTyping('sol-pdf-typing', SOL_PDF_PROGRESS_MENTS)` 회전 멘트 버블로 교체(📄 PDF 읽기→🔍 추출→📊 분석→✍️ 리포트 작성→거의 다). 완료/에러 양쪽 `removeTyping`. ②진행률 라벨 "AI 분석 중**...** 92%"의 끝 `...`을 `_solPdfShowProgress`에서 `.sol-pdf-dots`(opacity 펄스 점 3개, Safari 호환)로 분리 렌더 — 계속 움직임. `appendTyping(id, ments)`에 선택적 멘트 인자 추가(기존 `appendTyping(typingId)` 호출 무영향).
- **v=20260627a** (commit `812c55a`, index.html 단일 배포 LIVE) — 챗 응답 **마크다운 볼드(`**...**`) 렌더 추가**. `_solCoachRenderRich`/`_solCoachBrackets`가 표·[대괄호]만 처리하고 볼드는 미처리라 `**5) [플랜 B]**`처럼 `**`가 리터럴 노출되던 문제. `_solCoachBrackets`에 `**(.+?)**`→`<strong>$1</strong>`를 대괄호 치환 **앞**에 추가(비탐욕+줄단위라 단일 `*`·글머리표·짝없는 `**`는 리터럴 유지). 챗 응답·표 셀·잠금 설명 공용 적용. 배포본 브라우저 시각 검증 완료(`**` 잔재 0). + 6/26b 배포 검증 완료(A 스트리밍·③ 진행멘트 시각 ✅ / ① 건강검진 리포트 순서는 라이브 소스 코드 ✅, 시각 검증은 PDF 업로드 필요로 미완 → 대표님/전략실장 수동).
- **v=20260626b** (index.html + chat.js 동시 배포) — A(스트리밍) + ①(건강검진 답변 순서 버그) + ③(진행 멘트) 셋 다 구현, 6/26 미배포 index.html 변경(1~9)도 같이 배포.
  - **A. 스트리밍 (SSE)**: `api/chat.js` — `body.stream:true` 시 `streamGenerateContent?alt=sse`로 받아 `data:{"text":...}`/`data:[DONE]` 릴레이(thinking 파트 제외, generationConfig·프롬프트 동일=품질 불변). JSON 강제 PDF 모드(보장분석/건강검진)는 스트리밍 제외. `index.html` doSend → `_solStreamReply`/`_solStreamChat`/`_solCreateStreamBubble`로 점진 렌더(평문+커서 → 완료 시 `_solCoachRenderRich`). 실패 시 기존 비스트리밍 렌더로 폴백. **다른 챗 위젯 4개(메인데모/코칭standalone/strategy/FSS)는 비스트리밍 {reply} 유지 = 무영향.**
  - **① 건강검진 버그**: `_solPdfInjectReportPanel`이 report 재사용(이전 시스템 잔재) 시에도 `sol-chat-messages`를 반드시 숨기도록 수정 → 직전 append된 질문/분석시작 메시지가 report 아래 남아 "답변이 질문 위"처럼 보이던 것 해소(coverage 2회차도 동시 해결).
  - **③ 진행 멘트**: `appendTyping` 3-dot 옆에 회전 멘트(🔍분석→📊조회→✍️작성→거의 다) 1.4s 간격, 첫 토큰 도착(removeTyping) 시 사라짐. `_solTypingMentInterval` 클린업.
  - 🔴 **Web3Forms 키 교체 보류**: 대표님 승인 후 진행(현재 키=전략실장 이메일 수신 그대로 유지). web3forms.com에서 proenterprise@incarproent.com 발급 → index.html `_submitContactForm` `c96794c6…` 교체 예정.
  - ⚠️ **챗 흐름은 ai-branch.vercel.app(배포본)에서만 테스트** — 로컬 `_serve.js`는 `/api/*` 미실행.
- **v=20260626** (⚠️ chat.js만 배포 / index.html 미배포) — AI 홈페이지 대규모 작업. 상세·할일·다음 첫 질문 → [.claude/memory.md](.claude/memory.md)
  - ✅ **배포 LIVE (chat.js, commit `0b04dcb`)**: `/api/chat` 챗봇 **Gemini Developer API 키 → Vertex AI** 전환. 죽은 공유키(`...6rBg`, 6/5 도용 폐기) 대신 **서비스계정 OAuth**(Node 내장 `crypto` RS256 JWT 서명 → 토큰 교환, **외부 의존성 0·package.json 불필요**). 모델 `gemini-2.5-flash`, 리전 `asia-northeast3`, 프로젝트 `youtube-482701`(개인 결제 `0150F6`). env 3종 `VERTEX_SA_JSON`/`GCP_PROJECT_ID`/`VERTEX_REGION` ai-branch Vercel 등록 + 재배포. 옛 `GEMINI_API_KEY`·`ALLOWED_ORIGINS` 삭제(무해 — 코드에 `*.vercel.app` 하드코딩, ai-branch 도메인=`ai-branch.vercel.app`만). `vertex-proxy-sa` 새 JSON 키 발급 사용. **챗봇 부활 확인됨.** 보안레이어(Origin 화이트리스트·레이트리밋)·프롬프트·PDF 모드 그대로.
  - 🔴 **미배포 (index.html 로컬 only, uncommitted)**: ROADMAP 뱃지 제거+빛동기화 물결(`roadmap-rise`) / PEOPLE·SUPPORT·EXPERTISE·ROADMAP 뱃지 `display:none`(위로 올림) / 부분단어 파란색(단계별로·신뢰·사람=blue-500·서포터) / why-pro 8카드 가독성(좌 zinc-300·우 zinc-200·normal, 서브 9→11px, CEO부제 zinc-300, 성과날짜 .6→.78) / edu 패널 텍스트 밝힘(desc .7·course .5/.7·h4 .8·tag .6)+가로사진 2장 삭제+4:5 액자통일(matte/border/radius/shadow/contain) / 프로사업단총괄 인트로 문구교체("처음부터 정점까지/당신의 성장을 설계하다"+"PRO AI 시스템과 체계적인 교육으로/…")+쉼표제거+word-break:keep-all / 슬라이드쇼 로비(TWOSOME)사진 제거→INCAR간판 첫장 / 숫자 카운트업 `tabular-nums`+4000→2000ms / 문의폼 → **Web3Forms** 연결(key `c96794c6…`, ⚠️**본인 이메일용** — 대표님 이메일로 키 교체 필요).
  - 🔜 **다음(전부 미구현, 한 묶음으로 구현 후 index.html+chat.js 동시 배포)**: **A.스트리밍**(chat.js `streamGenerateContent?alt=sse` SSE 릴레이 + index.html 클라 점진 렌더 — 품질 동일·체감속도↑, ⚠️**server+client 동시 필요**, chat.js 단독 배포 시 현재 라이브 클라 깨짐) / **①건강검진 분석 AI 답변이 질문 "위"에 생성되는 버그**(클라 메시지 삽입 순서) / **③생성중 진행 멘트**("분석 중→데이터 조회→거의 다 됐어요" 회전, 클라) / **Web3Forms 대표님 이메일로 키 교체**.
- **v=20260522b** — 오버레이 내부 흰 배경 섹션 위에서 헤더 가독성 fix (IntersectionObserver)
  - 진단: 헤더 토글이 `window.scroll` 이벤트 + scrollY 기반 → 오버레이 열린 동안 `body{overflow:hidden}`로 메인 스크롤이 멈추면 토글 안 됨. 인재양성(`#talent-overlay` 조직문화 14630) / 프로사업단총괄(`#pro-intro-overlay` 14511) 안의 `#f5f5f7` 흰 섹션 위에서 흰 글자 헤더가 묻힘.
  - 해결: 흰 섹션 2곳에 `data-nav-bright` 마커 + IntersectionObserver(rootMargin `-60px 0 -90% 0`)로 헤더 라인에 흰 섹션이 진입한 동안 `navScrolled()` 강제. brightCount 카운터로 다중 섹션 처리. 이탈 시 메인 scrollY 기반 동작 복원.
  - 기존 동작 무손상: 메인 scroll handler에 `if (brightCount > 0) return` 가드만 추가. IntersectionObserver 미지원 브라우저는 기존 동작 그대로.
  - 적용처: index.html 8899~8927 (헤더 IIFE 내부 보강) + 14511 (`data-nav-bright`) + 14630 (`data-nav-bright`)
- **v=20260522a** (commit b69a325) — 프로사업단총괄 두 번째 캐러셀 한글 파일명 이미지 5종 git add (Vercel 404 fix)
  - 진단: `pro-carousel-auto-reverse`(index.html 14715~14731)가 참조하는 `프로 사진/광주지사.jpg` / `경북도청지사.jpg` / `총괄 성수지점.jpg` / `퍼스트지점 성수.jpg` / `로얄본부 직할.jpg` 5종이 모두 `??` untracked → Vercel 배포에 파일 없음 → blank 카드
  - 같은 폴더 SnapInsta 파일들은 git tracked → 정상 표시되어서 폴더/경로 문제 아님 확인
  - 해결: 5종 `git add` 후 commit + push. HTML 코드/경로 수정 없음 (상대경로 `프로 사진/<한글>.jpg` 그대로 작동)
- **v=20260521c** (commit c54b8d4) — 인재양성 이미지 src 절대 경로 변경
  - 진단: vercel.json rewrites가 한글 source 패턴 매칭 못 함 (curl 200/404 직접 검증)
  - 해결: HTML img src `src="<폴더>/..."` → `src="AI 홈페이지/<폴더>/..."` 일괄 25건 변환, vercel.json 제거
  - _serve.js 호환: 첫 시도(ROOT + url)에서 직접 매칭 — 로컬 + Vercel 모두 OK
- **v=20260521b** (commit a9a7d24) — 인재양성 이미지 폴더 git push (실패한 vercel.json 시도)
  - 원인: HTML img src 상대경로지만 GitHub에 이미지 untracked → Vercel 404
  - 시도: vercel.json rewrites — 한글 source 매칭 실패
  - 부산물: `AI 홈페이지/신입/관리자/법인/재무설계/db영업전문과과정/사람` 35개 이미지 push
- **v=20260521a** (commit b911d0d) — 완전판매 B 모드 민원 공문 PDF 업로드 기능 추가 (+137줄)
  - PDF_ENABLED_SYSTEMS에 'complete-sales' 추가, PDF_SYSTEM_CONTEXTS['complete-sales'] (multi: false, title: '민원 공문')
  - 신규 함수 4개: `_solComplReset` / `_solComplAddFile` / `_solComplAppendChip` / `_solComplAppendSystemMsg(Typing)`
  - doSend complete-sales PDF 첨부 분기 + api/chat.js `complete-sales-pdf` 컨텍스트 + completeSalesPrompt B 모드 PDF 룰
- **v=20260520n** (commit a01544f) — **FEATURE_PROSOLUTION_PDF_UPLOAD Flag=true 격상 (풀 기능 활성)**
  - 근본 원인: v=20260520a~m의 모든 변경이 `_isProsolutionPdfOn()` Flag 분기에서만 활성. Flag 기본값 false라 사용자가 sessionStorage._flag_sol_pdf='true' 옵트인 안 하면 옛 흐름(systemResponses 메시지 누적, 인사말 없음)으로 작동.
  - 사용자 보고 (캡처): 시스템 카드 클릭마다 [상담 코칭 AI] / [통합금융계산기] / [DB 영업관리] / [보장분석 시스템] 메시지 누적 + 타이핑 효과 안 됨 → Flag=false 분기 진입 증거
  - 변경: `var FEATURE_PROSOLUTION_PDF_UPLOAD = false → true`
  - 영향: 카드 클릭 시 `_solResetForSystem` + 챗봇 인사말 타이핑 + 잠금 카드 + 보험금 산출 PDF.js + 단계별 안내 + + 버튼 토글 모두 활성. Flag=false 분기 코드는 옵트아웃 경로로 보존 (sessionStorage 강제 false 가능)
- **v=20260520m** (commit 228159f) — 보험금 산출 PDF 첨부 단계별 안내 (1→2→3 타이핑)
  - 신규 `_solInsCalcAppendSystemMsgTyping(msg, speed)` — `_solCoachTypewriter` 재사용
  - `_solInsCalcAppendChip` 단계별 안내: count===1 (1/2 단계 완료 + 2단계 약관 안내) / count===2 (2/2 단계 완료 + 3단계 진단명 입력 안내, 예시 3개) / count≥3 (추가 첨부)
  - 모든 안내 메시지에 [대괄호] 청록 강조 + 14ms/char 타이핑 효과
- **v=20260520l** (commit 7051c94) — 보험금 산출 시연 제한 안내 + 완판 B 모드 민원 공문 PDF 안내
  - insuranceCalcPrompt에 [시연 모드 제약사항] 룰 + 응답 헤더 직후 "📌 [시연 모드 안내]" 한 줄 강제 출력
  - 완전판매 B 모드 인사말 텍스트 2건 변경: "접수된 민원 정밀 해부" → "접수된 민원 **내용** 정밀 해부" / "환차익으로 돈 번다고..." 예시 → "민원 공문 내용 pdf 업로드" 예시
  - ⏸️ **후속 작업 대기**: 완전판매 B 모드 실제 PDF 업로드 기능 추가 (`PDF_ENABLED_SYSTEMS`에 'complete-sales' 추가 + `_solComplAddFile` 신규 + `doSend` 분기 + `api/chat.js` context 분기)
- **v=20260520k** (commit aeb2d11) — 보험금 산출 약관 PDF 20MB 지원 (클라이언트 PDF.js 텍스트 추출)
  - PDF.js 3.11.174 cdnjs CDN async 로드 (4대 원칙 #3 준수)
  - 신규 `_solPdfWaitForLib(timeoutMs)` (lazy polling) + `_solExtractPdfText(file, onProgress)` (모든 페이지 텍스트 추출)
  - `_solInsCalcAddFile` 분기: ≤4MB base64 inline_data / >4MB ~20MB PDF.js 텍스트 추출 → text 모드 전송
  - 이미지 기반 스캔본 감지 (텍스트 <1000자 → fallback 안내) + 텍스트 한도 80K chars (클라) / 200K chars (서버)
  - `api/chat.js validatePdf` text 모드 추가: `[첨부 PDF — filename (클라이언트 텍스트 추출)]\n\n<text>` 래핑
- **v=20260520j** (commit 0d1fd99) — 잘못된 매칭 입력 시 풀 시스템 안내(잠금+CTA) 자동 노출 차단
  - 신규 `_solShouldShowLockedCta(reply)` 가드 헬퍼 — 응답 <500자 또는 재확인 시그니처("다시 입력해 주세요", "함께 표기해 주세요" 등) 포함 시 스킵
  - 3 호출처 (coaching/insurance-calc/complete-sales) onComplete 콜백에 가드 적용
- **v=20260520i** (commit 7d133c5) — 메인 챗봇 타이핑 효과 + 보험금 산출 잠금 7개 + 본문 정리
  - 메인 챗봇 두번째 줄 ("시스템 현황에서 해당 AI 시스템을 클릭...") 35ms/char 타이핑 + 600ms 딜레이 + 깜빡이는 커서
  - 보험금 산출 잠금 카드 5→7개: #1 이름 "50종 표준 담보 정밀 매칭" → "담보 정밀 매칭", 신규 #6 🎯 전문가 전략 가이드 / #7 💡 놓치지 말아야 할 포인트
  - insuranceCalcPrompt 본문 정리: [2️⃣ 전문가 전략] + [💡 포인트] 두 섹션 본문 출력 금지, 응답 구조 5섹션으로 축소
- **v=20260520h** (commit c445579) — 인재양성 로드맵 UX/UI QUANTCORE 디자인 이식
  - HTML: 점·라인 → 아이콘 박스 + 흐름 글로우 라인 구조 (5개 SVG 인라인 아이콘, 교육 테마)
  - 03 관리자 양성 .is-center (영구 cyan glow + 펄스 dot) / 05 WM 마스터 .is-final (indigo·purple glow)
  - CSS 재작성: gradient bg + rounded-3xl + backdrop-blur + grid 패턴 배경, 흐름 글로우 cyan/indigo 2개 1.5s 시차
  - 모바일 미디어 쿼리: 세로 스택 + 가로 라인 숨김 + 호버 효과 비활성
  - JS 무수정 — 기존 `.is-playing` / `.is-lit` / `.is-spot` 클래스 토글 호환 유지
- **v=20260520g** (commit 557e241) — 코칭/완판 의도 검증·재확인 룰 추가
  - coachingPrompt: 사용자 표기 [유형 X]과 실제 [질문 내용] 불일치 감지 ("A.1 거절 처리" → "B-1로 다시 입력해 주실까요?")
  - completeSalesPrompt: 모드 A/B와 실제 입력 불일치 감지 ("A 30대 자산가 거절처리" → 코칭 AI 영역 안내 + 재입력 유도)
  - 사용자 입력 우선 원칙: 동일 입력 재전송 시 강제 막지 않음
- **v=20260520f** (commit bd06013) — 메인 챗봇 인사말/버튼 정리 + 보장분석 인사말 변경
  - 메인 챗봇 인사말 "보장분석, 금융계산, 상담 코칭 등 무엇이든..." → "시스템 현황에서 해당 AI 시스템을 클릭 후 사용해보세요"
  - 메인 챗봇 4개 빠른 버튼 삭제 (정적 + 동적 배열 SYSTEM_QUICK_QUERIES.all)
  - 보장분석 AI 인사말 "보험 증권 PDF... 119개 항목을 즉시 분석" → "보험 내역 PDF... 즉시 분석" (3곳: 동적 L10476 + 시연 HTML L4708 + showcase L7809)
- **v=20260520e** (commit 8accb9f) — 코칭 가상 페르소나 금지 + 완판 사례번호 정확성 + PDF 안내 plain text
  - coachingPrompt: [가상 고객 데이터 임의 생성 절대 금지] 룰 — 사용자 미입력 보험료/보장금액/연령/소득 생성 금지
  - completeSalesPrompt: [사례·결정문 번호 정확성 룰] — "제202X-XX호" X 자리표시자 금지, 모르면 일반화
  - PDF 안내 메시지 raw HTML → plain text + URL 평문 (`<br>`, `<a>` 태그가 escHtml로 escape되어 raw 표시되던 버그 fix)
- **v=20260520d** (commit 6ac4441) — "관리자 소개" 오버레이 + 네비 링크 제거 (#about 섹션은 유지, -137줄)
  - 데스크톱 네비 + 모바일 네비 "관리자 소개" 링크 삭제
  - `#team-overlay` 풀스크린 마크업 88줄 삭제
  - Team Overlay Controller IIFE 47줄 삭제
  - `#about` 일반 섹션은 유지 (사용자 명시) — 페이지 콘텐츠 무손상
- **v=20260520c** (commit 59b144e) — 잠금 카드 5종 통합 + 코칭 10 + 완판 8 + 공통 2열 원칙
  - SOL_CHAT_LOCKED 단일 진실원으로 통합 (coverage / healthcheck 신규 키 추가)
  - coaching 5→10개 (사용자 결정: 음성/무한시나리오/FSS/내화법 4개 제거 + 답변 6~14 9개 신규 + 15단계 풀 엔진 유지)
  - complete-sales 5→8개 (중복 2건 병합: 카톡·녹취+법적방어 / 팀장 알림+Action Pack)
  - `_solChatAppendLockedCta` full-row 제거 (2열 원칙 통일)
  - PDF 패널 두 함수가 SOL_CHAT_LOCKED.coverage/healthcheck 참조하도록 전환 (인라인 하드코딩 → 데이터 단일 진실원)
  - coachingPrompt + completeSalesPrompt "💡 [...]는 풀 시스템에서" 안내 텍스트 제거 (잠금 카드 UI 중복 방지)
- **v=20260520b** (commit e2b3942) — PDF Gemini File API 롤백 + "에서 일하면→에서는" 7건 + 5MB 한도 + 압축 안내
  - v=20260520a의 Gemini File API resumable upload 클라이언트 직접 업로드가 CORS preflight 실패 (Failed to fetch)
  - 롤백: `handleUploadInit` + `_solUploadPdfToGemini` + file_uri 분기 완전 제거 (~180줄)
  - 5MB 한도 원복 + 5MB 초과 시 SmallPDF/ILovePDF 압축 링크 inline 안내
  - "인카금융서비스 프로사업단총괄에서 일하면" → "에서는" 일괄 교체 (7건)
- **v=20260520a** (commit aeefef7, **롤백됨 v=20260520b**) — 코칭+완판 데모 모드 + PDF 20MB 시도 (Gemini File API, CORS 실패로 롤백)
  - **상담코칭 답변 축소**: 유형 A 본문 1~5번 + 다음 단계 메뉴만 (기존 15단계 → 6단계). 6~14번(핵심필살/리스크/세무/벤치마크표/시너지/트렌드/상태요약/완판방어/타겟데이터) → [🔒 데모 종료 한 줄 안내] 1줄로 압축. 분량 2,500~4,500 → 1,500~2,500자.
  - **완전판매 답변 축소**: 유형 A 본문 0~4번 + 5단계 반복 루프만. 5~8번(법적방어/위험단어/화법교정표/팀장Action) + 4단계 마스터 스탠다드 → [🔒 데모 종료 한 줄 안내]. 분량 3,500~6,000 → 1,800~2,800자.
  - **공통 [표 강제 룰]**: 두 prompt 모두 — 비교 가능 항목(Worst/Best, Before/After, 옵션, 회사별, 위험/안전 표현 등)은 반드시 마크다운 표.
  - **PDF 20MB 지원** (Gemini File API 통합, commit aeefef7):
    - 신규 `api/chat.js` `action='upload-init'` 라우팅 — Gemini resumable upload URL 발급
    - 신규 `_solUploadPdfToGemini(file, onProgress)` — 클라이언트가 Gemini upload URL에 PDF 바이너리 직접 POST (Vercel 4.5MB 페이로드 한도 우회)
    - 4MB 이하: 기존 base64 inline_data (회귀 0). 4MB 초과 ~ 20MB: Gemini File API file_uri 경로
    - 적용처: `_solPdfHandleFile`(단일, 보장분석/건강검진) + `_solInsCalcAddFile`(다중, 보험금산출)
    - `validatePdf`: file_uri 모드 검증 (Google API URL 화이트리스트), inline 한도 7M→6M chars
  - **검증 대기**: Vercel 배포 + 코칭/완판/보험금 산출 챗봇 + 큰 PDF 업로드 수동 테스트
- **v=20260519a** — Dead code cleanup (코칭 카드 grid 909줄 + ORPHANED JS 2개)
  - Phase A (commit 78e5b42): index.html 코칭 카드 grid 909줄 삭제
    - CSS 282줄 (`.sol-coach-{grid,card,mode-tabs,level-chip,section,customer-bubble,script-card,qc-list,...}`)
    - JS 함수 258줄 (`_solCoach{Inject,Build,Bind,Open,Rerender,Get,Render}*`)
    - JS 데이터 367줄 (`COACH_MODES/LEVELS/_solCoachState/COACH_A|B|C_CARDS/CONTENT`)
  - Phase B (commit ce23345): `js/three-hero.js` + `js/main.js` 삭제 (`[ORPHANED]` 명시 파일 2개)
  - 보존: `_solCoachAppendIntroBubble/UserBubble/ResponseBubble` + 타이핑 함수 + `_solCoachBrackets` (DB영업/완전판매 재사용)
  - 백업 branch: `dead-code-backup-20260519`
  - 검증: 3회 Explore agent 추적 + 29 dead 식별자 grep 0건 + 9 라이브 식별자 grep 존재 확인
- **v=20260518m** — DB영업관리 ROI 계산 + DB 유형별 단가 입력 + 투자비용 표
  - DBSALES_STATE.dbPrice 5종 (보장/재무/지인소개/기고객/개척, 원 단위)
  - 입력 폼 "DB 유형별 단가 (원) — ROI 계산용" 섹션 5 필드
  - `_solDbsCompute`: invest 5종 + totalInvest 합산 + ROI 계산 ((실적 - 투자) / 투자 × 100)
  - 메트릭 4번째 카드: 단가 입력 시 +XX% (녹색) / -XX% (빨강) + 프로그레스 바 + foot
  - 유형별 투자비용 표 4컬럼 (유형/수량/단가/투자비용) + 합계 행 (청록 강조)
  - 버그 fix: `_solDbsRenderAll`의 dbTotal 미정의 참조 → r.dbTotal로 교체
- **v=20260518l** — DB영업관리 초기값 0 + NaN 방지 가드
  - DBSALES_STATE 모든 값 0 (사용자가 본인 데이터 직접 입력 가능)
  - pipe.taDone 가드 조건 dbTotal → ta로 수정 (ta=0 시 NaN 발생하던 버그)
  - pipe 값 모두 isFinite 검증 → NaN/Infinity → 0 대체
- **v=20260518k** — Team Manager Active 모드 Peek-and-Tease 카드
  - 운영 Team Mode 풀 구현 (1,500줄) 대신 흐릿한 미리보기 방식 — ROI 90% 달성
  - CSS sol-dbs-team-tease 9 클래스 (blur 2.5px + dark overlay + 잠금 아이콘 + 미니어처 컴포넌트)
  - 미니어처 배경: 3 메트릭 / 5단계 막대 차트 / 2줄 리더보드
  - 잠금 5종 첫 항목 (팀/조직 통합 분석) → 별도 peek 카드로 격상, 그 자리에 데이터 무결성+감사 로그 추가
  - 심리학: Zeigarnik effect + Loss Aversion으로 funnel 압력 2~3배
- **v=20260518j** — 7대 시스템 잠금+CTA 노출 시점 완전 통일
  - 챗봇 3개 (코칭/보험금산출/완전판매): AI 응답 완료 후 자동 노출 (`_solCoachTypewriter onComplete` 콜백)
  - 통합금융계산기: 메인 모듈 grid에서 제거 → 모듈 계산 결과 모달 안으로 이동
  - 7대 모두 "사용자 분석/요청 완료 후 결과와 함께 노출" 일관
- **v=20260518h** — Phase 3-B-6 DB영업관리 AI 대시보드 (개인 모드 풀 구현)
  - 입력 폼 + 종합 점수 (D~A+) + 4 메트릭 + 활동 흐름 + DB 효율 도넛 + 도달률/전환율 + 파이프라인 잔여 가치 + AI 코칭 + AI Strategic Simulator
  - 운영 시스템 (PRO AI 영업관리) 100% 매칭 — 기본값 51.0점 D 등급, 3.3배 보스트 일치
- **v=20260518g** — 챗봇 잠금+CTA 누락 보강 + 응답 분량 격상
  - SOL_CHAT_LOCKED 3 시스템별 잠금 5종 데이터 + `_solChatAppendLockedCta(sysKey)` 공용 함수
  - `maxOutputTokens` 4096 → 8192 (모든 챗봇 + 보험금 산출 PDF 모드)
  - 프롬프트에 "응답 절대 중간 자르지 말 것" + 분량 상향 명시
- **v=20260518f** — Phase 3-B-5 완전판매 AI (FSS 조사관 + 4 뱃지 + A/B 모드)
  - `completeSalesPrompt` 신규 (+85줄) — FSS 페르소나 + A/B 자동 감지 + 뱃지 강제
  - `_solCoachBrackets` 뱃지 색상 차등화 (✅⚖️ 녹색 / 🔍 노랑 / ⚠️ 빨강 / 기본 청록)
  - A 모드: 조사관 사전 점검 보고서 9 섹션 (0~8 + 4단계 해피콜 + 5단계 반복 루프)
  - B 모드: 반박 답변서 전략 7 섹션
- **v=20260518e** — Phase 3-B-4 보험금 산출 AI (다중 PDF + 마크다운 리포트)
  - `insuranceCalcPrompt` 신규 — 마크다운 산출 리포트 구조 명시
  - 다중 PDF 지원: `req.body.pdfs` 배열 (최대 5개) — `pdfParts` 통합 전달
  - `PDF_ENABLED_SYSTEMS += 'insurance-calc'` + `multi: true` 옵션
  - 리포트: 📋헤더 / 🚨서류 보완 / 💰최대 수령액 / 1️⃣산출표 (5컬럼 마크다운 표) / 2️⃣전략 / 💡포인트
- **v=20260518d** — 코칭 양방향 타이핑 (사용자 메시지 + AI 응답 양쪽)
  - `_solCoachAppendUserBubble` (8ms/char 평문 타이핑)
  - `_solCoachAppendResponseBubble` (10ms/char + 완료 시 마크다운 lite 변환)
- **v=20260518c** — 코칭 인사말 타이핑 효과 적용 (14ms/char)
- **v=20260518b** — Phase 3-B-3 코칭 운영 출력 100% 매칭 + 마크다운 표 렌더
  - `coachingPrompt` 15단계 풀 엔진 (유형 A) + Bias Breaker (B) + 7단계 + QC (C)
  - 마크다운 lite 렌더링: 표준 markdown table → HTML table, [대괄호] 청록 강조
- **v=20260518a** — Phase 3-B-3 상담 코칭 챗봇 모드 전환 (카드 grid 폐기)
  - 카드 grid → 채팅 인사말 + 사용자 입력 + AI 응답 흐름으로 전환
  - `selectedTextPrompt` 분기: 'coaching' → coachingPrompt
- **v=20260517e** — Phase 3-B-3 상담 코칭 (8 시나리오 + 3 화법, 카드 grid 방식 - 후속 폐기)
- **v=20260517d** — 계산기 모달 input 키보드 입력 차단 해결 (focus steal 방지)
- **v=20260517c** — Phase 3-B-2 통합금융계산기 운영 시스템 매칭 (11 메인 + 5 서브 = 16 계산기)
- **v=20260517b** — Phase 3-B-2 통합금융계산기 9 모듈 인터랙티브 (초기 버전)
- **v=20260517a** — Phase 3-B-1 건강검진 풀 반영 (본 시스템 PDF 5건 매칭)
  - A. expectedTreatmentCost + managementUrgency (상단 3-카드)
  - B. vitals[].normalRange + riskSummary (5컬럼 테이블)
  - C. risks[].causeIndicator + avgTreatmentCost + coverageOpinion (4컬럼 테이블)
  - D. aiSimulation (출처 인용 자동 fallback)
  - E. healthAdvice 4~5 불릿
- **v=20260504a/b** — 인재 양성 오버레이(`#talent-overlay`) 5단계 로드맵 동적 시퀀스 + spotlight 무한 순환, 조직문화 섹션 4카드 자동 순환 캐러셀(`culture-carousel-*`) 신규, 카드 크기 확대(360→560px) + 텍스트 강화, "종합 금융전문가" 그라데이션 + 띄어쓰기 통일, PARIS 카드 `object-position:center top` 위쪽 정렬
  - **5단계 로드맵 시퀀스**: `playRoadmapSequence()` — talent-open 시 `is-playing` + dots stagger(300+i*450ms), 라인 fill 0→80%(2.4s)
  - **5단계 spotlight loop**: `startRoadmapSpotLoop()` / `stopRoadmapSpotLoop()` — 1.2s 간격 1→2→3→4→5→1 순환, `closeAllOverlays()`에서 leak 정리
  - **조직문화 4카드 캐러셀**: PRO ENTERPRISE AWARD(`AI 홈페이지/PRO ENTERPRISE AWARD.jpg` 신규) → 리크루팅 시책 → 리더십 양성과정 → 연합 세미나(신규). 60s linear infinite, 4개×2배 복제 무한 루프, hover pause, prefers-reduced-motion 대응
  - **카드 사양**: 560×350px (16:10), gap 32px, 제목 22px/800, 본문 15px/#6b6b70 line-height 1.7. 반응형 1024/768 분기
  - **헤드라인**: `talent-overlay`의 EXPERTISE 섹션 — "단순 보험 판매를 넘어 <span gradient>종합 금융전문가</span>로" + 하단 li `종합 금융전문가 양성` 띄어쓰기 통일
  - **PARIS 카드**: `object-position:center top` (PTA IN PARIS 글자 노출, 개선문 frame 아래쪽 배치)
  - **Channel Talk SDK 통합 코드는 placeholder 상태로 보류** (`_CHANNEL_IO_PLUGIN_KEY = '<<INSERT_...>>'` — 발급 후 1줄 교체 시 즉시 활성. 현재는 fallback으로 `#contact` 폼 모달이 열림)
- **v=20260418** — api/chat.js 보안 레이어 (Origin 화이트리스트+레이트리밋+메시지 검증), _serve.js AI홈페이지 폴더 fallback, 프로사업단총괄 오버레이 세로폭+텍스트 미세조정
- **v=20260412b** — 교육 가로 스크롤 전면 교체 (GSAP→sticky+scroll), 사진 contain/스냅/과정하이라이트, 조직문화 섹션 추가
- **v=20260412** — 프로사업단총괄 오버레이 전면 리디자인 (OBLIQUE 히어로+교육4섹션+보상삭제+지사텍스트삭제)
- **v=20260411a** — 교육 로드맵 Stillpoint+Pipeline 전면 재설계, 보상 체계 문구 변경, Step1→교육 연동, _serve.js MP4+fallback
- **v=20260408a** — 빛의슬릿+워크스루+교육보상블록+Hero Loopra전환
- **v=20260407b** — 프로사업단총괄 오버레이 (문+캐러셀+워크스루), 푸터 통일, 폰트 축소
- **v=20260407a** — 헤더 Accsensia glass-panel, 모바일 반응형 전면 최적화, 푸터 #27398c, 모바일 메뉴 사이드패널, CEO 영상 배치, 줄바꿈 최적화
- **v=20260406b** — WHY PRO 허브 레이아웃, CEO 서명, 숏츠 5개, Step1/3 문구, 데모콘텐츠 보강, 자동순환 버그 수정
- **v=20260406a** — 네비 통합 핸들러, 배지/문의하기/소식카드 변경, 네비 배경색, CEO 배경 통일
- **v=20260405e** — 대규모 고도화 (실제 시스템 재구현, 소식 섹션, 네비 전폭, 글로우, UI 개선 30+ 항목)
- **v=20260404b** — 8대 AI 대시보드 프로덕션 고도화 (10개 항목 완료)
  - #1: 검색창 → 카테고리 자동이동
  - #2: 보장분석 PDF 리포트 (SVG 레이더, 8카테고리, TOP10)
  - #3: DB영업 전환율 차트 (donut, funnel, 병목)
  - #4: 계산기 9개 모듈 전부 구동
  - #5: 코칭 키워드 8개로 확장
  - #6: 보험금 산출 강화 (사고경위, PDF, 전략/방어)
  - #7: 건강검진 PDF 리포트 (원형게이지, 테이블, 질병리스크)
  - #8: 완전판매 FSS 챗봇형 (A/B 모드, 뱃지 시스템)
  - #9: KP→PRO, 수석설계사→팀장
  - #10: 최근활동 우측 사이드바 이동
