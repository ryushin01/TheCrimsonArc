import type { Meta, StoryObj } from '@storybook/react-vite'
import { Anatomy } from './Anatomy'

const meta = {
  title: 'pages/home/Anatomy',
  component: Anatomy,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Anatomy>

export default meta
type Story = StoryObj<typeof meta>

/** 스크롤 구간이 길어 스토리에서는 첫 화면(머리와 계기)만 봅니다. 프레임은 첫 화면을 열 때 받습니다. */
export const Default: Story = {}
