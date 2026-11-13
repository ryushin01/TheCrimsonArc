import { expect, test } from '@playwright/test'
import {
  axeViolations,
  collectErrors,
  expectNoHorizontalOverflow,
  sampleGif,
} from './helpers'

test.describe('홍보 페이지', () => {
  test('제목·랜드마크가 있고 3D 무대가 오류 없이 뜬다', async ({ page }) => {
    const errors = collectErrors(page)
    await page.goto('/')
    await expect(page).toHaveTitle(/The Crimson Arc/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'ko')
    await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(
      'The Crimson Arc: Draw in layers Move in frames',
    )
    await expect(page.getByRole('banner')).toBeVisible()
    await expect(page.getByRole('main')).toBeVisible()
    // 좁은 화면에서는 메뉴가 접혀 있어 숨은 요소까지 찾습니다.
    await expect(
      page.getByRole('navigation', { name: '주 메뉴', includeHidden: true }),
    ).toBeAttached()
    await expect(page.getByRole('contentinfo')).toBeAttached()
    // 3D 캔버스는 첫 화면 뒤에 받습니다.
    await expect(page.locator('canvas[data-engine]')).toHaveCount(1, {
      timeout: 20_000,
    })
    expect(errors).toEqual([])
  })

  for (const width of [390, 768, 1440]) {
    test(`${width}px에서 가로로 넘치지 않는다`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/')
      await page.getByRole('heading', { level: 1 }).waitFor()
      await expectNoHorizontalOverflow(page)
      await page.locator('#specs').scrollIntoViewIfNeeded()
      await expectNoHorizontalOverflow(page)
    })
  }

  test('axe 접근성 검사를 통과한다', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('heading', { level: 1 }).waitFor()
    expect(await axeViolations(page)).toEqual([])
  })

  test('본문 바로가기와 메뉴 링크로 키보드 초점이 옮겨진다', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, '모바일은 메뉴 버튼으로 엽니다')
    await page.goto('/')
    await page.keyboard.press('Tab')
    const skip = page.getByRole('link', { name: '본문 바로가기' })
    await expect(skip).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.locator('#main')).toBeFocused()

    await page.getByRole('link', { name: 'Frames (프레임)' }).first().click()
    await expect(page.locator('#frames')).toBeFocused()
    await expect(page).toHaveURL(/#frames$/)
  })

  test('모바일 메뉴는 펼침 상태를 알리고 링크를 누르면 닫힌다', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, '좁은 화면 전용')
    await page.goto('/')
    const button = page.getByRole('button', { name: '메뉴' })
    await button.click()
    await expect(button).toHaveAttribute('aria-expanded', 'true')
    await page
      .getByRole('link', { name: 'Export (GIF 내보내기)' })
      .first()
      .click()
    await expect(button).toHaveAttribute('aria-expanded', 'false')
  })

  test('움직임 멈춤 버튼으로 자동 연출을 멈추고 다시 켠다', async ({
    page,
  }) => {
    await page.goto('/')
    const toggle = page.getByRole('button', { name: /움직임 (멈춤|재생)/ })
    const before = await page.locator('html').getAttribute('data-motion')
    await toggle.click()
    const after = await page.locator('html').getAttribute('data-motion')
    expect(after).not.toBe(before)
    await toggle.click()
    await expect(page.locator('html')).toHaveAttribute(
      'data-motion',
      before ?? 'playing',
    )
  })

  test('레이어를 끄면 합친 결과의 설명이 바뀐다', async ({ page }) => {
    await page.goto('/#layers')
    await page.getByRole('checkbox', { name: /배경/ }).uncheck()
    await expect(
      page.getByRole('img', { name: /합친 결과: 아치, 혜성/ }),
    ).toBeVisible()
  })

  test('샘플 애니메이션을 실제 GIF로 만들어 내려받는다', async ({ page }) => {
    await page.goto('/#export')
    const panel = page.locator('#export')
    await panel.getByRole('button', { name: 'GIF 만들기' }).click()
    await expect(panel.getByRole('status')).toContainText(
      'GIF 애니메이션을 만들었습니다',
      { timeout: 20_000 },
    )
    await expect(
      panel.getByRole('img', {
        name: /만든 GIF 애니메이션 미리보기, 256×256픽셀, 프레임 12장/,
      }),
    ).toBeVisible()

    const download = page.waitForEvent('download')
    await panel
      .getByRole('link', { name: 'crimson-arc-sample.gif 내려받기' })
      .click()
    const file = await download
    expect(file.suggestedFilename()).toBe('crimson-arc-sample.gif')
    const stream = await file.createReadStream()
    const chunks: Buffer[] = []
    for await (const chunk of stream) chunks.push(chunk as Buffer)
    expect(Buffer.concat(chunks).subarray(0, 6).toString('ascii')).toBe(
      'GIF89a',
    )
  })

  test('움직이는 GIF를 열어 픽셀 아트로 바꾸고 스튜디오로 넘긴다', async ({
    page,
  }) => {
    await page.goto('/#open')
    const section = page.locator('#open')
    await section.locator('input[type="file"]').setInputFiles({
      name: 'walk.gif',
      mimeType: 'image/gif',
      buffer: sampleGif(3),
    })
    await expect(
      section.getByRole('status').filter({ hasText: '열었습니다' }),
    ).toHaveText('‘walk.gif’을(를) 열었습니다. 20×12, 프레임 3장')
    await section.getByRole('radio', { name: '32px' }).check()
    await expect(
      section.getByRole('img', { name: /픽셀 아트로 바꾼 이미지, 20×12픽셀/ }),
    ).toBeVisible()

    await section
      .getByRole('button', { name: '스튜디오에서 이어 그리기' })
      .click()
    await expect(page).toHaveURL(/\/studio\/$/)
    await expect(
      page.getByRole('status').filter({ hasText: '홍보 페이지에서 넘긴' }),
    ).toBeAttached()
    await expect(
      page.getByText(/20×12 · 10fps · 레이어 1 · 프레임 3/),
    ).toBeVisible()
  })

  test('잘못된 파일은 원인과 방법을 알린다', async ({ page }) => {
    await page.goto('/#open')
    const section = page.locator('#open')
    await section.locator('input[type="file"]').setInputFiles({
      name: 'notes.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('hello'),
    })
    await expect(section.getByRole('alert')).toHaveText(
      '‘notes.txt’은(는) 열 수 없는 형식입니다. PNG · JPG · GIF · WebP 이미지를 골라 주세요.',
    )
  })

  test('lil-gui 튜닝 패널을 열고 닫는다', async ({ page, isMobile }) => {
    test.skip(isMobile, '디버그 패널은 600px 미만에서 숨깁니다')
    await page.goto('/')
    const toggle = page.getByRole('button', { name: '튜닝' })
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    const panel = page.getByRole('region', { name: '3D 튜닝 패널' })
    await expect(
      panel.getByRole('button', { name: 'Arc tuning · lil-gui' }),
    ).toBeVisible()
    // 터치 기기에서는 lil-gui가 숫자 입력을 type="number"로 바꾸므로 레이블로 찾습니다.
    await expect(panel.getByLabel('조각(레이어) 수')).toBeVisible()
    expect(await axeViolations(page, '.lil-gui')).toEqual([])
    await toggle.click()
    await expect(panel).toBeHidden()
  })
})

test('없는 주소는 404 페이지를 보여 준다', async ({ page }) => {
  await page.goto('/404.html')
  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(
    '404: Frame not found',
  )
  expect(await axeViolations(page)).toEqual([])
})
