import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { ChronoControls } from './ChronoControls'

function Demo({ initiallyRunning = true }: { initiallyRunning?: boolean }) {
  const [running, setRunning] = useState(initiallyRunning)
  const [message, setMessage] = useState('')
  return (
    <ChronoControls
      running={running}
      message={message}
      onStartStop={() => {
        setRunning(!running)
        setMessage(
          running
            ? '크로노그래프를 멈췄습니다. 12분 5초'
            : '크로노그래프를 시작했습니다.',
        )
      }}
      onReset={() =>
        setMessage(
          running
            ? '0으로 되돌려 바로 다시 잽니다. (플라이백)'
            : '크로노그래프를 0으로 되돌렸습니다.',
        )
      }
    />
  )
}

const meta = {
  title: 'pages/home/ChronoControls',
  component: Demo,
  globals: { backgrounds: { value: 'studio' } },
} satisfies Meta<typeof Demo>

export default meta
type Story = StoryObj<typeof meta>

/** 움직임이 켜져 있으면 처음에는 도는 중입니다. */
export const Running: Story = {}

export const Stopped: Story = { args: { initiallyRunning: false } }
