import type { ReactNode } from 'react'
import { cx } from '@/shared/lib/classnames'
import styles from './Tag.module.css'

export interface TagProps {
  /** 앞에 붙는 번호 (예: '01') */
  index?: string
  children: ReactNode
  tone?: 'ink' | 'crimson' | 'light'
  /** 라벨 글자의 언어 */
  lang?: string
  className?: string
}

/** 섹션 제목 위의 작은 라벨: [01][LAYERS]|| */
export function Tag({
  index,
  children,
  tone = 'ink',
  lang = 'en',
  className,
}: TagProps) {
  return (
    <p className={cx(styles.tag, styles[tone], className)}>
      {index ? <span className={styles.index}>{index}</span> : null}
      <span className={styles.label} lang={lang}>
        {children}
      </span>
      <span className={styles.bars} aria-hidden="true" />
    </p>
  )
}
