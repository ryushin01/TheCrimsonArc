import { lzwDecode, lzwEncode } from './lzw'

/** 테스트마다 같은 값이 나오는 의사 난수 */
function seeded(seed: number) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 2 ** 32
  }
}

function roundTrip(indices: Uint8Array, minCodeSize: number) {
  const encoded = lzwEncode(indices, minCodeSize)
  return lzwDecode(encoded, minCodeSize, indices.length)
}

describe('LZW', () => {
  it.each([2, 3, 4, 8])(
    '무작위 색 번호를 그대로 되살린다 (최소 코드 %i비트)',
    (bits) => {
      const random = seeded(bits)
      const indices = new Uint8Array(20_000).map(() =>
        Math.floor(random() * (1 << bits)),
      )
      expect(roundTrip(indices, bits)).toEqual(indices)
    },
  )

  it('사전이 4096개로 차서 다시 시작하는 긴 데이터도 되살린다', () => {
    const random = seeded(7)
    const indices = new Uint8Array(300_000).map(() =>
      Math.floor(random() * 256),
    )
    expect(roundTrip(indices, 8)).toEqual(indices)
  })

  it('같은 값이 길게 이어지면 크게 압축된다', () => {
    const indices = new Uint8Array(65_536)
    const encoded = lzwEncode(indices, 2)
    expect(encoded.length).toBeLessThan(1_000)
    expect(lzwDecode(encoded, 2, indices.length)).toEqual(indices)
  })

  it('반복 무늬(KwKwK 경우)를 되살린다', () => {
    const indices = Uint8Array.from({ length: 5_000 }, (_, i) =>
      i % 7 < 3 ? 1 : i % 3,
    )
    expect(roundTrip(indices, 2)).toEqual(indices)
  })

  it('빈 데이터와 한 픽셀도 처리한다', () => {
    expect(roundTrip(new Uint8Array(0), 2)).toEqual(new Uint8Array(0))
    expect(roundTrip(Uint8Array.of(3), 2)).toEqual(Uint8Array.of(3))
  })
})
