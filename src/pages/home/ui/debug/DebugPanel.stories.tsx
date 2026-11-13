import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { DebugPanel, DebugToggle } from './DebugPanel'

function Demo({ initiallyOpen }: { initiallyOpen: boolean }) {
  const [open, setOpen] = useState(initiallyOpen)
  return (
    <div style={{ color: '#fff' }}>
      <DebugToggle
        open={open}
        panelId="story-debug"
        onToggle={() => setOpen((value) => !value)}
      />
      <DebugPanel id="story-debug" open={open} />
    </div>
  )
}

const meta = {
  title: 'pages/home/DebugPanel',
  component: Demo,
  args: { initiallyOpen: false },
  globals: { backgrounds: { value: 'studio' } },
} satisfies Meta<typeof Demo>

export default meta
type Story = StoryObj<typeof meta>

export const Closed: Story = {}

/** 입자·시퀀스·첫 화면·DPR 값과 FPS 그래프가 있는 lil-gui 패널 */
export const Open: Story = { args: { initiallyOpen: true } }
