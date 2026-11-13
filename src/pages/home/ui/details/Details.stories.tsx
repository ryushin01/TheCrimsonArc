import type { Meta, StoryObj } from '@storybook/react-vite'
import { Details } from './Details'

const meta = {
  title: 'pages/home/Details',
  component: Details,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Details>

export default meta
type Story = StoryObj<typeof meta>

/** 스크롤하면 입자가 실루엣 → 500M → 4Hz → 42H로 모입니다. 마우스를 올리면 흩어집니다. */
export const Default: Story = {}
