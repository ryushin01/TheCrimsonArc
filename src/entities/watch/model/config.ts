export type DialId = 'black' | 'crimson' | 'navy' | 'snow'
export type CaseId = 'steel' | 'dlc' | 'titanium'
export type StrapId = 'bracelet' | 'rubber' | 'leather'
export type LightId = 'studio' | 'sunset' | 'night'

export interface WatchConfig {
  dial: DialId
  case: CaseId
  strap: StrapId
  light: LightId
}

export const DEFAULT_CONFIG: Readonly<WatchConfig> = {
  dial: 'black',
  case: 'steel',
  strap: 'bracelet',
  light: 'studio',
}

export interface DialOption {
  name: string
  /** 다이얼 바탕 */
  base: string
  /** 숫자·눈금 인쇄 */
  print: string
  /**
   * 크림슨 인쇄(문구·6시 상징·초침)를 이 문자판에서만 다른 색으로 그릴 때.
   * 바탕이 같은 빨강이라 ARC_COLOR가 묻히는 문자판에만 둡니다.
   */
  ink?: string
}

export const DIALS: Record<DialId, DialOption> = {
  black: {
    name: '매트 블랙',
    base: '#101012',
    print: '#f1efe8',
  },
  crimson: {
    name: '크림슨 래커',
    base: '#6d0d1f',
    print: '#fff3ec',
    ink: '#fff3ec',
  },
  navy: {
    name: '딥 네이비',
    base: '#0f1a2e',
    print: '#eef1f6',
  },
  snow: {
    name: '스노우 화이트',
    base: '#e8e5dd',
    print: '#17171a',
  },
}

export interface CaseOption {
  name: string
  color: string
  roughness: number
}

export const CASES: Record<CaseId, CaseOption> = {
  steel: { name: '비드블라스트 스틸', color: '#c3c7cc', roughness: 0.42 },
  titanium: { name: '그레이드 5 티타늄', color: '#8d9197', roughness: 0.34 },
  dlc: { name: '블랙 DLC', color: '#2a2b2f', roughness: 0.36 },
}

export interface StrapOption {
  name: string
  color: string
  roughness: number
}

export const STRAPS: Record<StrapId, StrapOption> = {
  bracelet: { name: 'H-링크 브레이슬릿', color: '#c3c7cc', roughness: 0.42 },
  rubber: { name: '블랙 러버', color: '#17171a', roughness: 0.82 },
  leather: { name: '크림슨 가죽', color: '#5e0d1c', roughness: 0.68 },
}

export interface LightOption {
  name: string
  description: string
}

export const LIGHTS: Record<LightId, LightOption> = {
  studio: {
    name: '스튜디오',
    description: '흰 소프트박스로 금속의 결을 드러냅니다.',
  },
  sunset: { name: '노을', description: '따뜻한 주광과 크림슨 역광' },
  night: { name: '야광', description: '불을 끄면 핸즈와 인덱스가 빛납니다.' },
}

/** 베젤의 크림슨 호: 비행 구간 시간을 재는 처음 15분 */
export const CRIMSON_ARC_MINUTES = 15

/** 시계의 크림슨 호(베젤 15분 구간, 문자판 상징, 무브먼트 브리지)가 함께 쓰는 색 */
export const ARC_COLOR = '#8b0000'
