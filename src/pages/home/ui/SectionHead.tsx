import type { ReactNode } from 'react'
import styles from './SectionHead.module.css'

export interface SectionHeadProps {
  /** 제목 요소의 아이디 (섹션의 aria-labelledby가 가리킵니다) */
  id: string
  /** 번호와 영문 이름, 예: '01 · Anatomy' */
  eyebrow: string
  title: ReactNode
  lead?: ReactNode
  tone?: 'dark' | 'light'
  align?: 'start' | 'center'
  className?: string
}

/** 섹션 머리: 영문 번호 줄, 제목(h2), 소개 문장 */
export function SectionHead({
  id,
  eyebrow,
  title,
  lead,
  tone = 'dark',
  align = 'start',
  className,
}: SectionHeadProps) {
  return (
    <header
      className={className ? `${styles.head} ${className}` : styles.head}
      data-tone={tone}
      data-align={align}
    >
      <p className={styles.eyebrow} lang="en">
        {eyebrow}
      </p>
      <h2 id={id} className={styles.title}>
        {title}
      </h2>
      {lead ? <p className={styles.lead}>{lead}</p> : null}
    </header>
  )
}
