import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Button } from '@/shared/ui/button'
import { NewArtworkDialog } from './NewArtworkDialog'

const meta = {
  title: 'pages/studio/NewArtworkDialog',
  component: NewArtworkDialog,
  args: { open: false, onClose: () => {}, onCreate: () => {} },
  globals: { backgrounds: { value: 'studio' } },
} satisfies Meta<typeof NewArtworkDialog>

export default meta
type Story = StoryObj<typeof meta>

function Demo() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="light" onClick={() => setOpen(true)}>
        새로 만들기
      </Button>
      <NewArtworkDialog
        open={open}
        onClose={() => setOpen(false)}
        onCreate={() => setOpen(false)}
      />
    </>
  )
}

export const Default: Story = { render: () => <Demo /> }
