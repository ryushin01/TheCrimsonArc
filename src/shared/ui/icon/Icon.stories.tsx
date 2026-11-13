import type { Meta, StoryObj } from '@storybook/react-vite'
import { ICON_NAMES, Icon } from './Icon'

const meta = {
  title: 'shared/Icon',
  component: Icon,
  args: { name: 'pen', size: 24 },
} satisfies Meta<typeof Icon>

export default meta
type Story = StoryObj<typeof meta>

export const Single: Story = {}

export const All: Story = {
  render: (args) => (
    <ul
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
        gap: 16,
        padding: 0,
        listStyle: 'none',
      }}
    >
      {ICON_NAMES.map((name) => (
        <li
          key={name}
          style={{ display: 'flex', gap: 8, alignItems: 'center' }}
        >
          <Icon {...args} name={name} />
          <code>{name}</code>
        </li>
      ))}
    </ul>
  ),
}
