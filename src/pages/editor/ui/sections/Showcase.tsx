import type { ReactNode, Ref } from 'react'
import { cx } from '@/shared/lib/classnames'
import { DisplayHeading } from '@/shared/ui/display-heading'
import { Tag } from '@/shared/ui/tag'
import styles from './Showcase.module.css'

export interface ShowcaseProps {
  id: string
  index: string
  label: string
  titleLines: readonly string[]
  lead: ReactNode
  points: readonly ReactNode[]
  demo: ReactNode
  reverse?: boolean
  /** 스크롤하는 동안 화면에 고정 (스크럽 데모용) */
  pinned?: boolean
  sectionRef?: Ref<HTMLElement>
}

/** 기능 하나를 설명 + 실제로 동작하는 데모로 보여 주는 섹션 틀 */
export function Showcase({
  id,
  index,
  label,
  titleLines,
  lead,
  points,
  demo,
  reverse = false,
  pinned = false,
  sectionRef,
}: ShowcaseProps) {
  const titleId = `${id}-title`
  return (
    <section
      ref={sectionRef}
      id={id}
      className={cx(
        styles.section,
        reverse && styles.reverse,
        pinned && styles.pinned,
      )}
      aria-labelledby={titleId}
      data-theme="light"
    >
      <div className={styles.grid}>
        <div className={styles.text}>
          <Tag index={index} tone="crimson">
            {label}
          </Tag>
          <DisplayHeading
            id={titleId}
            lines={titleLines}
            className={styles.title}
          />
          <p className={styles.lead}>{lead}</p>
          <ul className={styles.points}>
            {points.map((point, i) => (
              <li key={i}>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.demo}>{demo}</div>
      </div>
    </section>
  )
}
