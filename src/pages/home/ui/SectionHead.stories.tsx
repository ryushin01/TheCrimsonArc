import type { Meta, StoryObj } from '@storybook/react-vite'
import { SectionHead } from './SectionHead'

const meta = {
  title: 'pages/home/SectionHead',
  component: SectionHead,
  args: {
    id: 'story-head',
    eyebrow: '01 · Anatomy',
    title: '한 바퀴 돌고, 펼쳐 보기',
    lead: '스크롤하는 만큼 96장의 이미지 시퀀스가 넘어갑니다.',
  },
  globals: { backgrounds: { value: 'studio' } },
} satisfies Meta<typeof SectionHead>

export default meta
type Story = StoryObj<typeof meta>

export const Dark: Story = {}

export const Light: Story = {
  args: { tone: 'light', eyebrow: '04 · Specs', title: 'CA-01 사양' },
  globals: { backgrounds: { value: 'paper' } },
}

export const Center: Story = { args: { align: 'center' } }
