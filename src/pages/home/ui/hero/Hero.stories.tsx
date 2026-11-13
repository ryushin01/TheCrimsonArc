import type { Meta, StoryObj } from '@storybook/react-vite'
import { loadStore } from '../../model/load-store'
import { Hero } from './Hero'

const meta = {
  title: 'pages/home/Hero',
  component: Hero,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Hero>

export default meta
type Story = StoryObj<typeof meta>

/** 자료를 받는 중: 베젤 눈금과 크림슨 호가 차오르고 7세그먼트 숫자로 %를 보여 줍니다. */
export const Loading: Story = {
  beforeEach: () => {
    loadStore.reset({ progress: 0.64 })
  },
}

/** 다 받은 뒤: 마우스를 따라 빛이 큰 제목 글자 안을 흐릅니다. */
export const Ready: Story = {
  beforeEach: () => {
    loadStore.reset({ progress: 1, done: true })
  },
}
