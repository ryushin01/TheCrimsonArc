import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button, ButtonLink } from './Button'

const meta = {
  title: 'shared/Button',
  component: Button,
  args: { children: 'Open studio', variant: 'solid', icon: 'arrow-right' },
  argTypes: {
    variant: {
      control: 'select',
      options: ['solid', 'crimson', 'light', 'outline', 'ghost'],
    },
    size: { control: 'inline-radio', options: ['md', 'sm'] },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Solid: Story = {}
export const Crimson: Story = {
  args: { variant: 'crimson', children: 'GIF 만들기', icon: 'sparkle' },
}
export const Outline: Story = {
  args: {
    variant: 'outline',
    children: '샘플 이미지로 해 보기',
    icon: 'image',
    iconPosition: 'start',
  },
}
export const Small: Story = {
  args: {
    size: 'sm',
    children: '레이어 추가',
    icon: 'plus',
    iconPosition: 'start',
  },
}
export const Disabled: Story = { args: { disabled: true } }
export const OnDark: Story = {
  args: { variant: 'light', children: 'Start drawing' },
  globals: { backgrounds: { value: 'maroon' } },
}

export const AsLink: Story = {
  render: (args) => (
    <ButtonLink href="#studio" variant={args.variant} icon="arrow-up-right">
      스튜디오 열기
    </ButtonLink>
  ),
}
