import { SPEC_GROUPS } from '../../model/content'
import { SectionHead } from '../SectionHead'
import styles from './Specs.module.css'

/** 사양: 케이스·무브먼트·문자판·스트랩 */
export function Specs() {
  return (
    <section
      id="specs"
      className={styles.specs}
      data-theme="light"
      aria-labelledby="specs-title"
    >
      <SectionHead
        id="specs-title"
        eyebrow="04 · Specs"
        title="CA-01 사양"
        lead="The Crimson Arc는 가상의 제품입니다. 판매하지 않으며, 수치는 쇼케이스를 위해 정한 값입니다."
        tone="light"
      />
      <div className={styles.grid}>
        {SPEC_GROUPS.map((group) => (
          <section
            key={group.id}
            className={styles.group}
            aria-labelledby={`spec-${group.id}`}
          >
            <h3 id={`spec-${group.id}`} className={styles.title}>
              {group.title}
            </h3>
            <dl className={styles.list}>
              {group.items.map((item) => (
                <div key={item.term} className={styles.row}>
                  <dt className={styles.term}>{item.term}</dt>
                  <dd className={styles.detail}>{item.detail}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </section>
  )
}
