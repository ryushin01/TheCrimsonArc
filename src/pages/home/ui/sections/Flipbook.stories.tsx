import type { Meta, StoryObj } from '@storybook/react-vite'
import { Flipbook } from './Flipbook'

const meta = {
  title: 'pages/home/Flipbook',
  component: Flipbook,
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 640 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Flipbook>

export default meta
type Story = StoryObj<typeof meta>

/** 스크롤 대신 [자동 재생]으로 프레임을 넘겨 보세요. */
export const Default: Story = {}
