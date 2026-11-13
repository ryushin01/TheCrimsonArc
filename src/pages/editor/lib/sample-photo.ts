/**
 * '샘플 이미지로 해 보기'에 쓸 사진 같은 그림을 Canvas 2D로 그립니다.
 * 저작권 걱정 없는 그림으로 '기존 이미지 열기' 흐름을 바로 체험하게 합니다.
 */
export async function createSamplePhoto(): Promise<File> {
  const width = 480
  const height = 320
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context)
    throw new Error('이 브라우저에서는 샘플 이미지를 만들 수 없습니다.')
  const horizon = 214

  const sky = context.createLinearGradient(0, 0, 0, horizon)
  sky.addColorStop(0, '#1d0510')
  sky.addColorStop(0.42, '#6b0f27')
  sky.addColorStop(0.78, '#e2735f')
  sky.addColorStop(1, '#f8cdb0')
  context.fillStyle = sky
  context.fillRect(0, 0, width, horizon)

  const sun = context.createRadialGradient(318, 176, 4, 318, 176, 120)
  sun.addColorStop(0, 'rgb(255 247 236 / 100%)')
  sun.addColorStop(0.18, 'rgb(255 214 186 / 95%)')
  sun.addColorStop(0.5, 'rgb(255 160 140 / 35%)')
  sun.addColorStop(1, 'rgb(255 140 130 / 0%)')
  context.fillStyle = sun
  context.fillRect(0, 0, width, horizon)

  // 먼 산, 가까운 산
  const ridge = (points: Array<[number, number]>, color: string) => {
    context.fillStyle = color
    context.beginPath()
    context.moveTo(0, horizon)
    for (const [x, y] of points) context.lineTo(x, y)
    context.lineTo(width, horizon)
    context.closePath()
    context.fill()
  }
  ridge(
    [
      [0, 168],
      [70, 140],
      [130, 160],
      [210, 128],
      [280, 165],
      [360, 146],
      [430, 170],
      [480, 150],
    ],
    '#8e2a3c',
  )
  ridge(
    [
      [0, 196],
      [90, 172],
      [170, 190],
      [250, 176],
      [330, 198],
      [410, 180],
      [480, 194],
    ],
    '#4d0d22',
  )

  // 언덕 위의 크림슨 아치
  context.fillStyle = '#2a0714'
  context.beginPath()
  context.arc(150, horizon, 86, Math.PI, 0)
  context.arc(150, horizon, 58, 0, Math.PI, true)
  context.closePath()
  context.fill()

  // 물에 비친 하늘과 해
  const water = context.createLinearGradient(0, horizon, 0, height)
  water.addColorStop(0, '#c45a58')
  water.addColorStop(0.35, '#5a1022')
  water.addColorStop(1, '#14040b')
  context.fillStyle = water
  context.fillRect(0, horizon, width, height - horizon)
  context.fillStyle = 'rgb(255 226 205 / 55%)'
  for (let i = 0; i < 14; i += 1) {
    const y = horizon + 6 + i * 7
    const span = 70 - i * 4
    context.fillRect(318 - span / 2 + ((i * 13) % 9) - 4, y, span, 2)
  }

  // 사진처럼 보이도록 고운 잡음
  const image = context.getImageData(0, 0, width, height)
  let seed = 99
  for (let i = 0; i < image.data.length; i += 4) {
    seed = (seed * 1664525 + 1013904223) >>> 0
    const noise = ((seed >>> 24) - 128) * 0.09
    image.data[i] += noise
    image.data[i + 1] += noise
    image.data[i + 2] += noise
  }
  context.putImageData(image, 0, 0)

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/png'),
  )
  if (!blob) throw new Error('샘플 이미지를 만들지 못했습니다.')
  return new File([blob], 'crimson-sunset.png', { type: 'image/png' })
}
