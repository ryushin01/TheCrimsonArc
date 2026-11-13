import type { Meta, StoryObj } from '@storybook/react-vite'
import { Atmosphere } from '../effects/Atmosphere'
import { Hero } from './Hero'

const meta = {
  title: 'pages/home/Hero',
  component: Hero,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div style={{ position: 'relative' }}>
        <Atmosphere />
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Hero>

export default meta
type Story = StoryObj<typeof meta>

/** 3D 무대 없이 글자와 배경만 보여 줍니다. */
export const WithoutStage: Story = {}
