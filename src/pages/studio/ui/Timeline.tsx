import { useEffect, useId, useRef } from 'react'
import { FrameThumbnail, findFrameIndex } from '@/entities/artwork'
import { LIMITS } from '@/shared/config'
import { cx } from '@/shared/lib/classnames'
import { Icon } from '@/shared/ui/icon'
import { useStudio, useStudioStore } from '../model/use-studio'
import panel from './Panel.module.css'
import styles from './Timeline.module.css'

export function Timeline() {
  const store = useStudioStore()
  const artwork = useStudio((state) => state.artwork)
  const activeFrameId = useStudio((state) => state.activeFrameId)
  const playing = useStudio((state) => state.playing)
  const onionSkin = useStudio((state) => state.onionSkin)
  const titleId = useId()
  const fpsId = useId()
  const radioName = useId()
  const list = useRef<HTMLOListElement>(null)
  const activeIndex = findFrameIndex(artwork, activeFrameId)

  // 고른 프레임이 가로 목록 밖에 있으면 목록만 옆으로 옮깁니다. (페이지는 세로로 움직이지 않음)
  useEffect(() => {
    const container = list.current
    const item = container?.querySelector<HTMLElement>('[data-active="true"]')
    if (!container || !item) return
    const left = item.offsetLeft
    const right = left + item.offsetWidth
    if (left < container.scrollLeft) container.scrollLeft = left - 8
    else if (right > container.scrollLeft + container.clientWidth) {
      container.scrollLeft = right - container.clientWidth + 8
    }
  }, [activeFrameId])

  return (
    <section
      className={cx(panel.panel, styles.timeline)}
      aria-labelledby={titleId}
    >
      <div className={styles.head}>
        <h2 id={titleId} className={panel.title}>
          프레임 {activeIndex + 1}/{artwork.frames.length}
        </h2>
        <div className={styles.playback}>
          <button
            type="button"
            className={styles.play}
            onClick={() => store.setPlaying(!playing)}
          >
            <Icon name={playing ? 'stop' : 'play'} size={16} />
            {playing ? '정지' : '재생'}
          </button>
          <label className={styles.fps} htmlFor={fpsId}>
            속도
            <input
              id={fpsId}
              className={panel.text}
              type="number"
              min={LIMITS.minFps}
              max={LIMITS.maxFps}
              value={artwork.fps}
              onChange={(event) => {
                const value = Number(event.target.value)
                if (Number.isFinite(value) && value > 0) store.setFps(value)
              }}
            />
            fps
          </label>
          <label className={panel.check}>
            <input
              type="checkbox"
              checked={onionSkin}
              onChange={(event) => store.setOnionSkin(event.target.checked)}
            />
            어니언 스킨
          </label>
        </div>
      </div>

      <fieldset className={panel.group}>
        <legend className="visually-hidden">편집할 프레임</legend>
        <ol ref={list} className={styles.frames}>
          {artwork.frames.map((frame, index) => (
            <li key={frame.id} data-active={frame.id === activeFrameId}>
              <label className={styles.frame}>
                <input
                  type="radio"
                  name={radioName}
                  checked={frame.id === activeFrameId}
                  onChange={() => store.selectFrame(frame.id)}
                />
                <FrameThumbnail
                  artwork={artwork}
                  frameId={frame.id}
                  className={styles.thumb}
                />
                <span>
                  <span className="visually-hidden">프레임</span>{' '}
                  {String(index + 1).padStart(2, '0')}
                </span>
              </label>
            </li>
          ))}
        </ol>
      </fieldset>

      <div className={panel.row}>
        <button
          type="button"
          className={panel.action}
          onClick={() => store.addFrame()}
          disabled={artwork.frames.length >= LIMITS.maxFrames}
        >
          <Icon name="plus" size={16} />빈 프레임
        </button>
        <button
          type="button"
          className={panel.action}
          onClick={() => store.duplicateFrame()}
          disabled={artwork.frames.length >= LIMITS.maxFrames}
        >
          <Icon name="copy" size={16} />
          복제
        </button>
        <button
          type="button"
          className={panel.action}
          onClick={() => store.moveFrame(-1)}
          disabled={activeIndex <= 0}
        >
          <Icon name="chevron-left" size={16} />
          앞으로
        </button>
        <button
          type="button"
          className={panel.action}
          onClick={() => store.moveFrame(1)}
          disabled={activeIndex >= artwork.frames.length - 1}
        >
          <Icon name="chevron-right" size={16} />
          뒤로
        </button>
        <button
          type="button"
          className={panel.action}
          onClick={() => store.removeFrame()}
          disabled={artwork.frames.length <= 1}
        >
          <Icon name="trash" size={16} />
          삭제
        </button>
      </div>
    </section>
  )
}
