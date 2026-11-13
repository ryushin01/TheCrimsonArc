import { useId } from 'react'
import { PixelCanvas, getCel } from '@/entities/artwork'
import { LIMITS } from '@/shared/config'
import { Icon } from '@/shared/ui/icon'
import { useStudio, useStudioStore } from '../model/use-studio'
import styles from './LayersPanel.module.css'
import panel from './Panel.module.css'

export function LayersPanel() {
  const store = useStudioStore()
  const artwork = useStudio((state) => state.artwork)
  const activeLayerId = useStudio((state) => state.activeLayerId)
  const activeFrameId = useStudio((state) => state.activeFrameId)
  const titleId = useId()
  const nameId = useId()
  const opacityId = useId()
  const radioName = useId()

  const layers = [...artwork.layers].reverse()
  const activeIndex = artwork.layers.findIndex(
    (layer) => layer.id === activeLayerId,
  )
  const active = artwork.layers[activeIndex]

  return (
    <section className={panel.panel} aria-labelledby={titleId}>
      <h2 id={titleId} className={panel.title}>
        레이어
        <span>
          {artwork.layers.length}/{LIMITS.maxLayers}
        </span>
      </h2>

      <fieldset className={panel.group}>
        <legend className="visually-hidden">
          편집할 레이어 (위가 맨 위 레이어)
        </legend>
        <ol className={styles.list}>
          {layers.map((layer) => (
            <li
              key={layer.id}
              className={styles.item}
              data-active={layer.id === activeLayerId}
            >
              <label className={styles.select}>
                <input
                  type="radio"
                  name={radioName}
                  checked={layer.id === activeLayerId}
                  onChange={() => store.selectLayer(layer.id)}
                />
                <PixelCanvas
                  data={getCel(artwork, layer.id, activeFrameId) ?? null}
                  width={artwork.width}
                  height={artwork.height}
                  className={styles.thumb}
                />
                <span className={styles.name}>
                  {layer.name}
                  <span className={styles.meta}>
                    {Math.round(layer.opacity * 100)}%
                    {layer.visible ? '' : ' · 숨김'}
                  </span>
                </span>
              </label>
              <label className={styles.visibility} data-off={!layer.visible}>
                <input
                  type="checkbox"
                  checked={layer.visible}
                  onChange={(event) =>
                    store.updateLayer(layer.id, {
                      visible: event.target.checked,
                    })
                  }
                />
                <span className="visually-hidden">{layer.name} 보이기</span>
                <Icon name="eye" size={18} />
              </label>
            </li>
          ))}
        </ol>
      </fieldset>

      {active ? (
        <div className={panel.group}>
          <div className={panel.field}>
            <label htmlFor={nameId} className={panel.fieldLabel}>
              이름
            </label>
            <input
              id={nameId}
              className={panel.text}
              type="text"
              value={active.name}
              maxLength={24}
              onChange={(event) =>
                store.updateLayer(
                  active.id,
                  { name: event.target.value },
                  `name-${active.id}`,
                )
              }
            />
          </div>
          <div className={panel.field}>
            <label htmlFor={opacityId} className={panel.fieldLabel}>
              불투명도
            </label>
            <div className={panel.range}>
              <input
                id={opacityId}
                type="range"
                min={0}
                max={100}
                step={5}
                value={Math.round(active.opacity * 100)}
                onChange={(event) =>
                  store.updateLayer(
                    active.id,
                    { opacity: Number(event.target.value) / 100 },
                    `opacity-${active.id}`,
                  )
                }
              />
              <output htmlFor={opacityId}>
                {Math.round(active.opacity * 100)}%
              </output>
            </div>
          </div>
        </div>
      ) : null}

      <div className={panel.row}>
        <button
          type="button"
          className={panel.action}
          onClick={() => store.addLayer()}
          disabled={artwork.layers.length >= LIMITS.maxLayers}
        >
          <Icon name="plus" size={16} />
          추가
        </button>
        <button
          type="button"
          className={panel.action}
          onClick={() => store.duplicateLayer()}
          disabled={artwork.layers.length >= LIMITS.maxLayers}
        >
          <Icon name="copy" size={16} />
          복제
        </button>
        <button
          type="button"
          className={panel.action}
          onClick={() => store.moveLayer(1)}
          disabled={activeIndex >= artwork.layers.length - 1}
        >
          <Icon name="chevron-up" size={16} />
          위로
        </button>
        <button
          type="button"
          className={panel.action}
          onClick={() => store.moveLayer(-1)}
          disabled={activeIndex <= 0}
        >
          <Icon name="chevron-down" size={16} />
          아래로
        </button>
        <button
          type="button"
          className={panel.action}
          onClick={() => store.removeLayer()}
          disabled={artwork.layers.length <= 1}
        >
          <Icon name="trash" size={16} />
          삭제
        </button>
      </div>
    </section>
  )
}
