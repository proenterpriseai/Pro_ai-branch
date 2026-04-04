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
index.html          — Main SPA (~2,684 lines, all JS inline)
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
| coverage | 보장분석 시스템 | AI chat: keyword matching (암/실손/사망/보험료) + Gemini API fallback |
| dbsales | DB 영업관리 | Search filter, status badge toggle (미상담→상담중→청약→완료), add row |
| calculator | 통합금융계산기 | 3 sub-tabs (예적금 FV계산/대출 상환/은퇴 자금), CSS bar charts |
| coaching | 상담 코칭 | 3 preset scenarios + free input (거절/클로징/신뢰) + Gemini API |
| insurance-calc | 보험금 산출 | 진단명/입원일수/비급여 입력 → 정액+실손 산출표 |
| healthcheck | 건강검진 분석 | 4 range sliders (혈압/혈당/콜레스테롤/ALT) → real-time 판정 뱃지 |
| complete-sales | 완전판매 | 5-step accordion + checkbox progress bar |

## Gemini API Integration
- **Endpoint**: `/api/chat` (Vercel Serverless Function)
- **Model**: `gemini-2.0-flash`, temperature 0.7, maxOutputTokens 500
- **Env var**: `GEMINI_API_KEY` (Vercel Dashboard > Settings > Environment Variables)
- **사용처**: coverage chat + coaching chat (keyword 매칭 실패 시 fallback)
- **System prompt**: 보험 전문 AI 어시스턴트 (간결, 아이콘 사용, 원화 표시)

## Critical Notes
- Three.js는 CDN `<script>` (global `THREE`), **importmap/ES Module 아님**
- 모든 대시보드 JS는 `index.html` 인라인 IIFE — 외부 JS 파일 로드 없음
- Canvas: `#three-canvas`, CSS `.content-layer` z-index 1이 위에 오버레이
- CEO 오버레이: `#ceo` hash trigger → modal, body scroll lock, back 버튼 지원
- `js/three-hero.js`, `js/main.js` — **orphaned** (index.html에서 로드하지 않음)
- 모바일: terrain은 모든 사이즈에서 렌더 (별도 숨김 없음)

## 4대 규칙 (영구)
1. **기존 기능 불변** — 신규 코드는 완전 독립 블록. 기존 함수 내부 수정 시 사전 승인 필수
2. **Feature Flag 필수** — 검증 전 모든 신규 기능 Flag=false. Flag=false 시 기존 영향 0
3. **CDN/외부 스크립트 비동기 필수** — 신규 `<script>` 태그는 `async`/`defer` 필수
4. **Lazy Init 필수** — 외부 의존성 모듈 레벨 즉시 초기화 금지

## Version
- **v=20260404a** — 8대 AI 대시보드 + Gemini API 통합
