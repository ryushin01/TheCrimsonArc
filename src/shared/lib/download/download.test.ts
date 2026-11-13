import { formatBytes, toFileName } from './download'

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
