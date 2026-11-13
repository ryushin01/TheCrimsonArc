import type { Meta, StoryObj } from '@storybook/react-vite'
import { HomePage } from './HomePage'

const meta = {
  title: 'pages/home/HomePage',
  component: HomePage,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof HomePage>

export default meta
type Story = StoryObj<typeof meta>

/** 시계 쇼케이스 전체 (시퀀스 프레임은 배포된 사이트 주소에서만 받습니다) */
export const Default: Story = {}
