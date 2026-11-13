import { DisplayHeading } from '@/shared/ui/display-heading'
import { Icon, type IconName } from '@/shared/ui/icon'
import { Tag } from '@/shared/ui/tag'
import styles from './Specs.module.css'

const SPECS: ReadonlyArray<{ icon: IconName; title: string; text: string }> = [
  {
    icon: 'layers',
    title: '레이어 8장',
    text: '보이기·숨기기, 불투명도, 이름 바꾸기, 순서 바꾸기, 복제. 숨긴 레이어는 내보낼 때도 빠집니다.',
  },
  {
    icon: 'film',
    title: '프레임 48장',
    text: '1~24fps 재생, 복제와 순서 바꾸기, 앞뒤 프레임을 비춰 보는 어니언 스킨.',
  },
  {
    icon: 'sparkle',
    title: 'GIF89a 내보내기',
    text: '메디안 컷 팔레트(최대 256색)와 디더링, ×1~×8 배율, 무한 반복. PNG와 스프라이트 시트도 만듭니다.',
  },
  {
    icon: 'image',
    title: '이미지 열기',
    text: 'PNG·JPG·GIF·WebP. 움직이는 GIF는 프레임째 열고, 큰 그림은 256픽셀 안으로 줄입니다.',
  },
  {
    icon: 'undo',
    title: '되돌리기 50단계',
    text: 'Ctrl(⌘)+Z로 되돌리고 Ctrl(⌘)+Shift+Z로 다시 합니다. 그리기와 레이어·프레임 변경 모두.',
  },
  {
    icon: 'pen',
    title: '키보드로 그리기',
    text: '캔버스에서 화살표로 커서를 옮기고 Space로 찍습니다. 도구 단축키는 캔버스에서만 동작합니다.',
  },
]

export function Specs() {
  return (
    <section
      id="specs"
      className={styles.specs}
      aria-labelledby="specs-title"
      data-theme="dark"
    >
      <div className={styles.inner}>
        <div className={styles.head}>
          <div className={styles.headText}>
            <Tag tone="light">Specs</Tag>
            <DisplayHeading
              id="specs-title"
              tone="light"
              lines={['Built for', 'frame by frame']}
              className={styles.title}
            />
          </div>
          <p className={styles.lead}>
            스튜디오가 실제로 할 수 있는 일만 적었습니다. 설치도 회원가입도 없이
            이 브라우저 안에서 동작합니다.
          </p>
        </div>
        <ul className={styles.cards}>
          {SPECS.map((spec, index) => (
            <li key={spec.title} className={styles.card}>
              <p className={styles.cardTop} aria-hidden="true">
                <Icon name={spec.icon} size={20} />0{index + 1}
              </p>
              <h3 className={styles.cardTitle}>{spec.title}</h3>
              <p className={styles.cardText}>{spec.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
