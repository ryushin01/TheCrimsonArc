import { afterEach, describe, expect, it } from 'vitest'
import { whenFontsSettled } from './fonts-settled'

const root = document.documentElement

describe('whenFontsSettled', () => {
  afterEach(() => {
    delete root.dataset.fonts
  })

  it('글꼴 로딩 화면이 없으면 바로 끝난다', async () => {
    await expect(whenFontsSettled()).resolves.toBeUndefined()
  })

  it('로딩 화면이 끝날 때까지 기다린다', async () => {
    root.dataset.fonts = 'loading'
    let settled = false
    const done = whenFontsSettled().then(() => {
      settled = true
    })
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(settled).toBe(false)
    root.dataset.fonts = 'ready'
    await done
    expect(settled).toBe(true)
  })
})
