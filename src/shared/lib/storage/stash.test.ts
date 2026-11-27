import 'fake-indexeddb/auto'
import { stashBlob, takeStashedBlob } from './stash'

describe('stashBlob / takeStashedBlob', () => {
  it('맡긴 파일을 이름·형식·수정 시각과 함께 한 번만 꺼낸다', async () => {
    const file = new File(['hello'], 'watch.gif', {
      type: 'image/gif',
      lastModified: 1_700_000_000_000,
    })
    expect(await stashBlob('file', file)).toBe(true)

    const taken = await takeStashedBlob('file')
    expect(taken).toBeInstanceOf(File)
    expect(taken).toMatchObject({
      name: 'watch.gif',
      type: 'image/gif',
      lastModified: 1_700_000_000_000,
    })
    expect(await taken?.text()).toBe('hello')
    // 꺼내면 지웁니다.
    expect(await takeStashedBlob('file')).toBeNull()
  })

  it('이름 없는 Blob은 Blob으로 돌려준다', async () => {
    expect(
      await stashBlob('blob', new Blob(['abc'], { type: 'text/plain' })),
    ).toBe(true)
    const taken = await takeStashedBlob('blob')
    expect(taken).not.toBeInstanceOf(File)
    expect(taken?.type).toBe('text/plain')
    expect(await taken?.text()).toBe('abc')
  })

  it('맡긴 것이 없으면 null', async () => {
    expect(await takeStashedBlob('none')).toBeNull()
  })

  describe('IndexedDB를 쓸 수 없으면', () => {
    beforeEach(() => {
      vi.stubGlobal('indexedDB', undefined)
    })
    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('맡기기는 false, 꺼내기는 null을 돌려준다', async () => {
      expect(await stashBlob('x', new Blob(['x']))).toBe(false)
      expect(await takeStashedBlob('x')).toBeNull()
    })
  })
})
