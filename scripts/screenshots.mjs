// README 화면(docs/images/*.jpg)과 공유 이미지(public/og.jpg, og-editor.jpg), 홈 화면 아이콘을 만듭니다.
// 먼저 프로덕션 빌드를 띄워 두세요: pnpm build:all && pnpm preview
// 사용: BASE_URL=http://localhost:4173 pnpm screenshots
import { readFileSync } from 'node:fs'
import { rename, rm } from 'node:fs/promises'
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
  // 자동 연출을 멈추지 않은 상태로 찍고, 첫 화면 인트로는 따로 찍으므로(?intro=1) 건너뜁니다.
  await page.addInitScript(() => {
    localStorage.setItem('crimson-arc:motion', 'playing')
    sessionStorage.setItem('crimson-arc:intro', 'seen')
  })
  if (route) await route(page)
  await page.goto(`${BASE}${path}`, {
    waitUntil: route ? 'domcontentloaded' : 'networkidle',
  })
  return { page, context }
}

async function shot(page, file, options = {}) {
  await page.screenshot({ path: file, type: 'jpeg', quality: 82, ...options })
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

/** 인트로의 다이얼이 다 펼쳐지고 열두 조합이 모두 나타날 때까지 (끝없이 도는 회전은 빼고) */
async function waitForIntroSettled(page) {
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll('dialog img')].every(
        (img) => img.dataset.loaded && getComputedStyle(img).opacity === '1',
      ) &&
      document
        .getAnimations()
        .every(
          (animation) =>
            animation.effect?.getComputedTiming().iterations === Infinity ||
            animation.playState === 'finished',
        ),
    null,
    { timeout: 60_000, polling: 250 },
  )
}

/** 분해 구간이 끝까지 펼쳐져 무브먼트 설명(Ash Core)이 나타날 때까지 */
async function waitForMovementCaption(page) {
  await page
    .locator('#anatomy li[data-active="true"]', { hasText: 'Ash Core' })
    .waitFor({ timeout: 30_000 })
  await page.waitForTimeout(800)
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

// 첫 화면 인트로(조디악 다이얼): 열두 조합이 다 나타난 뒤, 그리고 들어가며 다이얼이 돌고 가운데가 열리는 중간
{
  const { page, context } = await open('/?intro=1', {
    width: 1440,
    height: 900,
  })
  try {
    const dialog = page.getByRole('dialog', { name: 'The Crimson Arc' })
    await dialog.waitFor({ timeout: 30_000 })
    await waitForIntroSettled(page)
    // 끝없이 도는 다이얼·궤도는 처음 자리(12시에 기본 조합)로 두고 찍습니다. 돌고 있는 채로는 소프트웨어 렌더링에서 캡처가 멈춥니다.
    await shot(page, 'docs/images/intro.jpg', { animations: 'disabled' })
    await dialog.getByRole('button', { name: '입장하기' }).click()
    await page.waitForFunction(
      () => document.querySelector('dialog')?.dataset.phase === 'entering',
    )
    // 들어가기 연출(1.5초)의 0.65초 지점에 멈춰 찍습니다.
    await page.evaluate(() => {
      for (const animation of document.getAnimations()) {
        if (
          /intro-(stage-out|open|copy-out|fade-out)/.test(
            animation.animationName,
          )
        ) {
          animation.pause()
          animation.currentTime = 650
        }
      }
    })
    await page.waitForTimeout(400)
    // 닫기 타이머(1.5초)는 멈추지 않으므로, 임시 파일에 찍고 찍기 전후 모두 인트로가 열려 있을 때만 바꿔 넣습니다.
    // (닫힌 뒤 찍히면 첫 화면이 찍혀 README 이미지를 덮어쓰게 됩니다.)
    const file = 'docs/images/intro-enter.jpg'
    const temp = 'docs/images/.intro-enter.tmp.jpg'
    const isOpen = () =>
      page.evaluate(() => Boolean(document.querySelector('dialog')?.open))
    const closed = new Error(
      `${file}를 찍는 동안 인트로가 닫혔습니다. 부하가 적을 때 다시 실행하세요.`,
    )
    if (!(await isOpen())) throw closed
    await page.screenshot({ path: temp, type: 'jpeg', quality: 82 })
    if (!(await isOpen())) {
      await rm(temp, { force: true })
      throw closed
    }
    await rename(temp, file)
    console.log('저장', file)
  } finally {
    await context.close()
  }
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
  await waitForMovementCaption(page)
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
  await shot(page, 'docs/images/details-80k.jpg')

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
  await waitForMovementCaption(page)
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
