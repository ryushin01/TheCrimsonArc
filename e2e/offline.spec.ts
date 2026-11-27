import { type BrowserContext, type Page, expect, test } from '@playwright/test'
import { axeViolations, collectErrors, skipIntro } from './helpers'

/*
 * 오프라인 검사: localhost 밖으로 나가는 요청을 모두 끊은 채 모든 페이지와 주요 상태가 내용과 함께 뜨는지 봅니다.
 * 시계 이미지 시퀀스·3D 조명(Lightformer)·글꼴·아이콘은 모두 저장소에서 받고, 바깥 API·CDN·분석 도구를 쓰지 않으므로
 * 실행 중에는 바깥 요청이 하나도 없어야 합니다. (.env 없이 빌드한 결과를 그대로 씁니다)
 * 모바일은 작은 시퀀스(sm)와 다른 배치를 받으므로 네 프로젝트(Chromium·WebKit × 데스크톱·모바일) 모두 돌립니다.
 * 마지막 묶음은 서비스 워커로 한 번 들어온 뒤 서버까지 끊겨도(다시 방문) 모든 페이지가 뜨는지 봅니다.
 */

const LOCAL_HOSTS = ['localhost', '127.0.0.1']

/** 바깥 요청을 끊고, 끊긴 주소를 모읍니다. */
async function goOffline(context: BrowserContext): Promise<string[]> {
  const blocked: string[] = []
  await context.route(
    (url) => !LOCAL_HOSTS.includes(url.hostname),
    (route) => {
      blocked.push(route.request().url())
      return route.abort('internetdisconnected')
    },
  )
  return blocked
}

/** 글꼴 로딩 화면이 끝날 때까지 (끝나지 않는 로딩이 없어야 함) */
const fontsReady = (page: Page) =>
  expect(page.locator('html')).toHaveAttribute('data-fonts', 'ready', {
    timeout: 30_000,
  })

/** 첫 화면 핵심 프레임을 다 받아 로딩 표시가 사라질 때까지 */
const heroReady = (page: Page) =>
  expect(
    page.getByRole('progressbar', { name: '제품 이미지 불러오기' }),
  ).toHaveCount(0, { timeout: 30_000 })

test.describe('오프라인', () => {
  test.describe.configure({ timeout: 120_000 })
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
    await heroReady(page)
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

  test('인트로(조디악 다이얼)가 열두 조합 이미지와 함께 열린다', async ({
    page,
  }) => {
    await page.goto('/?intro=1')
    const dialog = page.getByRole('dialog', { name: 'The Crimson Arc' })
    await expect(dialog).toBeVisible({ timeout: 30_000 })
    await expect
      .poll(() => dialog.locator('img[data-loaded]').count(), {
        timeout: 30_000,
      })
      .toBe(12)
    expect(await axeViolations(page)).toEqual([])
  })

  test('공유 주소로 들어오면 그 조합의 구성기가 3D와 함께 열린다', async ({
    page,
  }) => {
    await page.goto('/?dial=crimson&light=night&view=back#colors')
    await fontsReady(page)
    await expect(page.getByRole('radio', { name: '크림슨 래커' })).toBeChecked()
    await expect(page.getByRole('radio', { name: '야광' })).toBeChecked()
    await expect(page.getByRole('radio', { name: '뒷면' })).toBeChecked()
    await expect(page.locator('#colors canvas')).toHaveCount(1, {
      timeout: 30_000,
    })
    expect(await axeViolations(page)).toEqual([])
  })

  test('?debug로 디버그 패널(lil-gui)이 열린 채 뜬다', async ({ page }) => {
    await page.goto('/?debug')
    const panel = page.getByRole('region', { name: '디버그 패널' })
    await expect(panel).toBeVisible({ timeout: 30_000 })
    await expect(panel.getByLabel('입자 수')).toBeVisible()
  })

  test('편집기 소개 페이지가 3D 무대와 함께 뜬다', async ({ page }) => {
    await page.goto('/editor/')
    await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(
      'The Crimson Arc: Draw in layers Move in frames',
    )
    await fontsReady(page)
    expect(await axeViolations(page)).toEqual([])
    // 3D 캔버스는 첫 화면 뒤에 받습니다.
    await expect(page.locator('canvas[data-engine]')).toHaveCount(1, {
      timeout: 60_000,
    })
  })

  test('스튜디오가 샘플 작품과 함께 뜨고 재생된다', async ({ page }) => {
    await page.goto('/studio/')
    await expect(
      page.getByRole('heading', { level: 1, name: 'Studio' }),
    ).toBeVisible()
    await expect(
      page.getByText('64×64 · 12fps · 레이어 4 · 프레임 12'),
    ).toBeVisible()
    await fontsReady(page)
    expect(await axeViolations(page)).toEqual([])
    await page.getByRole('button', { name: '재생' }).click()
    await expect(page.getByRole('button', { name: '정지' })).toBeVisible()
  })

  test('성능 비교 페이지가 측정 버튼과 함께 뜬다', async ({ page }) => {
    await page.goto('/bench/')
    await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(
      'Canvas · DOM · SVG 성능 비교',
    )
    await expect(
      page.getByRole('button', { name: '측정 시작 (약 30초)' }),
    ).toBeEnabled()
    await fontsReady(page)
    expect(await axeViolations(page)).toEqual([])
  })

  test('404 페이지가 돌아갈 링크와 함께 뜬다', async ({ page }) => {
    await page.goto('/404.html')
    await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(
      '404: Frame not found',
    )
    await expect(page.getByRole('link', { name: '첫 화면으로' })).toBeVisible()
    await fontsReady(page)
    expect(await axeViolations(page)).toEqual([])
  })

  test('Storybook이 첫 스토리를 그린다', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Storybook 화면은 데스크톱에서만 봅니다.')
    await page.goto('/storybook/')
    const preview = page.frameLocator('#storybook-preview-iframe')
    await expect(preview.locator('#storybook-root > *').first()).toBeVisible({
      timeout: 30_000,
    })
  })
})

test.describe('다시 방문(서비스 워커)', () => {
  test.describe.configure({ timeout: 180_000 })
  // Playwright는 Chromium에서만 서비스 워커의 요청까지 가로챌 수 있습니다. 화면 크기와 상관없어 데스크톱만 돌립니다.
  test.skip(
    ({ browserName, isMobile }) => browserName !== 'chromium' || isMobile,
    'Chromium 데스크톱에서만 돌립니다.',
  )
  test.use({ serviceWorkers: 'allow' })
  test.beforeEach(({ page }) => skipIntro(page))

  test('한 번 들어온 뒤에는 서버까지 끊겨도 모든 페이지가 뜬다', async ({
    page,
    context,
  }) => {
    const errors = collectErrors(page)
    // 서비스 워커는 페이지를 다 읽은 뒤 등록되므로, 느린 회선에서는 첫 화면 시퀀스 프레임을 서비스 워커가 맡기 전에 받습니다.
    // 그 경우를 늘 재현하도록 sw.js 응답을 첫 화면 프레임을 다 받을 때까지 붙잡아 둡니다.
    let releaseWorker = () => {}
    const heroLoaded = new Promise<void>((resolve) => {
      releaseWorker = resolve
    })
    await context.route('**/sw.js', async (route) => {
      await heroLoaded
      await route.fallback()
    })
    await page.goto('/')
    await heroReady(page)
    releaseWorker()
    // 설치(모든 페이지 미리 받기)가 끝나 이 페이지를 맡을 때까지 기다립니다.
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready
      if (navigator.serviceWorker.controller) return
      await new Promise((resolve) =>
        navigator.serviceWorker.addEventListener('controllerchange', resolve, {
          once: true,
        }),
      )
    })
    // 서비스 워커가 맡기 전에 받은 시퀀스 프레임도 캐시에 담길 때까지 기다립니다.
    await expect
      .poll(() =>
        page.evaluate(async () => {
          const frames = performance
            .getEntriesByType('resource')
            .map((entry) => entry.name)
            .filter((url) => new URL(url).pathname.includes('/sequence/'))
          const cached = await Promise.all(
            frames.map((url) => caches.match(url, { ignoreVary: true })),
          )
          return frames.length > 0 && cached.every(Boolean)
        }),
      )
      .toBe(true)
    // 같은 주소를 쓰는 다른 프로젝트와 겹치지 않게 캐시 이름은 crimson-arc:로 시작합니다.
    expect(
      await page.evaluate(async () =>
        (await caches.keys()).every((key) => key.startsWith('crimson-arc:')),
      ),
    ).toBe(true)

    // 이제 localhost까지 모든 요청을 끊습니다(인터넷이 끊긴 채 다시 방문).
    await context.route('**/*', (route) => route.abort('internetdisconnected'))

    await page.reload()
    await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(
      'The Crimson Arc A-01',
    )
    await heroReady(page)

    await page.goto('/?dial=crimson&light=night#colors')
    await expect(page.getByRole('radio', { name: '크림슨 래커' })).toBeChecked()
    await expect(page.locator('#colors canvas')).toHaveCount(1, {
      timeout: 60_000,
    })

    await page.goto('/editor/')
    await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(
      'The Crimson Arc: Draw in layers Move in frames',
    )
    await expect(page.locator('canvas[data-engine]')).toHaveCount(1, {
      timeout: 60_000,
    })

    await page.goto('/studio/')
    await expect(
      page.getByText('64×64 · 12fps · 레이어 4 · 프레임 12'),
    ).toBeVisible()

    // 끝 빗금이 없는 주소도 같은 페이지로 답합니다.
    await page.goto('/bench')
    await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(
      'Canvas · DOM · SVG 성능 비교',
    )

    // 받아 두지 않은 주소는 404 페이지로 답합니다.
    await page.goto('/no-such-page/')
    await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(
      '404: Frame not found',
    )
    await fontsReady(page)
    // 끊긴 요청에서 나는 네트워크 오류 말고는 오류가 없어야 합니다.
    expect(
      errors.filter((error) => !error.includes('Failed to load resource')),
    ).toEqual([])
  })
})
