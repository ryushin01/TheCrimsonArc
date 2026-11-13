import type { Meta, StoryObj } from '@storybook/react-vite'
import { CanvasView } from './CanvasView'
import { StudioProvider } from './StudioProvider'

const meta = {
  title: 'pages/studio/CanvasView',
  component: CanvasView,
  args: { onDropFile: () => {} },
  decorators: [
    (Story) => (
      <StudioProvider>
        <div style={{ height: 620 }}>
          <Story />
        </div>
      </StudioProvider>
    ),
  ],
  globals: { backgrounds: { value: 'studio' } },
} satisfies Meta<typeof CanvasView>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
