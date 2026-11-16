import { describe, expect, it } from 'vitest'
import { encodeGif } from './encode-gif'

const input = () => ({
  width: 2,
  height: 2,
  frames: [{ rgba: new Uint8ClampedArray(16).fill(255), delayMs: 100 }],
})

describe('encodeGif', () => {
  it('이미 그만둔 작업은 만들지 않고 AbortError로 끝난다', async () => {
    const controller = new AbortController()
    controller.abort()
    await expect(
      encodeGif(input(), undefined, controller.signal),
    ).rejects.toMatchObject({ name: 'AbortError' })
  })

  it('만드는 도중 그만두면 AbortError로 끝난다', async () => {
    const controller = new AbortController()
    const result = encodeGif(input(), undefined, controller.signal)
    controller.abort()
    await expect(result).rejects.toMatchObject({ name: 'AbortError' })
  })

  it('그만두지 않으면 GIF 바이트를 돌려준다', async () => {
    const { bytes } = await encodeGif(input())
    expect(String.fromCharCode(...bytes.slice(0, 6))).toBe('GIF89a')
  })
})
