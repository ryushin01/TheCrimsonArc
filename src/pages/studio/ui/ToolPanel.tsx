import { type CSSProperties, useId } from 'react'
import { Icon, type IconName } from '@/shared/ui/icon'
import { PALETTE } from '../lib/palette'
import { TOOL_KEYS, TOOL_LABELS } from '../lib/tools'
import type { Tool } from '../model/studio-store'
import { useStudio, useStudioStore } from '../model/use-studio'
import panel from './Panel.module.css'
import styles from './ToolPanel.module.css'

const TOOLS: ReadonlyArray<{ tool: Tool; icon: IconName }> = [
  { tool: 'pen', icon: 'pen' },
  { tool: 'eraser', icon: 'eraser' },
  { tool: 'fill', icon: 'fill' },
  { tool: 'picker', icon: 'picker' },
]

export function ToolPanel() {
  const store = useStudioStore()
  const tool = useStudio((state) => state.tool)
  const color = useStudio((state) => state.color)
  const brushSize = useStudio((state) => state.brushSize)
  const grid = useStudio((state) => state.grid)
  const titleId = useId()
  const sizeId = useId()
  const name = useId()

  return (
    <section className={panel.panel} aria-labelledby={titleId}>
      <h2 id={titleId} className={panel.title}>
        도구
      </h2>

      <fieldset className={panel.group}>
        <legend className="visually-hidden">그리기 도구</legend>
        <div className={styles.tools}>
          {TOOLS.map((item) => (
            <label key={item.tool} className={styles.tool}>
              <input
                type="radio"
                name={`${name}-tool`}
                value={item.tool}
                checked={tool === item.tool}
                onChange={() => store.setTool(item.tool)}
              />
              <Icon name={item.icon} size={18} />
              <span>{TOOL_LABELS[item.tool]}</span>
              <kbd className={styles.key} aria-hidden="true">
                {TOOL_KEYS[item.tool]}
              </kbd>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className={panel.group}>
        <legend className={panel.legend}>색</legend>
        <div className={styles.swatches}>
          {PALETTE.map((swatch) => (
            <label
              key={swatch.color}
              className={styles.swatch}
              style={{ '--swatch': swatch.color } as CSSProperties}
            >
              <input
                type="radio"
                name={`${name}-color`}
                value={swatch.color}
                checked={color === swatch.color}
                onChange={() => store.setColor(swatch.color)}
              />
              <span className="visually-hidden">{swatch.name}</span>
            </label>
          ))}
        </div>
        <label className={styles.custom}>
          <input
            type="color"
            value={color}
            onChange={(event) => store.setColor(event.target.value)}
          />
          직접 고르기
          <code>{color}</code>
        </label>
      </fieldset>

      <div className={panel.field}>
        <label htmlFor={sizeId} className={panel.fieldLabel}>
          붓 크기
        </label>
        <div className={panel.range}>
          <input
            id={sizeId}
            type="range"
            min={1}
            max={8}
            value={brushSize}
            onChange={(event) => store.setBrushSize(Number(event.target.value))}
          />
          <output htmlFor={sizeId}>{brushSize}px</output>
        </div>
      </div>

      <label className={panel.check}>
        <input
          type="checkbox"
          checked={grid}
          onChange={(event) => store.setGrid(event.target.checked)}
        />
        픽셀 격자 보기
      </label>
    </section>
  )
}
