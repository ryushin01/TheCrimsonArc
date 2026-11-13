import { type Page, expect, test } from '@playwright/test'
import {
  axeViolations,
  collectErrors,
  expectNoHorizontalOverflow,
  sampleGif,
} from './helpers'

async function openStudio(page: Page) {
  await page.goto('/studio/')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Studio' }),
  ).toBeVisible()
  return page.getByRole('application', { name: /그림 캔버스/ })
}

function undoSteps(page: Page) {
  return page.getByText(/되돌리기 \d+단계/)
}

test.describe('스튜디오', () => {
  test('샘플 작품과 빈 레이어로 시작하고 axe 검사를 통과한다', async ({
    page,
  }) => {
    const errors = collectErrors(page)
    await openStudio(page)
    await expect(
      page.getByText('64×64 · 12fps · 레이어 4 · 프레임 12'),
    ).toBeVisible()
    await expect(page.getByRole('radio', { name: /내 그림/ })).toBeChecked()
    await expect(page.getByRole('button', { name: '되돌리기' })).toBeDisabled()
    expect(await axeViolations(page)).toEqual([])
    await expectNoHorizontalOverflow(page)
    expect(errors).toEqual([])
  })

  test('마우스로 그리면 되돌리기·다시 하기가 된다', async ({ page }) => {
    const canvas = await openStudio(page)
    await canvas.scrollIntoViewIfNeeded()
    const box = await canvas.boundingBox()
    if (!box) throw new Error('캔버스 크기를 알 수 없습니다.')
    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.2)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.4, {
      steps: 8,
    })
    await page.mouse.up()
    await expect(undoSteps(page)).toHaveText('되돌리기 1단계')

    await page.getByRole('button', { name: '되돌리기' }).click()
    await expect(undoSteps(page)).toHaveText('되돌리기 0단계')
    await page.getByRole('button', { name: '다시 하기' }).click()
    await expect(undoSteps(page)).toHaveText('되돌리기 1단계')
  })

  test('키보드만으로 그리고 Ctrl+Z로 되돌린다', async ({ page }) => {
    const canvas = await openStudio(page)
    await canvas.focus()
    await page.keyboard.down('Space')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.up('Space')
    await expect(undoSteps(page)).toHaveText('되돌리기 1단계')
    await expect(
      page.getByRole('status').filter({ hasText: 'x 34, y 33' }),
    ).toBeAttached()

    // 도구 단축키는 캔버스에 초점이 있을 때만 동작합니다.
    await page.keyboard.press('g')
    await expect(page.getByRole('radio', { name: /채우기/ })).toBeChecked()
    // 방금 그린 칸이 아닌 빈 곳으로 옮겨 채웁니다.
    await page.keyboard.press('Shift+ArrowDown')
    await page.keyboard.press('Enter')
    await expect(undoSteps(page)).toHaveText('되돌리기 2단계')

    await page.keyboard.press('ControlOrMeta+z')
    await expect(undoSteps(page)).toHaveText('되돌리기 1단계')
    await page.keyboard.press('ControlOrMeta+Shift+z')
    await expect(undoSteps(page)).toHaveText('되돌리기 2단계')
  })

  test('숨긴 레이어에는 그리지 않고 이유를 알린다', async ({ page }) => {
    const canvas = await openStudio(page)
    await page.getByRole('checkbox', { name: '내 그림 보이기' }).uncheck()
    await canvas.focus()
    await page.keyboard.press('Enter')
    await expect(
      page
        .getByRole('status')
        .filter({ hasText: '숨겨져 있어 그릴 수 없습니다' }),
    ).toBeAttached()
  })

  test('레이어와 프레임을 더하고 지우고 되돌린다', async ({ page }) => {
    await openStudio(page)
    const layers = page.getByRole('region', { name: /레이어/ })
    await layers.getByRole('button', { name: '추가' }).click()
    await expect(page.getByText('레이어 5 · 프레임 12')).toBeVisible()
    await layers.getByRole('button', { name: '삭제' }).click()
    await expect(page.getByText('레이어 4 · 프레임 12')).toBeVisible()

    const frames = page.getByRole('region', { name: /프레임/ })
    await frames.getByRole('button', { name: '복제' }).click()
    await expect(page.getByText('레이어 4 · 프레임 13')).toBeVisible()
    await expect(frames.getByRole('radio', { name: '프레임 02' })).toBeChecked()
    await page.getByRole('button', { name: '되돌리기' }).click()
    await expect(page.getByText('레이어 4 · 프레임 12')).toBeVisible()
  })

  test('재생하면 프레임이 넘어가고 정지하면 멈춘다', async ({ page }) => {
    await openStudio(page)
    const play = page.getByRole('button', { name: '재생' })
    await play.click()
    await expect(page.getByRole('button', { name: '정지' })).toBeVisible()
    await expect(
      page.getByRole('heading', { name: /프레임 (?!1\/)\d+\/12/ }),
    ).toBeVisible()
    await page.getByRole('button', { name: '정지' }).click()
    await expect(page.getByRole('button', { name: '재생' })).toBeVisible()
  })

  test('새로 만들기는 잘못된 크기를 알리고 고치면 만든다', async ({ page }) => {
    await openStudio(page)
    await page.getByRole('button', { name: '새로 만들기' }).click()
    const dialog = page.getByRole('dialog', { name: '새로 만들기' })
    await expect(dialog).toBeVisible()
    const width = dialog.getByRole('spinbutton', { name: '너비' })
    await expect(width).toBeFocused()
    await width.fill('300')
    await dialog.getByRole('button', { name: '만들기' }).click()
    await expect(width).toHaveAttribute('aria-invalid', 'true')
    await expect(width).toHaveAccessibleDescription(
      /너비은\(는\) 8에서 256 사이의 정수로 입력하세요/,
    )
    expect(await axeViolations(page)).toEqual([])

    await width.fill('32')
    await dialog.getByRole('spinbutton', { name: '높이' }).fill('24')
    await dialog.getByRole('button', { name: '만들기' }).click()
    await expect(dialog).toBeHidden()
    await expect(
      page.getByText('32×24 · 12fps · 레이어 1 · 프레임 1'),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: '새로 만들기' }),
    ).toBeFocused()
  })

  test('움직이는 GIF를 열면 프레임째 들어오고, 레이어로도 가져온다', async ({
    page,
  }) => {
    await openStudio(page)
    const file = {
      name: 'walk.gif',
      mimeType: 'image/gif',
      buffer: sampleGif(4),
    }
    await page.locator('input[type="file"]').first().setInputFiles(file)
    await expect(
      page.getByText('20×12 · 10fps · 레이어 1 · 프레임 4'),
    ).toBeVisible()

    await page.locator('input[type="file"]').nth(1).setInputFiles(file)
    await expect(
      page.getByText('20×12 · 10fps · 레이어 2 · 프레임 4'),
    ).toBeVisible()
    await expect(
      page.getByRole('radio', { name: /walk/ }).first(),
    ).toBeChecked()
  })

  test('내보내기에서 GIF와 스프라이트 시트를 내려받는다', async ({ page }) => {
    await openStudio(page)
    await page.getByRole('button', { name: '내보내기' }).click()
    const dialog = page.getByRole('dialog', { name: '내보내기' })
    await dialog.getByRole('radio', { name: '×2 (128×128)' }).check()
    await dialog.getByRole('button', { name: 'GIF 만들기' }).click()
    await expect(dialog.getByRole('status')).toContainText(
      'GIF 애니메이션을 만들었습니다',
      { timeout: 20_000 },
    )
    const gif = page.waitForEvent('download')
    await dialog
      .getByRole('link', { name: 'crimson-arc-studio.gif 내려받기' })
      .click()
    expect((await gif).suggestedFilename()).toBe('crimson-arc-studio.gif')

    await dialog.getByRole('radio', { name: 'PNG 스프라이트 시트' }).check()
    await dialog.getByRole('button', { name: 'PNG 만들기' }).click()
    await expect(
      dialog.getByRole('img', { name: /1536×128픽셀/ }),
    ).toBeVisible()
    expect(await axeViolations(page)).toEqual([])
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
  })
})
