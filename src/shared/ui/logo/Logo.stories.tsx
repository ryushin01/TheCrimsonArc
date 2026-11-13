import type { Meta, StoryObj } from '@storybook/react-vite'
import { ArcMark, Logo } from './Logo'

const meta = {
  title: 'shared/Logo',
  component: Logo,
} satisfies Meta<typeof Logo>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const OnDark: Story = {
  render: () => (
    <span style={{ color: '#fff' }}>
      <Logo />
    </span>
  ),
  globals: { backgrounds: { value: 'maroon' } },
}

export const Marks: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'end' }}>
      {[16, 32, 64, 128].map((size) => (
        <ArcMark key={size} size={size} />
      ))}
    </div>
  ),
}
