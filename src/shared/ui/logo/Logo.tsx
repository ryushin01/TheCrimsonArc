import { cx } from '@/shared/lib/classnames'
import styles from './Logo.module.css'

export interface ArcMarkProps {
  size?: number
  className?: string
}

/**
 * 손목시계 선화(파비콘과 같은 그림). 판 없이 선만 그려 글자색(currentColor)을 따르고, 고회전 구간 같은 호만
 * `--mark-arc`(기본 #8B0000) 색입니다. 꾸밈용이라 보조기기에서 숨깁니다.
 */
export function ArcMark({ size = 32, className }: ArcMarkProps) {
  return (
    <svg
      viewBox="24 24 464 464"
      width={size}
      height={size}
      className={cx(styles.svg, className)}
      aria-hidden="true"
      focusable="false"
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M206 104L218 40H294L306 104M206 408L218 472H294L306 408" />
        <circle cx="256" cy="256" r="150" />
        <path d="M406 236V276" />
      </g>
      <path
        className={styles.arc}
        d="M158.3 220.4A104 104 0 0 1 353.7 220.4"
        fill="none"
        strokeWidth="16"
        strokeLinecap="round"
      />
      <path
        d="M256 256L305 171.1"
        stroke="currentColor"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <circle cx="256" cy="256" r="16" fill="currentColor" />
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
