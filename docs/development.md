# 개발 가이드

## 페이지와 진입점

Vite 다중 페이지로 HTML을 내보냅니다. 라우터 라이브러리는 쓰지 않습니다.

| 주소       | HTML                | 진입점                          | 페이지                                       |
| ---------- | ------------------- | ------------------------------- | -------------------------------------------- |
| `/`        | `index.html`        | `src/app/entries/home.tsx`      | `pages/home` 시계 쇼케이스                   |
| `/editor/` | `editor/index.html` | `src/app/entries/editor.tsx`    | `pages/editor` 프레임 애니메이션 편집기 소개 |
| `/studio/` | `studio/index.html` | `src/app/entries/studio.tsx`    | `pages/studio` 픽셀 애니메이션 스튜디오      |
| `/bench/`  | `bench/index.html`  | `src/app/entries/bench.tsx`     | `pages/bench` Canvas·DOM·SVG 성능 비교       |
| 없는 주소  | `404.html`          | `src/app/entries/not-found.tsx` | `pages/not-found`                            |
| `/render/` | `render/index.html` | `src/app/entries/render.tsx`    | `pages/render` 시퀀스 생성용 (배포에 없음)   |

GitHub Pages는 없는 주소에 `404.html`을 돌려주므로 따로 설정하지 않습니다.

## 구조 (Feature-Sliced Design v2.1)

- **app**: 진입점(`entries`), 전역 스타일(`styles`: 글꼴, 토큰, 기본값)
- **pages**: 한 페이지에서만 쓰는 코드. 시계 쇼케이스의 섹션·렌더러·Worker, 편집기 소개의 섹션·3D 무대, 스튜디오의 편집기 UI·상태
- **widgets**: 모든 페이지가 함께 쓰는 헤더(`actions` 자리에 페이지 전용 버튼)와 푸터
- **features**: 편집기 소개와 스튜디오가 함께 쓰는 내보내기(`export-artwork`)와 가져오기(`import-image`)
- **entities**: 시계 `watch` (설정·시각·분해 위치·시퀀스 주소, three.js 모델과 조명), 작품 `artwork`
- **shared**: `lib`(canvas, preload, particles, gif, pixel, math, scroll, motion, pointer, viewport, fonts …), `ui`, `config`

`pnpm lint:fsd`(Steiger)로 계층 규칙, 공개 API(`index.ts`), 슬라이스 간 import를 검사합니다. `package.json`의 `sideEffects`에 CSS와 `src/app`만 두어, 공개 API가 내보내는 3D 모델처럼 쓰지 않는 것은 번들에서 빠집니다.

## 시계 쇼케이스 (`pages/home`)

| 구간        | 파일                                                       | 내용                                                                                                                                               |
| ----------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 첫 화면     | `lib/hero-renderer.ts`, `hero.worker.ts`, `hero-canvas.ts` | OffscreenCanvas Worker. 로딩 중에는 눈금·크림슨 호·7세그먼트 %, 다 받으면 마우스를 따라가는 빛 꼬리 16개를 제목 글자로 오려 냄                     |
| Anatomy     | `lib/sequence-frames.ts`, `sequence-player.ts`             | 핵심 프레임 25장(8장 간격) → 첫 스크롤 뒤 나머지 167장을 간격을 반씩 좁혀(4 → 2 → 1) 받음. 스크롤 진행도를 lerp로 따라가며 이웃 프레임을 겹쳐 그림 |
| Details     | `lib/particle-scene.ts`, `shared/lib/particles`            | 입자 1,800~4,200개. 시퀀스 첫 프레임의 밝은 픽셀, 글자(500M·4Hz·42H)를 목표점으로 삼고 마우스 반발력과 복원력으로 움직임                           |
| Colors      | `ui/colors/WatchStage.tsx` (지연 로딩)                     | R3F 시계 모델. 견본을 고르면 재질 색·거칠기·야광을 lerp로 바꾸고, 보는 방향은 회전 목표만 바꿈                                                     |
| 디버그 패널 | `ui/debug/DebugPanel.tsx`, `model/tuning.ts`               | 헤더 오른쪽 위 **Debug**(또는 `?debug`). 입자 수·반발력·복원력·마찰, 시퀀스 lerp, 빛, DPR 상한, 메인·Worker FPS 그래프                             |

- 엔진은 `model/tuning.ts`의 값을 매 프레임 직접 읽습니다. Worker로 보내야 하는 값만 `tuningEvents`로 알립니다.
- 로딩 진행률은 `model/load-store.ts`에 모여 첫 화면 캔버스(Worker)와 보조기기용 `<progress>`가 함께 씁니다. 12초가 지나도 다 못 받으면 첫 화면을 열고 나머지는 계속 받습니다.
- 자세한 렌더링 원칙과 문제 해결은 [Canvas 렌더링 노트](canvas.md)에 있습니다.

### 시계 모델과 시퀀스 (`entities/watch`)

- 모델은 three.js 기본 도형과 `ExtrudeGeometry`·`LatheGeometry`로 만들고, 문자판·베젤·케이스백 인쇄는 Canvas 2D 흰 질감을 재질 색으로 물들입니다. 베젤 15분 호, 문자판 상징과 'AUTOMATIC · 500M' 문구, 초침, 날짜 숫자, 무브먼트 브리지의 빨강은 `ARC_COLOR`(`#8B0000`) 하나를 씁니다. 바탕이 같은 빨강인 크림슨 래커 문자판만 문구·상징·초침을 문자판의 밝은 인쇄색(`DIALS.crimson.ink`)으로 그립니다. 인쇄와 초침·날짜 원판은 조명에 밝아지지 않는 재질로 그려 화면에서도 그 색으로 보입니다.
- 시퀀스는 `pnpm sequence`가 개발 서버의 `/render/` 페이지에서 프레임마다 투명 PNG(1080px)를 받아 sharp로 줄여 저장합니다. 큰 프레임(`public/sequence/lg`, 960px)은 AVIF만, 작은 프레임(`sm`, 540px)은 AVIF와 WebP를 두고, AVIF를 못 읽는 브라우저는 작은 WebP를 씁니다. 192장 중 앞 128장은 2.8125°씩 한 바퀴, 뒤 64장은 3/4 각도로 돌며 분해됩니다. 모델을 바꾸면 다시 만듭니다. (실행 중에 `vite.config.ts`를 고치면 서버가 다시 시작되어 멈춥니다)

## 편집기 소개 (`pages/editor`)

0.1.0의 첫 화면을 `/editor/`로 옮겼습니다. 크림슨 호 3D 무대(R3F), 스크롤 구간(`model/chapters.ts`), 레이어·플립북·GIF 만들기·이미지 열기 데모, lil-gui 튜닝 패널(`?gui`)이 그대로 있습니다. '스튜디오에서 이어 그리기'는 파일을 IndexedDB에 잠시 맡기고 `/studio/?open=1`로 넘깁니다.

## 스튜디오 (`pages/studio`)

- 상태는 `model/studio-store.ts` 한 곳에 있고, 컴포넌트는 `useStudio(선택자)`로 필요한 값만 구독합니다.
- 작품은 불변 스냅숏이라 되돌리기는 이전 스냅숏을 다시 쓰는 것으로 끝납니다. (50단계, 바뀌지 않은 셀은 버퍼를 공유)
- 획을 긋는 동안에는 작업 버퍼에만 그리고, 손을 떼면 한 번만 저장소에 넣습니다.

## GIF 인코더·디코더 (`shared/lib/gif`)

외부 라이브러리 없이 메디안 컷 팔레트, 플로이드–스타인버그 디더링, 가변 길이 LZW를 구현했습니다. 디코더는 처리 방식 0~3, 투명색, 지역 색표, 인터레이스를 지원합니다. 인코딩은 Web Worker에서 돌고, 테스트는 독립 디코더 omggif와 서로 해독해 봅니다.

## 접근성 (WAI-ARIA 1.2 · KWCAG 2.2)

- 본문 바로가기, 주 메뉴 `nav > h2 + ul`, 바닥글 메뉴는 제목으로 이름을 구분합니다. 좁은 화면 메뉴와 디버그 패널은 `aria-expanded` 디스클로저입니다.
- **정지 기능(6.2.2)**: 헤더의 '움직임 멈춤'이 첫 화면 빛의 자동 떠돎, 구성기 시계의 흔들림과 초침을 멈춥니다. 운영체제의 '동작 줄이기'를 켜면 처음부터 멈추고 lenis를 끄며, 입자는 날아가지 않고 바로 자리를 잡습니다.
- **대체 텍스트(5.1.1)**: 첫 화면 캔버스와 큰 제목은 `aria-hidden`이고 같은 내용이 `h1`·본문에 있습니다. 시퀀스·입자·3D 무대는 감싼 요소에 지금 장면을 설명하는 `role="img"` 이름을 두고, 부품 설명과 단계는 목록으로 둡니다.
- **상태**: 로딩 중에는 `<progress>`로 진행률을, 구성기는 처음부터 있던 `role="status"`로 지금 조합을 알립니다. 지금 단계는 `aria-current="step"`과 왼쪽 선으로 함께 표시합니다.
- **키보드(6.1.1)**: 견본은 네이티브 라디오라 화살표로 고르고, 성능 비교 표는 이름 있는 `region`에 `tabIndex=0`을 줘 키보드로 가로 스크롤합니다.
- **명도 대비(5.4.3)**: 첫 화면 아래쪽 글자 뒤에는 어두운 그라데이션을 깔고, 빛이 본문까지 내려오지 않게 높이를 제한했습니다.

## 테스트와 품질

| 종류          | 위치                                   | 내용                                                                                                                                                                    |
| ------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 단위·컴포넌트 | `src/**/*.test.ts(x)`                  | 캔버스 맞춤·루프, 이미지 미리 받기, 입자 힘, 시퀀스 재생, 시계 모델·재질·조명(@react-three/test-renderer), GIF, 스튜디오 상태, 섹션·페이지 (jsdom)                      |
| 스토리        | `src/**/*.stories.tsx`                 | 섹션, 견본, 디버그 패널, 공용 UI (addon-a11y)                                                                                                                           |
| E2E           | `e2e/*.spec.ts`                        | 프로덕션 빌드에서 Chromium(데스크톱·Pixel 7)과 WebKit(데스크톱 Safari·iPhone 14): 화면 폭별 넘침, axe, 키보드, 시퀀스·입자·구성기·디버그 패널, 성능 비교, 편집·내보내기 |
| 성능 · 크기   | `lighthouserc.cjs`, `.size-limit.json` | 페이지 네 곳의 접근성·권장사항·SEO 점수와 레이아웃 이동, 첫 화면 JS·3D·Worker·CSS·시퀀스 용량 예산                                                                      |

CI(`.github/workflows/ci.yml`)는 서식 → ESLint → Steiger → 타입 → 단위 테스트 → 빌드(Storybook 포함) → 크기 → E2E → Lighthouse 순서로 돕니다. CI에는 GPU가 없어 소프트웨어 WebGL(SwiftShader)을 쓰므로 Lighthouse 성능 점수는 경고만 냅니다.

## Safari(WebKit)에서 다른 점

E2E를 WebKit으로도 돌려 찾은 차이와 대응입니다.

- macOS Safari는 기본 설정에서 Tab이 입력 칸만 오가고 링크는 Option+Tab으로 옮겨 갑니다. 키보드 E2E는 WebKit에서 Alt+Tab을 씁니다(`e2e/helpers.ts`의 `tabKey`).
- Safari는 마우스로 누른 버튼에 초점을 주지 않습니다. 대화상자는 열 때 `activeElement`가 `body`면 마지막으로 누른 대화형 요소로 초점을 돌려줍니다.
- 비공개 창(과 Playwright WebKit)은 IndexedDB에 Blob을 넣지 못합니다. 페이지 사이에 넘기는 파일은 바이트(ArrayBuffer)와 이름·형식만 저장합니다(`shared/lib/storage`).
- 텍스트 입력 칸의 기본 폭이 Chromium보다 넓어 그리드 칸을 밀어냅니다. 패널은 `minmax(0, 1fr)`과 `min-width: 0`으로 줄어들 수 있게 둡니다.

## 배포

`main`에 올라오면 `.github/workflows/pages.yml`이 `BASE_PATH=/TheCrimsonArc/`로 사이트와 Storybook을 함께 빌드해 GitHub Pages에 올립니다. 주소는 `import.meta.env.BASE_URL`을 기준으로 만들므로(`shared/config`의 `ROUTES`, `sequenceFrameUrl`) 하위 경로에서도 맞습니다.

- 사이트: https://ryushin01.github.io/TheCrimsonArc/
- 편집기 소개 · 스튜디오 · 성능 비교: `/editor/`, `/studio/`, `/bench/`
- Storybook: https://ryushin01.github.io/TheCrimsonArc/storybook/

같은 출처(`ryushin01.github.io`)를 다른 프로젝트와 함께 쓰므로, 브라우저 저장소 키는 `crimson-arc:`로 시작하고 IndexedDB 이름도 `crimson-arc`로 구분합니다.

## README 화면 다시 만들기

```bash
pnpm build:all
pnpm preview          # http://localhost:4173
pnpm screenshots      # 다른 터미널에서. docs/images/*.jpg, public/og.jpg, public/og-editor.jpg, public/apple-touch-icon.png
```

화면의 시계와 그림은 모두 코드로 만든 가상의 것이라 개인정보가 없습니다.
