import type { Meta, StoryObj } from '@storybook/react-vite'
import { Launch } from './Launch'

const meta = {
  title: 'pages/editor/Launch',
  component: Launch,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Launch>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
