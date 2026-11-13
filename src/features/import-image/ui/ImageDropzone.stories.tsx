import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '@/shared/ui/button'
import { ImageDropzone } from './ImageDropzone'

const meta = {
  title: 'features/import-image/ImageDropzone',
  component: ImageDropzone,
  args: { onFile: () => {} },
} satisfies Meta<typeof ImageDropzone>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithSampleButton: Story = {
  args: {
    children: (
      <Button variant="outline" size="sm" icon="sparkle" iconPosition="start">
        샘플 이미지로 해 보기
      </Button>
    ),
  },
}

export const WithError: Story = {
  args: {
    error:
      '‘notes.txt’은(는) 열 수 없는 형식입니다. PNG · JPG · GIF · WebP 이미지를 골라 주세요.',
  },
}

export const Dark: Story = {
  args: { tone: 'dark' },
  globals: { backgrounds: { value: 'studio' } },
}
