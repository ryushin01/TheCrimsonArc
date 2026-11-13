import type { Meta, StoryObj } from '@storybook/react-vite'
import { Colors } from './Colors'

const meta = {
  title: 'pages/home/Colors',
  component: Colors,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Colors>

export default meta
type Story = StoryObj<typeof meta>

/** 견본을 고르면 three.js 시계의 색·거칠기·야광이 lerp로 바뀝니다. */
export const Default: Story = {}
