# AI Branch — Pro Enterprise AI Landing Page

## Overview
Pro Enterprise AI 랜딩 페이지. OrfeoAI 수준의 3D 나선형 메탈릭 코일 + 스크롤 애니메이션.

## Tech Stack
- **3D**: Three.js r160 (ES Module via importmap)
- **Post-processing**: EffectComposer + UnrealBloomPass + OutputPass
- **Animation**: GSAP 3.12 + ScrollTrigger (scrub:1, object-based)
- **Server**: Node.js static server (`_serve.js`, port 3098)
- **Deploy**: Vercel (GitHub: `proenterpriseai/Pro_ai-branch`)

## File Structure
```
index.html          — 메인 HTML (importmap + GSAP CDN)
css/style.css       — 전체 스타일 (다크 테마, glassmorphism, responsive)
js/three-hero.js    — 3D 나선형 코어 (ES Module) ★ 핵심 파일
js/main.js          — 로딩 스크린, 헤더, 시계, GSAP 텍스트 애니메이션
_serve.js           — 개발 서버 (node _serve.js)
```

## 3D Spiral Architecture

### Group Hierarchy
```
spiralGroup (GSAP ScrollTrigger 제어: position/rotation/scale/opacity)
  └─ spiralTilt (고정 대각선 틸트: rotation 0.3, 0, -0.6)
      └─ spiral mesh (idle rotation 0.0008/frame + wriggle vertex shader)
```

### Key Parameters
| Parameter | Value |
|-----------|-------|
| turns | 24 |
| radius | 2.8 |
| height | 5.5 |
| tubeRadius | 0.065 |
| tubularSegments | 1200 |
| radialSegments | 8 |
| camera | fixed (0, 0, 8) + mouse parallax |

### Post-processing Pipeline
```
RenderPass → UnrealBloomPass(0.3, 0.5, 0.88) → OutputPass
```
- Bloom strength 0.3 (은은한 글로우)
- Threshold 0.88 (밝은 스페큘러만 블룸)
- OutputPass 필수 (Three.js r160 tone mapping 처리)

### Material
- MeshPhysicalMaterial: metalness=1, roughness=0.03, clearcoat=1
- envMapIntensity=5.5, iridescence 활성
- onBeforeCompile vertex shader: wriggle 유기적 움직임
- transparent=true (GSAP opacity 제어용)

### Scroll Animations (8 sections)
| Section | Scale | Effect |
|---------|-------|--------|
| Hero | 1.0 | 풀사이즈, 중앙 |
| What We Do | 3.5 | 줌인, 코일 화면 가득 |
| What We Build | 0.6 | 축소+페이드(0.3) |
| Who We Are | 1.2 | 좌측 배치 |
| Why Choose Us | 1.0 | 우측 스윕 |
| Features | 1.5 | 극적 앵글 |
| Clients | 0.4 | 최소화+페이드(0.25) |
| Testimonial | 2.5 | 재확장 |
| Footer | 0.3 | 퇴장 |

## Critical Notes

### Bloom + Dark Background
- `renderer.setClearColor(0x000000, 1)` 필수 — ACES tone mapping은 블랙 리프트하므로, 0x0a0a12 같은 색 쓰면 배경 회색으로 워싱됨
- `OutputPass` 없으면 tone mapping이 올바르게 적용 안 됨
- `renderer.toneMappingExposure = 1.6` — bloom과의 밸런스

### Performance
- 24턴 × 8 radialSegments = ~57K 삼각형 — 데스크톱 충분
- Bloom: 2 추가 렌더 패스 (half-res) — 60fps 유지
- 모바일 (<769px) 스킵: canvas display:none + isRendering=false

### GSAP 의존성
- GSAP/ScrollTrigger는 `<script defer>` (non-module)
- three-hero.js는 `<script type="module">` (ES module)
- `waitForGSAP()` 폴링으로 GSAP 로드 대기 (100ms interval)
- `window.__revealHero` 콜백으로 main.js 로딩 스크린과 연동

## Version
- v=20260401a (첫 배포)
