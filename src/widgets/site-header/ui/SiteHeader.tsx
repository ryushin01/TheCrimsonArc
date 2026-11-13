import { type ReactNode, useEffect, useId, useState } from 'react'
import { type NavItem, ROUTES } from '@/shared/config'
import { useMotion } from '@/shared/lib/motion'
import { ButtonLink } from '@/shared/ui/button'
import { Icon, type IconName } from '@/shared/ui/icon'
import { Logo } from '@/shared/ui/logo'
import { useHeaderTone, useScrolled } from '../lib/use-header-tone'
import styles from './SiteHeader.module.css'

export interface SiteHeaderProps {
  /** 지금 페이지 (첫 화면 로고 링크의 aria-current에 씁니다) */
  page: 'home' | 'editor' | 'studio' | 'other'
  /** 주 메뉴 항목 */
  nav: readonly NavItem[]
  /** 오른쪽 강조 링크. current면 지금 페이지로 표시합니다. */
  cta?: NavItem & { current?: boolean; icon?: IconName }
  /** 강조 링크 앞에 넣을 페이지 전용 버튼 (디버그 패널 열기 등) */
  actions?: ReactNode
  /** 본문 바로가기가 가리킬 아이디 */
  mainId?: string
  /** 자동으로 움직이는 연출이 있는 페이지에서만 정지 버튼을 보여 줍니다. */
  showMotionToggle?: boolean
  /** 처음부터 어두운 바탕 위에 놓이는지 */
  dark?: boolean
}

export function SiteHeader({
  page,
  nav,
  cta,
  actions,
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
            {nav.map((item) => (
              <li key={item.href} className={styles.item}>
                <a
                  className={styles.link}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                >
                  <span lang="en">{item.label}</span>
                  {item.title ? (
                    <>
                      {' '}
                      <span className="visually-hidden">({item.title})</span>
                    </>
                  ) : null}
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
          {actions}
          {cta ? (
            <ButtonLink
              href={cta.href}
              size="sm"
              variant="solid"
              icon={cta.icon ?? 'arrow-up-right'}
              className={styles.studioLink}
              aria-current={cta.current ? 'page' : undefined}
            >
              <span className={styles.studioLabel} lang="en">
                {cta.label}
              </span>
              {cta.title ? (
                <>
                  {' '}
                  <span className="visually-hidden">({cta.title})</span>
                </>
              ) : null}
            </ButtonLink>
          ) : null}
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
