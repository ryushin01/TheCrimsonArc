import type { Meta, StoryObj } from '@storybook/react-vite'
import { BenchPage } from './BenchPage'

const meta = {
  title: 'pages/bench/BenchPage',
  component: BenchPage,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof BenchPage>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
