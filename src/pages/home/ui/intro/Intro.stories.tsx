import type { Meta, StoryObj } from '@storybook/react-vite'
import { Intro } from './Intro'

const meta = {
  title: 'pages/home/Intro',
  component: Intro,
  parameters: { layout: 'fullscreen' },
  args: { onDone: () => {} },
} satisfies Meta<typeof Intro>

export default meta
type Story = StoryObj<typeof meta>

/**
 * 조디악 다이얼의 궤도에서 A-01 열두 조합이 공전합니다.
 * '입장하기'·스크롤·화면 누르기로 다이얼이 돌며 다가오고 가운데가 열리며 닫힙니다. (Esc는 바로 닫기)
 */
export const Default: Story = {}
