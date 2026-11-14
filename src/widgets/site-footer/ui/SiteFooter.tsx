import { useId } from 'react'
import { PRODUCT_SECTIONS, ROUTES, SITE } from '@/shared/config'
import { Logo } from '@/shared/ui/logo'
import styles from './SiteFooter.module.css'

export interface SiteFooterProps {
  page: 'home' | 'editor' | 'studio' | 'bench' | 'other'
}

const LAB_LINKS = [
  {
    href: ROUTES.editor,
    label: 'Editor',
    title: '프레임 애니메이션 편집기 소개',
    page: 'editor',
  },
  {
    href: ROUTES.studio,
    label: 'Studio',
    title: '픽셀 애니메이션 스튜디오',
    page: 'studio',
  },
  {
    href: ROUTES.bench,
    label: 'Bench',
    title: 'Canvas·DOM·SVG 성능 비교',
    page: 'bench',
  },
  {
    href: SITE.storybookUrl,
    label: 'Storybook',
    title: '컴포넌트 문서',
    page: null,
  },
] as const

export function SiteFooter({ page }: SiteFooterProps) {
  const exploreId = useId()
  const labId = useId()
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
            회전 베젤의 첫 15분을 크림슨 호로 새긴 가상의 기계식 파일럿 워치.
            41mm 비드블라스트 스틸, 80,000A/m 내자성, 자동 크로노그래프 A-01.
          </p>
        </div>

        <nav aria-labelledby={exploreId}>
          <h2 id={exploreId} className={styles.colTitle} lang="en">
            Explore
          </h2>
          <ul className={styles.links}>
            {PRODUCT_SECTIONS.map((section) => (
              <li key={section.id}>
                <a href={sectionHref(section.id)}>
                  <span lang="en">{section.label}</span>{' '}
                  <span className="visually-hidden">({section.title})</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-labelledby={labId}>
          <h2 id={labId} className={styles.colTitle} lang="en">
            Lab
          </h2>
          <ul className={styles.links}>
            {LAB_LINKS.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  aria-current={link.page === page ? 'page' : undefined}
                >
                  <span lang="en">{link.label}</span>{' '}
                  <span className="visually-hidden">({link.title})</span>
                </a>
              </li>
            ))}
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
          </ul>
        </section>

        <div className={styles.bottom}>
          <p className={styles.notice}>
            <strong>가상의 제품입니다.</strong> The Crimson Arc는 포트폴리오를
            위해 만든 가상의 시계 브랜드이며 판매하지 않습니다. 시계는
            three.js로 직접 모델링했고, 실제 브랜드의 로고와 이름은 쓰지
            않았습니다.
          </p>
          <p>
            © {SITE.year} {SITE.author}
          </p>
        </div>
      </div>
    </footer>
  )
}
