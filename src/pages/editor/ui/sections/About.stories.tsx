import type { Meta, StoryObj } from '@storybook/react-vite'
import { About } from './About'

const meta = {
  title: 'pages/editor/About',
  component: About,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof About>

export default meta
type Story = StoryObj<typeof meta>

/** 넓은 화면에서는 스크롤 진행도에 따라 주석이 나타나므로, 좁은 화면 보기로 확인하면 모두 보입니다. */
export const Default: Story = {}
