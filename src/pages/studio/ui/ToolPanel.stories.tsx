import type { Meta, StoryObj } from '@storybook/react-vite'
import { StudioProvider } from './StudioProvider'
import { ToolPanel } from './ToolPanel'

const meta = {
  title: 'pages/studio/ToolPanel',
  component: ToolPanel,
  decorators: [
    (Story) => (
      <StudioProvider>
        <div style={{ width: 260 }}>
          <Story />
        </div>
      </StudioProvider>
    ),
  ],
  globals: { backgrounds: { value: 'studio' } },
} satisfies Meta<typeof ToolPanel>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
