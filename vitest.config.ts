import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

/** 로직 계층의 커버리지 기준 */
const LOGIC_THRESHOLD = {
  statements: 80,
  branches: 80,
  functions: 80,
  lines: 80,
}

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.stories.{ts,tsx}',
        'src/**/index.ts',
        'src/**/*.d.ts',
      ],
      reporter: ['text-summary', 'json-summary', 'html'],
      // 전체는 지금 값(1.1.7) 아래로 내려가지 않게, 로직 계층(shared/lib·model·api)은 80%를 지킵니다.
      // 값을 올릴 때는 늘어난 만큼 함께 올립니다(pnpm test:coverage 결과 기준).
      thresholds: {
        statements: 66,
        branches: 61,
        functions: 69,
        lines: 67,
        'src/shared/lib/**': LOGIC_THRESHOLD,
        'src/*/*/model/**': LOGIC_THRESHOLD,
        'src/*/*/api/**': LOGIC_THRESHOLD,
      },
    },
  },
})
