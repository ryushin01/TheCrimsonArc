import { type BrowserContext, expect, test } from '@playwright/test'
import { axeViolations, collectErrors, skipIntro } from './helpers'

/*
 * 오프라인 검사: localhost 밖으로 나가는 요청을 모두 끊은 채 모든 페이지가 내용과 함께 뜨는지 봅니다.
 * 시계 이미지 시퀀스·3D 조명(Lightformer)·글꼴은 모두 저장소에서 받고, 바깥 API·CDN·분석 도구를 쓰지 않으므로
 * 실행 중에는 바깥 요청이 하나도 없어야 합니다. (.env 없이 빌드한 결과를 그대로 씁니다)
 * 화면이 같으므로 엔진마다 하나씩(Chromium 데스크톱, WebKit 데스크톱)만 돌립니다.
 */

/** 바깥 요청을 끊고, 끊긴 주소를 모읍니다. */
async function goOffline(context: BrowserContext): Promise<string[]> {
  const blocked: string[] = []
  await context.route(
    (url) => !['localhost', '127.0.0.1'].includes(url.hostname),
    (route) => {
      blocked.push(route.request().url())
      return route.abort('internetdisconnected')
    },
  )
  return blocked
}

test.describe('오프라인', () => {
  test.describe.configure({ timeout: 120_000 })
  test.skip(
    ({ isMobile }) => isMobile,
    '화면 크기와 상관없는 검사라 데스크톱에서만 돌립니다.',
  )
  test.beforeEach(({ page }) => skipIntro(page))

  // 바깥 요청을 끊고, 끊긴 주소와 콘솔 오류를 모아 테스트가 끝날 때 비었는지 봅니다.
  let blocked: string[] = []
  let errors: string[] = []
  test.beforeEach(async ({ page, context }) => {
    blocked = await goOffline(context)
    errors = collectErrors(page)
  })
  test.afterEach(() => {
    expect(blocked).toEqual([])
    expect(errors).toEqual([])
  })

  test('쇼케이스 첫 화면이 시퀀스·입자·구성기 3D와 함께 뜬다', async ({
    page,
  }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(
      'The Crimson Arc A-01',
    )
    // 핵심 프레임·글꼴을 다 받으면 로딩 표시가 사라집니다.
    await expect(
      page.getByRole('progressbar', { name: '제품 이미지 불러오기' }),
    ).toHaveCount(0, { timeout: 30_000 })
    await expect(
      page.locator('section[aria-labelledby] > canvas[aria-hidden="true"]'),
    ).toHaveCount(1)
    expect(await axeViolations(page)).toEqual([])
    // 구성기 3D도 바깥 자료 없이 그립니다.
    await page.locator('#colors').scrollIntoViewIfNeeded()
    await expect(page.locator('#colors canvas')).toHaveCount(1, {
      timeout: 30_000,
    })
  })

  test('편집기 소개 페이지가 3D 무대와 함께 뜬다', async ({ page }) => {
    await page.goto('/editor/')
    await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(
      'The Crimson Arc: Draw in layers Move in frames',
    )
    expect(await axeViolations(page)).toEqual([])
    // 3D 캔버스는 첫 화면 뒤에 받습니다.
    await expect(page.locator('canvas[data-engine]')).toHaveCount(1, {
      timeout: 60_000,
    })
  })

  test('스튜디오가 샘플 작품과 함께 뜬다', async ({ page }) => {
    await page.goto('/studio/')
    await expect(
      page.getByRole('heading', { level: 1, name: 'Studio' }),
    ).toBeVisible()
    await expect(
      page.getByText('64×64 · 12fps · 레이어 4 · 프레임 12'),
    ).toBeVisible()
    expect(await axeViolations(page)).toEqual([])
  })

  test('성능 비교 페이지가 뜬다', async ({ page }) => {
    await page.goto('/bench/')
    await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(
      'Canvas · DOM · SVG 성능 비교',
    )
    expect(await axeViolations(page)).toEqual([])
  })
})
