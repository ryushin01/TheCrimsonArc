# 개발 가이드

## 페이지와 진입점

Vite 다중 페이지로 HTML 세 개를 내보냅니다. 라우터 라이브러리는 쓰지 않습니다.

| 주소       | HTML                | 진입점                          | 페이지                     |
| ---------- | ------------------- | ------------------------------- | -------------------------- |
| `/`        | `index.html`        | `src/app/entries/home.tsx`      | `pages/home` 홍보 쇼케이스 |
| `/studio/` | `studio/index.html` | `src/app/entries/studio.tsx`    | `pages/studio` 편집기      |
| 없는 주소  | `404.html`          | `src/app/entries/not-found.tsx` | `pages/not-found`          |

Vercel은 없는 주소에 `404.html`을 돌려주므로 따로 rewrite를 두지 않습니다.

## 구조 (Feature-Sliced Design v2.1)

- **app**: 진입점(`entries`), 전역 스타일(`styles`: 글꼴, 토큰, 기본값). `ui` 세그먼트는 두지 않습니다.
- **pages**: 한 페이지에서만 쓰는 코드는 페이지 안에 둡니다. 홍보 페이지의 섹션·3D 무대·효과와 스튜디오의 편집기 UI·상태가 여기에 있습니다.
- **widgets**: 세 페이지가 함께 쓰는 헤더와 푸터
- **features**: 홍보 페이지 데모와 스튜디오가 함께 쓰는 내보내기(`export-artwork`)와 가져오기(`import-image`)
- **entities**: 작품 모델 `artwork` (레이어·프레임·셀, 합성, 합성 캐시, 샘플 작품, `PixelCanvas`)
- **shared**: `lib`(gif, pixel, math, scroll, motion, pointer, viewport, frame-loop, download, storage, classnames), `ui`, `config`

`pnpm lint:fsd`(Steiger)로 계층 규칙, 공개 API(`index.ts`), 슬라이스 간 import, 한 곳에서만 쓰는 슬라이스를 검사합니다. 슬라이스 안은 상대 경로, 슬라이스 사이는 `@/` 별칭으로 가져옵니다.

## 홍보 페이지의 움직임

### 스크롤과 구간

- `shared/lib/scroll`의 `useSmoothScroll`이 lenis를 켜고 위치·속도를 `scrollStore`에 모읍니다. '동작 줄이기'에서는 lenis를 끄고 기본 스크롤 위치만 모읍니다.
- `pages/home/model/chapters.ts`가 섹션 위치를 크기가 바뀔 때만 재고, 매 프레임에는 스크롤 값으로 진행도만 계산합니다. (레이아웃을 매 프레임 읽지 않음)
  - `leaving`: 첫 화면이 화면 위로 빠져나가는 정도
  - `pinned`: `position: sticky`로 고정된 동안의 정도 (소개, 넓은 화면의 프레임 데모)
  - `through`: 섹션이 화면 아래에 들어와 위로 나갈 때까지 (작동 원리, 좁은 화면의 플립북)
- 같은 페이지 `#아이디` 링크는 `useHashLinks`가 받아 부드럽게 이동하고 키보드 초점도 옮깁니다.

### lerp

`shared/lib/math`의 `damp(현재, 목표, λ, dt)`는 `lerp(a, b, 1 - e^(-λ·dt))`로, 프레임 속도와 상관없이 같은 빠르기로 목표를 따라갑니다. 마우스 위치(`pointerStore`)는 목표값만 모으고, 3D 기울기·첫 화면 빛·커서 링·레이어 데모 기울기가 각자 damp로 따라갑니다.

### 3D 무대 (`pages/home/ui/stage`)

- `React.lazy`로 첫 화면 글자가 그려진 뒤(`requestIdleCallback`) 받습니다. 실패하면 `ErrorBoundary`가 무대 없이 페이지를 보여 줍니다.
- 크림슨 호는 위쪽 반원 띠(`ExtrudeGeometry`) 다섯 장입니다. 흠집 질감은 Canvas 2D로 그린 `CanvasTexture`를 거칠기·요철 맵으로 씁니다.
- 첫 화면 → 소개: 가운데로 오며 조각이 펼쳐지고 drei `Grid`의 `fadeDistance`를 키워 격자를 드러냅니다. 앞쪽 조각 네 장의 테두리 점을 화면 좌표로 투영해 `anchorStore`에 넣으면, 소개 섹션이 SVG 지시선을 그립니다.
- 작동 원리: 호가 위로 떠오르며 멀어지고 빛줄기가 나타납니다. 섹션을 지나면 `frameloop="never"`로 렌더를 멈춥니다.
- drei `PerformanceMonitor`가 프레임이 떨어지면 해상도(DPR)를 낮춥니다.

### lil-gui 튜닝 패널

오른쪽 아래 **튜닝** 버튼(또는 주소의 `?gui`)으로 엽니다. 처음 열 때만 lil-gui를 불러오고, 값은 `pages/home/model/tuning.ts`의 저장소를 거쳐 3D 무대와 그레인·빛에 바로 반영됩니다. 디버그용이라 600px 미만에서는 숨깁니다.

## 스튜디오

- 상태는 `pages/studio/model/studio-store.ts` 한 곳에 있고, 컴포넌트는 `useStudio(선택자)`로 필요한 값만 구독합니다.
- 작품(`Artwork`)은 불변 스냅숏입니다. 셀(레이어 한 장의 프레임 한 장)은 바뀔 때마다 새 버퍼로 바꿔 끼우므로, 되돌리기는 이전 스냅숏을 다시 쓰는 것으로 끝납니다. (50단계, 바뀌지 않은 셀은 버퍼를 공유)
- 슬라이더 끌기·이름 입력·FPS 변경처럼 이어지는 조작은 `coalesce` 키로 되돌리기 한 번에 묶습니다.
- 획을 긋는 동안에는 작업 버퍼에만 그리고 캔버스를 직접 다시 그린 뒤, 손을 떼면 한 번만 저장소에 넣습니다.
- 프레임 미리보기는 셀 버퍼와 레이어 설정이 같으면 합성 결과를 재사용합니다. (`entities/artwork/model/composite-cache.ts`)
- 홍보 페이지의 '스튜디오에서 이어 그리기'는 파일을 IndexedDB에 잠시 맡기고 `/studio/?open=1`로 이동해 넘깁니다.

## GIF 인코더·디코더 (`shared/lib/gif`)

외부 라이브러리 없이 구현했습니다.

1. **팔레트**: 모든 프레임의 불투명한 색이 한도 이하면 그대로, 넘으면 5비트 히스토그램에서 메디안 컷(처음 절반은 많이 쓰인 상자부터, 나머지는 넓고 많이 쓰인 상자부터)으로 줄입니다. 투명한 곳이 있으면 투명색 한 칸을 비워 둡니다.
2. **색 번호 바꾸기**: 가까운 색(가중 RGB 거리)을 찾아 기억해 두고, 원하면 플로이드–스타인버그로 오차를 퍼뜨립니다.
3. **LZW**: 가변 길이 코드, 사전이 4096개로 차면 지우기 코드. 투명한 GIF는 처리 방식 2(배경으로 지움)로 씁니다.
4. **디코더**: 처리 방식 0~3, 투명색, 지역 색표, 인터레이스를 지원하고 프레임마다 합성 결과를 넘깁니다. 큰 GIF는 프레임을 풀 때마다 바로 줄여 메모리를 아낍니다.

인코딩은 `features/export-artwork`가 Web Worker에서 돌립니다. 테스트는 LZW 왕복(사전 초기화 경계 포함), 독립 디코더 omggif로 우리 출력 해독, omggif가 만든 부분 프레임·처리 방식 GIF를 우리 디코더로 해독, 널리 알려진 10×10 예제 GIF 해독으로 검증합니다.

## 접근성 (WAI-ARIA 1.2 · KWCAG 2.2)

- 본문 바로가기, 주 메뉴 `nav > h2 + ul`, 바닥글 메뉴는 제목으로 이름을 구분합니다. 좁은 화면 메뉴는 `aria-expanded` 디스클로저이고 Esc로 닫힙니다.
- **정지 기능(6.2.2)**: 헤더의 '움직임 멈춤'이 3D 흔들림·반짝이·빛줄기·흐르는 글자·CSS 애니메이션을 멈춥니다. 운영체제의 '동작 줄이기'를 켜면 처음부터 멈추고 lenis·커서 링을 끕니다. 버튼 글자가 바뀌므로 `aria-pressed`는 쓰지 않습니다.
- **키보드(6.1.1)**: 그리기 면은 `role="application"`으로 화살표·Space·Enter를 받습니다. 한 글자 도구 단축키는 캔버스에 초점이 있을 때만 동작합니다(6.1.4). 끌어다 놓기에는 같은 일을 하는 버튼이 있습니다(6.5.1).
- **상태 메시지**: 결과는 처음부터 있던 `role="status"`, 파일 오류는 `role="alert"`에 내용만 바꿔 알립니다. 같은 문장이 이어져도 읽히도록 보이지 않는 글자를 번갈아 붙입니다.
- **대화상자**: 네이티브 `<dialog>`와 `showModal()`, 첫 입력 칸으로 초점, 닫으면 연 버튼으로 복귀
- **입력 오류(7.3.1)**: 잘못된 값일 때만 `aria-invalid`, 오류 문구는 `aria-describedby`와 `aria-errormessage`로 함께 연결하고 원인과 방법을 씁니다.
- **명도 대비(5.4.3)**: 토큰 조합을 모두 4.5:1 이상으로 맞췄고(`src/app/styles/tokens.css`), 그라데이션 위 본문에는 종이색 판을 깔았습니다.
- 3D 캔버스와 장식 글자는 `aria-hidden`이고, 데모 캔버스는 지금 상태를 설명하는 `role="img"` 이름을 가집니다.

## 테스트와 품질

| 종류          | 위치                                   | 내용                                                                                                                                                                 |
| ------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 단위·컴포넌트 | `src/**/*.test.ts(x)`                  | GIF·LZW·팔레트, 픽셀 연산, 작품 모델, 스튜디오 상태, 컴포넌트 (jsdom)                                                                                                |
| 스토리        | `src/**/*.stories.tsx`                 | 공용 UI, 위젯, 기능 패널 (addon-a11y)                                                                                                                                |
| E2E           | `e2e/*.spec.ts`                        | 프로덕션 빌드에서 데스크톱·모바일(Pixel 7) 두 가지: 화면 폭별 넘침, axe(WCAG 2.2 AA), 키보드, 그리기·되돌리기, 열기·내보내기·내려받기, 홍보 페이지 → 스튜디오 넘기기 |
| 성능 · 크기   | `lighthouserc.cjs`, `.size-limit.json` | 접근성·권장사항·SEO 점수와 레이아웃 이동 기준, 첫 화면 JS·3D 조각·CSS 예산                                                                                           |

CI(`.github/workflows/ci.yml`)는 서식 → ESLint → Steiger → 타입 → 단위 테스트 → 빌드(Storybook 포함) → 크기 → E2E → Lighthouse 순서로 돕니다. CI에는 GPU가 없어 소프트웨어 WebGL(SwiftShader)을 쓰므로 Lighthouse 성능 점수는 경고만 냅니다.

## 배포

`main`에 올라오면 `.github/workflows/pages.yml`이 `BASE_PATH=/TheCrimsonArc/`로 사이트와 Storybook을 함께 빌드해 GitHub Pages에 올립니다. 주소는 `import.meta.env.BASE_URL`을 기준으로 만들므로(`shared/config`의 `ROUTES`), 하위 경로에서도 페이지 사이 링크와 리소스가 맞습니다. 없는 주소는 `404.html`이 받습니다.

- 사이트: https://ryushin01.github.io/TheCrimsonArc/
- 스튜디오: https://ryushin01.github.io/TheCrimsonArc/studio/
- Storybook: https://ryushin01.github.io/TheCrimsonArc/storybook/

같은 출처(`ryushin01.github.io`)를 다른 프로젝트와 함께 쓰므로, 브라우저 저장소 키는 `crimson-arc:`로 시작하고 IndexedDB 이름도 `crimson-arc`로 구분합니다.

## README 화면 다시 만들기

```bash
pnpm build:all
pnpm preview          # http://localhost:4173
pnpm screenshots      # 다른 터미널에서. docs/images/*.jpg, public/og.jpg, public/apple-touch-icon.png
```

화면의 그림은 모두 코드로 만든 샘플이라 개인정보가 없습니다.
