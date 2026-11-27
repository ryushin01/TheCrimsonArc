import { readFileSync } from 'node:fs'

export interface StoryEntry {
  id: string
  title: string
  name: string
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

/** index.json의 항목 하나가 스토리면 돌려줍니다(문서 항목·모르는 모양은 뺌). */
function toStory(entry: unknown): StoryEntry | null {
  if (!isRecord(entry) || entry.type !== 'story') return null
  const { id, title, name } = entry
  return typeof id === 'string' &&
    typeof title === 'string' &&
    typeof name === 'string'
    ? { id, title, name }
    : null
}

/** 빌드한 Storybook(dist/storybook/index.json)의 스토리를 모두 돌려줍니다. 빌드하지 않았으면 빈 목록입니다(pnpm build:all). */
export function builtStories(): StoryEntry[] {
  let index: unknown
  try {
    index = JSON.parse(
      readFileSync(
        new URL('../dist/storybook/index.json', import.meta.url),
        'utf8',
      ),
    )
  } catch {
    return []
  }
  if (!isRecord(index) || !isRecord(index.entries)) return []
  return Object.values(index.entries)
    .map(toStory)
    .filter((story) => story !== null)
}

/**
 * 스토리 하나만 그리는 미리보기 주소.
 * addon-a11y가 스토리를 그릴 때마다 스스로 axe를 돌리면 테스트의 axe와 겹치므로 수동 모드(a11y.manual)로 엽니다.
 */
export const storyUrl = (id: string) =>
  `/storybook/iframe.html?id=${encodeURIComponent(id)}&viewMode=story&globals=a11y.manual:!true`

/**
 * 배경(backgrounds) 전환 같은 CSS 전환·애니메이션을 끝 상태로 바로 보냅니다.
 * 전환 도중의 색으로 대비를 재거나 화면을 찍지 않게 합니다.
 */
export const SETTLE_CSS = `*, *::before, *::after {
  transition: none !important;
  animation-duration: 0s !important;
  animation-delay: 0s !important;
}`
