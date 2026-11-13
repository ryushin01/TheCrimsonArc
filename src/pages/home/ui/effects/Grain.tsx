import { useEffect, useRef } from 'react'
import { useTuningValue } from '../../model/tuning'
import styles from './Grain.module.css'

/** Canvas 2D로 잡음 타일을 한 번 그려 배경으로 반복합니다. */
function createNoiseTile(size = 180): string | null {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (!context) return null
  const image = context.createImageData(size, size)
  let seed = 7
  for (let i = 0; i < image.data.length; i += 4) {
    seed = (seed * 1664525 + 1013904223) >>> 0
    const value = 96 + (seed >>> 24) * 0.62
    image.data[i] = value
    image.data[i + 1] = value
    image.data[i + 2] = value
    image.data[i + 3] = 255
  }
  context.putImageData(image, 0, 0)
  return canvas.toDataURL('image/png')
}

export function Grain() {
  const ref = useRef<HTMLDivElement>(null)
  const opacity = useTuningValue('grain')

  useEffect(() => {
    const url = createNoiseTile()
    if (url && ref.current) ref.current.style.backgroundImage = `url(${url})`
  }, [])

  return (
    <div
      ref={ref}
      className={styles.grain}
      style={{ opacity }}
      aria-hidden="true"
    />
  )
}
