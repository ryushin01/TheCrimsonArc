import type { Meta, StoryObj } from '@storybook/react-vite'
import { DEFAULT_CONFIG } from '@/entities/watch'
import WatchStage, { type WatchStageProps } from './WatchStage'

function Framed(props: WatchStageProps) {
  return (
    <div
      style={{ width: 520, height: 520, background: '#1a1b1f' }}
      role="img"
      aria-label={`CA-01 3D 모델 (${props.view})`}
    >
      <WatchStage {...props} />
    </div>
  )
}

const meta = {
  title: 'pages/home/WatchStage',
  component: Framed,
  args: {
    config: { ...DEFAULT_CONFIG },
    view: 'front',
    active: true,
    paused: false,
  },
  argTypes: {
    view: { control: 'inline-radio', options: ['front', 'side', 'back'] },
  },
  globals: { backgrounds: { value: 'studio' } },
} satisfies Meta<typeof Framed>

export default meta
type Story = StoryObj<typeof meta>

/** 저절로 흔들리고 마우스를 따라 기울어지는 구성기 무대 */
export const Front: Story = {}

/** 움직임을 멈추면 고른 방향에 그대로 섭니다. */
export const BackPaused: Story = { args: { view: 'back', paused: true } }
