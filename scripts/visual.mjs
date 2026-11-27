/**
 * 화면 비교(시각 회귀) 실행기. 기준 이미지는 Linux용 Playwright 공식 Docker 이미지에서 만들었으므로
 * - Linux(CI의 컨테이너 작업 포함)에서는 바로 playwright test -c playwright.visual.config.ts를 돌리고,
 * - macOS·Windows에서는 같은 이미지를 Docker로 띄워 그 안에서 돌립니다(Docker가 켜져 있어야 함).
 * 먼저 pnpm build:all로 dist(사이트·Storybook)를 만들어 두어야 합니다. 뒤에 붙인 인자는 Playwright에 그대로 넘깁니다.
 *
 * 사용: pnpm test:visual [--update-snapshots] [-g 스튜디오]
 */
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const args = process.argv.slice(2)
const root = path.resolve(import.meta.dirname, '..')
const playwright = JSON.parse(
  readFileSync(
    path.join(root, 'node_modules/@playwright/test/package.json'),
    'utf8',
  ),
).version
const IMAGE = `mcr.microsoft.com/playwright:v${playwright}-noble`

function run(command, commandArgs) {
  const result = spawnSync(command, commandArgs, {
    stdio: 'inherit',
    cwd: root,
  })
  if (result.error) {
    console.error(result.error.message)
    process.exit(1)
  }
  process.exit(result.status ?? 1)
}

if (process.platform === 'linux') {
  run('pnpm', [
    'exec',
    'playwright',
    'test',
    '-c',
    'playwright.visual.config.ts',
    ...args,
  ])
} else {
  const docker = spawnSync('docker', ['info'], { stdio: 'ignore' })
  if (docker.status !== 0) {
    console.error(
      `화면 비교는 Linux 기준 이미지와 맞춰야 해서 Docker(${IMAGE})로 돌립니다. Docker를 켠 뒤 다시 실행하세요.`,
    )
    process.exit(1)
  }
  // 이 컴퓨터의 node_modules(다른 운영체제용 바이너리)를 가리도록 컨테이너 전용 볼륨을 씁니다.
  const inner = [
    'corepack enable',
    'pnpm install --frozen-lockfile',
    `pnpm exec playwright test -c playwright.visual.config.ts ${args.map((a) => JSON.stringify(a)).join(' ')}`,
  ].join(' && ')
  run('docker', [
    'run',
    '--rm',
    '--ipc=host',
    '-e',
    'CI=1',
    '-v',
    `${root}:/work`,
    '-v',
    'crimson-arc-visual-node-modules:/work/node_modules',
    '-v',
    'crimson-arc-visual-pnpm-store:/root/.local/share/pnpm',
    '-w',
    '/work',
    IMAGE,
    'bash',
    '-lc',
    inner,
  ])
}
