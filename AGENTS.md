# AGENTS.md — The Crimson Arc (TheCrimsonArc)

AI 코딩 에이전트(Codex, Claude Code 등)가 이 저장소에서 일할 때 지킬 규칙입니다. 자세한 내용은 `docs/development.md`, `docs/canvas.md`, `README.md`에 있습니다.

## 1. 프로젝트 개요

- 가상의 기계식 파일럿 워치 The Crimson Arc A-01을 소개하는 스크롤·마우스 반응형 브랜드 쇼케이스입니다. 조디악 다이얼 인트로, 360도 회전·분해 이미지 시퀀스, 입자, 3D 구성기를 HTML5 Canvas·three.js로 그렸습니다. 판매하지 않는 개인 프로젝트입니다.
- 화면 축 1개: 쇼케이스 사이트(웹). `/editor/`(편집기 소개), `/studio/`(픽셀 애니메이션 스튜디오, 같은 사이트의 실험실), `/bench/`(성능 비교)는 같은 사이트의 페이지입니다.
- 운영: https://ryushin01.github.io/TheCrimsonArc/ · Storybook https://ryushin01.github.io/TheCrimsonArc/storybook/ · `?debug`를 붙이면 lil-gui 디버그 패널이 열립니다.

## 2. 기술 스택과 구조

- React 19, TypeScript 6, Vite 8 다중 페이지(라우터 라이브러리 없음, 진입점 `src/app/entries/*.tsx`), Canvas 2D·OffscreenCanvas + Web Worker, React Three Fiber 9·drei·three.js, lenis, lil-gui, CSS Modules + CSS 변수 토큰, Storybook 10.
- **FSD v2.1.** 층 순서(위→아래): `app` → `pages` → `widgets` → `features` → `entities` → `shared`.
  - `pages`: 한 페이지에서만 쓰는 코드(home, editor, studio, bench, not-found, render). `render`는 시퀀스 생성용이라 배포에 없습니다.
  - `widgets`: 머리글·바닥글. `features`: `export-artwork`, `import-image`. `entities`: `watch`, `artwork`. `shared`: `lib`·`ui`·`config`.
  - `pnpm lint:fsd`(Steiger)가 층 규칙, 공개 API(`index.ts`), 슬라이스 간 import를 검사합니다.
- `package.json`의 `sideEffects`에는 CSS와 `src/app`만 둡니다(쓰지 않는 3D 모델이 번들에서 빠지도록).
- 주소는 `import.meta.env.BASE_URL` 기준으로 만듭니다(`shared/config`의 `ROUTES`, `sequenceFrameUrl`). 하위 경로 배포에서도 맞아야 합니다.

## 3. 설치·개발 명령

- Node.js 26(`.nvmrc`, `engines`), pnpm 12(`packageManager`).

```bash
nvm use
corepack enable pnpm
pnpm install
pnpm dev   # http://localhost:5173 (/editor/, /studio/, /bench/)
```

- 환경 변수(이름만): `BASE_PATH`(하위 경로 빌드, 배포는 `/TheCrimsonArc/`).
- 자료 명령: `pnpm sequence`(시계 이미지 시퀀스 192장), `pnpm lineup`(인트로 다이얼 열두 조합), `pnpm screenshots`(`build:all` 뒤 `pnpm preview`를 띄우고 다른 터미널에서, README 화면·공유 이미지).

## 4. 검사·테스트 명령

| 명령                                | 내용                                                                      |
| ----------------------------------- | ------------------------------------------------------------------------- |
| `pnpm format:check` / `pnpm format` | Prettier 검사 / 정리(Markdown 포함)                                       |
| `pnpm lint`                         | ESLint(jsx-a11y strict)                                                   |
| `pnpm lint:fsd`                     | Steiger(FSD)                                                              |
| `pnpm typecheck`                    | 타입 검사                                                                 |
| `pnpm test`                         | 단위·컴포넌트(jsdom, React Three Test Renderer)                           |
| `pnpm build` / `pnpm build:all`     | 사이트 빌드 / Storybook(`dist/storybook`) 포함                            |
| `pnpm size`                         | 첫 화면 JS·3D·Worker·CSS·시퀀스 용량 예산(`.size-limit.json`)             |
| `pnpm test:e2e`                     | 프로덕션 빌드 E2E, Chromium(데스크톱·Pixel 7) + WebKit(Safari·iPhone 14)  |
| `pnpm lhci`                         | 접근성·권장사항·SEO·레이아웃 이동은 실패, 성능은 경고(`lighthouserc.cjs`) |

- CI(`.github/workflows/ci.yml`, PR·main 푸시) 순서: `format:check` → `lint` → `lint:fsd` → `typecheck` → `test` → `build:all` → `size` → Chromium·WebKit 설치 → `test:e2e` → `lhci`.
- 커밋 훅(husky 등)은 없으므로 PR 전에 위 검사를 직접 돌립니다. WebKit 키보드 E2E는 Alt+Tab(`e2e/helpers.ts`의 `tabKey`)을 씁니다.
- **테스트 원칙: Testing Library.** 구현 세부가 아니라 사용자가 보는 동작을 검사하고, 요소는 역할·이름(`getByRole`)으로 찾습니다. 도구: 단위·컴포넌트는 Vitest + Testing Library(`@testing-library/react`·`user-event`), 3D는 `@react-three/test-renderer`, 화면 흐름은 Playwright E2E(Chromium·WebKit), 접근성은 axe(`@axe-core/playwright`, Storybook addon-a11y). 스토리는 addon-a11y로 보지만 CI에서 스토리 테스트를 따로 돌리지는 않습니다.

## 5. 코드 스타일

- Prettier: 세미콜론 없음, 작은따옴표, 끝 쉼표 `all`. Markdown도 Prettier 검사 대상입니다(표 정렬 포함).
- 선택 모양은 `:has(input:checked)` 대신 `data-checked`로 그립니다(Chromium 재그리기 문제). Safari 차이(`docs/development.md`의 'Safari(WebKit)에서 다른 점')를 지킵니다. IndexedDB에는 Blob 대신 ArrayBuffer를 저장합니다.
- 캔버스 렌더링 원칙(DPR, OffscreenCanvas, `cancelAnimationFrame`)은 `docs/canvas.md`를 따릅니다.
- 버그를 고치면 고치기 전에 실패하는 테스트를 함께 넣습니다.
- 접근성(WAI-ARIA 1.2 · KWCAG 2.2): 네이티브 요소 우선(인트로는 `<dialog>`의 `showModal()`, 견본은 네이티브 라디오), 텍스트 대비 4.5:1 이상(첫 화면 글자 뒤 어두운 그라데이션), 모든 기능 키보드(좁은 화면 메뉴는 버튼 바로 뒤, Esc로 닫으면 버튼으로 초점), 초점 표시 유지(`outline: none` 단독 금지), 조작 크기 24px 이상, 입력 레이블과 오류 연결, 바뀌는 안내는 `role="status"`, 진행률은 `<progress>`, 캔버스·3D는 `role="img"` 이름이나 `aria-hidden` + 같은 내용의 본문, '움직임 멈춤'과 운영체제 동작 줄이기를 따름.
- **타입: TypeScript strict.** `tsconfig.json`에서 `strict`를 켭니다. `any`·`as` 단언·`@ts-ignore`는 피하고, 외부 입력(조합 공유 주소, 가져온 이미지, 저장값)은 검사합니다.
- **서식:** Prettier(`prettier.config.js`)를 그대로 따릅니다(Biome 없음).
- **접근성 기준: WCAG 2.2·KWCAG 2.2**(WAI-ARIA 1.2 패턴). 자동 검사는 eslint-plugin-jsx-a11y(strict)와 axe(Playwright E2E, Storybook addon-a11y), Lighthouse 접근성 점수입니다.

## 6. Git·PR

- **흐름: GitHub Flow.** `main`에 직접 커밋·푸시하지 않습니다. 최신 `main`에서 브랜치를 만들어 PR로만 병합합니다. PR은 목적 하나로 작게, 본문에 무엇·왜·검사 결과를 적습니다.
- **브랜치 이름:** `feat/…`, `fix/…`, `refactor/…`, `docs/…`, `test/…`, `chore/…`, `release/…`(예: `feat/zodiac-intro`, `fix/review-1.1.2`). 이 저장소는 성능 개선에 `perf/…`도 씁니다.
- **커밋 메시지: Conventional Commits.** `<타입>: <한국어 요약>`, 타입은 `feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `style`, `chore`, `ci`, `build`. 버전을 올린 커밋·PR 제목은 끝에 `(x.y.z)`. 호환이 깨지면 본문에 `BREAKING CHANGE:`. 실제 예: `feat: 조디악 다이얼 인트로와 애쉬 코어 무브먼트 (1.1.0)`, `perf: 멈춘 구성기 3D는 바뀔 때만 그리기, 캔버스 루프 공통화, 내보내기 도중 닫기 (0.5.3)`.
- **기여자는 ryushin01만 남깁니다(2026-11-21 사용자 결정).** 커밋 작성자는 늘 `ryushin0 <141554987+ryushin01@users.noreply.github.com>`입니다. 이 저장소는 백엔드 코드가 없으므로 `Co-Authored-By` 줄을 넣지 않습니다(백엔드 저장소만 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`). PR 본문 끝에는 `🤖 Generated with [Claude Code](https://claude.com/claude-code)`를 적습니다.
  - GitHub Actions가 커밋하는 워크플로는 작성자를 ryushin01로 설정합니다(`github-actions[bot]` 금지)(지금은 커밋하는 워크플로 없음).
  - Dependabot PR은 그대로 병합하지 않고, 같은 변경을 ryushin01 커밋으로 다시 만들어 PR로 병합합니다.
- **버전: Semantic Versioning.** 호환이 깨지면 주, 기능 추가는 부, 버그 수정·작은 개선은 수. `package.json`의 `version`, README 버전 배지(`version-x.y.z`), `CHANGELOG.md`를 한 번에 맞춥니다. 문서만 바뀐 PR은 보통 버전을 올리지 않습니다.
- **변경 기록: Keep a Changelog.** `CHANGELOG.md`에 최신 버전을 위에 적습니다. 표준과 다른 점: 제목이 `## x.y.z (YYYY-MM-DD)`(표준은 `## x.y.z - YYYY-MM-DD`)이고, 추가·변경·수정·제거 소제목 대신 요약과 목록으로 적으며, `[Unreleased]` 절은 쓰지 않습니다. 기존 형식을 따릅니다.
- 병합은 squash(제목 끝 `(#번호)`). **CI가 통과하면 바로 병합**하고 CodeRabbit 리뷰는 기다리지 않습니다(이미 달린 맞는 지적은 반영). 리뷰 없이 병합한 변경은 필요하면 자체 코드 리뷰로 다시 점검합니다(1.1.3 선례).
- 공개 저장소라 Actions가 돕니다. Actions가 막히면 CI와 같은 검사를 로컬에서 돌려 대신합니다.

## 7. 배포·릴리스

- GitHub Pages(`.github/workflows/pages.yml`). **main 푸시마다 배포**(문서만 바뀌어도)하며 `BASE_PATH=/TheCrimsonArc/ pnpm build:all` 결과(`dist`)를 올립니다. Actions에서 **Run workflow**로 수동 배포.
- 데모 모드·비밀값은 없습니다. 시계와 그림은 모두 코드로 만든 가상의 것입니다.
- 배포 뒤 사이트·`/editor/`·`/studio/`·`/bench/`·Storybook 주소가 200인지 확인합니다.
- 릴리스: 병합 뒤 태그 `vX.Y.Z`, 제목 `vX.Y.Z — 요약`, 대상은 병합 커밋 전체 SHA, 본문은 CHANGELOG의 해당 절. 그 뒤 백업 `bash ~/Documents/Archive/Backup/backup.sh`.
- 보관함 계획 문서: `~/Documents/Obsidian Vault/TheCrimsonArc v1.0.0 고도화 계획.md`. 진행 기록을 날짜와 함께 남깁니다.
- 소개가 크게 바뀌면 프로필 저장소 `ryushin01/ryushin01` README 프로젝트 표(내용·기술·실행 칸)를 고칩니다. 버전 숫자는 Actions가 자동으로 고칩니다.

## 8. 보안·주의사항

- 비밀값·`.env`를 커밋하지 않습니다. 유료 API 키를 쓰지 않습니다. 워크플로의 `persist-credentials: false`를 유지합니다.
- `ryushin01.github.io`를 다른 프로젝트와 함께 쓰므로 브라우저 저장소 키는 `crimson-arc:`로 시작하고 IndexedDB 이름은 `crimson-arc`입니다.
- 실제 시계 브랜드의 로고·이름을 쓰지 않습니다(디자인은 파일럿 워치 관례를 참고해 직접 만듦).
- 에스코어드림은 수정할 수 없는 글꼴이라 받은 파일(`public/fonts/s-core-dream`)을 그대로 씁니다(서브셋·변환 금지). 자료·라이브러리를 새로 넣으면 README 출처 표에 저작자·라이선스·원본을 적습니다.

## 9. 공통 규칙

공통 규칙은 `~/Documents/GitHub/CLAUDE.md`에 있습니다(이 파일과 충돌하면 이 파일이 우선). 핵심:

- 답변·커밋·PR·문서·코드 주석은 한국어로 씁니다.
- 묻지 않고 끝까지 진행하고 결과를 한 번에 보고합니다. 비용이 드는 일, 새 비밀값, 디자인 결정, 되돌릴 수 없는 공개 행동은 하지 않고 보고합니다.
- 사용자의 진행 중인 작업(커밋하지 않은 변경, 원격에 없는 브랜치)을 건드리지 말고 `git worktree add /tmp/<이름> -b <브랜치> origin/main`에서 작업한 뒤 worktree를 지웁니다.
- 다른 세션에 공지할 때는 Paseo ryushin01 그룹 세션에만 보냅니다.
