import type { Meta, StoryObj } from '@storybook/react-vite'
import { LayersPanel } from './LayersPanel'
import { StudioProvider } from './StudioProvider'

const meta = {
  title: 'pages/studio/LayersPanel',
  component: LayersPanel,
  decorators: [
    (Story) => (
      <StudioProvider>
        <div style={{ width: 300 }}>
          <Story />
        </div>
      </StudioProvider>
    ),
  ],
  globals: { backgrounds: { value: 'studio' } },
} satisfies Meta<typeof LayersPanel>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
