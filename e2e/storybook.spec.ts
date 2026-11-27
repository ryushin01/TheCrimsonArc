import { expect, test } from '@playwright/test'
import { axeViolations, collectErrors } from './helpers'
import { SETTLE_CSS, builtStories, storyUrl } from './stories'

/*
 * Storybook 접근성: 빌드한 모든 스토리를 열어 axe(WCAG 2.2 AA) 위반이 있으면 실패시킵니다.
 * Storybook의 addon-a11y(.storybook/preview.tsx의 a11y.test = 'error')가 화면에서 보여 주는 검사를 CI에서 강제하는 것입니다.
 * 스토리는 화면 크기·엔진과 상관없어 Chromium 데스크톱에서만 돌립니다. (먼저 pnpm build:all)
 */
const stories = builtStories()

test.describe('Storybook 스토리 접근성', () => {
  test.skip(
    ({ browserName, isMobile }) => browserName !== 'chromium' || isMobile,
    'Chromium 데스크톱에서만 돌립니다.',
  )

  test('빌드한 스토리가 있다', () => {
    expect(stories.length).toBeGreaterThan(0)
  })

  for (const story of stories) {
    test(`${story.title} / ${story.name}`, async ({ page }) => {
      const errors = collectErrors(page)
      await page.goto(storyUrl(story.id))
      // 스토리를 다 그리면 Storybook이 body에 sb-show-main을 붙입니다(오류면 sb-show-errordisplay).
      await expect(page.locator('body')).toHaveClass(/sb-show-main/, {
        timeout: 30_000,
      })
      await page.addStyleTag({ content: SETTLE_CSS })
      expect(await axeViolations(page, '#storybook-root')).toEqual([])
      expect(errors).toEqual([])
    })
  }
})
