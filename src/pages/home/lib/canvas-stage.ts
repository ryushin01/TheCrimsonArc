import {
  type CanvasSize,
  createFrameLoop,
  fitCanvas,
  observeCanvasSize,
} from '@/shared/lib/canvas'
import { tuning, tuningEvents } from '../model/tuning'

export interface CanvasStageOptions {
  /** 이 요소가 화면에 보이는 동안만 루프를 돌립니다. */
  visibilityTarget: Element
  /** 캔버스 크기·배율이 바뀌었을 때 (픽셀 맞춤은 끝난 뒤) */
  onResize?: (size: CanvasSize) => void
  /** 매 프레임 (dt초, 지금 시각ms) */
  onFrame: (dt: number, now: number) => void
}

/**
 * 첫 화면의 2D 캔버스 무대(시퀀스·입자)가 함께 쓰는 뼈대입니다.
 * - 캔버스 픽셀을 CSS 크기 × 기기 배율(디버그 패널의 DPR 상한까지)로 맞추고, 상한을 바꾸면 크기가 그대로여도 다시 맞춥니다.
 * - visibilityTarget이 화면에 보이는 동안만 루프를 돌립니다.
 * 정리 함수를 돌려줍니다. (루프·관찰자·구독을 모두 멈춤)
 */
export function mountCanvasStage(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  { visibilityTarget, onResize, onFrame }: CanvasStageOptions,
): () => void {
  const stopResize = observeCanvasSize(
    canvas,
    (size) => {
      fitCanvas(canvas, context, size)
      onResize?.(size)
    },
    () => tuning.render.maxDpr,
  )
  const stopTuning = tuningEvents.subscribe(() => stopResize.refresh())
  const loop = createFrameLoop(onFrame)
  const visibility = new IntersectionObserver(([entry]) => {
    if (entry?.isIntersecting) loop.start()
    else loop.stop()
  })
  visibility.observe(visibilityTarget)
  return () => {
    loop.stop()
    visibility.disconnect()
    stopResize()
    stopTuning()
  }
}
