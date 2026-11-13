import type { Meta, StoryObj } from '@storybook/react-vite'
import { compositeFrame } from '../model/artwork'
import { createSampleArtwork } from '../model/sample'
import { PixelCanvas } from './PixelCanvas'

const sample = createSampleArtwork()

const meta = {
  title: 'entities/artwork/PixelCanvas',
  component: PixelCanvas,
  args: {
    data: compositeFrame(sample, sample.frames[4].id),
    width: sample.width,
    height: sample.height,
    label: '밤하늘의 크림슨 호 위를 혜성이 지나는 샘플 그림, 5번째 프레임',
    style: { width: 320 },
  },
} satisfies Meta<typeof PixelCanvas>

export default meta
type Story = StoryObj<typeof meta>

export const Composite: Story = {}

export const SingleLayerOnCheckerboard: Story = {
  args: {
    data: compositeFrame(sample, sample.frames[4].id, {
      onlyLayerIds: [sample.layers[1].id],
    }),
    checkerboard: true,
    label: '아치 레이어만 보이는 그림',
  },
}
