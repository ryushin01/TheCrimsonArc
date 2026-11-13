import type { Meta, StoryObj } from '@storybook/react-vite'
import { Lab } from './Lab'

const meta = {
  title: 'pages/home/Lab',
  component: Lab,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Lab>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
