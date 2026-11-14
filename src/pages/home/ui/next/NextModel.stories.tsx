import type { Meta, StoryObj } from '@storybook/react-vite'
import { NextModel } from './NextModel'

const meta = {
  title: 'pages/home/NextModel',
  component: NextModel,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof NextModel>

export default meta
type Story = StoryObj<typeof meta>

/** 화면에 들어오면 선홍색 호가 왼쪽부터 그려지고 호 위의 점이 나타납니다. */
export const Default: Story = {}
