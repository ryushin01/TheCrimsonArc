import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { DIALS, type DialId } from '@/entities/watch'
import { OptionGroup } from './OptionGroup'

const OPTIONS = (Object.keys(DIALS) as DialId[]).map((id) => ({
  id,
  name: DIALS[id].name,
  swatch: [DIALS[id].base, DIALS[id].print] as const,
}))

function Demo() {
  const [value, setValue] = useState<DialId>('black')
  return (
    <OptionGroup
      legend="문자판"
      name="story-dial"
      options={OPTIONS}
      value={value}
      onChange={setValue}
    />
  )
}

const meta = {
  title: 'pages/home/OptionGroup',
  component: Demo,
  globals: { backgrounds: { value: 'studio' } },
} satisfies Meta<typeof Demo>

export default meta
type Story = StoryObj<typeof meta>

export const Swatches: Story = {}
