/** 배포 하위 경로 ('/' 또는 '/TheCrimsonArc/') */
const BASE = import.meta.env.BASE_URL

export const SITE = {
  name: 'The Crimson Arc',
  shortName: 'Crimson Arc',
  description: '호를 그리는 크림슨 베젤의 가상 기계식 다이버 워치',
  url: 'https://ryushin01.github.io/TheCrimsonArc',
  repositoryUrl: 'https://github.com/ryushin01/TheCrimsonArc',
  storybookUrl: `${BASE}storybook/index.html`,
  author: '류창선',
  year: 2026,
} as const

export const ROUTES = {
  home: BASE,
  editor: `${BASE}editor/`,
  studio: `${BASE}studio/`,
  bench: `${BASE}bench/`,
} as const

export interface HomeSection {
  id: string
  /** 메뉴에 보이는 영문 이름 */
  label: string
  /** 한글 설명 */
  title: string
}

/** 첫 화면(시계 쇼케이스)의 섹션 */
export const PRODUCT_SECTIONS: readonly HomeSection[] = [
  { id: 'anatomy', label: 'Anatomy', title: '360도 분해' },
  { id: 'details', label: 'Details', title: '핵심 기능' },
  { id: 'colors', label: 'Colors', title: '색·재질' },
  { id: 'specs', label: 'Specs', title: '사양' },
]

/** 편집기 소개 페이지(/editor/)의 섹션 */
export const EDITOR_SECTIONS: readonly HomeSection[] = [
  { id: 'layers', label: 'Layers', title: '레이어' },
  { id: 'frames', label: 'Frames', title: '프레임' },
  { id: 'export', label: 'Export', title: 'GIF 내보내기' },
  { id: 'open', label: 'Open', title: '이미지 열기' },
]

export interface NavItem {
  href: string
  /** 화면에 보이는 영문 이름 */
  label: string
  /** 화면 낭독기에 덧붙여 읽을 한글 설명 */
  title?: string
}

/** 섹션 목록을 메뉴 항목으로 바꿉니다. 다른 페이지에서 쓰면 그 페이지 주소를 앞에 붙입니다. */
export function sectionNav(
  sections: readonly HomeSection[],
  pagePath?: string,
): NavItem[] {
  return sections.map((section) => ({
    href: `${pagePath ?? ''}#${section.id}`,
    label: section.label,
    title: section.title,
  }))
}

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
