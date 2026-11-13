import { useMemo, useRef, useState } from 'react'
import {
  FrameThumbnail,
  PixelCanvas,
  compositeFrame,
  getCel,
} from '@/entities/artwork'
import { useFrameLoop } from '@/shared/lib/frame-loop'
import { mapRange } from '@/shared/lib/math'
import { blendOver, tint } from '@/shared/lib/pixel'
import { useInView, useMediaQuery } from '@/shared/lib/viewport'
import { Button } from '@/shared/ui/button'
import { chapterProgress, useChapter } from '../../model/chapters'
import { getSampleArtwork } from '../../lib/sample'
import styles from './Flipbook.module.css'

const pad = (value: number) => String(value).padStart(2, '0')

/** 스크롤하면 프레임이 넘어가는 플립북. 자동 재생과 어니언 스킨을 켤 수 있습니다. */
export function Flipbook() {
  const sample = getSampleArtwork()
  const count = sample.frames.length
  const [index, setIndex] = useState(0)
  const [onion, setOnion] = useState(true)
  const [playing, setPlaying] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const clock = useRef(0)
  const inView = useInView(root)
  // 넓은 화면은 섹션이 고정된 동안, 좁은 화면은 플립북이 화면을 지나가는 동안 프레임을 넘깁니다.
  const pinned = useMediaQuery('(min-width: 961px)')
  useChapter('flipbook', root)

  useFrameLoop((dt) => {
    if (playing) {
      clock.current += dt
      const step = 1 / sample.fps
      if (clock.current >= step) {
        clock.current %= step
        setIndex((current) => (current + 1) % count)
      }
      return
    }
    // 스크롤 진행도로 프레임을 고릅니다. (스크럽)
    const progress = pinned
      ? chapterProgress('frames', 'pinned')
      : mapRange(chapterProgress('flipbook', 'through'), 0.3, 0.8, 0, 1)
    const next = Math.min(count - 1, Math.floor(progress * count))
    setIndex((current) => (current === next ? current : next))
  }, inView)

  const display = useMemo(() => {
    const frame = sample.frames[index]
    const base = compositeFrame(sample, frame.id)
    if (!onion) return base
    // 움직이는 혜성 레이어만 앞(빨강)·뒤(파랑) 프레임을 비춰 보입니다.
    const comet = sample.layers[sample.layers.length - 1].id
    const previous = getCel(
      sample,
      comet,
      sample.frames[(index - 1 + count) % count].id,
    )
    const next = getCel(sample, comet, sample.frames[(index + 1) % count].id)
    const current = getCel(sample, comet, frame.id)
    if (previous) blendOver(base, tint(previous, [255, 122, 144]), 0.6)
    if (next) blendOver(base, tint(next, [126, 196, 255]), 0.6)
    if (current) blendOver(base, current)
    return base
  }, [sample, index, onion, count])

  return (
    <div ref={root} className={styles.flipbook}>
      <div className={styles.screen}>
        <PixelCanvas
          data={display}
          width={sample.width}
          height={sample.height}
          className={styles.canvas}
          label={`샘플 애니메이션 ${count}프레임 중 ${index + 1}번째 프레임${onion ? ', 앞뒤 프레임 비춰 보기 켜짐' : ''}`}
        />
        <p className={styles.counter} aria-hidden="true">
          <span className={styles.current}>{pad(index + 1)}</span>
          <span className={styles.total}>/ {pad(count)} frames</span>
        </p>
      </div>
      <ol className={styles.strip} aria-hidden="true">
        {sample.frames.map((frame, i) => (
          <li key={frame.id} data-current={i === index}>
            <FrameThumbnail artwork={sample} frameId={frame.id} />
          </li>
        ))}
      </ol>
      <div className={styles.controls}>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={onion}
            onChange={(event) => setOnion(event.target.checked)}
          />
          어니언 스킨 (앞뒤 프레임 비춰 보기)
        </label>
        <Button
          size="sm"
          variant="outline"
          icon={playing ? 'stop' : 'play'}
          iconPosition="start"
          onClick={() => setPlaying((value) => !value)}
        >
          {playing ? '재생 멈춤' : '자동 재생'}
        </Button>
        <p className={styles.timing}>
          {sample.fps} fps · 프레임당 {Math.round(1000 / sample.fps)}ms
        </p>
      </div>
    </div>
  )
}
