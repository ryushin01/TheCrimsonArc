import type { Meta, StoryObj } from '@storybook/react-vite'
import { SiteHeader } from './SiteHeader'

const meta = {
  title: 'widgets/SiteHeader',
  component: SiteHeader,
  args: { page: 'home', showMotionToggle: true },
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div style={{ minHeight: 160 }}>
        <Story />
        <main id="main" />
      </div>
    ),
  ],
} satisfies Meta<typeof SiteHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Home: Story = {}
export const Studio: Story = {
  args: { page: 'studio', showMotionToggle: false, dark: true },
  globals: { backgrounds: { value: 'studio' } },
}
