import { useRef } from 'react'
import { HOME_SECTIONS } from '@/shared/config'
import { DisplayHeading } from '@/shared/ui/display-heading'
import { Tag } from '@/shared/ui/tag'
import { useChapter } from '../../model/chapters'
import styles from './Process.module.css'

/** 3D 호가 빛줄기 속으로 멀어지는 구간. 네 기능으로 가는 목차를 겸합니다. */
export function Process() {
  const ref = useRef<HTMLElement>(null)
  useChapter('process', ref)

  return (
    <section
      ref={ref}
      id="process"
      className={styles.process}
      aria-labelledby="process-title"
      data-theme="light"
    >
      <div className={styles.inner}>
        <Tag index="00">How it works</Tag>
        <DisplayHeading
          id="process-title"
          align="center"
          lines={['From sketch', 'to GIF']}
          className={styles.title}
        />
        <p className={styles.lead}>
          스케치에서 GIF까지 네 단계면 충분합니다. 아래 데모는 모두 실제로
          동작하고, 같은 기능을 스튜디오에서 그대로 쓸 수 있습니다.
        </p>
        <ol className={styles.steps}>
          {HOME_SECTIONS.map((section, index) => (
            <li key={section.id} className={styles.step}>
              <a href={`#${section.id}`}>
                <span className={styles.stepIndex}>0{index + 1}</span>
                <span className={styles.stepLabel} lang="en">
                  {section.label}
                </span>
                <span className={styles.stepTitle}>{section.title}</span>
              </a>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
