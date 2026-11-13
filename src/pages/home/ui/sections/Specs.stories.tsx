import type { Meta, StoryObj } from '@storybook/react-vite'
import { Specs } from './Specs'

const meta = {
  title: 'pages/home/Specs',
  component: Specs,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Specs>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
