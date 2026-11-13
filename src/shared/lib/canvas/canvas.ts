/** 캔버스를 그릴 CSS 크기와 기기 배율 */
export interface CanvasSize {
  width: number
  height: number
  dpr: number
}

type AnyCanvas = HTMLCanvasElement | OffscreenCanvas
type AnyContext2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D

/** 기기 배율. 레티나보다 큰 배율은 픽셀 수만 늘고 차이가 작아 max에서 자릅니다. */
export function getDpr(max = 2): number {
  const dpr = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1
  return Math.min(max, Math.max(1, dpr))
}

/**
 * 캔버스의 실제 픽셀 수를 CSS 크기 × 배율로 맞추고, 그리기 좌표는 CSS px로 쓰도록 ctx.scale을 겁니다.
 * 크기가 바뀔 때마다 scale만 다시 부르면 배율이 곱해지므로 setTransform으로 먼저 되돌립니다.
 */
export function fitCanvas(
  canvas: AnyCanvas,
  context: AnyContext2D,
  { width, height, dpr }: CanvasSize,
): void {
  const pixelWidth = Math.max(1, Math.round(width * dpr))
  const pixelHeight = Math.max(1, Math.round(height * dpr))
  // 같은 값을 다시 넣어도 캔버스가 지워지므로 달라졌을 때만 바꿉니다.
  if (canvas.width !== pixelWidth) canvas.width = pixelWidth
  if (canvas.height !== pixelHeight) canvas.height = pixelHeight
  context.setTransform(1, 0, 0, 1, 0, 0)
  context.scale(dpr, dpr)
}

/** observeCanvasSize가 돌려주는 정리 함수. refresh()는 배율 상한이 바뀌었을 때 다시 알립니다. */
export type CanvasSizeObserver = (() => void) & { refresh(): void }

/**
 * 요소의 CSS 크기와 기기 배율이 바뀔 때마다 알려 줍니다. 같은 크기·배율이면 다시 알리지 않습니다.
 * 창을 다른 배율의 모니터로 옮기면 크기는 그대로여도 배율이 바뀌므로 resolution 미디어 쿼리도 봅니다.
 */
export function observeCanvasSize(
  element: Element,
  onResize: (size: CanvasSize) => void,
  maxDpr: number | (() => number) = 2,
): CanvasSizeObserver {
  let width = 0
  let height = 0
  let lastKey = ''
  let disposed = false
  const readMax = () => (typeof maxDpr === 'function' ? maxDpr() : maxDpr)
  const emit = () => {
    if (disposed || width === 0 || height === 0) return
    const dpr = getDpr(readMax())
    const key = `${width}x${height}@${dpr}`
    if (key === lastKey) return
    lastKey = key
    onResize({ width, height, dpr })
  }

  const observer = new ResizeObserver(([entry]) => {
    if (!entry) return
    width = entry.contentRect.width
    height = entry.contentRect.height
    emit()
  })
  observer.observe(element)
  const rect = element.getBoundingClientRect()
  width = rect.width
  height = rect.height
  emit()

  let media: MediaQueryList | null = null
  const onDprChange = () => {
    media?.removeEventListener('change', onDprChange)
    watchDpr()
    emit()
  }
  const watchDpr = () => {
    if (disposed || typeof window.matchMedia !== 'function') return
    media = window.matchMedia(
      `(resolution: ${window.devicePixelRatio || 1}dppx)`,
    )
    media.addEventListener('change', onDprChange)
  }
  watchDpr()

  const dispose = () => {
    disposed = true
    observer.disconnect()
    media?.removeEventListener('change', onDprChange)
  }
  return Object.assign(dispose, { refresh: emit })
}
