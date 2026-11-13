import type { Meta, StoryObj } from '@storybook/react-vite'
import { Tag } from './Tag'

const meta = {
  title: 'shared/Tag',
  component: Tag,
  args: { index: '01', children: 'Layers', tone: 'ink' },
} satisfies Meta<typeof Tag>

export default meta
type Story = StoryObj<typeof meta>

export const Ink: Story = {}
export const Crimson: Story = {
  args: { tone: 'crimson', index: '02', children: 'Frames' },
}
export const WithoutIndex: Story = {
  args: { index: undefined, children: 'Animation studio' },
}
export const Light: Story = {
  args: { tone: 'light', children: 'Specs' },
  globals: { backgrounds: { value: 'maroon' } },
}
