// README 화면(docs/images/*.jpg)과 공유 이미지(public/og.jpg, og-editor.jpg), 홈 화면 아이콘을 만듭니다.
// 먼저 프로덕션 빌드를 띄워 두세요: pnpm build:all && pnpm preview
// 사용: BASE_URL=http://localhost:4173 pnpm screenshots
import { readFileSync } from 'node:fs'
import { chromium } from '@playwright/test'

const BASE = process.env.BASE_URL ?? 'http://localhost:4173'
const browser = await chromium.launch({
  args: [
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
  ],
})

async function open(path, viewport, options = {}) {
  const { route, ...contextOptions } = options
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    ...contextOptions,
  })
  const page = await context.newPage()
  // 자동 연출을 멈추지 않은 상태로 찍습니다.
  await page.addInitScript(() =>
    localStorage.setItem('crimson-arc:motion', 'playing'),
  )
  if (route) await route(page)
  await page.goto(`${BASE}${path}`, {
    waitUntil: route ? 'domcontentloaded' : 'networkidle',
  })
  return { page, context }
}

async function shot(page, file) {
  await page.screenshot({ path: file, type: 'jpeg', quality: 82 })
  console.log('저장', file)
}

/** 첫 화면 자료(핵심 프레임·글꼴)를 다 받고 제목이 나타날 때까지 */
async function waitForHome(page) {
  await page
    .getByRole('progressbar', { name: '제품 이미지 불러오기' })
    .waitFor({ state: 'detached', timeout: 30_000 })
  await page.waitForTimeout(2200)
}

/** 섹션 진행도(0~1)에 맞춰 스크롤합니다. pinned면 고정 구간 기준 */
async function scrollToSection(page, id, progress = 0, pinned = false) {
  await page.evaluate(
    ([sectionId, ratio, isPinned]) => {
      const element = document.getElementById(sectionId)
      const rect = element.getBoundingClientRect()
      const top = rect.top + window.scrollY
      const span = isPinned ? rect.height - window.innerHeight : rect.height
      window.scrollTo({ top: top + span * ratio, behavior: 'instant' })
    },
    [id, progress, pinned],
  )
  await page.waitForTimeout(1800)
}

/** 마우스를 천천히 움직여 빛·입자가 따라오게 합니다. */
async function sweep(page, from, to) {
  await page.mouse.move(...from)
  await page.mouse.move(...to, { steps: 14 })
  await page.waitForTimeout(450)
}

// 공유 이미지 (1200×630): 첫 화면 큰 제목
{
  const { page, context } = await open('/', { width: 1200, height: 630 })
  await waitForHome(page)
  await sweep(page, [300, 220], [560, 250])
  await shot(page, 'public/og.jpg')
  await context.close()
}

// 편집기 소개 페이지 공유 이미지 (1200×630)
{
  const { page, context } = await open('/editor/', { width: 1200, height: 630 })
  await page.mouse.move(840, 260)
  await page.locator('canvas[data-engine]').waitFor({ timeout: 30_000 })
  await page.waitForTimeout(2500)
  await shot(page, 'public/og-editor.jpg')
  await context.close()
}

// 홈 화면 아이콘 (180×180 PNG)
{
  const { page, context } = await open('/404.html', { width: 180, height: 180 })
  const svg = readFileSync('public/favicon.svg', 'utf8')
  await page.setContent(
    // 아이콘이 크림색 바탕까지 그린 그림이라 여백 없이 가득 채운다(iOS가 모서리를 둥글린다).
    `<body style="margin:0;width:180px;height:180px">${svg.replace('<svg ', '<svg width="180" height="180" style="display:block" ')}</body>`,
  )
  await page.screenshot({ path: 'public/apple-touch-icon.png', type: 'png' })
  console.log('저장 public/apple-touch-icon.png')
  await context.close()
}

// 데스크톱 첫 화면: 로딩 중 (프레임 응답을 늦춰 진행률이 차오르는 중간을 찍습니다)
{
  const { page, context } = await open(
    '/',
    { width: 1440, height: 900 },
    {
      route: (target) =>
        target.route('**/sequence/**', async (request) => {
          const order = Number(
            request
              .request()
              .url()
              .match(/(\d{3})\./)?.[1],
          )
          await new Promise((resolve) => setTimeout(resolve, 500 + order * 60))
          await request.continue()
        }),
    },
  )
  await page.waitForTimeout(3300)
  await shot(page, 'docs/images/home-loading.jpg')
  await context.close()
}

// 데스크톱 쇼케이스
{
  const { page, context } = await open('/', { width: 1440, height: 900 })
  await waitForHome(page)
  await sweep(page, [420, 330], [700, 380])
  await shot(page, 'docs/images/home.jpg')

  await scrollToSection(page, 'anatomy', 0.3, true)
  await shot(page, 'docs/images/anatomy-turn.jpg')
  await scrollToSection(page, 'anatomy', 0.97, true)
  await shot(page, 'docs/images/anatomy-explode.jpg')

  const steps = page.locator('#details li')
  await steps
    .nth(0)
    .evaluate((element) => element.scrollIntoView({ block: 'center' }))
  await page.waitForTimeout(2600)
  await shot(page, 'docs/images/details-silhouette.jpg')
  await steps
    .nth(1)
    .evaluate((element) => element.scrollIntoView({ block: 'center' }))
  await page.waitForTimeout(2600)
  const stage = await page.locator('#details canvas').boundingBox()
  await sweep(
    page,
    [stage.x + stage.width * 0.3, stage.y + stage.height * 0.42],
    [stage.x + stage.width * 0.46, stage.y + stage.height * 0.5],
  )
  await shot(page, 'docs/images/details-500m.jpg')

  await scrollToSection(page, 'colors', 0.18)
  await page.locator('#colors canvas').waitFor({ timeout: 30_000 })
  await page.getByRole('radio', { name: '크림슨 래커' }).check()
  await page.getByRole('radio', { name: '블랙 DLC' }).check()
  await page.getByRole('radio', { name: '노을' }).check()
  await page.waitForTimeout(3500)
  await shot(page, 'docs/images/colors.jpg')
  await context.close()
}

// lil-gui 디버그 패널 (?debug)
{
  const { page, context } = await open('/?debug', { width: 1440, height: 900 })
  await waitForHome(page)
  await page.getByRole('button', { name: '입자 (Particles)' }).waitFor()
  await scrollToSection(page, 'details', 0.18)
  const stage = await page.locator('#details canvas').boundingBox()
  await sweep(
    page,
    [stage.x + stage.width * 0.35, stage.y + stage.height * 0.45],
    [stage.x + stage.width * 0.5, stage.y + stage.height * 0.5],
  )
  await page.waitForTimeout(1500)
  await shot(page, 'docs/images/debug.jpg')
  await context.close()
}

// 성능 비교
{
  const { page, context } = await open('/bench/', { width: 1440, height: 900 })
  await page.waitForFunction(() => typeof window.__runBench === 'function')
  await page.evaluate(() =>
    window.__runBench({ warmupMs: 300, measureMs: 900 }),
  )
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(500)
  await shot(page, 'docs/images/bench.jpg')
  await context.close()
}

// 편집기 소개(/editor/)와 스튜디오
{
  const editor = await open('/editor/', { width: 1440, height: 900 })
  await editor.page.mouse.move(1000, 360)
  await editor.page.locator('canvas[data-engine]').waitFor({ timeout: 30_000 })
  await editor.page.waitForTimeout(2500)
  await shot(editor.page, 'docs/images/editor.jpg')
  await editor.context.close()

  const { page, context } = await open('/studio/', { width: 1440, height: 900 })
  await page.getByRole('radio', { name: '프레임 05' }).check()
  const canvas = page.getByRole('application', { name: /그림 캔버스/ })
  const box = await canvas.boundingBox()
  const at = (x, y) => [
    box.x + (box.width * x) / 64,
    box.y + (box.height * y) / 64,
  ]
  for (const stroke of [
    [
      [10, 14],
      [16, 10],
      [22, 14],
    ],
    [
      [42, 12],
      [48, 9],
      [54, 13],
    ],
  ]) {
    await page.mouse.move(...at(...stroke[0]))
    await page.mouse.down()
    for (const point of stroke.slice(1))
      await page.mouse.move(...at(...point), { steps: 6 })
    await page.mouse.up()
  }
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.mouse.move(...at(30, 30))
  await page.waitForTimeout(500)
  await shot(page, 'docs/images/studio.jpg')
  await context.close()
}

// 모바일
{
  const mobile = { width: 390, height: 844 }
  const options = { isMobile: true, hasTouch: true }
  const { page, context } = await open('/', mobile, options)
  await waitForHome(page)
  await shot(page, 'docs/images/mobile-home.jpg')
  await scrollToSection(page, 'anatomy', 0.97, true)
  await shot(page, 'docs/images/mobile-anatomy.jpg')
  await context.close()
}

// Storybook
{
  const { page, context } = await open(
    '/storybook/index.html?path=/story/pages-home-specs--default',
    { width: 1440, height: 900 },
  )
  await page.waitForTimeout(6000)
  await shot(page, 'docs/images/storybook.jpg')
  await context.close()
}

await browser.close()
