import { ExportPanel } from '@/features/export-artwork'
import { getSampleArtwork } from '../../lib/sample'
import styles from './Card.module.css'
import { Showcase } from './Showcase'

export function ExportShowcase() {
  return (
    <Showcase
      id="export"
      index="03"
      label="Export"
      titleLines={['Ship it', 'as GIF']}
      lead="완성한 애니메이션은 버튼 한 번으로 GIF가 됩니다. 아래 버튼을 누르면 브라우저 안에서 실제 GIF 파일을 만들어 미리 보고 내려받을 수 있습니다."
      points={[
        '합성: 보이는 레이어를 프레임마다 아래부터 겹칩니다.',
        '팔레트: 모든 프레임이 함께 쓸 256색 이하 팔레트를 메디안 컷으로 고르고, 원하면 디더링합니다.',
        '압축: LZW로 압축해 GIF89a로 쓰고, 화면이 멈추지 않게 Web Worker에서 처리합니다.',
      ]}
      demo={
        <div className={styles.card}>
          <p className={styles.cardTitle}>
            <span lang="en">Live export</span>
            <span>샘플 · 64×64 · 12프레임</span>
          </p>
          <ExportPanel
            artwork={getSampleArtwork()}
            fileName="crimson-arc-sample"
            defaultScale={4}
          />
        </div>
      }
    />
  )
}
