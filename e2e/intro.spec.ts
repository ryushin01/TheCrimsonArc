import { type Page, expect, test } from '@playwright/test'
import { axeViolations, collectErrors, tabKey } from './helpers'

/** 첫 화면 인트로(조디악 다이얼) */
const intro = (page: Page) =>
  page.getByRole('dialog', { name: 'The Crimson Arc' })

/** 글꼴 로딩 화면이 끝나 페이지(또는 인트로)가 보일 때까지 */
const fontsReady = (page: Page) =>
  expect(page.locator('html')).toHaveAttribute('data-fonts', 'ready', {
    timeout: 30_000,
  })

/**
 * 인트로가 거친 단계(open → entering)를 페이지 안에서 기록합니다.
 * 들어가기 연출(1.5초)은 부하가 큰 환경에서 단언이 다시 보기 전에 끝날 수 있어, 지나간 단계를 나중에 확인합니다.
 */
const introPhases = (page: Page) =>
  page.evaluate(
    () => (window as unknown as { __introPhases: string[] }).__introPhases,
  )

/** 인트로가 열리고 열두 조합 이미지를 다 받아 그릴 때까지 */
async function openIntro(page: Page) {
  await page.addInitScript(() => {
    const phases: string[] = []
    ;(window as unknown as { __introPhases: string[] }).__introPhases = phases
    new MutationObserver(() => {
      const phase = document.querySelector('dialog')?.dataset.phase
      if (phase && phases.at(-1) !== phase) phases.push(phase)
    }).observe(document, {
      subtree: true,
      attributes: true,
      attributeFilter: ['data-phase'],
    })
  })
  await page.goto('/')
  const dialog = intro(page)
  await expect(dialog).toBeVisible({ timeout: 30_000 })
  await expect
    .poll(() => dialog.locator('img[data-loaded]').count(), {
      timeout: 30_000,
    })
    .toBe(12)
  return dialog
}

test.describe('첫 화면 인트로 (조디악 다이얼)', () => {
  // 인트로 뒤에서 캔버스·Worker가 함께 도는 무거운 페이지라 시간을 넉넉히 둡니다.
  test.describe.configure({ timeout: 120_000 })

  test('처음 들어오면 열두 조합이 도는 인트로가 열리고, 입장하면 다이얼이 돌며 첫 화면으로 들어간다', async ({
    page,
  }) => {
    const errors = collectErrors(page)
    const dialog = await openIntro(page)
    await expect(dialog).toContainText(
      '세계 최초의 특수합금 무브먼트 애쉬 코어(Ash Core)를 품은 A-01의 열두 가지 얼굴',
    )
    await expect(
      dialog
        .getByRole('list', { name: 'A-01 열두 가지 조합' })
        .getByRole('img'),
    ).toHaveCount(12)
    const enter = dialog.getByRole('button', { name: '입장하기' })
    await expect(enter).toBeFocused()
    // 열려 있는 동안 뒤 페이지는 스크롤하지 않습니다.
    await expect(page.locator('html')).toHaveAttribute('data-intro', 'open')
    expect(await axeViolations(page)).toEqual([])

    await enter.click()
    await expect(dialog).toHaveCount(0, { timeout: 10_000 })
    expect(await introPhases(page)).toEqual(['open', 'entering'])
    await expect(page.locator('html')).not.toHaveAttribute('data-intro')
    await expect(
      page.getByRole('heading', { level: 1, name: 'The Crimson Arc A-01' }),
    ).toBeInViewport()

    // 같은 탭에서 다시 오면 인트로 없이 첫 화면에서 시작합니다.
    await page.goto('/')
    await fontsReady(page)
    await expect(
      page.getByRole('heading', { level: 1, name: 'The Crimson Arc A-01' }),
    ).toBeVisible()
    await expect(intro(page)).toHaveCount(0)
    expect(errors).toEqual([])
  })

  test('Esc를 누르면 바로 닫히고, 다음 Tab은 본문 바로가기부터 시작한다', async ({
    page,
    browserName,
  }) => {
    const dialog = await openIntro(page)
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    // 들어가기 연출 없이 닫습니다.
    expect(await introPhases(page)).toEqual(['open'])
    await expect(page.locator('html')).not.toHaveAttribute('data-intro')
    await page.keyboard.press(tabKey(browserName))
    await expect(
      page.getByRole('link', { name: '본문 바로가기' }),
    ).toBeFocused()
  })

  test('휠을 아래로 굴리거나 화면을 눌러도 들어가고, 뒤 페이지는 맨 위에 그대로 있다', async ({
    page,
    isMobile,
  }) => {
    const dialog = await openIntro(page)
    const box = (await page.viewportSize())!
    if (isMobile) {
      await page.touchscreen.tap(box.width / 2, box.height * 0.2)
    } else {
      await page.mouse.move(box.width / 2, box.height * 0.2)
      await page.mouse.wheel(0, 240)
    }
    await expect(dialog).toHaveCount(0, { timeout: 10_000 })
    expect(await introPhases(page)).toEqual(['open', 'entering'])
    expect(await page.evaluate(() => window.scrollY)).toBe(0)
  })

  test('구간 링크·새로고침·동작 줄이기에서는 인트로 없이 시작한다', async ({
    page,
  }) => {
    // 구간 링크: 보러 온 구간으로 곧장 갑니다.
    await page.goto('/#specs')
    await fontsReady(page)
    await expect(page.locator('#specs')).toBeInViewport({ timeout: 20_000 })
    await expect(intro(page)).toHaveCount(0)

    // 새로고침: 이번 탭 기록을 지워도 보던 화면으로 돌아옵니다.
    await page.goto('/')
    await expect(intro(page)).toBeVisible({ timeout: 30_000 })
    await page.keyboard.press('Escape')
    await expect(intro(page)).toHaveCount(0)
    await page.evaluate(() => window.sessionStorage.clear())
    await page.reload()
    await fontsReady(page)
    await expect(intro(page)).toHaveCount(0)

    // 동작 줄이기: 회전·확대 연출이라 열지 않습니다.
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.evaluate(() => window.sessionStorage.clear())
    await page.goto('/')
    await fontsReady(page)
    await expect(intro(page)).toHaveCount(0)
    await expect(page.locator('html')).not.toHaveAttribute('data-intro')
  })
})
