import { useId } from 'react'
import { HOME_SECTIONS, ROUTES, SITE } from '@/shared/config'
import { Logo } from '@/shared/ui/logo'
import styles from './SiteFooter.module.css'

export interface SiteFooterProps {
  page: 'home' | 'studio' | 'other'
}

export function SiteFooter({ page }: SiteFooterProps) {
  const exploreId = useId()
  const projectId = useId()
  const sectionHref = (id: string) =>
    page === 'home' ? `#${id}` : `${ROUTES.home}#${id}`

  return (
    <footer className={styles.footer} data-theme="light">
      <p className={styles.giant} aria-hidden="true" lang="en">
        Crimson Arc
      </p>
      <div className={styles.card}>
        <div className={styles.brand}>
          <Logo markSize={40} />
          <p className={styles.about}>
            레이어로 그리고, 프레임으로 움직이고, GIF로 내보내는 브라우저
            애니메이션 스튜디오.
          </p>
        </div>

        <nav aria-labelledby={exploreId}>
          <h2 id={exploreId} className={styles.colTitle} lang="en">
            Explore
          </h2>
          <ul className={styles.links}>
            {HOME_SECTIONS.map((section) => (
              <li key={section.id}>
                <a href={sectionHref(section.id)}>
                  <span lang="en">{section.label}</span>{' '}
                  <span className="visually-hidden">({section.title})</span>
                </a>
              </li>
            ))}
            <li>
              <a
                href={ROUTES.studio}
                aria-current={page === 'studio' ? 'page' : undefined}
              >
                <span lang="en">Studio</span>{' '}
                <span className="visually-hidden">(스튜디오)</span>
              </a>
            </li>
          </ul>
        </nav>

        <section aria-labelledby={projectId}>
          <h2 id={projectId} className={styles.colTitle} lang="en">
            Project
          </h2>
          <ul className={styles.links}>
            <li>
              <a href={SITE.repositoryUrl}>GitHub 저장소</a>
            </li>
            <li>
              <a href={SITE.storybookUrl}>Storybook 컴포넌트 문서</a>
            </li>
          </ul>
        </section>

        <div className={styles.bottom}>
          <p className={styles.notice}>
            <strong>가상의 제품입니다.</strong> The Crimson Arc는 포트폴리오를
            위해 만든 가상의 브랜드이며 판매하지 않습니다. 스튜디오의 편집
            기능은 실제로 동작합니다.
          </p>
          <p>
            © {SITE.year} {SITE.author}
          </p>
        </div>
      </div>
    </footer>
  )
}
