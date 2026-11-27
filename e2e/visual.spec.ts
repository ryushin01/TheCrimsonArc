import { type Page, expect, test } from '@playwright/test'
import { skipIntro } from './helpers'
import { SETTLE_CSS, builtStories, storyUrl } from './stories'

/*
 * 화면 비교(시각 회귀). playwright.visual.config.ts로만 돌고, 기준 이미지는 Linux Playwright 컨테이너에서 만듭니다.
 * - 움직임: 동작 줄이기(reducedMotion: 'reduce' → 사이트의 '움직임 멈춤'), CSS 전환·애니메이션 끄기, 고정 시각(Date)
 * - WebGL·캔버스(시퀀스·입자·3D·픽셀 캔버스)는 그릴 때마다 조금씩 달라 숨깁니다(visibility: hidden).
 *   mask로 덮으면 화면 전체를 채우는 첫 화면 캔버스가 위에 놓인 글자까지 가려, 숨겨서 바탕과 글자만 비교합니다.
 * - 글꼴: 에스코어드림·JetBrains Mono·Electrolize는 저장소 파일이고, 다 받을 때까지 기다립니다.
 * - WebGL 컨텍스트가 하나라도 있으면 CI의 헤드리스 Chromium(SwiftShader)이 화면 찍기(Page.captureScreenshot)에 답하지 않아
 *   시간 제한(15초)을 넘깁니다(캔버스를 숨기거나 display: none으로 빼도 같고, 3D 묶음을 막으면 10번 모두 22초 안에 통과).
 *   그래서 주요 화면은 WebGL이 없는 브라우저로 열고(구성기는 '3D를 그리지 못했습니다' 안내로 바뀜), 3D만 있는 스토리는 비교하지 않습니다.
 * - 인트로는 동작 줄이기에서 열리지 않는 회전 연출이라, 편집기 소개는 3D 무대를 따라 지시선이 매 프레임 움직여 비교하지 않습니다
 *   (편집기 구간은 스토리로 비교하고, 화면 흐름은 E2E가 봅니다).
 */

/** 시계 바늘·크로노그래프 등 시각을 쓰는 화면을 고정합니다. */
const FIXED_TIME = new Date('2026-01-01T10:08:30+09:00')

test.skip(
  process.platform !== 'linux',
  '기준 이미지는 Linux 컨테이너용입니다. pnpm test:visual(Docker)로 돌리세요.',
)

/** WebGL이 없는 브라우저처럼 WebGL 컨텍스트를 만들지 않습니다(2D 캔버스는 그대로). */
async function withoutWebGL(page: Page) {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      configurable: true,
      value(this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
        if (/webgl/i.test(type)) return null
        return Reflect.apply(getContext, this, [type, ...rest])
      },
    })
  })
}

async function settle(page: Page) {
  await page.addStyleTag({
    content: `${SETTLE_CSS}\ncanvas { visibility: hidden !important; }`,
  })
  await page.evaluate(() => document.fonts.ready)
}

async function shoot(page: Page, name: string) {
  await settle(page)
  await expect(page).toHaveScreenshot(`${name}.png`)
}

const fontsReady = (page: Page) =>
  expect(page.locator('html')).toHaveAttribute('data-fonts', 'ready', {
    timeout: 30_000,
  })

test.describe('주요 화면', () => {
  test.describe.configure({ timeout: 120_000 })
  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(FIXED_TIME)
    await skipIntro(page)
    await withoutWebGL(page)
  })

  test('쇼케이스 첫 화면', async ({ page }) => {
    await page.goto('/')
    await fontsReady(page)
    await expect(
      page.getByRole('progressbar', { name: '제품 이미지 불러오기' }),
    ).toHaveCount(0, { timeout: 30_000 })
    await shoot(page, 'home')
  })

  test('쇼케이스 구성기(공유 주소)', async ({ page }) => {
    await page.goto('/?dial=crimson&light=night#colors')
    await fontsReady(page)
    await expect(page.getByRole('radio', { name: '크림슨 래커' })).toBeChecked()
    // WebGL이 없으면 3D 자리 아래 상태 안내가 바뀝니다(바뀐 뒤 찍습니다).
    await expect(
      page.getByText('이 브라우저에서는 3D 모델을 그리지 못했습니다.', {
        exact: false,
      }),
    ).toBeAttached({ timeout: 30_000 })
    await shoot(page, 'home-colors')
  })

  test('스튜디오', async ({ page }) => {
    await page.goto('/studio/')
    await fontsReady(page)
    await expect(
      page.getByText('64×64 · 12fps · 레이어 4 · 프레임 12'),
    ).toBeVisible()
    await shoot(page, 'studio')
  })

  test('성능 비교', async ({ page }) => {
    await page.goto('/bench/')
    await fontsReady(page)
    await shoot(page, 'bench')
  })

  test('404', async ({ page }) => {
    await page.goto('/404.html')
    await fontsReady(page)
    await shoot(page, 'not-found')
  })
})

/**
 * 3D(WebGL) 장면이 화면 대부분이고, 3D가 그린 위치를 따라 DOM이 매 프레임 움직여 찍을 때마다 달라지는 스토리.
 * 캔버스를 숨겨도 남는 것이 거의 없어 비교하지 않습니다(3D는 @react-three/test-renderer 단위 테스트와 E2E가 봅니다).
 * 조명 견본(WatchLighting)도 캔버스 하나뿐이라 숨기면 빈 상자만 남고, WebGL 컨텍스트 때문에 화면 찍기가 멈춥니다(위 설명).
 */
const UNSTABLE_STORIES = [
  'entities-watch-watchlighting--',
  'entities-watch-watchmodel--',
  'pages-home-watchstage--',
  'pages-home-colors--',
  'pages-editor-editorpage--',
]

test.describe('Storybook 스토리', () => {
  test.skip(({ isMobile }) => isMobile, '스토리는 데스크톱 화면만 비교합니다.')
  test.beforeEach(({ page }) => page.clock.setFixedTime(FIXED_TIME))

  const stories = builtStories().filter(
    (story) => !UNSTABLE_STORIES.some((prefix) => story.id.startsWith(prefix)),
  )
  for (const story of stories) {
    test(`${story.title} / ${story.name}`, async ({ page }) => {
      await page.goto(storyUrl(story.id))
      await expect(page.locator('body')).toHaveClass(/sb-show-main/, {
        timeout: 30_000,
      })
      await shoot(page, `story-${story.id}`)
    })
  }
})
