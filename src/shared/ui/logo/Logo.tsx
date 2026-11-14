import { cx } from '@/shared/lib/classnames'
import styles from './Logo.module.css'
import markUrl from './mark.svg'

export interface ArcMarkProps {
  size?: number
  className?: string
}

/** 크림색 판 위에 그은 손목시계 선화(파비콘과 같은 그림). 오른쪽 위를 깎은 타일 모양은 그대로 두고, 꾸밈용이라 대체 텍스트를 비웁니다. */
export function ArcMark({ size = 32, className }: ArcMarkProps) {
  return (
    <img
      src={markUrl}
      alt=""
      width={size}
      height={size}
      className={cx(styles.tile, className)}
    />
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
