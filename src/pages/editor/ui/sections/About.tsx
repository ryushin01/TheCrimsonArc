import { useRef } from 'react'
import { useFrameLoop } from '@/shared/lib/frame-loop'
import { useMotion } from '@/shared/lib/motion'
import { useInView, useMediaQuery } from '@/shared/lib/viewport'
import { DisplayHeading } from '@/shared/ui/display-heading'
import { Tag } from '@/shared/ui/tag'
import { ANCHOR_COUNT, anchorStore } from '../../model/anchors'
import { chapterProgress, useChapter } from '../../model/chapters'
import styles from './About.module.css'

const CALLOUTS = [
  {
    label: 'Layer',
    title: '겹겹이 쌓는 레이어',
    text: '레이어를 8장까지 겹쳐 그리고, 숨기거나 불투명도를 바꿉니다.',
  },
  {
    label: 'Frame',
    title: '한 장씩 넘기는 프레임',
    text: '프레임을 48장까지 그려 움직임을 만들고, 앞뒤 그림을 비춰 봅니다.',
  },
  {
    label: 'GIF',
    title: '한 번에 내보내는 GIF',
    text: '모든 프레임을 256색 이하 팔레트로 줄여 반복 재생되는 GIF로 만듭니다.',
  },
  {
    label: 'Open',
    title: '열어서 이어 그리기',
    text: 'PNG·JPG·GIF·WebP를 열고, 움직이는 GIF는 프레임째 불러옵니다.',
  },
] as const

/** 스크롤하면 3D 호의 조각이 펼쳐지고, 주석이 차례로 나타나 조각을 지시선으로 가리킵니다. */
export function About() {
  const ref = useRef<HTMLElement>(null)
  const items = useRef<Array<HTMLLIElement | null>>([])
  const lines = useRef<Array<SVGLineElement | null>>([])
  const markers = useRef<Array<SVGRectElement | null>>([])
  const sticky = useRef<HTMLDivElement>(null)
  const { reduced } = useMotion()
  const wide = useMediaQuery('(min-width: 901px)')
  const inView = useInView(ref)
  useChapter('about', ref)

  useFrameLoop(() => {
    const progress = chapterProgress('about', 'pinned')
    const box = sticky.current?.getBoundingClientRect()
    for (let i = 0; i < ANCHOR_COUNT; i += 1) {
      const item = items.current[i]
      const line = lines.current[i]
      const marker = markers.current[i]
      if (!item || !line || !marker || !box) continue
      const visible = reduced || !wide || progress > 0.1 + i * 0.16
      item.dataset.visible = String(visible)

      const anchor = anchorStore.get(i)
      const rect = item.getBoundingClientRect()
      const onLeft = i < 2
      const x1 = (onLeft ? rect.right : rect.left) - box.left
      const y1 = rect.top + 26 - box.top
      const x2 = anchor.x - box.left
      const y2 = anchor.y - box.top
      const show = visible && anchor.visible && wide
      line.setAttribute('x1', x1.toFixed(1))
      line.setAttribute('y1', y1.toFixed(1))
      line.setAttribute('x2', x2.toFixed(1))
      line.setAttribute('y2', y2.toFixed(1))
      line.style.opacity = show ? '0.9' : '0'
      marker.setAttribute(
        'transform',
        `translate(${x2.toFixed(1)} ${y2.toFixed(1)}) rotate(45)`,
      )
      marker.style.opacity = show ? '1' : '0'
    }
  }, inView)

  return (
    <section
      ref={ref}
      id="about"
      className={styles.about}
      aria-labelledby="about-title"
      data-theme="light"
    >
      <div ref={sticky} className={styles.sticky}>
        <svg className={styles.lines} aria-hidden="true">
          {CALLOUTS.map((callout, index) => (
            <g key={callout.label}>
              <line
                ref={(element) => {
                  lines.current[index] = element
                }}
                className={styles.line}
              />
              <rect
                ref={(element) => {
                  markers.current[index] = element
                }}
                className={styles.marker}
                x={-6}
                y={-6}
                width={12}
                height={12}
              />
            </g>
          ))}
        </svg>

        <div className={styles.intro}>
          <Tag>The studio</Tag>
          <DisplayHeading
            id="about-title"
            lines={['What is', 'Crimson Arc?']}
            className={styles.title}
          />
          <p className={styles.text}>
            그림 한 장을 여러 레이어로 나누고, 그 그림을 프레임마다 조금씩
            바꾸면 움직임이 됩니다. 크림슨 호를 이루는 조각 하나하나가 바로 그
            레이어입니다.
          </p>
        </div>

        <ol className={styles.callouts}>
          {CALLOUTS.map((callout, index) => (
            <li
              key={callout.label}
              ref={(element) => {
                items.current[index] = element
              }}
              className={styles.callout}
              data-visible="false"
            >
              <p className={styles.calloutLabel}>
                <span>0{index + 1}</span>
                <span lang="en">{callout.label}</span>
              </p>
              <h3 className={styles.calloutTitle}>{callout.title}</h3>
              <p className={styles.calloutText}>{callout.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
