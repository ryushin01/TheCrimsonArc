import type { Meta, StoryObj } from '@storybook/react-vite'
import { createSampleArtwork } from '@/entities/artwork'
import { ExportPanel } from './ExportPanel'

const sample = createSampleArtwork()

const meta = {
  title: 'features/export-artwork/ExportPanel',
  component: ExportPanel,
  args: { artwork: sample, fileName: 'crimson-arc-sample' },
} satisfies Meta<typeof ExportPanel>

export default meta
type Story = StoryObj<typeof meta>

export const GifOnly: Story = {}

export const AllFormatsDark: Story = {
  args: {
    formats: ['gif', 'png', 'sheet'],
    tone: 'dark',
    frameId: sample.frames[3].id,
  },
  globals: { backgrounds: { value: 'studio' } },
}
