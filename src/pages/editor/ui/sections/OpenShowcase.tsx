import styles from './Card.module.css'
import { OpenDemo } from './OpenDemo'
import { Showcase } from './Showcase'

export function OpenShowcase() {
  return (
    <Showcase
      id="open"
      index="04"
      label="Open"
      reverse
      titleLines={['Open it,', 'draw on']}
      lead="이미 있는 그림에서 시작해도 됩니다. 사진이나 움직이는 GIF를 열면 편집할 수 있는 크기로 줄이고, 원하는 색 수의 픽셀 아트로 바꿔 스튜디오에서 이어 그립니다."
      points={[
        'PNG·JPG·GIF·WebP를 끌어다 놓거나 골라서 엽니다.',
        '움직이는 GIF는 프레임마다 풀어서 프레임으로 가져옵니다.',
        '큰 이미지는 256픽셀 안으로 줄이고, 지금 작품에 새 레이어로 얹을 수도 있습니다.',
      ]}
      demo={
        <div className={styles.card}>
          <p className={styles.cardTitle}>
            <span lang="en">Open &amp; pixelate</span>
            <span>파일은 이 브라우저 밖으로 나가지 않습니다</span>
          </p>
          <OpenDemo />
        </div>
      }
    />
  )
}
