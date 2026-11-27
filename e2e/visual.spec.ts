import { type Page, expect, test } from '@playwright/test'
import { skipIntro } from './helpers'
import { SETTLE_CSS, builtStories, storyUrl } from './stories'

/*
 * 화면 비교(시각 회귀). playwright.visual.config.ts로만 돌고, 기준 이미지는 Linux Playwright 컨테이너에서 만듭니다.
 * - 움직임: 동작 줄이기(reducedMotion: 'reduce' → 사이트의 '움직임 멈춤'), CSS 전환·애니메이션 끄기, 고정 시각(Date)
 * - WebGL·캔버스(시퀀스·입자·3D·픽셀 캔버스)는 그릴 때마다 조금씩 달라 숨깁니다(visibility: hidden).
 *   mask로 덮으면 화면 전체를 채우는 첫 화면 캔버스가 위에 놓인 글자까지 가려, 숨겨서 바탕과 글자만 비교합니다.
 * - 글꼴: 에스코어드림·JetBrains Mono·Electrolize는 저장소 파일이고, 다 받을 때까지 기다립니다.
 * - 인트로는 동작 줄이기에서 열리지 않는 회전 연출이라 비교하지 않습니다(intro.spec.ts에서 검사).
 */

/** 시계 바늘·크로노그래프 등 시각을 쓰는 화면을 고정합니다. */
const FIXED_TIME = new Date('2026-01-01T10:08:30+09:00')

test.skip(
  process.platform !== 'linux',
  '기준 이미지는 Linux 컨테이너용입니다. pnpm test:visual(Docker)로 돌리세요.',
)

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
    await shoot(page, 'home-colors')
  })

  test('편집기 소개', async ({ page }) => {
    await page.goto('/editor/')
    await fontsReady(page)
    await shoot(page, 'editor')
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

test.describe('Storybook 스토리', () => {
  test.skip(({ isMobile }) => isMobile, '스토리는 데스크톱 화면만 비교합니다.')
  test.beforeEach(({ page }) => page.clock.setFixedTime(FIXED_TIME))

  for (const story of builtStories()) {
    test(`${story.title} / ${story.name}`, async ({ page }) => {
      await page.goto(storyUrl(story.id))
      await expect(page.locator('body')).toHaveClass(/sb-show-main/, {
        timeout: 30_000,
      })
      await shoot(page, `story-${story.id}`)
    })
  }
})
