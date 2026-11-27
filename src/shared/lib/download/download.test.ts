import { downloadBlob, formatBytes, toFileName } from './download'

describe('download', () => {
  it('바이트 수를 읽기 쉽게 바꾼다', () => {
    expect(formatBytes(900)).toBe('900 B')
    expect(formatBytes(1536)).toBe('1.5 KB')
    expect(formatBytes(3 * 1024 * 1024)).toBe('3.00 MB')
  })

  it('파일 이름에서 쓸 수 없는 글자와 확장자를 정리한다', () => {
    expect(toFileName('my art/v2.png', 'gif')).toBe('my-art-v2.gif')
    expect(toFileName('   ', 'png')).toBe('crimson-arc.png')
  })
})

describe('downloadBlob', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('파일 이름을 단 링크를 눌러 내려받고, 링크와 주소를 치운다', () => {
    vi.useFakeTimers()
    const create = vi.fn(() => 'blob:watch')
    const revoke = vi.fn()
    vi.stubGlobal(
      'URL',
      Object.assign(URL, { createObjectURL: create, revokeObjectURL: revoke }),
    )
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function (this: HTMLAnchorElement) {
        expect(this).toHaveAttribute('download', 'a-01.gif')
        expect(this).toHaveAttribute('href', 'blob:watch')
      })
    downloadBlob(new Blob(['gif']), 'a-01.gif')
    expect(click).toHaveBeenCalledTimes(1)
    expect(document.querySelector('a[download]')).toBeNull()
    expect(revoke).not.toHaveBeenCalled()
    vi.advanceTimersByTime(10_000)
    expect(revoke).toHaveBeenCalledWith('blob:watch')
    vi.unstubAllGlobals()
  })
})
