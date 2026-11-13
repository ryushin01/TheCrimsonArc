import {
  type PixelBuffer,
  type Rgba,
  createBuffer,
  hexToRgba,
  setPixel,
} from '@/shared/lib/pixel'
import { celKey, createId } from './artwork'
import type { Artwork, Frame, Layer } from './types'

export const SAMPLE_SIZE = 64
export const SAMPLE_FRAMES = 12

const SKY_TOP = hexToRgba('#14040b')
const SKY_BOTTOM = hexToRgba('#5a0f25')
const GROUND = hexToRgba('#0f0308')
const HORIZON = hexToRgba('#7d1129')
const STAR_DIM = hexToRgba('#6f3a4a')
const STAR_BRIGHT = hexToRgba('#ffe9e0')

const ARC_LIGHT = hexToRgba('#f4a48c')
const ARC_EMBER = hexToRgba('#e9846b')
const ARC_BODY = hexToRgba('#c42843')
const ARC_SHADE = hexToRgba('#7d1129')
const ARC_DEEP = hexToRgba('#4a0a1b')

const COMET_CORE = hexToRgba('#fff7f0')
const COMET_GLOW = hexToRgba('#ffd0bd')
const TRAIL = ['#ffb199', '#ff7a90', '#d23350', '#8e1530'].map(hexToRgba)

const CENTER_X = 32
const CENTER_Y = 50
const INNER_RADIUS = 14.5
const OUTER_RADIUS = 22.5

/** 4×4 베이어 행렬 (그라데이션을 픽셀 아트처럼 점으로 섞음) */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]

const STARS: ReadonlyArray<readonly [number, number, number]> = [
  [7, 6, 0],
  [18, 13, 0.4],
  [29, 4, 0.75],
  [44, 9, 0.15],
  [55, 5, 0.55],
  [59, 17, 0.9],
  [11, 21, 0.3],
  [50, 24, 0.65],
]

function mix(a: Rgba, b: Rgba, t: number): Rgba {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
    255,
  ]
}

function drawBackground(frame: number): PixelBuffer {
  const buffer = createBuffer(SAMPLE_SIZE, SAMPLE_SIZE)
  for (let y = 0; y < SAMPLE_SIZE; y += 1) {
    for (let x = 0; x < SAMPLE_SIZE; x += 1) {
      if (y >= CENTER_Y + 1) {
        setPixel(buffer, x, y, y === CENTER_Y + 1 ? HORIZON : GROUND)
        continue
      }
      // 위에서 아래로 6단계 그라데이션을 베이어 디더링으로 섞습니다.
      const t = (y / CENTER_Y) * 5
      const step = Math.floor(t)
      const threshold = (BAYER[(y % 4) * 4 + (x % 4)] + 0.5) / 16
      const level = step + (t - step > threshold ? 1 : 0)
      setPixel(buffer, x, y, mix(SKY_TOP, SKY_BOTTOM, Math.min(1, level / 5)))
    }
  }
  // 별은 1초에 한 번씩 천천히 밝아졌다 어두워집니다. (깜빡임 없이)
  for (const [x, y, phase] of STARS) {
    const glow =
      0.5 + 0.5 * Math.sin(((frame / SAMPLE_FRAMES + phase) % 1) * Math.PI * 2)
    setPixel(buffer, x, y, mix(STAR_DIM, STAR_BRIGHT, glow))
  }
  return buffer
}

function drawArc(): PixelBuffer {
  const buffer = createBuffer(SAMPLE_SIZE, SAMPLE_SIZE)
  for (let y = 0; y <= CENTER_Y; y += 1) {
    for (let x = 0; x < SAMPLE_SIZE; x += 1) {
      const dx = x + 0.5 - CENTER_X
      const dy = CENTER_Y + 0.5 - (y + 0.5)
      const distance = Math.hypot(dx, dy)
      if (distance < INNER_RADIUS || distance > OUTER_RADIUS) continue
      const band = (distance - INNER_RADIUS) / (OUTER_RADIUS - INNER_RADIUS)
      const angle = Math.atan2(dy, dx)
      // 왼쪽 위에서 빛이 온다고 보고 면을 나눠 칠합니다.
      const light = Math.cos(angle - 2.3)
      let color = ARC_BODY
      if (band < 0.16) color = ARC_DEEP
      else if (band > 0.84 && light > 0.15) color = ARC_LIGHT
      else if (light > 0.78) color = ARC_EMBER
      else if (light < -0.35) color = ARC_SHADE
      setPixel(buffer, x, y, color)
    }
  }
  return buffer
}

function cometPoint(angle: number, radius: number): [number, number] {
  return [
    Math.round(CENTER_X - 0.5 + Math.cos(angle) * radius),
    Math.round(CENTER_Y - Math.sin(angle) * radius),
  ]
}

function drawComet(frame: number): PixelBuffer {
  const buffer = createBuffer(SAMPLE_SIZE, SAMPLE_SIZE)
  const radius = (INNER_RADIUS + OUTER_RADIUS) / 2
  const step = Math.PI / SAMPLE_FRAMES
  const angle = Math.PI - (frame + 0.5) * step
  // 꼬리: 지나온 자리에 점점 어두워지는 점
  TRAIL.forEach((color, index) => {
    const [x, y] = cometPoint(angle + (index + 1) * step * 0.42, radius)
    setPixel(buffer, x, y, color)
    if (index < 2) setPixel(buffer, x, y + 1, color)
  })
  const [cx, cy] = cometPoint(angle, radius)
  for (const [dx, dy] of [
    [0, -1],
    [-1, 0],
    [1, 0],
    [0, 1],
  ]) {
    setPixel(buffer, cx + dx, cy + dy, COMET_GLOW)
  }
  setPixel(buffer, cx, cy, COMET_CORE)
  return buffer
}

/**
 * 홍보 페이지와 스튜디오가 함께 쓰는 샘플 작품
 * - 배경: 디더링한 밤하늘과 천천히 밝아지는 별
 * - 아치: 크림슨 호 (모든 프레임이 같은 그림을 공유)
 * - 혜성: 호를 따라 왼쪽에서 오른쪽으로 달리는 빛
 */
export function createSampleArtwork(): Artwork {
  const layers: Layer[] = [
    { id: createId('layer'), name: '배경', visible: true, opacity: 1 },
    { id: createId('layer'), name: '아치', visible: true, opacity: 1 },
    { id: createId('layer'), name: '혜성', visible: true, opacity: 1 },
  ]
  const frames: Frame[] = Array.from({ length: SAMPLE_FRAMES }, () => ({
    id: createId('frame'),
  }))
  const arc = drawArc().data
  const cels: Record<string, Uint8ClampedArray> = {}
  frames.forEach((frame, index) => {
    cels[celKey(layers[0].id, frame.id)] = drawBackground(index).data
    cels[celKey(layers[1].id, frame.id)] = arc
    cels[celKey(layers[2].id, frame.id)] = drawComet(index).data
  })
  return {
    width: SAMPLE_SIZE,
    height: SAMPLE_SIZE,
    fps: 12,
    layers,
    frames,
    cels,
  }
}
