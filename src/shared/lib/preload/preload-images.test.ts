import { preloadImages } from './preload-images'

describe('preloadImages', () => {
  const OriginalImage = globalThis.Image
  let active = 0
  let peak = 0

  beforeEach(() => {
    active = 0
    peak = 0
    class FakeImage {
      decoding = 'auto'
      src = ''
      decode() {
        active += 1
        peak = Math.max(peak, active)
        return new Promise<void>((resolve, reject) => {
          setTimeout(() => {
            active -= 1
            if (this.src.includes('broken')) reject(new Error('decode'))
            else resolve()
          }, 1)
        })
      }
    }
    globalThis.Image = FakeImage as unknown as typeof Image
  })

  afterEach(() => {
    globalThis.Image = OriginalImage
  })

  it('순서를 지키고 실패한 자리는 null로 둔다', async () => {
    const progress: number[] = []
    const result = await preloadImages(['a.webp', 'broken.webp', 'c.webp'], {
      onProgress: (done) => progress.push(done),
    })
    expect(result.map((image) => image?.src ?? null)).toEqual([
      'a.webp',
      null,
      'c.webp',
    ])
    expect(progress).toEqual([1, 2, 3])
  })

  it('동시에 받는 수를 concurrency로 제한한다', async () => {
    const urls = Array.from({ length: 10 }, (_, index) => `${index}.webp`)
    await preloadImages(urls, { concurrency: 3 })
    expect(peak).toBeLessThanOrEqual(3)
  })

  it('취소하면 남은 이미지를 받지 않는다', async () => {
    const controller = new AbortController()
    const urls = Array.from({ length: 10 }, (_, index) => `${index}.webp`)
    const onImage = vi.fn()
    const pending = preloadImages(urls, {
      concurrency: 1,
      signal: controller.signal,
      onImage,
    })
    controller.abort()
    const result = await pending
    expect(result.filter(Boolean).length).toBeLessThan(10)
  })
})
