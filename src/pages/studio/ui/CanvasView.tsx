import {
  type DragEvent,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
import {
  compositeFrame,
  findFrameIndex,
  getCel,
  setCel,
} from '@/entities/artwork'
import { type PixelBuffer, blendOver, tint } from '@/shared/lib/pixel'
import { useElementSize } from '@/shared/lib/viewport'
import { Icon } from '@/shared/ui/icon'
import { type Point, TOOL_LABELS, applyTool, pickColor } from '../lib/tools'
import type { Tool } from '../model/studio-store'
import { useStudio, useStudioStore } from '../model/use-studio'
import styles from './CanvasView.module.css'
import panel from './Panel.module.css'

interface Stroke {
  buffer: PixelBuffer
  last: Point | null
  changed: boolean
  layerId: string
  frameId: string
  tool: Tool
}

const KEY_TOOLS: Record<string, Tool> = {
  b: 'pen',
  e: 'eraser',
  g: 'fill',
  i: 'picker',
}
const ONION_PREVIOUS: readonly [number, number, number] = [255, 122, 144]
const ONION_NEXT: readonly [number, number, number] = [126, 196, 255]

export interface CanvasViewProps {
  /** 캔버스에 이미지 파일을 끌어다 놓았을 때 */
  onDropFile: (file: File) => void
}

/** 그리기 화면. 마우스·펜·터치와 키보드(화살표 + Space)로 그립니다. */
export function CanvasView({ onDropFile }: CanvasViewProps) {
  const store = useStudioStore()
  const artwork = useStudio((state) => state.artwork)
  const activeLayerId = useStudio((state) => state.activeLayerId)
  const activeFrameId = useStudio((state) => state.activeFrameId)
  const onionSkin = useStudio((state) => state.onionSkin)
  const playing = useStudio((state) => state.playing)
  const grid = useStudio((state) => state.grid)
  const tool = useStudio((state) => state.tool)
  const brushSize = useStudio((state) => state.brushSize)

  const stage = useRef<HTMLDivElement>(null)
  const pixels = useRef<HTMLCanvasElement>(null)
  const overlay = useRef<HTMLCanvasElement>(null)
  const stroke = useRef<Stroke | null>(null)
  const cursor = useRef<Point & { visible: boolean; keyboard: boolean }>({
    x: 0,
    y: 0,
    visible: false,
    keyboard: false,
  })
  const [zoom, setZoom] = useState<number | null>(null)
  const [dragging, setDragging] = useState(false)
  const [position, setPosition] = useState('')
  const size = useElementSize(stage)
  const helpId = useId()

  const { width, height } = artwork
  const fit = Math.max(
    1,
    Math.min(
      32,
      Math.floor(
        Math.min((size.width - 40) / width, (size.height - 40) / height),
      ) || 1,
    ),
  )
  const scale = zoom ?? fit

  const drawOverlay = useCallback(() => {
    const canvas = overlay.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return
    const ratio = window.devicePixelRatio || 1
    const cssWidth = width * scale
    const cssHeight = height * scale
    if (
      canvas.width !== Math.round(cssWidth * ratio) ||
      canvas.height !== Math.round(cssHeight * ratio)
    ) {
      canvas.width = Math.round(cssWidth * ratio)
      canvas.height = Math.round(cssHeight * ratio)
    }
    context.setTransform(ratio, 0, 0, ratio, 0, 0)
    context.clearRect(0, 0, cssWidth, cssHeight)
    const state = store.get()
    if (state.grid && scale >= 6) {
      context.strokeStyle = 'rgb(255 255 255 / 9%)'
      context.lineWidth = 1
      context.beginPath()
      for (let x = 1; x < width; x += 1) {
        context.moveTo(x * scale + 0.5, 0)
        context.lineTo(x * scale + 0.5, cssHeight)
      }
      for (let y = 1; y < height; y += 1) {
        context.moveTo(0, y * scale + 0.5)
        context.lineTo(cssWidth, y * scale + 0.5)
      }
      context.stroke()
    }
    const point = cursor.current
    if (point.visible) {
      const footprint =
        state.tool === 'pen' || state.tool === 'eraser' ? state.brushSize : 1
      const half = Math.floor((footprint - 1) / 2)
      context.lineWidth = point.keyboard ? 2 : 1.5
      context.strokeStyle = point.keyboard
        ? '#ff7a90'
        : 'rgb(255 255 255 / 85%)'
      context.strokeRect(
        (point.x - half) * scale + 1,
        (point.y - half) * scale + 1,
        footprint * scale - 2,
        footprint * scale - 2,
      )
    }
  }, [store, width, height, scale])

  const draw = useCallback(() => {
    const context = pixels.current?.getContext('2d')
    if (!context) {
      drawOverlay()
      return
    }
    const state = store.get()
    let art = state.artwork
    const current = stroke.current
    if (current)
      art = setCel(art, current.layerId, current.frameId, current.buffer.data)
    const data = compositeFrame(art, state.activeFrameId)
    // 어니언 스킨: 지금 레이어의 앞(빨강)·뒤(파랑) 프레임을 옅게 비춥니다.
    if (state.onionSkin && !state.playing && art.frames.length > 1) {
      const index = findFrameIndex(art, state.activeFrameId)
      const previous = getCel(
        art,
        state.activeLayerId,
        art.frames[(index - 1 + art.frames.length) % art.frames.length].id,
      )
      const next = getCel(
        art,
        state.activeLayerId,
        art.frames[(index + 1) % art.frames.length].id,
      )
      if (previous) blendOver(data, tint(previous, ONION_PREVIOUS), 0.32)
      if (next && art.frames.length > 2)
        blendOver(data, tint(next, ONION_NEXT), 0.32)
    }
    context.putImageData(
      new ImageData(
        data as Uint8ClampedArray<ArrayBuffer>,
        art.width,
        art.height,
      ),
      0,
      0,
    )
    drawOverlay()
  }, [store, drawOverlay])

  useEffect(() => {
    draw()
  }, [
    draw,
    artwork,
    activeLayerId,
    activeFrameId,
    onionSkin,
    playing,
    grid,
    tool,
    brushSize,
  ])

  // ---- 획 (stroke) ----
  const begin = (at: Point): boolean => {
    const state = store.get()
    const layer = state.artwork.layers.find(
      (item) => item.id === state.activeLayerId,
    )
    if (!layer) return false
    if (state.playing) store.setPlaying(false)
    if (state.tool === 'picker') {
      const picked = pickColor(
        compositeFrame(state.artwork, state.activeFrameId),
        width,
        height,
        at,
      )
      if (picked) {
        store.setColor(picked)
        store.announce(`색 ${picked}을(를) 골랐습니다.`)
      } else {
        store.announce('투명한 곳이라 색을 고르지 않았습니다.')
      }
      return false
    }
    if (!layer.visible) {
      store.announce(
        `‘${layer.name}’ 레이어가 숨겨져 있어 그릴 수 없습니다. 레이어 목록에서 보이기를 켜 주세요.`,
      )
      return false
    }
    const cel = getCel(state.artwork, layer.id, state.activeFrameId)
    stroke.current = {
      buffer: {
        width,
        height,
        data: cel
          ? new Uint8ClampedArray(cel)
          : new Uint8ClampedArray(width * height * 4),
      },
      last: null,
      changed: false,
      layerId: layer.id,
      frameId: state.activeFrameId,
      tool: state.tool,
    }
    extend(at)
    if (state.tool === 'fill') finish()
    return true
  }

  const extend = (at: Point) => {
    const current = stroke.current
    if (!current) return
    const state = store.get()
    const changed = applyTool(
      current.buffer,
      current.tool,
      state.color,
      state.brushSize,
      at,
      current.last,
    )
    current.changed ||= changed
    current.last = at
    draw()
  }

  const finish = () => {
    const current = stroke.current
    stroke.current = null
    if (!current) return
    if (!current.changed) {
      draw()
      return
    }
    const state = store.get()
    store.commit(
      setCel(
        state.artwork,
        current.layerId,
        current.frameId,
        current.buffer.data,
      ),
      {
        message: current.tool === 'fill' ? '영역을 채웠습니다.' : undefined,
      },
    )
  }

  const cancel = () => {
    if (!stroke.current) return
    stroke.current = null
    draw()
    store.announce('그리던 획을 취소했습니다.')
  }

  // ---- 포인터 ----
  const toPixel = (event: PointerEvent<HTMLElement>): Point => {
    const rect = event.currentTarget.getBoundingClientRect()
    return {
      x: Math.floor(((event.clientX - rect.left) / rect.width) * width),
      y: Math.floor(((event.clientY - rect.top) / rect.height) * height),
    }
  }

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    event.currentTarget.focus({ preventScroll: true })
    const at = toPixel(event)
    cursor.current = { ...at, visible: true, keyboard: false }
    if (begin(at) && stroke.current)
      event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const at = toPixel(event)
    cursor.current = { ...at, visible: true, keyboard: false }
    if (stroke.current && stroke.current.tool !== 'fill') extend(at)
    else drawOverlay()
  }

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    finish()
  }

  const onPointerLeave = () => {
    if (!stroke.current) {
      cursor.current.visible = cursor.current.keyboard
      drawOverlay()
    }
  }

  // ---- 키보드 ----
  const moveCursor = (dx: number, dy: number) => {
    const point = cursor.current
    point.x = Math.min(width - 1, Math.max(0, point.x + dx))
    point.y = Math.min(height - 1, Math.max(0, point.y + dy))
    point.visible = true
    point.keyboard = true
    setPosition(`x ${point.x}, y ${point.y}`)
    if (stroke.current) extend({ x: point.x, y: point.y })
    else drawOverlay()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return
    const step = event.shiftKey ? 8 : 1
    const key = event.key
    const arrows: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    }
    if (arrows[key]) {
      event.preventDefault()
      moveCursor(...arrows[key])
      return
    }
    if (key === ' ') {
      event.preventDefault()
      if (!event.repeat && !stroke.current) {
        cursor.current.keyboard = true
        cursor.current.visible = true
        begin({ x: cursor.current.x, y: cursor.current.y })
      }
      return
    }
    if (key === 'Enter') {
      event.preventDefault()
      if (begin({ x: cursor.current.x, y: cursor.current.y })) finish()
      return
    }
    if (key === 'Escape') {
      cancel()
      return
    }
    const lower = key.toLowerCase()
    if (KEY_TOOLS[lower]) {
      store.setTool(KEY_TOOLS[lower])
      store.announce(`${TOOL_LABELS[KEY_TOOLS[lower]]} 도구`)
      return
    }
    if (key === '[' || key === ']') {
      const next = store.get().brushSize + (key === ']' ? 1 : -1)
      store.setBrushSize(next)
      store.announce(`붓 크기 ${store.get().brushSize}픽셀`)
      return
    }
    if (key === ',' || key === '.') {
      store.stepFrame(key === '.' ? 1 : -1)
      const state = store.get()
      store.announce(
        `${findFrameIndex(state.artwork, state.activeFrameId) + 1}번 프레임`,
      )
    }
  }

  const onKeyUp = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === ' ') finish()
  }

  const onFocus = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.matches(':focus-visible')) return
    const point = cursor.current
    if (!point.keyboard && !point.visible) {
      point.x = Math.floor(width / 2)
      point.y = Math.floor(height / 2)
    }
    point.visible = true
    point.keyboard = true
    drawOverlay()
  }

  const onBlur = () => {
    finish()
    cursor.current.keyboard = false
    cursor.current.visible = false
    drawOverlay()
  }

  // ---- 끌어다 놓기 ----
  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!event.dataTransfer.types.includes('Files')) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
    setDragging(true)
  }

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer.files[0]
    if (file) onDropFile(file)
  }

  const layerName =
    artwork.layers.find((layer) => layer.id === activeLayerId)?.name ?? ''

  return (
    <section className={styles.view} aria-label="캔버스">
      <div className={styles.bar}>
        <p className={panel.fieldLabel}>
          {width}×{height} · ‘{layerName}’ 레이어 · {TOOL_LABELS[tool]}
        </p>
        <div className={styles.zoom}>
          <button
            type="button"
            className={panel.action}
            onClick={() => setZoom(Math.max(1, scale - 1))}
            disabled={scale <= 1}
          >
            <Icon name="zoom-out" size={16} />
            축소
          </button>
          <span className={styles.zoomValue}>×{scale}</span>
          <button
            type="button"
            className={panel.action}
            onClick={() => setZoom(Math.min(32, scale + 1))}
            disabled={scale >= 32}
          >
            <Icon name="zoom-in" size={16} />
            확대
          </button>
          <button
            type="button"
            className={panel.action}
            onClick={() => setZoom(null)}
            disabled={zoom === null}
          >
            맞춤
          </button>
        </div>
      </div>

      {/* 끌어다 놓기는 보조 수단이고, 키보드로는 [레이어로 가져오기] 버튼을 씁니다. */}
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div
        ref={stage}
        className={styles.stage}
        data-dragging={dragging}
        onDragEnter={onDragOver}
        onDragOver={onDragOver}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        {/* 그리기 면은 화살표·Space 입력을 직접 받아야 하므로 application 역할과 tabIndex를 씁니다. */}
        {/* eslint-disable jsx-a11y/no-noninteractive-tabindex, jsx-a11y/no-noninteractive-element-interactions */}
        <div
          className={styles.surface}
          style={{ width: width * scale, height: height * scale }}
          role="application"
          aria-label={`그림 캔버스, ${width}×${height}픽셀`}
          aria-describedby={helpId}
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onPointerLeave={onPointerLeave}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          onFocus={onFocus}
          onBlur={onBlur}
        >
          <canvas
            ref={pixels}
            className={styles.pixels}
            width={width}
            height={height}
            aria-hidden="true"
          />
          <canvas ref={overlay} className={styles.overlay} aria-hidden="true" />
        </div>
        {/* eslint-enable jsx-a11y/no-noninteractive-tabindex, jsx-a11y/no-noninteractive-element-interactions */}
      </div>

      <p id={helpId} className={styles.help}>
        캔버스를 고른 뒤 <kbd>화살표</kbd>로 커서를 옮기고(<kbd>Shift</kbd>를
        함께 누르면 8칸) <kbd>Space</kbd>를 누른 채 움직이면 그립니다.{' '}
        <kbd>Enter</kbd>는 한 번 찍기, <kbd>Esc</kbd>는 그리던 획 취소,{' '}
        <kbd>B</kbd>·<kbd>E</kbd>·<kbd>G</kbd>·<kbd>I</kbd>는 도구, <kbd>[</kbd>
        ·<kbd>]</kbd>는 붓 크기, <kbd>,</kbd>·<kbd>.</kbd>는 앞뒤 프레임입니다.
        이미지 파일을 끌어다 놓으면 새 레이어로 들어갑니다.
      </p>
      <p role="status" className="visually-hidden">
        {position}
      </p>
    </section>
  )
}
