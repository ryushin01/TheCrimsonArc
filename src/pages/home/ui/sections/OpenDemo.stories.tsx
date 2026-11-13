import type { Meta, StoryObj } from '@storybook/react-vite'
import { OpenDemo } from './OpenDemo'

const meta = {
  title: 'pages/home/OpenDemo',
  component: OpenDemo,
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 560 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof OpenDemo>

export default meta
type Story = StoryObj<typeof meta>

/** [샘플 이미지로 해 보기]를 누르면 노을 사진이 픽셀 아트로 바뀝니다. */
export const Default: Story = {}
