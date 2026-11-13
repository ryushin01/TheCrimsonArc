import { type CSSProperties, useEffect, useRef } from 'react'
import { cx } from '@/shared/lib/classnames'
import styles from './PixelCanvas.module.css'

export interface PixelCanvasProps {
  /** width×height×4 RGBA. null이면 비웁니다. */
  data: Uint8ClampedArray | null
  width: number
  height: number
  /** 화면 낭독기용 설명. 없으면 꾸밈으로 보고 숨깁니다. */
  label?: string
  checkerboard?: boolean
  className?: string
  style?: CSSProperties
}

/** 픽셀 그림을 원래 해상도로 그리고 CSS로 또렷하게(pixelated) 키워 보여 줍니다. */
export function PixelCanvas({
  data,
  width,
  height,
  label,
  checkerboard = false,
  className,
  style,
}: PixelCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const context = ref.current?.getContext('2d')
    if (!context) return
    context.clearRect(0, 0, width, height)
    if (data && data.length === width * height * 4) {
      context.putImageData(
        new ImageData(data as Uint8ClampedArray<ArrayBuffer>, width, height),
        0,
        0,
      )
    }
  }, [data, width, height])

  return (
    <canvas
      ref={ref}
      width={width}
      height={height}
      className={cx(styles.canvas, checkerboard && styles.checker, className)}
      style={{ aspectRatio: `${width} / ${height}`, ...style }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  )
}
