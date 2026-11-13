import { CanvasTexture, RepeatWrapping } from 'three'

/** 같은 무늬가 나오도록 씨앗값으로 만드는 의사 난수 */
function seeded(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 2 ** 32
  }
}

/**
 * Canvas 2D로 긁힌 금속 무늬를 그려 거칠기·요철 텍스처로 씁니다.
 * 가는 사선 흠집과 고운 잡음으로 레퍼런스의 '쓸린 크림슨 금속' 느낌을 냅니다.
 */
export function createScratchTexture(size = 512): CanvasTexture | null {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (!context) return null
  const random = seeded(20261113)

  const image = context.createImageData(size, size)
  for (let i = 0; i < image.data.length; i += 4) {
    const value = 120 + (random() - 0.5) * 36
    image.data[i] = value
    image.data[i + 1] = value
    image.data[i + 2] = value
    image.data[i + 3] = 255
  }
  context.putImageData(image, 0, 0)

  context.lineCap = 'round'
  for (let i = 0; i < 320; i += 1) {
    const bright = random() > 0.45
    const alpha = 0.12 + random() * 0.4
    context.strokeStyle = bright
      ? `rgba(235, 235, 235, ${alpha})`
      : `rgba(30, 30, 30, ${alpha})`
    context.lineWidth = 0.4 + random() * 1.3
    const x = random() * size
    const y = random() * size
    // 대부분 한 방향으로 쓸린 흠집, 가끔 다른 방향
    const angle =
      (random() > 0.8 ? random() * Math.PI : -0.6 + random() * 0.35) +
      Math.PI * 0.1
    const length = 18 + random() * 150
    const bend = (random() - 0.5) * 16
    context.beginPath()
    context.moveTo(x, y)
    context.quadraticCurveTo(
      x + Math.cos(angle) * length * 0.5 + bend,
      y + Math.sin(angle) * length * 0.5 - bend,
      x + Math.cos(angle) * length,
      y + Math.sin(angle) * length,
    )
    context.stroke()
  }

  const texture = new CanvasTexture(canvas)
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.repeat.set(0.45, 0.45)
  texture.anisotropy = 4
  return texture
}
