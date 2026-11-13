import type { Meta, StoryObj } from '@storybook/react-vite'
import { SiteFooter } from './SiteFooter'

const meta = {
  title: 'widgets/SiteFooter',
  component: SiteFooter,
  args: { page: 'home' },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof SiteFooter>

export default meta
type Story = StoryObj<typeof meta>

export const Home: Story = {}
export const OtherPage: Story = { args: { page: 'other' } }
