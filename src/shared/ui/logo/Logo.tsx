import { cx } from '@/shared/lib/classnames'
import styles from './Logo.module.css'

export interface ArcMarkProps {
  size?: number
  className?: string
}

/** 깎은 타일 위 크림슨 호와 그 위를 지나는 혜성. 꾸밈용이라 보조기기에서 숨깁니다. */
export function ArcMark({ size = 32, className }: ArcMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d="M0 0h26l6 6v26H0z" fill="var(--mark-tile, #3a0a1c)" />
      <path
        d="M5 24a11 11 0 0 1 22 0h-5.5a5.5 5.5 0 0 0-11 0z"
        fill="var(--mark-arc, #d23350)"
      />
      <circle cx="20.1" cy="16.9" r="2.4" fill="var(--mark-dot, #fff4ec)" />
    </svg>
  )
}

export interface LogoProps {
  className?: string
  markSize?: number
}

/** 심볼과 워드마크. 링크 안에 넣으면 'The Crimson Arc'가 링크 이름이 됩니다. */
export function Logo({ className, markSize = 32 }: LogoProps) {
  return (
    <span className={cx(styles.logo, className)}>
      <ArcMark size={markSize} className={styles.mark} />
      <span className={styles.word} lang="en">
        <span className={styles.the}>The</span> Crimson Arc
      </span>
    </span>
  )
}
