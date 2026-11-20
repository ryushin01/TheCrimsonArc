import {
  CASES,
  type CaseId,
  DIALS,
  type DialId,
  STRAPS,
  type StrapId,
} from './config'

/** 인트로 다이얼에 놓는 A-01 한 점의 조합 */
export interface LineupEntry {
  dial: DialId
  case: CaseId
  strap: StrapId
}

/**
 * 인트로 다이얼에 12시부터 시계 방향으로 놓는 A-01의 열두 조합.
 * 구성기에 있는 문자판 4종 × 케이스 3종을 한 번씩 쓰고, 이웃한 두 점은 문자판도 케이스도 다르게 놓았습니다.
 * 12시는 기본 조합(매트 블랙 · 비드블라스트 스틸 · 블랙 가죽)이고,
 * 스틸 빛 브레이슬릿은 금속 케이스(스틸·티타늄)에만 채웁니다.
 */
export const LINEUP: readonly LineupEntry[] = [
  { dial: 'black', case: 'steel', strap: 'leather' },
  { dial: 'crimson', case: 'titanium', strap: 'bracelet' },
  { dial: 'navy', case: 'dlc', strap: 'leather' },
  { dial: 'snow', case: 'steel', strap: 'bracelet' },
  { dial: 'black', case: 'titanium', strap: 'crimson' },
  { dial: 'crimson', case: 'dlc', strap: 'crimson' },
  { dial: 'navy', case: 'steel', strap: 'bracelet' },
  { dial: 'snow', case: 'titanium', strap: 'leather' },
  { dial: 'black', case: 'dlc', strap: 'leather' },
  { dial: 'crimson', case: 'steel', strap: 'bracelet' },
  { dial: 'navy', case: 'titanium', strap: 'crimson' },
  { dial: 'snow', case: 'dlc', strap: 'crimson' },
]

/** 라인업 이미지 한 변의 길이(px). 화면에서는 최대 약 130px로 그려 2배 화면까지 선명합니다. */
export const LINEUP_IMAGE_SIZE = 256

export type LineupFormat = 'avif' | 'webp'

/** i번째 라인업 이미지 주소 (public/lineup/{번호}.{형식}) */
export function lineupImageUrl(
  index: number,
  format: LineupFormat,
  base: string = import.meta.env.BASE_URL,
): string {
  return `${base}lineup/${String(index).padStart(2, '0')}.${format}`
}

/** 보조기기에 읽어 줄 조합 이름 (예: '매트 블랙 문자판, 비드블라스트 스틸 케이스, 블랙 가죽 스트랩') */
export function lineupLabel(entry: LineupEntry): string {
  const strap = STRAPS[entry.strap].name
  return `${DIALS[entry.dial].name} 문자판, ${CASES[entry.case].name} 케이스, ${
    entry.strap === 'bracelet' ? strap : `${strap} 스트랩`
  }`
}
