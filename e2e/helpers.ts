import AxeBuilder from '@axe-core/playwright'
import { type Page, expect } from '@playwright/test'
import { encodeAnimation } from '../src/shared/lib/gif'

/** WCAG 2.2 AA까지의 axe 규칙으로 검사하고 위반 목록을 돌려줍니다. */
export async function axeViolations(
  page: Page,
  include?: string,
): Promise<string[]> {
  let builder = new AxeBuilder({ page }).withTags([
    'wcag2a',
    'wcag2aa',
    'wcag21a',
    'wcag21aa',
    'wcag22aa',
  ])
  if (include) builder = builder.include(include)
  const results = await builder.analyze()
  return results.violations.map(
    (violation) =>
      `${violation.id}: ${violation.nodes
        .slice(0, 3)
        .map((node) => node.target.join(' '))
        .join(' | ')}`,
  )
}

/**
 * 첫 화면 인트로(조디악 다이얼)를 이번 탭에서 이미 본 것으로 남겨, 첫 화면에서 바로 시작합니다.
 * 키는 src/pages/home/lib/intro.ts의 INTRO_SEEN_KEY와 같습니다. 인트로 자체는 intro.spec.ts에서 확인합니다.
 */
export async function skipIntro(page: Page): Promise<void> {
  await page.addInitScript(() => {
    try {
      window.sessionStorage.setItem('crimson-arc:intro', 'seen')
    } catch {
      // 저장소를 쓸 수 없는 환경이면 인트로가 열립니다.
    }
  })
}

/** 페이지 오류(콘솔 error, 잡히지 않은 예외)를 모읍니다. */
export function collectErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  return errors
}

export async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
}

/** 프레임마다 색이 바뀌는 작은 움직이는 GIF (테스트용 파일) */
export function sampleGif(frameCount = 3, width = 20, height = 12): Buffer {
  const frames = Array.from({ length: frameCount }, (_, index) => {
    const rgba = new Uint8ClampedArray(width * height * 4)
    for (let i = 0; i < rgba.length; i += 4)
      rgba.set([200, index * 60, 80, 255], i)
    return { rgba, delayMs: 100 }
  })
  return Buffer.from(encodeAnimation({ width, height, frames, loop: 0 }).bytes)
}

/**
 * 링크까지 초점을 옮기는 Tab 키. macOS Safari(WebKit)는 기본 설정에서 Tab이 입력 칸만 오가고
 * 링크는 Option+Tab으로 옮겨 가므로 WebKit에서는 Alt+Tab을 씁니다.
 */
export function tabKey(browserName: string): string {
  return browserName === 'webkit' ? 'Alt+Tab' : 'Tab'
}
