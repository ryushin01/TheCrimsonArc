import type { Meta, StoryObj } from '@storybook/react-vite'
import { Process } from './Process'

const meta = {
  title: 'pages/editor/Process',
  component: Process,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Process>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
