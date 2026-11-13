import { PRODUCT_SECTIONS, ROUTES, sectionNav } from '@/shared/config'
import { ButtonLink } from '@/shared/ui/button'
import { DisplayHeading } from '@/shared/ui/display-heading'
import { SiteFooter } from '@/widgets/site-footer'
import { SiteHeader } from '@/widgets/site-header'
import styles from './NotFoundPage.module.css'

export function NotFoundPage() {
  return (
    <>
      <SiteHeader
        page="other"
        nav={sectionNav(PRODUCT_SECTIONS, ROUTES.home)}
        cta={{ href: ROUTES.studio, label: 'Studio', title: '스튜디오' }}
      />
      <main id="main" className={styles.main}>
        <p className={styles.code} aria-hidden="true">
          404
        </p>
        <DisplayHeading as="h1" lines={['Frame not found']} prefix="404:" />
        <p className={styles.text}>
          찾는 페이지가 없습니다. 주소가 바뀌었거나 잘못 입력되었을 수 있습니다.
          첫 화면이나 스튜디오에서 다시 시작해 주세요.
        </p>
        <div className={styles.links}>
          <ButtonLink href={ROUTES.home} icon="arrow-right">
            첫 화면으로
          </ButtonLink>
          <ButtonLink
            href={ROUTES.studio}
            variant="outline"
            icon="arrow-up-right"
          >
            스튜디오 열기
          </ButtonLink>
        </div>
      </main>
      <SiteFooter page="other" />
    </>
  )
}
