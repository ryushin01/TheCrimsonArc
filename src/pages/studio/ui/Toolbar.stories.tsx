import type { Meta, StoryObj } from '@storybook/react-vite'
import { StudioProvider } from './StudioProvider'
import { Toolbar } from './Toolbar'

const meta = {
  title: 'pages/studio/Toolbar',
  component: Toolbar,
  args: {
    busy: false,
    error: null,
    onNew: () => {},
    onOpenFile: () => {},
    onPlaceFile: () => {},
    onExport: () => {},
  },
  decorators: [
    (Story) => (
      <StudioProvider>
        <Story />
      </StudioProvider>
    ),
  ],
  parameters: { layout: 'fullscreen' },
  globals: { backgrounds: { value: 'studio' } },
} satisfies Meta<typeof Toolbar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const WithError: Story = {
  args: {
    error:
      '‘notes.txt’은(는) 열 수 없는 형식입니다. PNG · JPG · GIF · WebP 이미지를 골라 주세요.',
  },
}
