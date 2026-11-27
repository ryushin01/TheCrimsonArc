import { defineConfig, devices } from '@playwright/test'
import base from './playwright.config'

/*
 * 화면 비교(시각 회귀): 주요 화면(데스크톱·모바일)과 Storybook 스토리를 기준 이미지와 비교합니다.
 * 글꼴 렌더링이 운영체제마다 달라 기준 이미지는 Linux용 Playwright 공식 Docker 이미지에서 만들고 비교합니다.
 * - CI: ci.yml의 visual 작업이 같은 이미지(mcr.microsoft.com/playwright)를 컨테이너로 씁니다.
 * - 로컬: pnpm test:visual (macOS 등은 Docker로 돌림, 기준 이미지 다시 만들기: pnpm test:visual --update-snapshots)
 * WebGL·캔버스는 가리고, 동작 줄이기·고정 시각·애니메이션 끄기로 움직임을 멈춥니다.
 */
const PORT = 4792

export default defineConfig({
  ...base,
  testIgnore: [],
  testMatch: ['**/visual.spec.ts'],
  workers: process.env.CI ? 2 : 1,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  snapshotPathTemplate:
    '{testDir}/__screenshots__/{testFilePath}/{projectName}/{arg}{ext}',
  expect: {
    ...base.expect,
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
      // 소프트웨어 렌더링의 안티에일리어싱 차이 정도는 허용합니다.
      maxDiffPixelRatio: 0.01,
    },
  },
  use: {
    ...base.use,
    baseURL: `http://localhost:${PORT}`,
    reducedMotion: 'reduce',
    colorScheme: 'light',
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
  },
  projects: [
    {
      name: 'visual-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
    { name: 'visual-mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `pnpm exec vite preview --port ${PORT} --strictPort`,
    port: PORT,
    reuseExistingServer: false,
    timeout: 60_000,
  },
})
