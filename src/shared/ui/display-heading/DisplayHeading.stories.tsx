import type { Meta, StoryObj } from '@storybook/react-vite'
import { DisplayHeading } from './DisplayHeading'

const meta = {
  title: 'shared/DisplayHeading',
  component: DisplayHeading,
  args: { lines: ['Draw in layers', 'Move in frames'], as: 'h2' },
} satisfies Meta<typeof DisplayHeading>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Centered: Story = {
  args: { align: 'center', lines: ['How it works'] },
}
export const OnDark: Story = {
  args: { tone: 'light', lines: ['Built for', 'Frame by frame'] },
  globals: { backgrounds: { value: 'maroon' } },
}
