import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { type Page, expect, test } from '@playwright/test'
import { skipIntro } from './helpers'

/*
 * 성능: 3D 화면(쇼케이스 구성기, 편집기 무대)에서 Web Vitals(LCP·CLS·INP)와 프레임을 잽니다.
 * - Web Vitals는 Google의 web-vitals 라이브러리(개발 의존성)를 페이지에 넣어 브라우저가 낸 값을 그대로 읽습니다.
 * - 기준은 Web Vitals의 '좋음'(LCP 2.5초, CLS 0.1, INP 200ms)입니다.
 *   CI에는 GPU가 없어 3D를 소프트웨어(SwiftShader)로 그리므로 프레임은 '멈추지 않고 돈다' 수준만 봅니다.
 * - 측정값은 테스트 첨부(annotations)로 남겨 리포트에서 볼 수 있습니다.
 * 기기·엔진에 따라 달라지는 값이라 Chromium 데스크톱에서만 돌립니다. Lighthouse(lighthouserc.cjs)와 함께 봅니다.
 */

const VITALS = { lcp: 2500, cls: 0.1, inp: 200 }
/** 프레임 기준: 평균 FPS가 이 값 이상이고, 1초 넘게 멈춘 프레임이 없어야 합니다. */
const FRAMES = { minFps: 10, maxFrameMs: 1000 }

const require = createRequire(import.meta.url)
// 패키지 exports에 IIFE 파일이 없어 기본 진입점(dist/) 옆의 파일을 씁니다.
// 초기화 스크립트는 함수 안에서 돌아 `var webVitals`가 전역에 남지 않으므로 window에 직접 붙입니다.
const WEB_VITALS = `${readFileSync(
  join(dirname(require.resolve('web-vitals')), 'web-vitals.iife.js'),
  'utf8',
)}\nwindow.webVitals = webVitals`

interface Vitals {
  lcp: number | null
  cls: number | null
  inp: number | null
}

/** 페이지를 열기 전에 web-vitals를 넣어, 값이 바뀔 때마다 window.__vitals에 남깁니다. */
async function watchVitals(page: Page) {
  await page.addInitScript({ content: WEB_VITALS })
  await page.addInitScript(() => {
    const vitals: Record<string, number | null> = {
      lcp: null,
      cls: null,
      inp: null,
    }
    Reflect.set(window, '__vitals', vitals)
    const api: unknown = Reflect.get(window, 'webVitals')
    if (typeof api !== 'object' || api === null) return
    const keep =
      (name: string) =>
      ({ value }: { value: number }) => {
        vitals[name] = value
      }
    for (const [name, fn] of [
      ['lcp', 'onLCP'],
      ['cls', 'onCLS'],
      ['inp', 'onINP'],
    ] as const) {
      const register: unknown = Reflect.get(api, fn)
      if (typeof register === 'function')
        register(keep(name), { reportAllChanges: true })
    }
  })
}

function readVitals(page: Page): Promise<Vitals> {
  return page.evaluate(() => {
    const value: unknown = Reflect.get(window, '__vitals')
    const pick = (key: string) => {
      const v: unknown =
        typeof value === 'object' && value !== null
          ? Reflect.get(value, key)
          : null
      return typeof v === 'number' ? v : null
    }
    return { lcp: pick('lcp'), cls: pick('cls'), inp: pick('inp') }
  })
}

/** requestAnimationFrame 간격을 durationMs 동안 재서 평균 FPS와 가장 긴 프레임(ms)을 돌려줍니다. */
function measureFrames(page: Page, durationMs = 3000) {
  return page.evaluate(
    (duration) =>
      new Promise<{ fps: number; maxFrameMs: number }>((resolve) => {
        const times: number[] = []
        const tick = (now: number) => {
          times.push(now)
          if (now - times[0]! < duration) requestAnimationFrame(tick)
          else {
            const gaps = times.slice(1).map((t, i) => t - times[i]!)
            resolve({
              fps: (gaps.length / (now - times[0]!)) * 1000,
              maxFrameMs: Math.max(...gaps),
            })
          }
        }
        requestAnimationFrame(tick)
      }),
    durationMs,
  )
}

function report(name: string, values: object) {
  test
    .info()
    .annotations.push({ type: name, description: JSON.stringify(values) })
}

function expectGoodVitals(vitals: Vitals) {
  expect(vitals.lcp, 'LCP를 재지 못했습니다').not.toBeNull()
  expect(vitals.lcp ?? Infinity).toBeLessThanOrEqual(VITALS.lcp)
  expect(vitals.cls ?? 0).toBeLessThanOrEqual(VITALS.cls)
  // 기준(40ms)보다 짧은 상호작용만 있었으면 INP가 나오지 않으므로 0으로 봅니다.
  expect(vitals.inp ?? 0).toBeLessThanOrEqual(VITALS.inp)
}

test.describe('성능 (3D 화면)', () => {
  test.describe.configure({ timeout: 120_000 })
  test.skip(
    ({ browserName, isMobile }) => browserName !== 'chromium' || isMobile,
    'Chromium 데스크톱에서만 잽니다.',
  )
  test.beforeEach(async ({ page }) => {
    await skipIntro(page)
    await watchVitals(page)
  })

  test('쇼케이스 구성기: Web Vitals와 3D 프레임', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('data-fonts', 'ready', {
      timeout: 30_000,
    })
    await page.locator('#colors').scrollIntoViewIfNeeded()
    await expect(page.locator('#colors canvas')).toHaveCount(1, {
      timeout: 30_000,
    })
    // 견본을 고르는 상호작용으로 INP를 잽니다.
    await page.getByRole('radio', { name: '크림슨 래커' }).check()
    await page.getByRole('radio', { name: '야광' }).check()
    const frames = await measureFrames(page)
    const vitals = await readVitals(page)
    report('web-vitals', vitals)
    report('frames', frames)
    expectGoodVitals(vitals)
    expect(frames.fps).toBeGreaterThanOrEqual(FRAMES.minFps)
    expect(frames.maxFrameMs).toBeLessThanOrEqual(FRAMES.maxFrameMs)
  })

  test('편집기 무대: Web Vitals와 3D 프레임', async ({ page }) => {
    await page.goto('/editor/')
    await expect(page.locator('html')).toHaveAttribute('data-fonts', 'ready', {
      timeout: 30_000,
    })
    await expect(page.locator('canvas[data-engine]')).toHaveCount(1, {
      timeout: 60_000,
    })
    await page.getByRole('button', { name: '움직임 멈춤' }).click()
    await page.getByRole('button', { name: '움직임 재생' }).click()
    const frames = await measureFrames(page)
    const vitals = await readVitals(page)
    report('web-vitals', vitals)
    report('frames', frames)
    expectGoodVitals(vitals)
    expect(frames.fps).toBeGreaterThanOrEqual(FRAMES.minFps)
    expect(frames.maxFrameMs).toBeLessThanOrEqual(FRAMES.maxFrameMs)
  })
})
