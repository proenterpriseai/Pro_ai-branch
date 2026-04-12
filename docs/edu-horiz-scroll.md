# 교육 가로 스크롤 기술 규칙 (v=20260412b)

## 아키텍처: sticky + vanilla scroll (GSAP 미사용)

### 핵심 원리
1. `#edu-horiz-scroll` — `height:400vh` (세로 스크롤 공간)
2. `.edu-horiz-sticky` — `position:sticky; top:0; height:100vh; overflow:hidden`
3. `.edu-horiz-wrap` — `display:flex` 가로 배치, JS가 `translate3d`로 이동
4. overlay `scroll` 이벤트 → progress 계산 → `translateX` 매핑

### ⚠️ GSAP pin 사용 금지
- `position:fixed` 오버레이 안에서 GSAP `pin:true`는 깜빡임/레이아웃 충돌 발생
- 반드시 `position:sticky` + vanilla JS 방식 유지

### ⚠️ overlay.scrollTo({behavior:'smooth'}) 미작동
- `position:fixed; overflow-y:auto` 요소에서 `scrollTo({behavior:'smooth'})`는 Chrome에서 미작동
- smooth scroll이 필요하면 `requestAnimationFrame` + `scrollTop` 직접 설정으로 구현
- 현재 스냅 애니메이션: easeInOut 커브, 400ms 지속

### CSS 클래스
| 클래스 | 용도 |
|--------|------|
| `#edu-horiz-scroll` | 섹션 컨테이너 (400vh) |
| `.edu-horiz-sticky` | sticky 뷰포트 (100vh) |
| `.edu-horiz-wrap` | 가로 flex 트랙 |
| `.edu-horiz-panel` | 각 패널 (grid: 1fr 1fr) |
| `.edu-hp-text` | 좌측 텍스트 |
| `.edu-hp-img` | 우측 이미지 컨테이너 |
| `.edu-hp-course` | 과정 항목 |
| `.edu-hp-course.active` | 현재 사진과 연동된 활성 과정 (흰색 하이라이트) |
| `.edu-nav-dots` | 하단 패널 인디케이터 |

### JS 구조 (IIFE 내부)
1. **히어로 슬라이드쇼** — 4장 자동 순환 (4초)
2. **교육 가로 스크롤** — `initEduScroll()` (MutationObserver가 오버레이 활성화 감지 후 300ms 뒤 호출)
   - 좌표 캐시: `cachedTop`, `cachedRange` (resize 시 갱신)
   - `translate3d` GPU 가속
   - dot 인디케이터 업데이트
   - **자동 스냅**: 스크롤 멈춘 후 200ms → 가장 가까운 패널로 rAF smooth 스크롤 (400ms easeInOut)
3. **사진 자동 순환** — 각 `[data-slideshow]`에 3초 크로스페이드 + `.edu-hp-course.active` 연동

### 이미지 규칙
- `object-fit: contain` — 짤림 없이 전체 표시
- `height: calc(100vh - 8rem)` — 고정 높이 컨테이너
- `border-radius: 16px` — 둥근 모서리
- 다중 이미지: 첫 번째 `opacity:1`, 나머지 `opacity:0; position:absolute`

### 교육 사진 매핑 (v=20260412b)
| 패널 | 폴더 | 장수 | 비고 |
|------|------|------|------|
| 01 신인/저차월 | `신입/` | 5장 | `456407783`, `529646521`, `551078060`, `573534756`, `581774895` |
| 02 관리자 양성 | `관리자/` | 5장 | `626957428`, `523235892`, `539531083`, `573853513`, `575975059` |
| 03 전문 역량 | `db영업전문과과정/` | 1장 | `486760402` (스케줄표 사진 `486669384` 제거됨) |
| 04 경제/법인 | `법인/` | 2장 | `625842837`, `657618779` |

### 모바일 (768px↓)
- `#edu-horiz-scroll { height:auto }` — 스크롤 공간 해제
- `.edu-horiz-sticky { position:static }` — sticky 해제
- `.edu-horiz-wrap { flex-direction:column }` — 세로 스택
- `.edu-nav-dots { display:none }` — dot 숨김
