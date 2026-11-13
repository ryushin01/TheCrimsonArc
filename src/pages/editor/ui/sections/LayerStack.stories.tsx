import type { Meta, StoryObj } from '@storybook/react-vite'
import { LayerStack } from './LayerStack'

const meta = {
  title: 'pages/editor/LayerStack',
  component: LayerStack,
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 760 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LayerStack>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
