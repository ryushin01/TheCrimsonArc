import { type Page, expect, test } from '@playwright/test'
import {
  axeViolations,
  collectErrors,
  expectNoHorizontalOverflow,
  tabKey,
} from './helpers'

/** 첫 화면 자료(핵심 프레임·글꼴)를 다 받을 때까지 기다립니다. (로더 자체 제한 12초 + 부하가 큰 환경의 여유) */
async function waitForLoaded(page: Page) {
  await expect(
    page.getByRole('progressbar', { name: '제품 이미지 불러오기' }),
  ).toHaveCount(0, {
    timeout: 30_000,
  })
}

/** 시퀀스 구간의 진행도(0~1) 위치로 스크롤합니다. */
async function scrollAnatomy(page: Page, progress: number) {
  await page.evaluate((p) => {
    const section = document.getElementById('anatomy')!
    const top = section.getBoundingClientRect().top + window.scrollY
    window.scrollTo(0, top + p * (section.offsetHeight - window.innerHeight))
  }, progress)
}

test.describe('시계 쇼케이스 첫 화면', () => {
  // 캔버스·Worker·3D가 함께 도는 무거운 페이지라 병렬 실행에서 시간을 넉넉히 둡니다.
  test.describe.configure({ timeout: 120_000 })

  test('제목·랜드마크가 있고 로딩을 마치면 첫 화면 캔버스가 오류 없이 돈다', async ({
    page,
  }) => {
    const errors = collectErrors(page)
    await page.goto('/')
    await expect(page).toHaveTitle(/The Crimson Arc CA-01/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'ko')
    await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(
      'The Crimson Arc CA-01',
    )
    await expect(page.getByRole('banner')).toBeVisible()
    await expect(page.getByRole('main')).toBeVisible()
    await expect(page.getByRole('contentinfo')).toBeAttached()
    await waitForLoaded(page)
    // 캔버스는 hero-canvas.ts가 만들어 넣으며 보조기기에서는 숨깁니다.
    await expect(
      page.locator('section[aria-labelledby] > canvas[aria-hidden="true"]'),
    ).toHaveCount(1)
    expect(errors).toEqual([])
  })

  for (const width of [390, 768, 1440]) {
    test(`${width}px에서 어느 구간도 가로로 넘치지 않는다`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/')
      await waitForLoaded(page)
      for (const id of ['anatomy', 'details', 'colors', 'specs', 'lab']) {
        // 부드러운 스크롤이 움직이는 동안 '멈춘 요소'를 기다리지 않도록 바로 옮깁니다.
        await page.evaluate((target) => {
          document.getElementById(target)?.scrollIntoView({ block: 'start' })
        }, id)
        await expectNoHorizontalOverflow(page)
      }
    })
  }

  test('axe 접근성 검사를 통과한다 (첫 화면, 구성기, 사양)', async ({
    page,
  }) => {
    await page.goto('/')
    await waitForLoaded(page)
    expect(await axeViolations(page)).toEqual([])
    await page.locator('#colors').scrollIntoViewIfNeeded()
    await expect(page.locator('#colors canvas')).toHaveCount(1, {
      timeout: 20_000,
    })
    expect(await axeViolations(page, '#colors')).toEqual([])
    await page.locator('#specs').scrollIntoViewIfNeeded()
    expect(await axeViolations(page, '#specs')).toEqual([])
  })

  test('본문 바로가기와 메뉴 링크로 키보드 초점이 옮겨진다', async ({
    page,
    isMobile,
    browserName,
  }) => {
    test.skip(isMobile, '모바일은 메뉴 버튼으로 엽니다')
    await page.goto('/')
    // React가 화면을 다 그린 뒤에 Tab을 눌러야 본문 바로가기가 첫 초점을 받습니다.
    await page.getByRole('heading', { level: 1 }).waitFor()
    await page.keyboard.press(tabKey(browserName))
    await expect(
      page.getByRole('link', { name: '본문 바로가기' }),
    ).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.locator('#main')).toBeFocused()
    await page
      .getByRole('link', { name: 'Details (핵심 기능)' })
      .first()
      .click()
    await expect(page.locator('#details')).toBeFocused()
    await expect(page).toHaveURL(/#details$/)
  })

  test('스크롤하면 이미지 시퀀스가 넘어가고 구간 설명이 바뀐다', async ({
    page,
  }) => {
    await page.goto('/')
    await waitForLoaded(page)
    await scrollAnatomy(page, 0.3)
    const caseback = page.locator('#anatomy li', {
      hasText: '나사로 잠그는 케이스백',
    })
    await expect(caseback).toHaveAttribute('data-active', 'true')
    await expect(page.locator('#anatomy li[data-active="true"]')).toHaveCount(1)
    // 캔버스에 시계가 그려졌는지 가운데 픽셀의 불투명도로 확인합니다.
    const painted = await page
      .locator('#anatomy canvas')
      .evaluate((canvas: HTMLCanvasElement) => {
        const context = canvas.getContext('2d')!
        const { data } = context.getImageData(
          canvas.width / 2,
          canvas.height / 2,
          1,
          1,
        )
        return data[3]
      })
    expect(painted).toBeGreaterThan(200)
    await scrollAnatomy(page, 0.95)
    await expect(
      page.locator('#anatomy li', { hasText: '크림슨 호 브리지 아래의 심장' }),
    ).toHaveAttribute('data-active', 'true')
    // 스크롤을 시작하면 나머지 프레임도 받습니다.
    await expect
      .poll(
        () =>
          page.evaluate(
            () =>
              performance
                .getEntriesByType('resource')
                .filter((entry) => entry.name.includes('/sequence/')).length,
          ),
        { timeout: 20_000 },
      )
      .toBeGreaterThan(180)
  })

  test('단계를 지나면 입자 모양과 지금 단계 표시가 바뀐다', async ({
    page,
  }) => {
    await page.goto('/')
    await waitForLoaded(page)
    const steps = page.locator('#details li')
    await steps.nth(2).scrollIntoViewIfNeeded()
    await steps
      .nth(2)
      .evaluate((element) => element.scrollIntoView({ block: 'center' }))
    await expect(steps.nth(2)).toHaveAttribute('aria-current', 'step')
    await expect(
      page.getByRole('img', { name: '입자로 그린 4Hz' }),
    ).toBeAttached()
  })

  test('견본을 고르면 3D 시계와 상태 문장이 바뀐다', async ({ page }) => {
    await page.goto('/')
    await page.locator('#colors').scrollIntoViewIfNeeded()
    await expect(page.locator('#colors canvas')).toHaveCount(1, {
      timeout: 20_000,
    })
    await page.getByRole('radio', { name: '크림슨 래커' }).check()
    await page.getByRole('radio', { name: '야광' }).check()
    const status = page
      .locator('#colors')
      .getByRole('status')
      .filter({ hasText: '문자판' })
    await expect(status).toHaveText(
      '크림슨 래커 문자판, 비드블라스트 스틸 케이스, 블랙 가죽, 야광 조명',
    )
    await page.getByRole('radio', { name: '뒷면' }).check()
    await expect(page.getByRole('img', { name: /\(뒷면\)$/ })).toBeAttached()
  })

  test('움직임 멈춤 버튼으로 자동 연출을 멈추고 다시 켠다', async ({
    page,
  }) => {
    await page.goto('/')
    const toggle = page.getByRole('button', { name: /움직임 (멈춤|재생)/ })
    const before = await page.locator('html').getAttribute('data-motion')
    await toggle.click()
    expect(await page.locator('html').getAttribute('data-motion')).not.toBe(
      before,
    )
    await toggle.click()
    await expect(page.locator('html')).toHaveAttribute(
      'data-motion',
      before ?? 'playing',
    )
  })

  test('오른쪽 위 Debug 버튼으로 lil-gui 패널과 FPS 그래프를 연다', async ({
    page,
    isMobile,
  }) => {
    test.skip(
      isMobile,
      '디버그 버튼은 좁은 화면에서 숨깁니다 (?debug로 열 수 있음)',
    )
    await page.goto('/')
    const toggle = page.getByRole('button', { name: 'Debug', exact: true })
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    const panel = page.getByRole('region', { name: '디버그 패널' })
    await expect(
      panel.getByRole('button', { name: 'Debug · lil-gui' }),
    ).toBeVisible()
    await expect(panel.getByLabel('입자 수')).toBeVisible()
    await expect(panel.getByRole('img', { name: /FPS 그래프/ })).toBeVisible()
    expect(await axeViolations(page, '.lil-gui')).toEqual([])
    await toggle.click()
    await expect(panel).toBeHidden()
  })

  test('주소에 ?debug를 붙이면 디버그 패널이 열린 채로 시작한다', async ({
    page,
  }) => {
    await page.goto('/?debug')
    await expect(
      page.getByRole('region', { name: '디버그 패널' }),
    ).toBeVisible()
  })
})

test.describe('성능 비교 페이지 (/bench/)', () => {
  test('세 방식을 실제로 재서 표를 채운다', async ({ page }) => {
    test.setTimeout(120_000)
    const errors = collectErrors(page)
    await page.goto('/bench/')
    await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(
      'Canvas · DOM · SVG 성능 비교',
    )
    expect(await axeViolations(page)).toEqual([])
    await page.waitForFunction(() => typeof window.__runBench === 'function')
    const results = await page.evaluate(() =>
      window.__runBench?.({ warmupMs: 100, measureMs: 250 }),
    )
    expect(results).toHaveLength(12)
    await expect(page.getByRole('status')).toHaveText(/측정을 마쳤습니다/)
    await expect(page.getByRole('cell', { name: /fps/ })).toHaveCount(12)
    expect(errors).toEqual([])
  })
})
