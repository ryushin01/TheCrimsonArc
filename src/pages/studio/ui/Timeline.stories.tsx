import type { Meta, StoryObj } from '@storybook/react-vite'
import { StudioProvider } from './StudioProvider'
import { Timeline } from './Timeline'

const meta = {
  title: 'pages/studio/Timeline',
  component: Timeline,
  decorators: [
    (Story) => (
      <StudioProvider>
        <Story />
      </StudioProvider>
    ),
  ],
  parameters: { layout: 'fullscreen' },
  globals: { backgrounds: { value: 'studio' } },
} satisfies Meta<typeof Timeline>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
