import { describe, expect, it } from 'vitest'
import { CASES, DEFAULT_CONFIG, DIALS } from './config'
import { LINEUP, lineupImageUrl, lineupLabel } from './lineup'

describe('인트로 라인업', () => {
  it('문자판 4종 × 케이스 3종 열두 조합을 한 번씩 쓴다', () => {
    expect(LINEUP).toHaveLength(12)
    const pairs = new Set(LINEUP.map((entry) => `${entry.dial}/${entry.case}`))
    expect(pairs.size).toBe(
      Object.keys(DIALS).length * Object.keys(CASES).length,
    )
  })

  it('12시에는 기본 조합을 둔다', () => {
    const [first] = LINEUP
    expect(first).toEqual({
      dial: DEFAULT_CONFIG.dial,
      case: DEFAULT_CONFIG.case,
      strap: DEFAULT_CONFIG.strap,
    })
  })

  it('이웃한 두 점(11시와 12시 포함)은 문자판도 케이스도 다르다', () => {
    LINEUP.forEach((entry, index) => {
      const next = LINEUP[(index + 1) % LINEUP.length]
      expect(entry.dial).not.toBe(next.dial)
      expect(entry.case).not.toBe(next.case)
    })
  })

  it('스틸 빛 브레이슬릿은 블랙 DLC 케이스와 짝짓지 않는다', () => {
    for (const entry of LINEUP) {
      if (entry.strap === 'bracelet') expect(entry.case).not.toBe('dlc')
    }
  })

  it('이미지 주소는 두 자리 번호와 형식을 쓴다', () => {
    expect(lineupImageUrl(3, 'avif', '/TheCrimsonArc/')).toBe(
      '/TheCrimsonArc/lineup/03.avif',
    )
    expect(lineupImageUrl(11, 'webp', '/')).toBe('/lineup/11.webp')
  })

  it('조합 이름을 문자판·케이스·스트랩 순으로 읽어 준다', () => {
    expect(lineupLabel(LINEUP[0])).toBe(
      '매트 블랙 문자판, 비드블라스트 스틸 케이스, 블랙 가죽 스트랩',
    )
    expect(lineupLabel(LINEUP[1])).toBe(
      '크림슨 래커 문자판, 그레이드 5 티타늄 케이스, H-링크 브레이슬릿',
    )
  })
})
