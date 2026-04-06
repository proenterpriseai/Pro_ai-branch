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

## Critical Notes
- Three.js는 CDN `<script>` (global `THREE`), **importmap/ES Module 아님**
- 모든 대시보드 JS는 `index.html` 인라인 IIFE — 외부 JS 파일 로드 없음
- Canvas: `#three-canvas`, CSS `.content-layer` z-index 1이 위에 오버레이
- CEO 오버레이: `#ceo` hash trigger → modal, body scroll lock, back 버튼 지원
- `js/three-hero.js`, `js/main.js` — **orphaned** (index.html에서 로드하지 않음)
- 모바일: terrain은 모든 사이즈에서 렌더 (별도 숨김 없음)
- **네비 배경색**: `#27398c` (파란색 계열, v=20260406 변경)
- **`html { scroll-behavior: smooth }` 설정됨** — JS scrollIntoView와 충돌 주의

## 4대 규칙 (영구)
1. **기존 기능 불변** — 신규 코드는 완전 독립 블록. 기존 함수 내부 수정 시 사전 승인 필수
2. **Feature Flag 필수** — 검증 전 모든 신규 기능 Flag=false. Flag=false 시 기존 영향 0
3. **CDN/외부 스크립트 비동기 필수** — 신규 `<script>` 태그는 `async`/`defer` 필수
4. **Lazy Init 필수** — 외부 의존성 모듈 레벨 즉시 초기화 금지

## Version
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
