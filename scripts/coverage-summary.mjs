/**
 * Vitest 커버리지 요약(coverage/coverage-summary.json)을 Markdown 표로 만듭니다.
 * GitHub Actions에서는 $GITHUB_STEP_SUMMARY에 덧붙여 실행 요약 화면에 보이고, 로컬에서는 화면에 찍습니다.
 * 전체와 로직 계층(shared/lib, model, api)을 나눠 보여 줍니다. 기준은 vitest.config.ts의 thresholds입니다.
 *
 * 사용: pnpm test:coverage && node scripts/coverage-summary.mjs
 */
import { appendFile, readFile } from 'node:fs/promises'
import path from 'node:path'

const METRICS = ['statements', 'branches', 'functions', 'lines']
const GROUPS = [
  ['`src/shared/lib`', /\/src\/shared\/lib\//],
  ['`src/*/*/model`', /\/src\/[^/]+\/[^/]+\/model\//],
  ['`src/*/*/api`', /\/src\/[^/]+\/[^/]+\/api\//],
]

const summary = JSON.parse(
  await readFile(path.resolve('coverage/coverage-summary.json'), 'utf8'),
)

/** 파일들의 covered/total을 더해 계층 하나의 비율을 냅니다. 파일이 없으면 null */
function aggregate(pattern) {
  const files = Object.entries(summary).filter(
    ([file]) => file !== 'total' && pattern.test(file),
  )
  if (files.length === 0) return null
  return Object.fromEntries(
    METRICS.map((metric) => {
      const covered = files.reduce((sum, [, v]) => sum + v[metric].covered, 0)
      const total = files.reduce((sum, [, v]) => sum + v[metric].total, 0)
      return [metric, total ? (covered / total) * 100 : 100]
    }),
  )
}

const row = (name, values) =>
  `| ${name} | ${METRICS.map((m) => `${values[m].toFixed(2)}%`).join(' | ')} |`

const total = Object.fromEntries(
  METRICS.map((metric) => [metric, summary.total[metric].pct]),
)
const lines = [
  '### 커버리지',
  '',
  '| 범위 | 문장 | 분기 | 함수 | 줄 |',
  '| --- | ---: | ---: | ---: | ---: |',
  row('전체', total),
  ...GROUPS.map(([name, pattern]) => {
    const values = aggregate(pattern)
    return values ? row(name, values) : `| ${name} | - | - | - | - |`
  }),
  '',
  '로직 계층은 80%, 전체는 `vitest.config.ts`의 기준선 아래로 내려가면 실패합니다.',
  '',
]
const markdown = lines.join('\n')

if (process.env.GITHUB_STEP_SUMMARY) {
  await appendFile(process.env.GITHUB_STEP_SUMMARY, `${markdown}\n`)
}
console.log(markdown)
