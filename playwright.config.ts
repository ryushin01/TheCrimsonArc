import { defineConfig, devices } from '@playwright/test'

// 다른 프로젝트의 미리보기 서버와 겹치지 않는 포트를 씁니다.
const PORT = 4791

/**
 * Chromium 데스크톱에서만 의미 있는 검사(스토리 접근성, 성능)와 Chromium에서만 도는 검사(상태 접근성)는
 * 다른 프로젝트에서 아예 빼 둡니다. 건너뛴 테스트도 샤드 나누기에 세어지므로 빼야 샤드가 고르게 나뉩니다.
 */
const DESKTOP_CHROMIUM_ONLY = ['**/storybook.spec.ts', '**/perf.spec.ts']
const CHROMIUM_ONLY = ['**/a11y.spec.ts']

export default defineConfig({
  testDir: './e2e',
  // 화면 비교(visual.spec.ts)는 기준 이미지를 만든 Linux 컨테이너에서만 돌립니다(playwright.visual.config.ts).
  testIgnore: ['**/visual.spec.ts'],
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  // 소프트웨어 WebGL과 WebKit을 함께 돌리면 CPU가 포화되어 시간 초과가 나므로 로컬은 4개까지만 동시에 돌립니다.
  workers: process.env.CI ? undefined : 4,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    // 서비스 워커가 요청을 맡으면 page.route로 가로챌 수 없으므로 기본은 막고, 서비스 워커 검사(offline.spec.ts)에서만 켭니다.
    serviceWorkers: 'block',
    launchOptions: {
      // CI에는 GPU가 없으므로 소프트웨어 WebGL(SwiftShader)을 씁니다.
      // --ignore-gpu-blocklist가 SwiftShader를 진짜 GPU처럼 다뤄 2D 캔버스(첫 화면 시퀀스·입자)와 페이지 래스터까지
      // 같은 소프트웨어 GPU로 보내면, 새 WebGL 컨텍스트의 첫 셰이더 연결이 그 일 뒤에서 2~30초 기다려 메인 스레드가 멈춥니다.
      // GPU가 없는 실제 기기처럼 2D 캔버스와 래스터는 CPU로 그리고, 소프트웨어 GPU에는 WebGL만 맡깁니다.
      args: [
        '--use-angle=swiftshader',
        '--enable-unsafe-swiftshader',
        '--ignore-gpu-blocklist',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu-rasterization',
      ],
    },
  },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'mobile',
      testIgnore: ['**/visual.spec.ts', ...DESKTOP_CHROMIUM_ONLY],
      use: { ...devices['Pixel 7'] },
    },
    // Safari(WebKit): 초점 이동, 비공개 세션의 IndexedDB, 입력 칸 기본 폭처럼 Safari에서만 나는 문제를 잡습니다.
    // 위의 SwiftShader 실행 옵션은 Chromium 전용이라 비웁니다.
    {
      name: 'webkit',
      testIgnore: [
        '**/visual.spec.ts',
        ...DESKTOP_CHROMIUM_ONLY,
        ...CHROMIUM_ONLY,
      ],
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1440, height: 900 },
        launchOptions: {},
      },
    },
    {
      name: 'webkit-mobile',
      testIgnore: [
        '**/visual.spec.ts',
        ...DESKTOP_CHROMIUM_ONLY,
        ...CHROMIUM_ONLY,
      ],
      use: { ...devices['iPhone 14'], launchOptions: {} },
    },
  ],
  // 프로덕션 빌드 결과를 띄워 검사합니다. (먼저 pnpm build 필요)
  webServer: {
    command: `pnpm exec vite preview --port ${PORT} --strictPort`,
    port: PORT,
    reuseExistingServer: false,
    timeout: 60_000,
  },
})
