import { type Page, expect, test } from '@playwright/test'
import { axeViolations, sampleGif, skipIntro } from './helpers'

/*
 * 접근성 상태 검사: 다른 E2E가 첫 화면·대화상자·패널에서 돌리는 axe에 더해,
 * 페이지 전체(모든 구간을 지나온 뒤)와 사용자가 만드는 상태(움직임 멈춤, 메뉴 펼침, 파일 열기 오류·성공, 숨긴 레이어 알림, 재생 중)를
 * WCAG 2.2 AA axe로 검사합니다. 배치가 다른 데스크톱·모바일(Chromium)에서 돌립니다.
 */

const fontsReady = (page: Page) =>
  expect(page.locator('html')).toHaveAttribute('data-fonts', 'ready', {
    timeout: 30_000,
  })

/**
 * id가 있는 구간마다 차례로 화면에 들여, 늦게 그리는 구간(3D·지연 로딩)을 모두 깨운 뒤 페이지 끝에 섭니다.
 * (시퀀스 구간은 매우 길어 한 화면씩 휠로 내려가면 소프트웨어 WebGL에서 너무 오래 걸립니다)
 */
async function scrollThrough(page: Page) {
  // 고정(sticky)·움직이는 구간은 '멈춘 요소'가 되지 않아 Playwright의 scrollIntoViewIfNeeded가 기다리므로 DOM으로 옮깁니다.
  const ids = await page
    .locator('main [id]')
    .evaluateAll((elements) => elements.map((element) => element.id))
  for (const id of ids) {
    await page.evaluate((target) => {
      document.getElementById(target)?.scrollIntoView({ block: 'start' })
    }, id)
    await page.waitForTimeout(200)
  }
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
}

test.describe('접근성 상태', () => {
  test.describe.configure({ timeout: 120_000 })
  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'axe 결과는 엔진과 상관없어 Chromium(데스크톱·모바일)에서만 돌립니다.',
  )
  test.beforeEach(({ page }) => skipIntro(page))

  test('쇼케이스: 모든 구간을 지나온 페이지 전체', async ({ page }) => {
    await page.goto('/')
    await fontsReady(page)
    await scrollThrough(page)
    expect(await axeViolations(page)).toEqual([])
  })

  test('쇼케이스: 움직임을 멈춘 상태', async ({ page }) => {
    await page.goto('/')
    await fontsReady(page)
    await page.getByRole('button', { name: '움직임 멈춤' }).click()
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'paused')
    await expect(
      page.getByRole('button', { name: '움직임 재생' }),
    ).toBeVisible()
    expect(await axeViolations(page)).toEqual([])
  })

  test('좁은 화면 메뉴를 펼친 상태(쇼케이스·편집기)', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, '넓은 화면은 메뉴 버튼 없이 메뉴가 늘 보입니다')
    for (const path of ['/', '/editor/']) {
      await page.goto(path)
      await fontsReady(page)
      const button = page.getByRole('button', { name: '메뉴' })
      await button.click()
      await expect(button).toHaveAttribute('aria-expanded', 'true')
      expect(await axeViolations(page)).toEqual([])
    }
  })

  test('편집기: 모든 구간을 지나온 페이지 전체', async ({ page }) => {
    await page.goto('/editor/')
    await fontsReady(page)
    await scrollThrough(page)
    expect(await axeViolations(page)).toEqual([])
  })

  test('편집기: 이미지 열기 오류와 성공 상태', async ({ page }) => {
    await page.goto('/editor/#open')
    await fontsReady(page)
    const section = page.locator('#open')
    const input = section.locator('input[type="file"]')
    await input.setInputFiles({
      name: 'notes.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('hello'),
    })
    await expect(section.getByRole('alert')).toBeVisible()
    expect(await axeViolations(page, '#open')).toEqual([])

    await input.setInputFiles({
      name: 'walk.gif',
      mimeType: 'image/gif',
      buffer: sampleGif(3),
    })
    await expect(
      section.getByRole('img', { name: /픽셀 아트로 바꾼 이미지/ }),
    ).toBeVisible()
    expect(await axeViolations(page, '#open')).toEqual([])
  })

  test('스튜디오: 숨긴 레이어 알림과 재생 중 상태', async ({ page }) => {
    await page.goto('/studio/')
    await fontsReady(page)
    await page.getByRole('checkbox', { name: '내 그림 보이기' }).uncheck()
    await page.getByRole('application', { name: /그림 캔버스/ }).focus()
    await page.keyboard.press('Enter')
    await expect(
      page
        .getByRole('status')
        .filter({ hasText: '숨겨져 있어 그릴 수 없습니다' }),
    ).toBeAttached()
    expect(await axeViolations(page)).toEqual([])

    await page.getByRole('button', { name: '재생' }).click()
    await expect(page.getByRole('button', { name: '정지' })).toBeVisible()
    expect(await axeViolations(page)).toEqual([])
  })

  test('성능 비교: 페이지 전체', async ({ page }) => {
    await page.goto('/bench/')
    await fontsReady(page)
    await scrollThrough(page)
    expect(await axeViolations(page)).toEqual([])
  })
})
