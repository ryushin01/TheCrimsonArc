import { useEffect, useId, useState } from 'react'
import { HOME_SECTIONS, ROUTES } from '@/shared/config'
import { useMotion } from '@/shared/lib/motion'
import { ButtonLink } from '@/shared/ui/button'
import { Icon } from '@/shared/ui/icon'
import { Logo } from '@/shared/ui/logo'
import { useHeaderTone, useScrolled } from '../lib/use-header-tone'
import styles from './SiteHeader.module.css'

export interface SiteHeaderProps {
  /** 지금 페이지 (aria-current와 링크 주소에 씁니다) */
  page: 'home' | 'studio' | 'other'
  /** 본문 바로가기가 가리킬 아이디 */
  mainId?: string
  /** 자동으로 움직이는 연출이 있는 페이지에서만 정지 버튼을 보여 줍니다. */
  showMotionToggle?: boolean
  /** 처음부터 어두운 바탕 위에 놓이는지 */
  dark?: boolean
}

export function SiteHeader({
  page,
  mainId = 'main',
  showMotionToggle = false,
  dark = false,
}: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const navId = useId()
  const navTitleId = useId()
  const observedTone = useHeaderTone()
  const scrolled = useScrolled()
  const { paused, setPaused } = useMotion()
  const tone = dark ? 'dark' : observedTone

  useEffect(() => {
    if (!menuOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  const sectionHref = (id: string) =>
    page === 'home' ? `#${id}` : `${ROUTES.home}#${id}`

  return (
    <>
      <a className="skip-link" href={`#${mainId}`}>
        본문 바로가기
      </a>
      <header
        className={styles.header}
        data-tone={tone}
        data-scrolled={scrolled || dark}
      >
        <a
          href={ROUTES.home}
          className={styles.home}
          aria-current={page === 'home' ? 'page' : undefined}
        >
          <Logo />
        </a>

        <nav
          id={navId}
          className={styles.nav}
          aria-labelledby={navTitleId}
          data-open={menuOpen}
        >
          <h2 id={navTitleId} className="visually-hidden">
            주 메뉴
          </h2>
          <ul className={styles.list}>
            {HOME_SECTIONS.map((section) => (
              <li key={section.id} className={styles.item}>
                <a
                  className={styles.link}
                  href={sectionHref(section.id)}
                  onClick={() => setMenuOpen(false)}
                >
                  <span lang="en">{section.label}</span>{' '}
                  <span className="visually-hidden">({section.title})</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.actions}>
          {showMotionToggle ? (
            <button
              type="button"
              className={styles.motion}
              onClick={() => setPaused(!paused)}
            >
              <Icon name={paused ? 'play' : 'pause'} size={16} />
              <span className={styles.motionText}>
                {paused ? '움직임 재생' : '움직임 멈춤'}
              </span>
            </button>
          ) : null}
          <ButtonLink
            href={ROUTES.studio}
            size="sm"
            variant="solid"
            icon="arrow-up-right"
            className={styles.studioLink}
            aria-current={page === 'studio' ? 'page' : undefined}
          >
            <span className={styles.studioLabel}>Studio</span>
          </ButtonLink>
          <button
            type="button"
            className={styles.menuButton}
            aria-expanded={menuOpen}
            aria-controls={navId}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <Icon name={menuOpen ? 'close' : 'menu'} size={18} />
            메뉴
          </button>
        </div>
      </header>
    </>
  )
}
