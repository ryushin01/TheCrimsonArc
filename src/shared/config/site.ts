/** 배포 하위 경로 ('/' 또는 '/TheCrimsonArc/') */
const BASE = import.meta.env.BASE_URL

export const SITE = {
  name: 'The Crimson Arc',
  shortName: 'Crimson Arc',
  description: '레이어와 프레임으로 그리고 GIF로 내보내는 애니메이션 스튜디오',
  url: 'https://ryushin01.github.io/TheCrimsonArc',
  repositoryUrl: 'https://github.com/ryushin01/TheCrimsonArc',
  storybookUrl: `${BASE}storybook/index.html`,
  author: '류창선',
  year: 2026,
} as const

export const ROUTES = {
  home: BASE,
  studio: `${BASE}studio/`,
} as const

export interface HomeSection {
  id: string
  /** 메뉴에 보이는 영문 이름 */
  label: string
  /** 한글 설명 */
  title: string
}

export const HOME_SECTIONS: readonly HomeSection[] = [
  { id: 'layers', label: 'Layers', title: '레이어' },
  { id: 'frames', label: 'Frames', title: '프레임' },
  { id: 'export', label: 'Export', title: 'GIF 내보내기' },
  { id: 'open', label: 'Open', title: '이미지 열기' },
]

/** 스튜디오와 홍보 페이지가 함께 쓰는 문서 한도 */
export const LIMITS = {
  maxSize: 256,
  minSize: 8,
  maxLayers: 8,
  maxFrames: 48,
  minFps: 1,
  maxFps: 24,
  historyDepth: 50,
  maxFileBytes: 15 * 1024 * 1024,
} as const
