import { type CSSProperties, useMemo, useRef, useState } from 'react'
import {
  PixelCanvas,
  compositeFrame,
  getCel,
  updateLayer,
} from '@/entities/artwork'
import { useFrameLoop } from '@/shared/lib/frame-loop'
import { clamp, damp } from '@/shared/lib/math'
import { useMotion } from '@/shared/lib/motion'
import { pointerStore } from '@/shared/lib/pointer'
import { useInView } from '@/shared/lib/viewport'
import { getSampleArtwork } from '../../lib/sample'
import styles from './LayerStack.module.css'

const FRAME_INDEX = 6

/** 샘플 작품의 레이어를 3D로 펼쳐 보이고, 레이어를 켜고 끄면 합친 결과가 바로 바뀝니다. */
export function LayerStack() {
  const sample = getSampleArtwork()
  const frameId = sample.frames[FRAME_INDEX].id
  const [visible, setVisible] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(sample.layers.map((layer) => [layer.id, true])),
  )
  const [spread, setSpread] = useState(true)
  const stage = useRef<HTMLDivElement>(null)
  const stack = useRef<HTMLDivElement>(null)
  const tilt = useRef({ x: 0, y: 0 })
  const inView = useInView(stage)
  const { reduced } = useMotion()

  const composite = useMemo(() => {
    let artwork = sample
    for (const layer of sample.layers) {
      artwork = updateLayer(artwork, layer.id, {
        visible: visible[layer.id] ?? true,
      })
    }
    return compositeFrame(artwork, frameId)
  }, [sample, frameId, visible])

  // 마우스가 무대 어디에 있는지에 따라 쌓인 레이어가 lerp로 천천히 기울어집니다.
  useFrameLoop((dt) => {
    const element = stack.current
    const box = stage.current?.getBoundingClientRect()
    if (!element || !box) return
    const pointer = pointerStore.get()
    const tx = pointer.active
      ? clamp(((pointer.clientX - box.left) / box.width) * 2 - 1, -1, 1)
      : 0
    const ty = pointer.active
      ? clamp(((pointer.clientY - box.top) / box.height) * 2 - 1, -1, 1)
      : 0
    const strength = reduced ? 4 : 12
    tilt.current.x = damp(tilt.current.x, tx * strength, 5, dt)
    tilt.current.y = damp(tilt.current.y, ty * strength, 5, dt)
    element.style.transform = `rotateX(${(56 - tilt.current.y).toFixed(2)}deg) rotateZ(${(-38 + tilt.current.x).toFixed(2)}deg)`
  }, inView)

  const visibleNames = sample.layers
    .filter((layer) => visible[layer.id])
    .map((layer) => layer.name)
  const order = [...sample.layers].reverse()

  return (
    <div className={styles.demo}>
      <div
        ref={stage}
        className={styles.stage}
        role="img"
        aria-label={`레이어 ${sample.layers.length}장을 ${spread ? '펼쳐' : '겹쳐'} 놓은 모습. 보이는 레이어: ${visibleNames.join(', ') || '없음'}`}
      >
        <div
          ref={stack}
          className={styles.stack}
          style={
            {
              '--gap': spread ? '64px' : '3px',
              '--mid': (sample.layers.length - 1) / 2,
            } as CSSProperties
          }
        >
          {sample.layers.map((layer, index) => (
            <div
              key={layer.id}
              className={styles.plane}
              style={{ '--i': index } as CSSProperties}
              data-hidden={!visible[layer.id]}
            >
              <PixelCanvas
                data={getCel(sample, layer.id, frameId) ?? null}
                width={sample.width}
                height={sample.height}
              />
              <span className={styles.planeTag} aria-hidden="true">
                0{index + 1} {layer.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.side}>
        <figure className={styles.result}>
          <PixelCanvas
            data={composite}
            width={sample.width}
            height={sample.height}
            checkerboard
            label={`합친 결과: ${visibleNames.join(', ') || '보이는 레이어 없음'}`}
          />
          <figcaption>합친 결과</figcaption>
        </figure>

        <fieldset className={styles.group}>
          <legend className={styles.legend}>보이는 레이어</legend>
          {order.map((layer) => {
            const index = sample.layers.indexOf(layer)
            return (
              <label key={layer.id} className={styles.check}>
                <input
                  type="checkbox"
                  checked={visible[layer.id] ?? true}
                  onChange={(event) =>
                    setVisible((current) => ({
                      ...current,
                      [layer.id]: event.target.checked,
                    }))
                  }
                />
                <span className={styles.layerIndex}>0{index + 1}</span>
                {layer.name}
              </label>
            )
          })}
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={spread}
              onChange={(event) => setSpread(event.target.checked)}
            />
            레이어 펼쳐 보기
          </label>
        </fieldset>
      </div>
    </div>
  )
}
