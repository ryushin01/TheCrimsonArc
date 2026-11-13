import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Button } from '../button'
import { Dialog } from './Dialog'

const meta = {
  title: 'shared/Dialog',
  component: Dialog,
  args: {
    open: false,
    onClose: () => {},
    title: '새로 만들기',
    description: '빈 캔버스의 크기를 정합니다.',
    children: null,
  },
} satisfies Meta<typeof Dialog>

export default meta
type Story = StoryObj<typeof meta>

function Demo({ tone }: { tone: 'light' | 'dark' }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>대화상자 열기</Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="새로 만들기"
        description="빈 캔버스의 크기를 정합니다."
        tone={tone}
      >
        <p>내용이 여기에 들어갑니다.</p>
      </Dialog>
    </>
  )
}

export const Light: Story = { render: () => <Demo tone="light" /> }
export const Dark: Story = {
  render: () => <Demo tone="dark" />,
  globals: { backgrounds: { value: 'studio' } },
}
