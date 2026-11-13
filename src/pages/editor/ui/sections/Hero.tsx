import { useRef } from 'react'
import { ROUTES } from '@/shared/config'
import { ButtonLink } from '@/shared/ui/button'
import { DisplayHeading } from '@/shared/ui/display-heading'
import { Tag } from '@/shared/ui/tag'
import { useChapter } from '../../model/chapters'
import styles from './Hero.module.css'

export function Hero() {
  const ref = useRef<HTMLElement>(null)
  useChapter('hero', ref)

  return (
    <section
      ref={ref}
      id="top"
      className={styles.hero}
      aria-labelledby="hero-title"
      data-theme="light"
    >
      <div className={styles.copy}>
        <Tag tone="light">Frame animation studio</Tag>
        <DisplayHeading
          as="h1"
          id="hero-title"
          prefix="The Crimson Arc:"
          lines={['Draw in layers', 'Move in frames']}
          tone="light"
          className={styles.title}
        />
      </div>
      <div className={styles.aside}>
        <p className={styles.lead}>
          <strong lang="en">The Crimson Arc</strong>는 브라우저에서 바로 쓰는
          프레임 애니메이션 스튜디오입니다. 레이어를 겹쳐 그리고, 프레임을 한
          장씩 넘겨 움직임을 만들고, 완성한 그림은 GIF로 내보내세요.
        </p>
        <div className={styles.ctas}>
          <ButtonLink href={ROUTES.studio} icon="arrow-up-right">
            스튜디오 열기
          </ButtonLink>
          <ButtonLink href="#about" variant="outline" icon="chevron-down">
            둘러보기
          </ButtonLink>
        </div>
      </div>
    </section>
  )
}
