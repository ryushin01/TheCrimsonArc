// README 화면(docs/images/*.jpg)과 공유 이미지(public/og.jpg), 홈 화면 아이콘을 만듭니다.
// 먼저 프로덕션 빌드를 띄워 두세요: pnpm build && pnpm preview
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
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    ...options,
  })
  const page = await context.newPage()
  // 자동 연출을 멈추지 않은 상태로 찍습니다.
  await page.addInitScript(() =>
    localStorage.setItem('crimson-arc:motion', 'playing'),
  )
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' })
  return { page, context }
}

async function shot(page, file) {
  await page.screenshot({ path: file, type: 'jpeg', quality: 82 })
  console.log('저장', file)
}

async function waitForStage(page) {
  await page.locator('canvas[data-engine]').waitFor({ timeout: 30_000 })
  await page.waitForTimeout(2500)
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

// 공유 이미지 (1200×630)
{
  const { page, context } = await open('/', { width: 1200, height: 630 })
  await page.mouse.move(840, 260)
  await waitForStage(page)
  await shot(page, 'public/og.jpg')
  await context.close()
}

// 홈 화면 아이콘 (180×180 PNG)
{
  const { page, context } = await open('/404.html', { width: 180, height: 180 })
  const svg = readFileSync('public/favicon.svg', 'utf8')
  await page.setContent(
    `<body style="margin:0;display:grid;place-items:center;width:180px;height:180px;background:#3a0a1c">${svg.replace('<svg ', '<svg width="132" height="132" ')}</body>`,
  )
  await page.screenshot({ path: 'public/apple-touch-icon.png', type: 'png' })
  console.log('저장 public/apple-touch-icon.png')
  await context.close()
}

// 데스크톱 홍보 페이지
{
  const { page, context } = await open('/', { width: 1440, height: 900 })
  await page.mouse.move(1000, 360)
  await waitForStage(page)
  await shot(page, 'docs/images/home.jpg')

  await scrollToSection(page, 'about', 0.5, true)
  await page.mouse.move(760, 420)
  await page.waitForTimeout(1500)
  await shot(page, 'docs/images/about.jpg')

  await scrollToSection(page, 'process', 0.42)
  await shot(page, 'docs/images/process.jpg')

  await scrollToSection(page, 'layers', 0.18)
  await page.mouse.move(900, 600)
  await page.waitForTimeout(1500)
  await shot(page, 'docs/images/layers.jpg')

  await scrollToSection(page, 'frames', 0.45, true)
  await shot(page, 'docs/images/frames.jpg')

  await scrollToSection(page, 'export', 0.12)
  await page
    .locator('#export')
    .getByRole('button', { name: 'GIF 만들기' })
    .click()
  await page
    .locator('#export')
    .getByRole('img', { name: /만든 GIF/ })
    .waitFor()
  await page.locator('#export figure').scrollIntoViewIfNeeded()
  await page.evaluate(() => window.scrollBy(0, 120))
  await page.waitForTimeout(800)
  await shot(page, 'docs/images/export.jpg')

  await scrollToSection(page, 'open', 0.1)
  await page
    .locator('#open')
    .getByRole('button', { name: '샘플 이미지로 해 보기' })
    .click()
  await page
    .locator('#open')
    .getByRole('img', { name: /픽셀 아트로 바꾼 이미지/ })
    .waitFor()
  await page.locator('#open').getByRole('radio', { name: '48px' }).check()
  await page.locator('#open figure').first().scrollIntoViewIfNeeded()
  await page.evaluate(() => window.scrollBy(0, 160))
  await page.waitForTimeout(800)
  await shot(page, 'docs/images/open.jpg')

  await scrollToSection(page, 'specs', 0.1)
  await shot(page, 'docs/images/specs.jpg')
  await context.close()
}

// 스튜디오: 빈 레이어에 획을 몇 개 그린 뒤
{
  const { page, context } = await open('/studio/', { width: 1440, height: 900 })
  await page.getByRole('radio', { name: '프레임 05' }).check()
  const canvas = page.getByRole('application', { name: /그림 캔버스/ })
  const box = await canvas.boundingBox()
  const at = (x, y) => [
    box.x + (box.width * x) / 64,
    box.y + (box.height * y) / 64,
  ]
  const strokes = [
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
  ]
  for (const stroke of strokes) {
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

  await page.getByRole('button', { name: '내보내기' }).click()
  const dialog = page.getByRole('dialog', { name: '내보내기' })
  await dialog.getByRole('button', { name: 'GIF 만들기' }).click()
  await dialog.getByRole('img', { name: /만든 GIF/ }).waitFor()
  await page.waitForTimeout(500)
  await shot(page, 'docs/images/studio-export.jpg')
  await context.close()
}

// 모바일
{
  const mobile = { width: 390, height: 844 }
  const options = { isMobile: true, hasTouch: true }
  const home = await open('/', mobile, options)
  await waitForStage(home.page)
  await shot(home.page, 'docs/images/mobile-home.jpg')
  await home.context.close()

  const studio = await open('/studio/', mobile, options)
  await studio.page
    .getByRole('application', { name: /그림 캔버스/ })
    .scrollIntoViewIfNeeded()
  await studio.page.evaluate(() => window.scrollBy(0, -120))
  await studio.page.waitForTimeout(500)
  await shot(studio.page, 'docs/images/mobile-studio.jpg')
  await studio.context.close()
}

// Storybook
{
  const { page, context } = await open(
    '/storybook/index.html?path=/story/features-export-artwork-exportpanel--gif-only',
    { width: 1440, height: 900 },
  )
  await page.waitForTimeout(3000)
  await shot(page, 'docs/images/storybook.jpg')
  await context.close()
}

await browser.close()
