import { ROUTES, SITE } from '@/shared/config'
import { Icon } from '@/shared/ui/icon'
import { SectionHead } from '../SectionHead'
import styles from './Lab.module.css'

interface LabLink {
  id: string
  href: string
  kicker: string
  title: string
  body: string
}

const LINKS: readonly LabLink[] = [
  {
    id: 'bench',
    href: ROUTES.bench,
    kicker: 'Benchmark',
    title: 'Canvas · DOM · SVG 성능 비교',
    body: '같은 입자 수를 세 방식으로 움직여 FPS를 잽니다. 왜 이 쇼케이스를 Canvas로 그렸는지 숫자로 확인합니다.',
  },
  {
    id: 'editor',
    href: ROUTES.editor,
    kicker: 'v0.1 · Editor',
    title: '프레임 애니메이션 편집기 소개',
    body: '처음 버전의 The Crimson Arc. 레이어·프레임·GIF 내보내기·이미지 열기를 실제로 써 보는 홍보 페이지입니다.',
  },
  {
    id: 'studio',
    href: ROUTES.studio,
    kicker: 'Studio',
    title: 'Canvas 2D 픽셀 스튜디오',
    body: '레이어 8장과 프레임 48장으로 그리고, 직접 만든 인코더로 GIF·PNG·스프라이트 시트를 내보냅니다.',
  },
  {
    id: 'storybook',
    href: SITE.storybookUrl,
    kicker: 'Storybook',
    title: '컴포넌트 문서',
    body: '섹션과 컨트롤을 따로 떼어 상태별로 보고, 접근성 검사 결과를 함께 확인합니다.',
  },
]

/** 이 사이트의 다른 실험들 */
export function Lab() {
  return (
    <section
      id="lab"
      className={styles.lab}
      data-theme="light"
      aria-labelledby="lab-title"
    >
      <SectionHead
        id="lab-title"
        eyebrow="05 · Lab"
        title="쇼케이스 뒤의 실험실"
        lead="같은 저장소에서 만든 다른 화면들입니다. 주소에 ?debug를 붙이면 이 페이지의 lil-gui 디버그 패널이 열린 채로 시작합니다."
        tone="light"
      />
      <ul className={styles.list}>
        {LINKS.map((link) => (
          <li key={link.id} className={styles.card}>
            <p className={styles.kicker} lang="en">
              {link.kicker}
            </p>
            <h3 className={styles.title}>
              <a className={styles.link} href={link.href}>
                {link.title}
                <Icon name="arrow-up-right" size={18} />
              </a>
            </h3>
            <p className={styles.body}>{link.body}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
