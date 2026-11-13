import type { Meta, StoryObj } from '@storybook/react-vite'
import { EDITOR_SECTIONS, PRODUCT_SECTIONS, sectionNav } from '@/shared/config'
import { SiteHeader } from './SiteHeader'

const meta = {
  title: 'widgets/SiteHeader',
  component: SiteHeader,
  args: {
    page: 'home',
    nav: sectionNav(PRODUCT_SECTIONS),
    cta: { href: '#colors', label: 'Configure', title: '색·재질 고르기' },
    showMotionToggle: true,
    dark: true,
  },
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div style={{ minHeight: 160 }}>
        <Story />
        <main id="main" />
      </div>
    ),
  ],
  globals: { backgrounds: { value: 'studio' } },
} satisfies Meta<typeof SiteHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Home: Story = {}
export const Editor: Story = {
  args: {
    page: 'editor',
    dark: false,
    nav: sectionNav(EDITOR_SECTIONS),
    cta: { href: '/studio/', label: 'Studio', title: '스튜디오' },
  },
  globals: { backgrounds: { value: 'paper' } },
}
export const Studio: Story = {
  args: {
    page: 'studio',
    showMotionToggle: false,
    nav: sectionNav(EDITOR_SECTIONS, '/editor/'),
    cta: {
      href: '/studio/',
      label: 'Studio',
      title: '스튜디오',
      current: true,
    },
  },
}
