import type { ComponentPropsWithRef, ReactNode } from 'react'
import { cx } from '@/shared/lib/classnames'
import { Icon, type IconName } from '../icon'
import styles from './Button.module.css'

export type ButtonVariant = 'solid' | 'crimson' | 'light' | 'outline' | 'ghost'

interface ButtonLookProps {
  variant?: ButtonVariant
  size?: 'md' | 'sm'
  icon?: IconName
  iconPosition?: 'start' | 'end'
  children: ReactNode
}

function Content({
  icon,
  iconPosition,
  children,
}: Pick<ButtonLookProps, 'icon' | 'iconPosition' | 'children'>) {
  const iconElement = icon ? (
    <Icon
      name={icon}
      size={18}
      className={cx(styles.icon, iconPosition === 'end' && styles.iconEnd)}
    />
  ) : null
  return (
    <>
      {iconPosition === 'start' ? iconElement : null}
      <span>{children}</span>
      {iconPosition === 'end' ? iconElement : null}
    </>
  )
}

export function buttonClassName({
  variant = 'solid',
  size = 'md',
  className,
}: {
  variant?: ButtonVariant
  size?: 'md' | 'sm'
  className?: string
}): string {
  return cx(
    styles.button,
    styles[variant],
    size === 'sm' && styles.sm,
    className,
  )
}

export type ButtonProps = ButtonLookProps &
  Omit<ComponentPropsWithRef<'button'>, 'children'>

/** 모서리를 깎은 버튼 */
export function Button({
  variant,
  size,
  icon,
  iconPosition = 'end',
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClassName({ variant, size, className })}
      {...rest}
    >
      <Content icon={icon} iconPosition={iconPosition}>
        {children}
      </Content>
    </button>
  )
}

export type ButtonLinkProps = ButtonLookProps &
  Omit<ComponentPropsWithRef<'a'>, 'children'>

/** 버튼 모양의 링크 (다른 페이지·위치로 이동할 때) */
export function ButtonLink({
  variant,
  size,
  icon,
  iconPosition = 'end',
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <a className={buttonClassName({ variant, size, className })} {...rest}>
      <Content icon={icon} iconPosition={iconPosition}>
        {children}
      </Content>
    </a>
  )
}
