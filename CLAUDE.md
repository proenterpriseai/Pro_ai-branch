# AI Branch — Pro Enterprise AI Landing Page

## Overview
Pro Enterprise AI 채용/홍보 랜딩 페이지. Hero + 8섹션 스크롤 + 8대 AI 대시보드 인터랙티브 데모.
- **Deploy**: Vercel (GitHub: `proenterpriseai/Pro_ai-branch`)
- **Dev Server**: `node _serve.js` (port 3098)

## Tech Stack
| 기술 | 상세 |
|------|------|
| 배경/히어로 | UnicornStudio (WebGL, `data-us-project` 스포트라이트, CDN 동적 로드 v1.4.34) + CSS fallback glow |
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

## 히어로 배경 (UnicornStudio, index.html inline ~lines 3755-3766)
- Loopra 스포트라이트 씬 — `<div data-us-project="7BChNsgjdoJkLPEpWhX3">` + `unicornStudio.umd.js@v1.4.34`(jsdelivr) 동적 `<script>` 삽입 → lazy init
- 첫 로드 텀 최소화(v=20260704l): `<head>`에 스크립트 `preload` + `storage.googleapis.com` `preconnect`(프로젝트 데이터는 캐시버스팅이라 매 로드 fetch, preconnect로 연결비용만 절감)
- **CSS fallback glow** — UnicornStudio 로드 전/실패 시 표시(3764~), 외부 WebGL이 늦어도 히어로가 비지 않음
- ⚠️ **과거 Three.js 3D terrain은 완전 제거됨** — `PlaneBufferGeometry` wireframe terrain·커서 orb·`PointsMaterial` 파티클·`FogExp2`·`#three-canvas`는 더 이상 없음. `THREE` 전역·`js/three-hero.js`도 미사용/미존재

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
- 히어로 배경 = **UnicornStudio** WebGL (CDN 동적 `<script>`, `data-us-project`) + CSS fallback glow. `THREE`/`#three-canvas`/3D terrain은 제거됨(위 "히어로 배경" 섹션 참조)
- 모든 대시보드 JS는 `index.html` 인라인 IIFE — 외부 JS 파일 로드 없음
- CEO 오버레이: `#ceo` hash trigger → modal, body scroll lock, back 버튼 지원
- `js/three-hero.js`·`js/main.js` — **삭제됨**(v=20260519a dead-code cleanup, `js/` 폴더 없음)
- 모바일: 히어로 배경은 모든 사이즈에서 렌더 (별도 숨김 없음)
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
| `#mobile-nav-overlay` | `</body>` 직전 | 모바일 사이드 메뉴 (v=20260713e: **흰 배경 + #27398c 글자·hairline** 공식홈 룩, 세로=내용 높이만·bottom 미고정·좌하단 radius 20px, display:none/block 토글) |
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

- **v=20260713f** (**main 직커밋 LIVE**, tag `v20260713f`, 2026-07-13) — 현황 박스 글로우 마우스 추적 + 모바일 체험하기 CTA + 프로솔루션 오버레이 모바일 행간(사용자 세션). 로컬 DOM 실측·콘솔0 검증 후 배포.
  - **#branch-map 현황 박스**: `glow-target` 클래스+`.glow-border` 자식 추가 → 다른 카드(#solutions 등)와 동일하게 마우스 추적 글로우(기존엔 `border-gradient` 자동 회전만 있어 커서 무반응). 자동 회전 테두리는 타 카드와 동일하게 유지.
  - **모바일 체험하기 CTA**: 기존 "체험하기" 버튼이 `#ai-right-panel`(`hidden md:flex`) 안에 있어 <768px에서 패널째 숨겨짐 → 쇼케이스 아래 `md:hidden` 풀폭 "AI 시스템 체험하기" 버튼 신규(`data-nav="prosolution-open"`). md 이상은 기존 우측 패널 버튼 담당(중복0). "AI 시스템" 네비는 모바일서도 원래 정상(위임 핸들러 공통).
  - **프로솔루션 오버레이 모바일 행간**: 모바일 미디어쿼리 `.pt-28` 5rem→**7.5rem** — 고정 네비 알약(하단 ~82px)에 제목("7대 핵심 AI 시스템, 먼저 만나보세요")이 겹침(-2px) → 간격 58px 확보(타 섹션 여백감). 데스크톱 불변.
  - ⚠️**로컬 프리뷰 PDF 업로드 실패는 환경 제약**: `_serve.js`=정적 서버라 `/api/chat` 없음→SPA fallback HTML 200→"<!DOCTYPE not valid JSON" 에러. 라이브는 JSON 정상(실측). AI 분석 검증=Vercel 배포에서만.
- **v=20260713e** (**main 직커밋 LIVE**, tag `v20260713e`, 2026-07-13) — 모바일 사이드 메뉴(`#mobile-nav-overlay`) 공식홈 룩으로 반전(사용자 세션·모바일 전용, 데스크톱 영향0). 로컬 375px DOM 실측·스크린샷·콘솔0 검증 후 배포.
  - **색상 반전**: 패널 배경 `#27398c`→`#ffffff`, 메뉴 글자 `#ffffff`→`#27398c`, 구분선 `rgba(255,255,255,0.15)`→`rgba(39,57,140,0.2)`(브랜드 블루 hairline), X 버튼 원 `rgba(255,255,255,0.1)`→`rgba(39,57,140,0.08)`·아이콘 stroke `#ffffff`→`#27398c`(흰 배경 가시성). 공식홈(proenterprise.co.kr) 모바일 메뉴 룩과 일치.
  - **세로 자르기**: 패널 full-height(`bottom:0`) 제거 → 내용 높이만(문의하기+40px≈483px/812), 좌하단 `border-radius:0 0 0 20px`(카드 마감). 아래는 다크 스크림.
- **v=20260713d** (**main 직커밋 LIVE**, tag `v20260713d`, 2026-07-13) — STORIES 캐러셀에 RECRUITING 100 영상 추가 + 전국 캐러셀 부제 교체(사용자 세션). 전부 로컬 DOM 실측·콘솔 0 검증 후 배포.
  - **RECRUITING 100 영상 카드 신규**: `assets/video/2026-recruiting-100.mp4`(14MB, 인스타 SnapInsta 웹버전 — 226MB 원본 `260112_인카금융_master.mp4`는 GitHub 100MB 리밋으로 미사용) + poster `assets/images/2026-recruiting-100-poster.png`(골드 "다시 한번 '확장의 시대'를 연다" 프레임, 2877×1375·4MB). title=`RECRUITING 100`, subtitle=`290명에서 694명, 1년 만에 200% 성장`.
  - **STORIES 순서**: RECRUITING 100 → 2025 프로사업단 연도대상 → 프로사업단 월례 시상식 → PRO 7대 AI 시스템 Workshop (점 3→4, 무한루프 클론 2장 유지). ⚠️브라우저 자동화 환경은 하드웨어 비디오 디코딩 프레임이 canvas로 안 넘어와 프레임 추출 불가 → poster는 사용자가 저장한 PNG 사용.
  - **전국 캐러셀(#pro-carousel-overlay) 부제 교체**: `어디서든 동일한 질의 교육 시스템. AI 도입…향상되었습니다.` → `어디서든 동일한 질의 교육으로,<br>전국 거점의 <strong>평균 생산성</strong>을 끌어올립니다`. 색 `rgba(255,255,255,0.45)`→`#b8bccb`(조직문화 섹션과 통일·가독성). `<br>`은 데스크톱 줄바꿈·모바일 brToSpace 공백(기존 반응형).
- **v=20260713c** (**main 직커밋 LIVE**, tag `v20260713c`, 2026-07-13) — AI 카드 문구 자연화 + 로고 크기 공식홈 통일.
  - **#why-pro AI 카드 문구**(상담코칭·완전판매): 딱딱한 조각문/jargon → 자연 완결문. 상담코칭 = "고객의 거절 유형을 읽고 상황에 맞는 화법을 실시간으로 제안합니다."(2문장→1문장, "심리 분석…물꼬" 삭제). 완전판매 = "AI가 법적 근거와 판례를 바탕으로 대응 논리를 세워, 민원 위험을 미리 막아 줍니다."("FSS 출신" 제거·`<br>` 제거).
  - **로고 크기 공식홈 통일**: 헤더+메인푸터 `class="h-[30px]"`, 오버레이 푸터 5곳 `height:30px`. ai-branch 로고 원본 754×170(비율 4.435:1) → 공식홈(proenterprise.co.kr) 헤더 로고 가로 133.33px에 맞춰 세로 30px(가로 실측 133.06px). ⚠️로고 크기 기준: 공식홈=가로(width 133.33px 고정), ai-branch=세로(height) → 원본 비율로 환산.
- **v=20260713b** (**main 직커밋 LIVE**, tag `v20260713b`, 2026-07-13) — WM센터 카드 배경 통일. `.wm-track`(법인/CEO·개인/고액자산가) + `.wm-card`(자산맞춤·WM특화·VIP) 배경 `#0a0a14` → `rgba(255,255,255,0.045)`(조직문화 카드와 동일 패널색, 사용자 요청). 블루 헤더·상단바 액센트 유지. 테두리 `--wmc-hair`가 이미 0.08이라 배경만 교체해도 조직문화 박스와 완전 일치(실측 match). 로컬 실측·콘솔0 후 배포.
- **v=20260713a** (**main 직커밋 LIVE**, tag `v20260713a`, 2026-07-13) — 조직소개 오버레이 폴리시 일괄(사용자 세션). 전부 로컬 DOM 실측·콘솔 0 검증 후 배포.
  - **헤더 스크롤 다크 복원**: 메인 히어로·조직소개 실크 히어로·CEO 인사말 3곳 모두 "최상단=기존 상태(glass/흰 알약) → 스크롤>50 시 검은 계열 다크"로 통일. `mainNavUpdate`에서 히어로-glass 분기 제거(구 v20260711c "히어로 보이는 동안 glass 유지"는 대형 카피와 헤더 겹침으로 반려), `updateProNav`=`proOv.scrollTop>50`, `updateCeoNav` 신규(흰 페이지라 최상단 흰 알약 유지·스크롤 시 다크) + CEO 오버레이 scroll 리스너.
  - **조직소개 실크 히어로**: 부제(`.pro-silk-sub`) 삭제했다가 메인 히어로 스타일(22px/1.4·#dfe7fb 아님 rgba .92·네이비 그림자)로 재추가, 텍스트 "PRO AI 시스템과 체계적인 교육 과정으로 / 영업인이 끊임없이 성장하는 최적의 환경을 제공합니다." + 제목 가로·세로 중앙(margin:0).
  - **클로징(#pro-closing)**: `───` 선을 텍스트 세로 중심에 정렬(margin-top 16→10px) + 본문 3줄 끝 쉼표 삭제(줄바꿈·내부 쉼표 유지) + 헤드라인 최대 62.4→**52px**(3.9→3.25rem, 히어로60>클로징52>섹션44 위계).
  - **조직문화 카드**: 검정 위 가독성 위해 `.culture-card`에 옅은 패널 배경(rgba .045)+테두리+라운드18(box-sizing border-box라 캐러셀 폭 불변) + 하단 패딩 18px. AWARD·리크루팅 카드 설명 `<br>` 한 단어 앞으로 이동(홀로 떨어지던 "축하를"·"성장원동력" 해소).
  - **지사/신규 조직 런칭 캐러셀 복원**: v20260711c에서 #pro-closing으로 교체되며 삭제됐던 `#pro-carousel-overlay`(Scene 2 자동 슬라이드)를 5723020 커밋에서 마크업만 복원(CSS·keyframes·클로닝 IIFE 잔존). 위치=조직문화 아래·클로징 위. 헤딩 가운데 정렬(조직문화와 통일)·부제 "평균 생산성이 향상" 강조(#dfe7fb)·부제↔이미지 여백 24→48px.
- **v=20260712a** (**main 직커밋 LIVE**, tag `v20260712a`, 2026-07-12) — 네비 라이트 고착 버그 fix + 클로징 문안 재구성 + #stats·클로징 다크 통일 + 지구본 유리화. 상세 진실원 → auto-memory `session-20260712-aibranch-dark-unify.md`.
  - **🐛 네비 라이트 알약 고착 버그 fix(핵심)**: 오버레이는 `display:none`이 아니라 `opacity/visibility`로 닫힘 → 내부 `data-nav-bright` 마커(#pro-closing)의 지오메트리가 잔존 → IntersectionObserver가 "이탈"을 못 잡아 `brightCount`가 1로 고착 → 다크 섹션(메인 히어로 등) 위에 라이트 알약이 남고 새로고침해야 풀리던 버그. **fix = `recomputeBrightCount()`**(닫힘 순간 실제 지오메트리 재계산, 닫힌 오버레이 내부 마커는 `.closest('.ceo-overlay')` 활성 클래스로 판별 제외)를 `applyDarkNav`(닫힘 MutationObserver)에서 `mainNavUpdate()` 직전 호출. visibility 트랜지션 0.5s와 무관하게 즉시 정확.
  - **클로징 문안 재구성**: `One Team &`→**`One Team`** / 새 오프닝 리드 **"처음부터 정점까지, 그 여정을 함께하겠습니다."**(`.pc-lead-hero`, 22px·700·흰색 = 조직문화 `.culture-card-title`과 통일) / 기존 lead("좋은 시스템은…") 굵기 제거 / "단계별 교육 그리고"→**"단계별 교육과정,"** / 문단 분리(성장 문화 ↔ 그 결과) / close("프로사업단총괄은…최고의 파트너") 굵기 제거. "—" 라인 유지.
  - **#stats·클로징 다크 통일**: 흰 배경 3곳 중 2곳을 다크로(사용자 결정 — 흰 구역이 다크 페이지 흐름을 끊음). ①`#stats` bg `#f5f5f7`→투명(body 검정), 제목 흰색+**"성장"/"행복"만 블루 그라데이션**(blue-400→500, "7대 핵심 AI 시스템"·"다른 결과"와 동일), 부제 `text-zinc-400`. ②`#pro-closing` bg `#f6f6f8`→`#050505`(조직문화와 통일), Team/Financial Group/System 흰색·리드/close/rule 흰색·본문 `#b8bccb`·`.o`(One) 블루 그라데이션·`.hl` `#8fb2f2`. **양쪽 `data-nav-bright` 마커 제거** → 라이트 네비는 이제 **CEO 오버레이 전용**(코드 단순화, 위 버그의 근원이던 흰 구역 2곳 소멸).
  - **클로징 지구본 유리화**: SVG 와이어프레임 채움 라이트 팔레트(#dbe6ff~#8fb2f2)→로열블루(`#6ea0ff→#3E76F9→#1C49C8`) + **반투명 0.55→0.3**(유리구슬) + 라인 `#3b6ae0`→`#5b8afc`·노드 라이트 톤. 회전 애니 26s 불변.
  - ⚠️ **반려·원복 이력(재시도 금지, 코드 주석에 경고 기록)**: ①**라이트 헤더 글라스모피즘**(navLight 0.97→0.72+blur20→공식홈 0.45+blur12) — 우리 페이지는 62px급 대형 헤드라인이 헤더 밑을 지나가 반투명+블러로도 글자 형체가 비쳐 반려 → **0.97 원복**. ②**AeroNet 캔버스 파티클 지구본 이식**(다크→네이비→라이트 3라운드) — 사용자 "별루" → **SVG 와이어프레임 원복**. ③**메인 히어로 실크 배경**(공식홈 #3E76F9 셰이더 이식·물결 진폭 조절·screen 빛줄기 하이브리드 다수 라운드) — 사용자 반려 → **UnicornStudio 스포트라이트+im-blue 틴트(mix-blend:color) 원복**(v20260711b와 동일). ④클로징 One 색 WM 그라데이션(#2a46a2→#1C49C8, 검정 위 대비 2.5:1 묻힘) 반려. **전부 로컬 실측 검증(JS readPixels/computed·콘솔0)·히어로 배경 블록 git diff 0(커밋본과 완전 동일 원복 확인).**
- **v=20260711c** (**main 직커밋 LIVE**, tag `v20260711c`, 2026-07-11) — 히어로 타이포 통일 + 조직소개 하단 재구성 + 라이트 네비 모드. 상세 진실원 → auto-memory `session-20260711-aibranch-nav-glass.md`.
  - **A. 메인 히어로 타이포 통일**: 제목 `#hero-title` = 조직소개 실크 제목과 동일(Pretendard 700·자간 -0.04em·네이비 그림자) + 배지→제목/제목→부제 **간격 균등**(데스크톱 `margin-top:max(0px,calc(25vh-174px))`+`margin-bottom:calc(25vh-142px)`, 모바일 28px). 부제 `#hero-typing`·배지도 Pretendard 통일(font-geist 제거).
  - **B. 조직소개 하단 재구성**: 지사 캐러셀(인스타 홍보카드 13장) **통째 삭제**(복제 IIFE는 null-guard라 무해·잔존) → **클로징 섹션 `#pro-closing` 신규**(원금융 "ABOUT US" 디자인 이식): 2톤 영문 헤드라인 **"One Team & / One Financial Group / Only One System"**("One"·"Only One"=`.o` `#27398c`, 나머지 검정 — `Network`→`Group` 교체=원금융 브랜드 반향 회피) + 좌측 라인·CEO결 4문단(지정 줄바꿈) + 우측 **회전 와이어프레임 지구본 SVG**(블루, `pc-spin` 26s. ⚠️Sequra 크레센트 SVG 재현 2회 시도→퀄리티 부족으로 원복, AI 생성 자산 대기). 푸터 `margin-top:48→0`(검은 띠 제거, **조직소개 푸터만** — 다른 3개 오버레이 48px 유지).
  - **조직문화 섹션 다크 전환**: bg `#f5f5f7`→`#050505`(WM센터와 통일) + 팔레트 매칭(제목·카드제목 `#fff`/부제·설명 `#b8bccb`/강조 `#dfe7fb`) + `data-nav-bright` 제거.
  - **🔑 라이트 네비 모드 신규(공식홈 스타일)**: 흰 배경 위 헤더 = 밝은 알약 `rgba(255,255,255,0.97)`+**검정 글자·로고 invert(1)**·햄버거 다크(`#nav-light-style` CSS + `navLight(imp)` — `.nav-light` 클래스 스코프). 적용=흰 구간 전수 3곳: 메인 `#stats`(마커 신규)·클로징 `#pro-closing`·**CEO 오버레이**(구 강제 다크→라이트). 다크 섹션 동작 불변.
  - **네비 판정 재작성**: ①`mainNavUpdate()` 단일 판정(흰 섹션 light > **히어로 보이는 동안 glass 유지**(bottom>120, 구 scrollY>50 다크 대체) > 스크롤 다크) — 스크롤 리스너/IO 콜백/오버레이 닫힘 복원 전부 통일, `scrolled` 플래그 제거. ②**마커 수집 버그 fix**: 파스 시점 `querySelectorAll`이라 스크립트 아래 `#pro-closing` 누락 → `setupBrightObs()` DOMContentLoaded 후 수집. ③`updateProNav` 히어로 아래 분기에 brightCount 라이트 추가.
  - ⚠️ **교훈**: (1) `data-nav-bright` 마커류 수집은 반드시 DOMContentLoaded 후(마크업이 스크립트 아래) — setupDarkNav와 동일 함정. (2) sed 파일 splice는 삽입 파일 끝 개행 확인(줄 병합 사고). (3) 클로징 컷/배경 `#f6f6f8` 하드코딩 — 섹션 배경 변경 시 동기 필요.
- **v=20260710g~k** (**main 직커밋 LIVE**, tag `v20260710k`, main `3a8ab80`, 2026-07-10) — 대표님 피드백 3라운드. 상세 → auto-memory `session-20260710-aibranch-ceo-feedback.md`.
  - **g**: STORIES 카드 "YouTube"/"현장 영상" 라벨 칩 제거(+tone dead CSS), 제목 14→18px·부제 11→13.5px.
  - **h**: 지사 캐러셀 **형광(초록/노랑) 박힌글자 이미지 6장 삭제**(1행 천안·하남·일산·다산·구미 / 2행 로얄본부 직할 2곳) → 흰 글자 톤만 잔존(1행 9장·2행 4+4). ⚠️**잠복 버그 fix**: 1행 복제 IIFE(~7822)가 마크업(~15816)보다 위라 즉시 실행 시 null→**복제가 한 번도 안 되고 있었음** → DOMContentLoaded로 이동(9→18장). 루프 이음새 gap 절반 보정 `calc(-50% - 0.625rem)`(양방향 키프레임). 조직문화 캐러셀: 뷰포트 = 정확히 카드 2장 폭(1152/912px, 모바일 320px 1장) + **심리스 무한 루프**(앞 2장 클론+transitionend 무애니 스냅+폴백 700ms+연타 가드) — 되감기 점프 제거.
  - **i**: 지사 캐러셀 윗줄 속도 정정 26→**63s**. h에서 duration 보정(40→26s)이 복제 fix로 트랙 2배 된 걸 미반영해 위 138 vs 아래 57px/s로 벌어졌던 것 → **위아래 동일 57px/s 통일**(실측). ⚠️교훈: 트랙 카드 수 변경 시 px/s = (트랙폭/2)/duration 실측으로 검증.
  - **j**: STORIES 영상 캐러셀도 **심리스 무한 루프**(h와 동일 방식: 클론 2장+스냅). pageCount(페이지) 개념 제거→카드 시작 위치 0..2, 점 3개 고정(PC/모바일 동일), 자동재생(6s)도 순방향 순환. 클론 카드도 위임 클릭+data-id라 라이트박스 정상.
  - **k**: 조직 소개 히어로 — 사무실 사진 슬라이드쇼 3장 삭제 → **100vh 블루 실크 풀배경 + 중앙 흰 카피**("처음부터 정점까지/당신의 성장을 설계하다"+부제, 구 흰 배경 텍스트 블록 통합). 1차 구현은 메인 히어로 UnicornStudio 씬 addScene 재사용.
  - **l→m**: 대표님 정정("공식홈의 밝은 로열블루 실크" — 메인 히어로 씬은 어두운 스포트라이트 톤이라 다름) → **자체 raw WebGL fragment shader로 재현**(`pro-hero-silk-scene`, 의존성 0). m=추가 피드백 반영: **이중 주파수 주름**(6.2+2.8, 굵기 제각각 — 밝은 밴드 44~257px·골 1~26px 실측)+**밝은 로열블루 팔레트**(mid #4273f0 지배, 밝은면적 79%·평균 rgb(64,103,210)). 오버레이 첫 오픈 lazy init + 닫히면 rAF 정지 + reduced-motion 정적 + CSS fallback glow. **튜닝법**: 페이지 내 오프스크린 하네스(`__silkTest2`)로 파라미터 후보 일괄 렌더→수치 지표(밝은면적/평균색/밴드 전환수/폭 분포)+프레임 캡처 시각 대조 수렴. ⚠️base64 수동 전송은 오염 잦음→수치 지표 우선. ⚠️공식홈(proenterprise.co.kr) 히어로 = **아임웹 인터랙티브 배경(vendor ThreeCanvas.js)** — 빌더 내장이라 설정 추출 불가(정적 HTML에 색/프리셋 없음, 런타임 주입).
- **v=20260710b~f** (**main 직커밋 LIVE**, tag `v20260710f`, main `1e3ea20`, 2026-07-10) — 대표님 피드백 후속 라운드. 상세 → auto-memory `session-20260710-aibranch-ceo-feedback.md`.
  - **b→d→f CEO 사진 사이징 수렴**: 660px(너무 큼)→560px→**최종 f=텍스트 컬럼 스팬**(위=제목 2행 "서포터가…" ±3px, 아래=서명+44px, 실측 499×742). 구현=우측 컬럼 `lg:self-stretch`+absolute 래퍼(`top:110px; bottom:-40px`)+img `height:100%`. ⚠️함정: `height:calc(100%)`+self-stretch=순환 사이징 폭주 / **abspos replaced(img)는 top+bottom으로 높이 미결정**(고유 크기)→래퍼 div 필수.
  - **d 네비 다크 옵저버**: 흰 오버레이(CEO·프로인트로) 열림 동안 `#nav-bar` 인라인 `background rgba(15,15,30,0.92) !important`(MutationObserver). 스크롤 핸들러가 인라인 단일소스라 **CSS `:has()`로는 못 이김**. 셋업은 DOMContentLoaded 후(프로인트로 마크업이 스크립트 아래).
  - **c**: 02카드 "금융 유튜브"→"유튜브"·스튜디오↔디자인 스왑(3↔5)·STORIES ITA 임성미→**2025 연도대상**(`assets/video/2025-annual-awards.mp4` 31MB), 순서 연도대상→월례→워크샵. ⚠️PS 커밋 -m에 큰따옴표=인자 깨짐 → **커밋 메시지는 `git commit -F 파일` 고정**.
  - **e**: CARING sub "최대" 제거·02카드 제목 **"통합 브랜드 지원"**·조직문화 **자동(38s)→화살표 수동 캐러셀**(`.culture-track` transform 방식, 복제 카드 제거. scroll-snap/scrollLeft은 백그라운드 탭 frozen이라 검증 불가+비채택)·연도대상 poster=`AI 홈페이지/PRO ENTERPRISE AWARD.jpg` 재활용(브라우저 video 프레임 캡처 이 환경 전부 검정, ffmpeg/cv2 없음).
  - **f**: 조직문화 캐러셀 **무한 순환**(next 끝→처음/prev 처음→끝 랩, `% (m+1)`, 화살표 상시 활성).
- **v=20260710a** (**main 직커밋 LIVE**, tag `v20260710a`, main `bebec28`, 2026-07-10) — 대표님 피드백 11건 일괄 반영. 로컬 DOM 실측(1440+375px)·콘솔0·라이브 캐시버스터 grep 13/13·잔재 0 검증. 상세 진실원 → auto-memory `session-20260710-aibranch-ceo-feedback.md`.
  - 히어로 부제 타이핑 85→**45ms**/자, 시작 지연 1500→800ms (9645·9647 근처).
  - 헤더+모바일 네비 라벨: "프로사업단총괄"→**"조직 소개"**, "인재양성"→**"성장 시스템"** (data-nav 불변).
  - **CEO 오버레이 화이트 전환**(공식홈 레퍼런스): bg `#050505`→`#ffffff`, YouTube iframe 2개(PC `#ceo-video`+모바일) 삭제→`assets/images/ceo-lim.png`(기존 미사용 파일 재활용, PC 우측 max-w 500px + 모바일 상단 300px), 제목 그라데이션 span 제거→전체 `#27398c`, 본문 gray-800/600, 서명 invert 필터 제거, 닫기버튼 다크 보정. **오버라이드 전부 `#ceo-overlay` 스코프 `<style>`**(.ceo-overlay 클래스는 4개 오버레이 공유). ⚠️ `ceo-video` JS 참조 5곳은 전부 `if(vid)` null-safe라 미수정(의도적 잔존). Shorts 5카드·푸터 유지.
  - 성장 로드맵(01 카드): "성장 로드맵 트래커"→**"성장 로드맵"**, 부제 "입문부터 WM전문가과정까지 · 5단계", 배지 "진행 중"→**"운영 중"**, 행 상태 pill 5개(완료/진행 중/대기) 삭제+dead CSS(.st.*) 제거(`is-run` 발광·바 유지, JS는 pill 미참조 확인), 05행 제목 "WM센터장 주관 법인/고액 자산가/재무설계 전문가 과정"(12.5px 유지, 데스크톱 한 줄 312px 실측·모바일 2줄 랩), 05행 설명 "법인·CEO, 자산가 시장 컨설팅 — Wealth Manager로 성장", GROWTH 부제 3줄 교체("타사가 2주 교육 후…높은 생산성의 이유입니다.", 모바일은 brToSpace가 br→공백=기존 패턴), 칩 "WM 마스터"→"WM 전문가 과정".
  - 02 카드: **"전용 스튜디오" 5번째 축 추가**(카메라 SVG+태그 "촬영"), "4축"→"5축" 3곳(부제/카피/주석), tskRowGlow delay 0/1.6/3.2/4.8/6.4s 재배분+nth-child(5), 칩 "스튜디오" 추가, "PRO 보험스쿨"→**"PROCAST"**.
  - 파트너 05: **보케어→CARING**(자동차 보험 플랫폼) — rname/h3 "CARING"(free 클래스 upright=라틴 정립 그대로 적합), area "영업지원 · 자동차보험", sub "대한민국 최대 자동차 보험 플랫폼", desc 비교견적/배서·청약 카피, 아이콘 자동차로, `partners/caring.jpg` 신규(원본 바탕화면 `카링. 자동차보험.PNG` 2115×811 → Pillow 1400px q82 JPEG 85KB). 구 bocare.jpg 파일은 관례대로 유지(참조만 제거).
- **v=20260707a~20260707j** (**main 직커밋 LIVE**, tag `v20260707j`, main `5303401`, 2026-07-07) — 7대 AI 쇼케이스(#solutions) + 승격 구조(#about) 폴리시 10건. 전부 프리뷰 DOM 실측·라이브 캐시버스터 grep·콘솔0 후 배포. 상세 진실원 → auto-memory `session-20260707-aibranch-showcase-polish.md`.
  - **a**(`2d4c53f`): KPI 4카드 그래프 풀폭(`nxk-dot7`·`nxk-bars` `gap-1`→`justify-between` = 스파크라인과 동일 113px) + KPI/사이드바 "AI 시스템" 라벨/우측패널(핵심 지표·지표박스·AI 인사이트) 가운데 정렬 + AI 풀 시스템 카드 아이콘 우측 이동·글자 확대 + **보장분석 `__COVERAGE__` 리포트 "AI 카테고리 분석" 16카드 섹션 제거**(미사용 `_cat` 헬퍼 동반 제거, ①요약·②상세표·③점수카드 유지=종합점수 B+에서 종료).
  - **b**(`b99b92d`): 금일 분석·AI 사용률 스파크라인이 동일 nxkDraw 7s 동시 시작으로 똑같이 움직이던 것 → AI 사용률만 `.draw-alt`(duration 9.5s + delay -3.5s)로 영구 비동기.
  - **c**(`1bd00cf`): AI 인사이트 **본문** text-center 제거→좌측 복구(제목은 center 유지) + 풀시스템 설명 zinc-500→zinc-400.
  - **d**(`74afc2e`): 사이드바 "AI 시스템" 라벨 zinc-600→white.
  - **e**(`fa1eba4`): 우측패널 CTA "AI 풀 시스템"→**"AI 통합 시스템"** + 설명 zinc-400→white.
  - **f**(`c645a65`): 사이드바 "AI 시스템" 라벨 10px→**14px**(우측패널 엔진 제목 text-sm과 동일).
  - **g**(`dfc3185`): KPI 라벨 4종(`.nxk-label`) rgba(255,255,255,0.5)→**#fff**.
  - **h~j**(`d8c1371`/`1d027d5`/`5303401`): 승격 구조 "영업인 루트"/"관리자 루트" — text-center(h) + text-sm→text-base 16px=설계사 박스 동일(i) + **`pl-[22px]`로 박스 기준 가운데 정정**(j). ⚠️ 행 구조 `[●점 flex-shrink-0]+[gap-3 12px]+[박스 flex-1]`라 박스 중심이 컬럼 중심보다 +11px 우측 → text-center만으론 라벨이 11px 좌측 치우침. 점10+gap12=22px 좌패딩으로 실측 diff 0.
  - ⚠️ **교훈**: (1) 배포 직후 라이브 검증은 CDN 엣지 구캐시 혼합 응답 → `?cb=timestamp` 캐시버스터 필수. (2) 쇼케이스 데모는 렌더 후 3s 자동 다음엔진 전환 → 결과물 검증 시 `setTimeout` d===3000 드롭 패치로 고정(검색창 focus만으론 orphan 타이머로 불충분). (3) 스크린샷 무한애니 타임아웃=기존 한계, DOM 실측 대체.

- **v=20260706g~20260706h** (**main 직커밋 LIVE**, tag `v20260706h`, main `92d6005`, 2026-07-06) — CEO 오버레이 제목("당신을 위한 최고의 / 서포터가 되겠습니다.", `index.html:7717`) 행간 조정. 전부 실측·라이브 확인.
  - **g**(76be59f→e239856): 전략실장 "좁다" 2회 → `leading-[1.2]`→`[1.45]`→`[1.6]` 단계 확대.
  - **h**(92d6005): 전략실장 요청 "1번 제목과 행간 통일" → `leading-[1.6]`(class) → **`style="line-height:1.25;"`**. #stats 히어로 제목 "소득의 격차를 만드는 / 7대 핵심 AI 시스템"(`index.html:4335`, `line-height:1.25`)과 **완전 동일 값**. ⚠️ 방향상 g의 확대와 반대(간격 ~26px→11px 축소)지만 "두 제목 통일"이 최종 결정. 폰트 44px 동일이라 값=시각 1:1. 라이브 실측: `ai-branch.vercel.app` HTML에 `line-height:1.25;">당신을 위한` 확인.

- **v=20260706d~20260706f** (**main 직커밋 LIVE**, tag `v20260706f`, 2026-07-06) — 모바일 폴리시 집중.
  - **d**: 인재양성 04 카드 카운터 0 fix(`updateStack`이 모바일서 통째 return→`updateMocks()`(=.play+runCounters) 미실행이 원인, 데스크톱 스택 트랜스폼만 skip하도록 분리). 모바일 본문 `<br>`→공백 치환(JS `brToSpace`, DOMContentLoaded+load+400ms — `display:none`이면 "한도로무상" 단어 붙는 부작용 회피)+히어로 타이핑 '|'→모바일 공백. 데스크톱 p br 42개 유지.
  - **e**: 모바일 #about/자격카드 5건 — 파이프라인 카드 외곽 p-8→16·pp-node 56→38·아이콘 30·본문폭 164→196px(6→3줄) / 승격구조 라벨 13px·패딩축소(영업수석지점장 옆칼럼 침범 해소) / tsk-live·tsk-cstat .v nowrap(STEP4·CFP·AFPK) / 모기지 배너 object-position 32%→8%(베이크된 "모기지리더스와 함께" 텍스트 크롭). 전부 모바일 @media = 데스크톱 무영향.
  - **f**: #branch-map "인카금융서비스 프로사업단총괄 현황" 행간 leading-tight→line-height:1.45.
- **v=20260706c** (**main 직커밋 LIVE**, tag `v20260706c`, main `31e7895`, 2026-07-06) — 대표님 시연 직전 폴리시 12건(전부 main 직배포·실측·콘솔0).
  - 헤더 "채팅상담" 버튼 확대(14→16px). 히어로 제목·부제 **text-shadow**(움직이는 블루실크 위 흰글자 가독성, 색·굵기 불변, 부제 타이핑 유지).
  - **모바일**: 전역 `body{word-break:keep-all;overflow-wrap:break-word}`(한글 단어중간 줄바꿈 "라인/업"·"설계하/는" 방지) / AI 쇼케이스 데모 2단→모바일 세로스택(`#ai-demo-area` display:flex+height:100% → column, 계산기 "7,764만" 짤림 해소, 데스크톱 무영향) / 375·320px 오버플로우0·짤림0 확인.
  - 성과 카드3 배경 밝힘 / "체험하기" 우측패널 버튼 11→14px·bold / 조직문화 캐러셀 60s→**38s**(지사 캐러셀 ~63px/s 트랙폭 실측 매칭) / 조직문화 제목 색 #111→**#27398c**(프로인트로 히어로와 통일).
  - **인재양성 스택카드**: 배경 숫자 0.055→0.12(가시성) / orb 4장 구분(색=카드 tint 색조 4종 + 위치를 **전부 오른쪽=텍스트쪽**으로, 인접 상/하 교차 01우상·02우하·03우상·04우하, 강도 0.30 통일 — "02·04 오른쪽 밋밋" 해소) / "출발점 — 보장 분석 전문성"→"출발점".
- **v=20260706a~20260706b** (**main FF 머지 → 프로덕션 LIVE**, tag `v20260706b`, main `7421287`, 2026-07-06) — 타이포 통일 + 새로고침 복원 3종 + 채널톡 활성화 (`preview/typo-scale-44` 22커밋, 라운드별 실측 검증·콘솔0).
  - **타이포 스케일 통일**: 섹션 제목 **44px 완전 통일**(전 페이지 예외 없음 — Tailwind 9곳 text-[44px] + clamp 6곳 2.75rem + #recruit 48→44 + 프로솔루션 36→44 + 오버레이 히어로 3곳). 근거=공식 proenterprise.co.kr 실측(40~45px 밴드)+일반 관례. 부제 **17px 통일**(19곳, 공식 동일문장 17px 기준). 교육 패널 제목 한 줄+본문 상향(desc17/h4 15/p13/tag11). 한 줄 전환(#stats·#contact·#branch-map·캐러셀×2·교육4) + 어중간 줄바꿈 일괄 정리(WM카드 제목 1줄·설명 자연흐름, 왜PRO/승격/조직문화/파트너 지정 위치 개행). 성과 카드 라벨 18px·"2억 9,242만" 정정·카드3 배경 밝힘(#224075→#33619b). 3원칙 카드 이너 `h-full`(하단 베젤 6px 균일). 파트너 레일 20px·"보케어"(BOCARE 제거)·AFPK 국내공인재무설계사. 카드02 펀치라인("고객은 이미 우리를 알고 있습니다").
  - **F5 복원 3종**(전략실장 지적): ①메인 스크롤(`scrollRestoration=manual`+sessionStorage `proai_scrollY`+rAF 루프 2.5s, 섹션 해시 잔재에도 동작—오버레이 해시만 제외) ②오버레이 재개방(해시 매핑 ceo/prosolution/pro-intro/talent + 내부 scrollTop `proai_overlayScroll`, 직접 URL 진입도 열림) ③복원 전 메인 플래시 가림막(head 인라인 `pro-restore-pending`, 첫 적용 즉시 `__proReveal()`, failsafe 1800ms). +헤더 포커스 링 blur(F5 후 흰 네모=UA focus ring, 로드 시 nav 내부만 해제·Tab 접근성 유지).
  - **채널톡 활성화**: 공식홈 동일 워크스페이스 pluginKey `3863b31b-…` 주입(공식홈 공개 HTML서 확인·재사용). "지원하기"→**"채팅상담"**(2곳), 런처 버블 상시 표시(hideChannelButton 제거), `showMessenger`. ⚠️도메인 화이트리스트 시 ai-branch.vercel.app 추가 필요 가능 / 문의가 공식홈 콘솔로 합류=운영 동의 공유 권장.
  - 기타: 헤더 "프로솔루션"→**"인재양성"**(+aria) / **talent 오버레이 푸터 보강**(4개 중 유일 누락, --ov-w 목록 추가) / 프로솔루션 인사말 타이핑=**오버레이 열림 트리거**(로드 시 실행돼 정적으로 보이던 것) + 배지 "AI 풀 시스템·7대 통합" 삭제 / #about 부제 mt-6 / 부제 줄바꿈·문구 다수("AI 활용법까지" 등).
  - ⚠️ **오버레이 푸터 우측 ~16px 여백 = 스크롤바 영역**(4개 오버레이 공통, 정상). **Web3Forms 대표님 교체 절차**: 주소만으론 불가 — web3forms.com에 대표님 이메일 입력→Access Key가 그 메일로 발송→키 전달받아 1줄 교체. 🔵 잔여: `preview/gray-tint-scale`(회색 3단 위계+블루틴트) 미머지 — main 이동으로 rebase 필요.
- **v=20260705h~20260705o** (**main FF 머지 → 프로덕션 LIVE**, tag `v20260705o` — 전략실장 프리뷰 확인 후 공개, 2026-07-05) — nexora-restyle 후속 UI 다듬기 8건(33~40차). 전부 preview 브랜치에서 라운드별 진행·실측 검증·콘솔0 후 일괄 FF 머지.
  - **h(33차)**: #about 3원칙 카드 — 제목을 아이콘 오른쪽으로(flex 행) + 이너 배경 `#0a0f1a`(네이비)→`#0d0d0d`(=bg-white/5 over black, 프로솔루션·승격구조와 톤 통일). 승격구조 사다리 10개 라벨 `text-center`.
  - **i(34차)**: 3원칙 카드 베젤 균일화 — `linear-gradient(0.10→0.02)` → 균일 `rgba(255,255,255,0.10)`(하단 흐림 해소). 자격 스탯(`.tsk-cstat`) 3개 `text-center` + "사내 직강 교수진 20명"→"사내 교수진 23명". 금융유튜브 stat 박스 `1fr`→`1fr 1fr`(반폭 왼쪽).
  - **j(35차)**: 카드02 "SNS 인스타그램 / PRO 매거진" stat 박스 추가(금융유튜브 우측, 반폭).
  - **k→l(36·37차)**: 교육 포스터 액자(`.edu-hp-img`) 리스타일 — 남색→중성 차콜 + 매트 여백 18→10px, 최종적으로 **3원칙 카드와 동일 실버 베젤**(`border:6px rgba(255,255,255,0.10)` + 이너 `#0d0d0d` + 리세스 + 드롭섀도, 4개 패널 공용). 파트너 네트워크 Sub "각 금융 분야의 파트너와 함께 합니다."→"각 금융 분야 최고의 파트너와 협업해, 종합 자산관리 솔루션을 제공합니다." (H "PRO 전문 파트너" 유지).
  - **m(38차)**: 교육 슬라이드쇼 정사각(1:1) 2장 제거(신인교육과정 수료 1080×1080 / DB영업전문가과정 실적변화 675×675·저해상도) → 남은 포스터 전부 0.75~0.80 비율 균일. 마크업만 제거(파일 유지).
  - **n(39차)**: 관리자양성 슬라이드 SAGEWOOD→**성수본점 2026 한화리조트 워크샵** 교체. 신규 `AI 홈페이지/관리자/2026-manager-workshop-hanwha.jpg`(1080×1350=4:5).
  - **o(40차)**: 헥사곤 로드쇼 포스터 상단 로고 잘림 해결 — **원본 파일 자체가 크롭**(픽셀 손실, CSS 복구 불가)이라 온전한 버전으로 교체. 신규 `AI 홈페이지/법인/2026-hexagon-roadshow.jpg`(1080×1350=4:5).
  - ⚠️ **잔존 미사용 파일(무해, 정리 후보)**: `AI 홈페이지/관리자/관리자 워크샵1.jpg`(구 SAGEWOOD), `AI 홈페이지/법인/SnapInsta...657618779.jpg`(구 크롭 헥사곤). D(흰색 배경 3섹션 #stats·프로인트로·조직문화)는 **의도된 것 → 유지**(전략실장 결정).
- **v=20260704a~20260705g** (**main FF 머지 → 프로덕션 LIVE**, tag `v20260705g` — 전략실장 최종 OK 후 공개) — Nexora 레퍼런스 기반 대규모 리디자인 2건 + 전략실장 피드백 32라운드 + 머지 클린업(아래). 상세·라운드별 진실원 → auto-memory `pending-aibranch-nexora-restyle-2026-07-04.md`(→completed 이동).
  - **머지 클린업(v=20260705g, dead-code)**: 구 roadmap 시퀀스 **JS 제거**(`playRoadmapSequence`/`startRoadmapSpotLoop`/`stopRoadmapSpotLoop` 3함수 + `roadmapSpotIdx` var + `talent-open`/`closeAllOverlays` 호출부 — 인재양성이 `.tsk-*` 스택 카드로 대체돼 `.roadmap-*` 마크업이 없어 전부 inert였음) + 구 roadmap **CSS 전량 제거**(`#talent-overlay .roadmap-*` 규칙 + `@keyframes roadmap-flow-h/v/pulse/rise` + 모바일 @media 내 roadmap 라인, `.support-grid`/`.expertise-*` 라이브 규칙은 보존) + `.free-badge` 데드 CSS 제거. **프리뷰 실측 검증**: 제거 식별자 전부 `undefined`·roadmap/free-badge 마크업 0·talent-open 오버레이 정상 오픈·contact 네비=#join-contact 스크롤(오버레이 미개방)·콘솔 에러 0.
  - **5~32차 요약**(전부 프리뷰 검증·콘솔0): 우측패널 계정칩 중앙+AI풀시스템 카드 이동/자세히보기 제거 · "AI 응답률"→"AI 사용률" · "AI-Powered" 배지 제거 · BOCARE 태그(영업지원·보험)/세로 레일 upright/설명 문구 · 인재양성 라벨 간소화(GROWTH/SUPPORT/EXPERTISE/SYSTEM)·"TALENT PROGRAM" 숨김·04칩 7개·헤드라인 "여러분의" · 스택카드 바닥여백 해소(카드=flex 채움, 헤더 top고정+본문 auto중앙) · 01·04 막대 NEXUS풍 오실레이션(tskOsc) · 쇼케이스 재진입 시 엔진0 리셋(스크롤 rect 실측) · 카드 뷰포트 채움(equalize fill=vh-top*2) · 헤더 "AI시스템" 클릭=엔진0 · 자동화처리량 svg 44→88 · **헤더 "인재양성"→"프로솔루션"**(체험 오버레이 배지는 "AI 풀 시스템 · 7대 통합"으로 분리) · 체험하기/자세히보기 버튼 솔리드 #2563eb · LIVE 초록→블루 · 카드 sticky top 88→124(네비 겹침 해소) · 02 Brand Promise 해시태그化 · **문의하기 인라인 섹션 신규(#join-contact)**: 현황 다음 2단(좌 영입소구 ▶5·우 폼), 헤더 "문의하기"=이 섹션 스크롤, 기존 폼 재사용(_submitContactForm form-scoped)+지역명(name=region) 추가, eyebrow "Join Pro Enterprise"(Inter) · #about "프로솔루션" 번호리스트→**컴팩트 세로 파이프라인**(레일 입체튜브+빛흐름+36px 베젤소켓, 블루3톤) · 3원칙 카드 **이중 베젤**(외곽 프레임+#0a0f1a 리세스 패널) · 금융유튜브 stat 카드03→02(="PRO 보험스쿨") · 지도 방사선 8개 본점(367,179) 정렬 · 승격구조 하단 좌측과 정렬(라벨16·연결선h-5).
  - ✅ **stale 정정 완료(v=20260705g)**: Tech Stack·"3D Digital Terrain"→"히어로 배경"·Critical Notes를 **UnicornStudio(`data-us-project="7BChNsgjdoJkLPEpWhX3"`, `unicornstudio.js@v1.4.34` 동적 로드 + CSS fallback glow)** 기준으로 정정. Three.js·`#three-canvas`·3D terrain·`js/` orphan 서술 제거(grep으로 index.html에 `THREE`/`three-canvas` 0건, `js/` 폴더 부재 확인).
  - **① 7대 AI 쇼케이스(#solutions) SaaS 앱화**: 브라우저 크롬(신호등·주소창) 제거 → 사이드바 브랜드 블록(`PRO enterprise / AI automation`) + 앱 헤더(**"AI 통합 시스템" / "7대 AI 영업 시스템을 한 곳에서 활용하세요."**) + **실동작 검색창**(시스템명 매칭 → `setActiveEngine` 자동 전환, 디바운스 280ms, focus 시 자동순환 정지) + KPI 스트립 4카드(`#ai-kpi-strip`, `.nxk-*` — 7대 도트 순차점등 `nxkDotSeq` / 금일47건 스파크라인 `nxkDraw` / 700+ 바 웨이브 `nxkBarSeq` / 99.2% 스파크라인, 전부 동적·reduced-motion 대응). 우측 패널: 상단 **계정 칩 행**(실사진 아바타 `assets/images/consultant-avatar.jpg` 슬롯+P 폴백, 셰브론 텍스트 밀착 10px, **높이 68px = 앱 헤더와 보더 라인 픽셀 일치**) + 엔진 정보는 KPI 스트립과 동일 y 정렬(pt-4) + 지표 카드 컬러 헤어라인·fadeSlideIn 순차·인사이트 박스. 사이드바 하단 "AI 풀 시스템" 카드(data-nav=prosolution-open)+워크스페이스 푸터. **"AI 시스템 체험하기" 하단 버튼 제거**(CTA는 사이드바 체험하기). 데모 스크립트·엔진 데이터·클릭 로직 전부 불변.
  - **② 인재양성(#talent-overlay) 스택 카드**: 기존 섹션 1~3(로드맵 QUANTCORE·support-grid·tx-ladder)을 **01~04 스티키 스택 카드**(`.tsk-*`)로 교체 — 01 성장 트래커(프로그레스 순차 차오름 9s) / 02 브랜드 콘솔(4축 하이라이트 순환 8s) / 03 자격 워크플로우(연결선 빛 하강+순차 점등 6s+★펄스, 기존 사다리 IO 애니 계승) / 04 AI 미니 대시보드(카운트업+바+스파크 드로우). 기존 카피 전부 이식. **파트너 아코디언(#partner-network)·WM센터 무손상**(문구만 3건 변경: 인트로 4축 "교육·브랜딩·전문 자격·시스템"/"자체 WM센터 운영"/"각 금융 분야의 파트너와 함께 합니다").
  - ⚠️ **핵심 교훈 3건**: (a) 오버레이 스크롤포트 원점 ≠ 뷰포트 0(**sticky stuck 위치 실측 108px**) → 스택 JS는 고정 임계값 금지, **gap(다음 카드 실거리) 기반**으로 판정. (b) `.play` 애니 게이트는 IO 대신 **스크롤 핸들러 rect 실측 토글**(백그라운드 탭 IO 동결 무관 + 헤드리스 검증 가능). (c) 스택 카드 완전 은폐 = **top 통일(88px) + 오버레이 열림 시 JS 높이 균등화**(MutationObserver→setTimeout 60ms, rAF는 백그라운드 탭 정지) 세트.
  - ✅ **머지 완료(v=20260705g)**: 전략실장 최종 OK → `preview/nexora-restyle` **main FF 머지 → 프로덕션 LIVE**. ⚠️ **`#contact` 오버레이는 유지**(핸드오프엔 "미사용→삭제"였으나 코드 검증 결과 6개 CTA[`getElementById('contact')`+scrollTo+`location.hash`]·popstate 라우팅·닫기 버튼이 여전히 참조 = 미사용 아님 → 이번 스코프에서 제외, 전략실장 승인). **Web3Forms 키 `c96794c6…`=전략실장 이메일 유지**(대표님 승인 후 별도 교체, 장기 보류 유지). 🔵 선택 잔여: 파이프라인/소켓 멀티컬러, #about 3원칙 카드 추가 세련화(강도 미확정).
- **v=20260630b** (main `0d9fb98`, tag `v20260630b`, **프로덕션 배포 LIVE 700명**) — 인재양성 자격 사다리 왼쪽부터 순차 등장 애니. `preview/20260630-ladder-reveal` 2커밋 FF 머지. 라이브 검증: `ladReveal` 키프레임·`tx-anim`·`animation-delay 1.15s` 반영.
  - **`#talent-expertise .tx-ladder` 순차 등장**: EXPERTISE "자격으로 완성하는 성장 경로" 4카드(s1 보험설계사→s2 AFPK→s3 CFP→s4 종합자산관리·WM)가 화면 진입 시 **왼쪽부터 하나씩** 슬라이드+페이드(`@keyframes ladReveal` opacity 0→1, translateX -22px→0). 트리거=**IntersectionObserver**(사다리 직후 인라인 `<script>`, threshold [0,0.25]; ≥0.25 진입 시 `.reveal` 추가, 완전 이탈 시 제거=재진입 재생). 연결선(`::before`)도 함께 페이드인.
  - **타이밍(대표님 "천천히 자연스럽게")**: 각 카드 `.9s cubic-bezier(.22,.61,.36,1)`, stagger 간격 0.35s(delay .1/.45/.8/1.15s), 연결선 `transition:opacity 1s ease .7s` → 전체 ~2s. (1차 .55s·간격 .17s에서 완화.)
  - **graceful**: JS 활성 시에만 `.tx-anim`으로 초기 숨김(무JS·IO 미지원=즉시 표시), `prefers-reduced-motion: reduce` 시 animation 없이 즉시 표시.
- **v=20260630a** (main `5501b82`, tag `v20260630a`, **프로덕션 배포 LIVE 700명**) — 제휴 이미지 압축 + 문구 2건 + 허브 코어 깜빡임. `preview/20260630-png-text` 2커밋 FF 머지. 라이브 검증: jpg 3종 200·옛 png 404·"PRO AI HUB" 0·"전문 파트너" 존재·`pro-hub-core`/`proHubCorePulse` 존재.
  - ① **제휴 네트워크 PNG 3종 JPEG 압축**(`assets/images/partners/`): hexagon(1670KB)·mortgage(1953KB)·bocare(1531KB) PNG → JPEG(Pillow, 폭 1400px 상한·q82·progressive·optimize) = **~5.15MB→379KB(-93%)**. 알파 전부 불투명(255)이라 투명도 손실 0, object-position만 조정된 풀 배너라 크롭 불필요(globee/daejin과 달리 단순 리사이즈/압축). `.acc-photo` src 3건 `.png`→`.jpg` 교체(15006/15016/15046), 옛 png 제거. 이제 제휴 5사 전부 `.jpg`.
  - ② **WHY PRO 허브 "PRO AI HUB" 라벨 삭제**: 중앙 발광 오브 아래 배지+구분선 묶음(`absolute translate-y-28` 컨테이너) 그룹째 제거(텍스트만 지우면 구분선 고아 → 그룹 전체). absolute라 레이아웃 영향 0, 오브·궤도·링·연결선 불변.
  - ③ **제휴 헤딩 "PRO 네트워크"→"PRO 전문 파트너"**(`#partner-network h2`, `전문 파트너`=`.hl` 블루).
  - ④ **WHY PRO 허브 중앙 코어 점 깜빡임(맥동) 추가**: 코어 점(`.pro-hub-core`, 데스크톱 허브 `w-3.5 h-3.5 bg-blue-400`)에 `@keyframes proHubCorePulse 1.6s ease-in-out infinite`(opacity 1→0.35, scale 1→0.78, glow box-shadow 강약 펄스). 스코프 `<style>`(블러 글로우 div 다음), 점 1개에만. `prefers-reduced-motion: reduce` 시 animation:none. ⚠️ **헤드리스 프리뷰는 백그라운드 탭=CSS 애니 frozen**→`getAnimations()` 빈 배열, computed `animationName`으로 바인딩만 검증(실브라우저 정상).
  - 🔴 **남은 일**: 배너 크롭%·object-position 미세조정 여지 / Web3Forms 키 교체 여전히 보류.
- **v=20260629a** (main `17966f8`, tag `v20260629a`, **프로덕션 배포 LIVE 700명**) — 인재양성·프로사업단총괄 대규모 추가/재설계. `preview/wm-center` 브랜치 **12커밋 FF 머지**(프리뷰 반복 검증 후). 라이브 확인: ai-branch.vercel.app에 `#wm-center`·`#partner-network`·"PRO 네트워크" 반영(HTTP 200).
  - ① **WM센터 섹션 신규**(`#wm-center`, 프로사업단총괄 오버레이 교육↔조직문화 사이) — "2026년 7월 출범" 배지 + "법인 고객 및 고액 자산가를 위한 WM센터" + 2트랙(법인/CEO·개인/고액자산가, **역할만·이름/번호 제외**) + 혜택 3카드(자산 맞춤 컨설팅 / WM 특화 자료·교육 / VIP 고객 관리 지원). 🔴**내부문서(수수료·출장비·센터장 번호·신청서) 전부 공개 제외**(WM 70/30·출장비 등은 내부 정산이라 영입 페이지 부적합). `#wm-center` 스코프 독립 블록.
  - ② **교육 가로스크롤 패널 가운데 공백 축소**(`.edu-horiz-panel`) — `padding-inline:max(2rem,calc((100vw-1180px)/2))`(중앙 1180px 밴드)+`column-gap:3rem`, `.edu-hp-text` 좌패딩 `8rem→3rem 1rem`. 와이드(1680px) 가운데 공백 **~630→55px**. 모바일 1열 무영향.
  - ③ **성과(`#stats`) 카드 ↑ 화살표** `text-blue-500→text-white`(2곳).
  - ④ **인재양성 EXPERTISE 재설계**(`#talent-expertise`) — 추상 카드 2개 → **자격 사다리**(보험설계사→AFPK→CFP→종합자산관리·WM) + **증거**(금융 유튜브 `pro보험스쿨` / 조직 자격 `CFP 2·AFPK 5` / 사내 직강 `20명`) + 소득 한 줄. 서브 규제 안전 톤("…아우르는 종합 설계 역량")+줄바꿈. STEP/PROOF 라벨 13→18px. 제휴 그리드는 제거(아코디언으로 이동).
  - ⑤ **제휴 네트워크 아코디언 신규**(`#partner-network`, EXPERTISE 아래) — 확장형 아코디언 **5사: 헥사곤→모기지→대진→글로비→보케어**(헥사곤 기본 열림). 이미지 **상단 가로 배너**(cover, 이미지별 `object-position`). 🔴**글로비·대진은 스크린샷 텍스트가 우측~59%에 박혀** CSS로 못 옮김→**캔버스로 좌측 18~19% 크롭+JPEG 압축**(globee 3.4MB→140KB, daejin 2MB→82KB, `.jpg`로 교체·옛 png 제거). 접힌 카드 밋밋함 개선(네이비 그라데이션+아이콘 42px 글로우+호버 떠오르기/글로우/상단 액센트). **아코디언 전환=`flex-grow` 트랜지션**(`flex` 단축 트랜지션이 헤드리스서 `0 0 0%`로 멈추는 버그 회피). 세로 라벨 `transform:rotate(180deg)` 제거(글자 뒤집힘 해소). 헤드라인 "전 분야 네트워크"→"PRO 네트워크". 5사 수익률·수수료 등 내부/규제 항목 전부 공개 제외, 보케어 무상제공만 강조.
  - ⑥ **메인 "프로사업단총괄 현황"(`#branch-map`) 체크마크 5개** — 얇은 원형 체크 → **스캘럽 씰(check-badge) + 흰 체크**(`#2f57c4`).
  - ⑦ `assets/images/partners/` 5종 추가(mortgage.png·hexagon.png·bocare.png + globee.jpg·daejin.jpg).
  - ⚠️ **교훈**: 채팅 붙여넣기 이미지는 파일 저장 불가→사용자가 repo `assets/`에 직접 저장. **헤드리스 프리뷰는 flex-grow 트랜지션 동적 미갱신**(transition:none이면 정상)·**스크린샷 타임아웃**(Three.js rAF)→**DOM 실측으로 검증**. 모든 변경 DOM 실측·콘솔0. Vercel **프리뷰 배포는 SSO 보호**(302)·프로덕션은 공개.
  - 🔴 **남은 일**: 모기지·헥사곤·보케어 PNG 압축(~6MB→수백KB) 보류 / 배너 크롭% 미세조정 여지 / Web3Forms 키 교체 여전히 보류.
- **v=20260628t** (index.html 단일, main push + tag) — 히어로 서브타이틀(`#hero-typing`) 굵기 `font-light(300)→font-normal(400)`로 ↑ — 색은 원래 흰색이었으나 얇아서 회색처럼 보이던 것 또렷하게(대표님 요청).
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
