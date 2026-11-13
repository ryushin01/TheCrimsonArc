import type { Meta, StoryObj } from '@storybook/react-vite'
import { EditorPage } from './EditorPage'

const meta = {
  title: 'pages/editor/EditorPage',
  component: EditorPage,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof EditorPage>

export default meta
type Story = StoryObj<typeof meta>

/** 0.1.0의 프레임 애니메이션 편집기 소개 페이지 전체 */
export const Default: Story = {}
