import { defineConfig, devices } from '@playwright/test'

// 다른 프로젝트의 미리보기 서버와 겹치지 않는 포트를 씁니다.
const PORT = 4791

export default defineConfig({
  testDir: './e2e',
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
    launchOptions: {
      // CI에는 GPU가 없으므로 소프트웨어 WebGL을 씁니다.
      args: [
        '--use-angle=swiftshader',
        '--enable-unsafe-swiftshader',
        '--ignore-gpu-blocklist',
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
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    // Safari(WebKit): 초점 이동, 비공개 세션의 IndexedDB, 입력 칸 기본 폭처럼 Safari에서만 나는 문제를 잡습니다.
    // 위의 SwiftShader 실행 옵션은 Chromium 전용이라 비웁니다.
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1440, height: 900 },
        launchOptions: {},
      },
    },
    {
      name: 'webkit-mobile',
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
