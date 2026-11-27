/** 불러오기에 성공(폭 width)하거나 실패하는 가짜 Image */
function fakeImage(result: 'load' | 'error', width = 1) {
  return class {
    naturalWidth = width
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    set src(_value: string) {
      queueMicrotask(() => (result === 'load' ? this.onload : this.onerror)?.())
    }
  }
}

async function load() {
  vi.resetModules()
  return (await import('./supports-avif')).supportsAvif
}

describe('supportsAvif', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('1×1 시험 이미지를 그리면 true, 한 번 확인한 값은 기억한다', async () => {
    vi.stubGlobal('Image', fakeImage('load'))
    const supportsAvif = await load()
    const first = supportsAvif()
    expect(await first).toBe(true)
    expect(supportsAvif()).toBe(first)
  })

  it.each([
    ['그리지 못하면', fakeImage('error')],
    ['크기를 잘못 읽으면', fakeImage('load', 0)],
    ['Image가 없으면', undefined],
  ])('%s false', async (_, image) => {
    vi.stubGlobal('Image', image)
    expect(await (await load())()).toBe(false)
  })
})
