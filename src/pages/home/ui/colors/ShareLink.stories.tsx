import type { Meta, StoryObj } from '@storybook/react-vite'
import { ShareLink } from './ShareLink'

const meta = {
  title: 'pages/home/ShareLink',
  component: ShareLink,
  globals: { backgrounds: { value: 'studio' } },
  args: {
    url: 'https://ryushin01.github.io/TheCrimsonArc/?dial=crimson&light=sunset#colors',
  },
} satisfies Meta<typeof ShareLink>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
