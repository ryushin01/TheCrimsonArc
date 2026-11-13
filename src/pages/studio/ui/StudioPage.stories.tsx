import type { Meta, StoryObj } from '@storybook/react-vite'
import { StudioPage } from './StudioPage'

const meta = {
  title: 'pages/studio/StudioPage',
  component: StudioPage,
  parameters: { layout: 'fullscreen' },
  globals: { backgrounds: { value: 'studio' } },
} satisfies Meta<typeof StudioPage>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
