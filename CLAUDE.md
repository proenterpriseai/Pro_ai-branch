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
api/chat.js         — Vercel Serverless Function: Gemini API proxy (53 lines)
assets/images/      — Logo SVG, CEO portrait
_serve.js           — Dev server (port 3098)
js/three-hero.js    — [ORPHANED] 미사용, 이전 Icosahedron ES Module
js/main.js          — [ORPHANED] 미사용, 이전 loading/glitch
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
- **사용처**: coverage chat + coaching chat (keyword 매칭 실패 시 fallback)
- **System prompt**: 보험 전문 AI 어시스턴트 (간결, 아이콘 사용, 원화 표시)

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

## 프로사업단총괄 섹션 (v=20260411a)

### 현재 상태
- **오버레이 방식**: `#pro-intro-overlay` (ceo-overlay 패턴, `</body>` 직전)
- **Scene 1 (빛의 슬릿)**: #27398c 글로우 라인이 중앙에서 넓어지며 콘텐츠 리빌
- **Scene 2 (지사 캐러셀)**: 14장 카드 자동 순환 (CSS @keyframes, 카드 복제 무한 루프)
- **워크스루 슬라이드쇼**: 성수 본점 6장 Ken Burns 효과 (JS 스크롤 기반 사진 전환)

### 교육 로드맵 (v=20260411a — 3대 레퍼런스 융합)
- **상단 Stillpoint Ritual Panels**: `#edu-panels` 4컬럼 그리드
  - 각 패널: 풀블리드 배경 사진 + 그라디언트 오버레이 + Stage 번호 + 제목
  - hover: 기존 제목 fadeOut → 글래스모피즘 디테일 slideIn (backdrop-filter:blur(16px))
  - 디테일: 과정명 + 설명 + 태그 pill + #27398c 액센트 라인 (width 0→100%)
  - 모바일(768px↓): 1열 스택, 디테일 항상 표시 (hover 없으므로), 베이스 숨김
- **하단 Pipeline 지그재그**: `#edu-pipeline` 좌-우-좌-우 카드 배치
  - SVG 곡선 연결 + 스크롤 진행 시 glow stroke-dashoffset 애니메이션
  - 각 카드: Stage + 과정명 + 설명 + **가로 스크롤 갤러리** (해당 폴더 전체 사진/영상)
  - 갤러리: height 180px(PC)/140px(모바일), object-fit:contain, scroll-snap-x, 잘림 없음
  - 모바일: 지그재그 해제 → 100% 폭, SVG 숨김
- **CSS 클래스 접두사**: `.ritual-*` (패널), `.pipeline-*` (카드)

### 교육 사진/영상 매핑 (바탕화면 폴더 — _serve.js fallback 서빙)
| 탭 | 폴더 | JPG | MP4 | 비고 |
|----|------|-----|-----|------|
| 01 신인/저차월 | `신입/` | 8 | 2 | + `AI 홈페이지/포스터.PNG` (교재) |
| 02 관리자 양성 | `관리자/` | 7 | 2 | |
| 03 전문 역량 | `db영업전문과과정/` | 5 | 1 | 폴더명 "과과정" 오타 주의 |
| 04 금융/법인 | `재무설계/` | 1 | 0 | 사진 부족 |

### 보상 체계 블록
- 제목: "성장을 지속 시키는 조직문화" (v=20260411 변경)
- 설명: "프로사업단총괄은 다양한 행사와 시상식을 통해 확실한 동기부여와 지속적인 원동력을 제공합니다."

### 네비 연동
- `data-nav="pro-intro"` → `#pro-intro-overlay` 오버레이 열기
- **Step 1 "프로를 만드는 교육 체계"** → `data-nav="pro-intro" data-scroll-to="edu-panels"` → 오버레이 열림 후 400ms 뒤 교육 섹션으로 자동 스크롤
- `closeAllOverlays()`에 `pro-intro-overlay` 닫기 추가 완료
- 모바일 메뉴에도 `data-nav="pro-intro"` 연동 완료

### _serve.js 변경 (v=20260411)
- **MP4 MIME 타입 추가**: `.mp4: 'video/mp4'`
- **바탕화면 폴더 fallback**: ai-branch에서 파일 못 찾으면 `path.join(__dirname, '..')` (바탕화면)에서 재탐색
- 이로써 `신입/`, `관리자/`, `db영업전문과과정/`, `재무설계/`, `AI 홈페이지/` 경로 서빙 가능

### 보유 사진 (전체)
- **지사 개설 14장**: 캐러셀 카드로 사용 중
- **성수 본점 6장**: 워크스루 슬라이드쇼로 사용 중
- **교육 사진/영상 27개**: Stillpoint 패널 배경 + Pipeline 갤러리로 전수 사용
- **교재 포스터 1장**: Pipeline 01번 카드 갤러리 첫 아이템
- **행사 2장, 성과 2장, 해외연수 1장, 영상 5개**: 프로 사진/ 폴더 (기존 사용 중)

## Version
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
