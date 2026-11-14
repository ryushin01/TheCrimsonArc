import {
  CanvasTexture,
  RepeatWrapping,
  SRGBColorSpace,
  type Texture,
} from 'three'
import { ARC_COLOR } from '../model/config'
import { DIAL_RADIUS, SUBDIAL_RADIUS, SUBDIAL_Y } from './geometry'

/*
 * 시계의 인쇄·각인은 모두 Canvas 2D로 그립니다.
 * 다이얼·베젤의 인쇄 층은 흰색으로 그리고, 재질 색으로 물들여 텍스처를 다시 그리지 않고 색을 바꿉니다.
 */

export const DISPLAY_FONT = '"Chakra Petch", "Arial Narrow", sans-serif'

type Draw = (context: CanvasRenderingContext2D, size: number) => void

function paint(
  size: number,
  draw: Draw,
  { color = true, height = size } = {},
): Texture | null {
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) return null
  draw(context, size)
  const texture = new CanvasTexture(canvas)
  if (color) texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 8
  return texture
}

/** mm 좌표(위가 +y)를 캔버스 픽셀로 바꾸는 도우미 */
function mapper(size: number, radius: number) {
  const k = size / 2 / radius
  return {
    k,
    x: (mm: number) => size / 2 + mm * k,
    y: (mm: number) => size / 2 - mm * k,
  }
}

/** 12시에서 시계 방향 각도로 반지름 r 위의 점 */
function polar(r: number, angle: number): [number, number] {
  return [Math.sin(angle) * r, Math.cos(angle) * r]
}

/** 반지름 방향으로 놓인 막대 (r1~r2, 너비 w) */
function radialBar(
  context: CanvasRenderingContext2D,
  m: ReturnType<typeof mapper>,
  angle: number,
  r1: number,
  r2: number,
  width: number,
  offset = 0,
) {
  context.save()
  context.translate(m.x(0), m.y(0))
  context.rotate(angle)
  context.fillRect(
    (offset - width / 2) * m.k,
    -r2 * m.k,
    width * m.k,
    (r2 - r1) * m.k,
  )
  context.restore()
}

/** 파일럿 문자판처럼 3시 숫자 자리에 날짜 창을 둡니다. */
const DATE_ANGLE = Math.PI / 2
export const DATE_WINDOW = {
  angle: DATE_ANGLE,
  radius: 12.3,
  width: 2.6,
  height: 2,
} as const

/** 큰 아라비아 숫자가 놓이는 반지름(mm). 12시는 삼각형, 3시는 날짜 창 */
const NUMERAL_RADIUS = 12.3

/** 다이얼 인쇄 층: 철길 모양 분 눈금, 브랜드 이름, 날짜 창 테두리 (파일럿 Type A) */
export function createDialPrintTexture(): Texture | null {
  return paint(1024, (context, size) => {
    const m = mapper(size, DIAL_RADIUS)
    context.fillStyle = '#fff'
    context.strokeStyle = '#fff'
    // 철길 모양 분 눈금: 두 원 사이에 1분마다 짧게, 5분마다 길고 굵게
    context.lineWidth = 0.12 * m.k
    for (const r of [15.35, 16.2]) {
      context.beginPath()
      context.arc(m.x(0), m.y(0), r * m.k, 0, Math.PI * 2)
      context.stroke()
    }
    for (let i = 0; i < 60; i += 1) {
      const angle = (i / 60) * Math.PI * 2
      if (i % 5 === 0) radialBar(context, m, angle, 14.75, 16.2, 0.34)
      else radialBar(context, m, angle, 15.35, 16.2, 0.14)
    }
    // 6시 크로노그래프 30분 적산계: 테두리, 1분 눈금(5분마다 길게), 10·20·30
    context.lineWidth = 0.1 * m.k
    context.beginPath()
    context.arc(m.x(0), m.y(SUBDIAL_Y), SUBDIAL_RADIUS * m.k, 0, Math.PI * 2)
    context.stroke()
    for (let i = 0; i < 30; i += 1) {
      const angle = (i / 30) * Math.PI * 2
      const long = i % 5 === 0
      const [ox, oy] = polar(SUBDIAL_RADIUS - 0.08, angle)
      const [ix, iy] = polar(SUBDIAL_RADIUS - (long ? 0.85 : 0.45), angle)
      context.lineWidth = (long ? 0.2 : 0.1) * m.k
      context.beginPath()
      context.moveTo(m.x(ox), m.y(oy + SUBDIAL_Y))
      context.lineTo(m.x(ix), m.y(iy + SUBDIAL_Y))
      context.stroke()
    }
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.font = `600 ${0.78 * m.k}px ${DISPLAY_FONT}`
    for (const [label, minute] of [
      ['30', 0],
      ['10', 10],
      ['20', 20],
    ] as const) {
      const [x, y] = polar(SUBDIAL_RADIUS - 1.55, (minute / 30) * Math.PI * 2)
      context.fillText(label, m.x(x), m.y(y + SUBDIAL_Y) + 0.05 * m.k)
    }
    context.font = `700 ${1.12 * m.k}px ${DISPLAY_FONT}`
    if ('letterSpacing' in context) context.letterSpacing = `${0.14 * m.k}px`
    context.fillText('THE CRIMSON ARC', m.x(0), m.y(7.2))
    // 날짜 창 테두리
    const [dx, dy] = polar(DATE_WINDOW.radius, DATE_WINDOW.angle)
    context.lineWidth = 0.16 * m.k
    context.strokeRect(
      m.x(dx - DATE_WINDOW.width / 2),
      m.y(dy + DATE_WINDOW.height / 2),
      DATE_WINDOW.width * m.k,
      DATE_WINDOW.height * m.k,
    )
  })
}

/** 다이얼 강조 층: 브랜드 아래 문구 (크림슨 인쇄) */
export function createDialAccentTexture(): Texture | null {
  return paint(1024, (context, size) => {
    const m = mapper(size, DIAL_RADIUS)
    context.fillStyle = '#fff'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.font = `600 ${0.82 * m.k}px ${DISPLAY_FONT}`
    if ('letterSpacing' in context) context.letterSpacing = `${0.32 * m.k}px`
    context.fillText('AUTOMATIC', m.x(0), m.y(5.6))
  })
}

/**
 * 다이얼 상징 층: 6시 크로노그래프 적산계의 윗선을 따라 두른 크림슨 호와 그 위의 점.
 * 브랜드 이름의 '호'를 적산계 테두리로 씁니다. (모든 문자판에서 같은 호 색)
 */
export function createDialArcTexture(): Texture | null {
  return paint(1024, (context, size) => {
    const m = mapper(size, DIAL_RADIUS)
    const r = SUBDIAL_RADIUS + 0.42
    context.fillStyle = '#fff'
    context.strokeStyle = '#fff'
    context.lineWidth = 0.5 * m.k
    context.lineCap = 'butt'
    context.beginPath()
    // 캔버스 각도는 3시가 0이고 시계 방향이 +이므로 위쪽 반원은 π → 2π입니다.
    context.arc(
      m.x(0),
      m.y(SUBDIAL_Y),
      r * m.k,
      Math.PI + 0.16,
      Math.PI * 2 - 0.16,
    )
    context.stroke()
    context.beginPath()
    const [px, py] = polar(r, Math.PI * 0.18)
    context.arc(m.x(px), m.y(py + SUBDIAL_Y), 0.42 * m.k, 0, Math.PI * 2)
    context.fill()
  })
}

/**
 * 야광 층 (파일럿 Type A): 12시의 삼각형과 양옆 두 점, 큰 아라비아 숫자.
 * 숫자까지 야광이라 밤에도 시각을 읽습니다. 3시는 날짜 창 자리라 비웁니다.
 */
export function createDialLumeTexture(): Texture | null {
  return paint(1024, (context, size) => {
    const m = mapper(size, DIAL_RADIUS)
    context.fillStyle = '#fff'
    context.beginPath()
    context.moveTo(m.x(0), m.y(11.15))
    context.lineTo(m.x(-1.95), m.y(14.55))
    context.lineTo(m.x(1.95), m.y(14.55))
    context.closePath()
    context.fill()
    for (const side of [-1, 1]) {
      context.beginPath()
      context.arc(m.x(side * 3.3), m.y(13.75), 0.62 * m.k, 0, Math.PI * 2)
      context.fill()
    }
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.font = `700 ${2.85 * m.k}px ${DISPLAY_FONT}`
    for (let hour = 1; hour <= 11; hour += 1) {
      if (hour === 3) continue
      const [x, y] = polar(NUMERAL_RADIUS, (hour / 12) * Math.PI * 2)
      context.fillText(String(hour), m.x(x), m.y(y) + 0.12 * m.k)
    }
  })
}

/** 날짜 원판: 흰 바탕에 크림슨(ARC_COLOR) 숫자 */
export function createDateTexture(day: number): Texture | null {
  return paint(
    250,
    (context, width) => {
      const height = 200
      context.fillStyle = '#f4f1ea'
      context.fillRect(0, 0, width, height)
      context.fillStyle = ARC_COLOR
      context.font = `600 ${height * 0.78}px ${DISPLAY_FONT}`
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.fillText(String(day), width / 2, height * 0.54)
    },
    { height: 200 },
  )
}

const BEZEL_RADIUS = 20.25

/** 비행 시간 베젤: 1분 눈금, 5분마다 굵은 눈금, 10분마다 숫자 */
export function createBezelPrintTexture(): Texture | null {
  return paint(1024, (context, size) => {
    const m = mapper(size, BEZEL_RADIUS)
    context.fillStyle = '#fff'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.font = `700 ${2.0 * m.k}px ${DISPLAY_FONT}`
    for (let minute = 1; minute < 60; minute += 1) {
      const angle = (minute / 60) * Math.PI * 2
      if (minute % 10 === 0) {
        context.save()
        context.translate(m.x(0), m.y(0))
        context.rotate(angle)
        context.fillText(String(minute), 0, -18.75 * m.k)
        context.restore()
      } else if (minute % 5 === 0) {
        radialBar(context, m, angle, 18.0, 20.0, 0.5)
      } else {
        radialBar(context, m, angle, 19.25, 20.0, 0.22)
      }
    }
  })
}

/** 베젤의 크림슨 호: 0~15분 구간 띠 */
export function createBezelArcTexture(): Texture | null {
  return paint(1024, (context, size) => {
    const m = mapper(size, BEZEL_RADIUS)
    context.strokeStyle = '#fff'
    context.lineWidth = 2.8 * m.k
    context.beginPath()
    // 캔버스 각도는 3시가 0이고 시계 방향이 +이므로 12시는 -90도입니다.
    context.arc(
      m.x(0),
      m.y(0),
      18.75 * m.k,
      -Math.PI / 2 + 0.07,
      -Math.PI / 2 + Math.PI / 2 - 0.02,
    )
    context.stroke()
  })
}

/** 베젤 12시의 야광 삼각형 */
export function createBezelLumeTexture(): Texture | null {
  return paint(512, (context, size) => {
    const m = mapper(size, BEZEL_RADIUS)
    context.fillStyle = '#fff'
    context.beginPath()
    context.moveTo(m.x(0), m.y(17.7))
    context.lineTo(m.x(-1.25), m.y(19.95))
    context.lineTo(m.x(1.25), m.y(19.95))
    context.closePath()
    context.fill()
  })
}

/** 비드블라스트 표면처럼 고운 잡음을 깝니다. */
function grain(
  context: CanvasRenderingContext2D,
  size: number,
  base: number,
  spread: number,
) {
  const image = context.createImageData(size, size)
  let seed = 11
  for (let i = 0; i < image.data.length; i += 4) {
    seed = (seed * 1664525 + 1013904223) >>> 0
    const value = base + ((seed >>> 24) / 255 - 0.5) * spread
    image.data[i] = value
    image.data[i + 1] = value
    image.data[i + 2] = value
    image.data[i + 3] = 255
  }
  context.putImageData(image, 0, 0)
}

/** 케이스백 각인: 둘레 문구, 홈 6개, 가운데 상징 */
export function createCasebackTexture(): Texture | null {
  return paint(1024, (context, size) => {
    const m = mapper(size, 18.2)
    grain(context, size, 176, 34)
    context.strokeStyle = 'rgb(70 72 76)'
    context.fillStyle = 'rgb(70 72 76)'
    context.lineWidth = 0.18 * m.k
    for (const r of [12.8, 15.4]) {
      context.beginPath()
      context.arc(m.x(0), m.y(0), r * m.k, 0, Math.PI * 2)
      context.stroke()
    }
    for (let i = 0; i < 6; i += 1) {
      radialBar(
        context,
        m,
        (i / 6) * Math.PI * 2 + Math.PI / 6,
        16.2,
        18.4,
        1.6,
      )
    }
    const text =
      'THE CRIMSON ARC · A-01 AUTOMATIC · 20 BAR · 80 000 A/m · BEAD-BLASTED STEEL · '
    context.font = `600 ${0.95 * m.k}px ${DISPLAY_FONT}`
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    const step = (Math.PI * 2) / text.length
    for (let i = 0; i < text.length; i += 1) {
      context.save()
      context.translate(m.x(0), m.y(0))
      context.rotate(i * step)
      context.fillText(text[i], 0, -14.1 * m.k)
      context.restore()
    }
    context.font = `700 ${3.4 * m.k}px ${DISPLAY_FONT}`
    context.fillText('A·01', m.x(0), m.y(1.6))
    context.lineWidth = 0.6 * m.k
    context.beginPath()
    context.arc(m.x(0), m.y(-4.6), 3 * m.k, Math.PI, 0)
    context.stroke()
  })
}

/** 로터: 제네바 스트라이프와 각인 */
export function createRotorTexture(): Texture | null {
  return paint(1024, (context, size) => {
    const m = mapper(size, 13.2)
    for (let i = -20; i < 20; i += 1) {
      const gradient = context.createLinearGradient(0, 0, size, 0)
      gradient.addColorStop(0, i % 2 ? '#d9dce0' : '#c6c9ce')
      gradient.addColorStop(0.5, i % 2 ? '#f2f3f5' : '#dfe1e4')
      gradient.addColorStop(1, i % 2 ? '#d9dce0' : '#c6c9ce')
      context.fillStyle = gradient
      context.save()
      context.translate(size / 2, size / 2)
      context.rotate(-0.42)
      context.fillRect(-size, i * 1.6 * m.k, size * 2, 1.6 * m.k)
      context.restore()
    }
    context.fillStyle = 'rgb(60 62 66)'
    context.textAlign = 'center'
    context.font = `700 ${1.3 * m.k}px ${DISPLAY_FONT}`
    context.fillText('THE CRIMSON ARC', m.x(0), m.y(-7.4))
    context.font = `600 ${0.9 * m.k}px ${DISPLAY_FONT}`
    context.fillText('A-01 · 26 JEWELS · 28 800 A/h', m.x(0), m.y(-9.4))
  })
}

/** 메인 플레이트: 겹친 원 무늬(페를라주) */
export function createPerlageTexture(): Texture | null {
  const texture = paint(512, (context, size) => {
    context.fillStyle = '#c9ccd1'
    context.fillRect(0, 0, size, size)
    const step = 22
    for (let y = 0; y < size + step; y += step * 0.8) {
      for (let x = 0; x < size + step; x += step * 0.8) {
        const gradient = context.createRadialGradient(
          x,
          y,
          0,
          x,
          y,
          step * 0.62,
        )
        gradient.addColorStop(0, '#eef0f2')
        gradient.addColorStop(0.55, '#d3d6da')
        gradient.addColorStop(1, '#b7bbc1')
        context.fillStyle = gradient
        context.beginPath()
        context.arc(x, y, step * 0.62, 0, Math.PI * 2)
        context.fill()
      }
    }
  })
  if (texture) {
    texture.wrapS = RepeatWrapping
    texture.wrapT = RepeatWrapping
    texture.repeat.set(2, 2)
  }
  return texture
}

/** 다이얼 바탕의 고운 결 (거칠기 맵) */
export function createMatteTexture(): Texture | null {
  return paint(
    512,
    (context, size) => {
      grain(context, size, 200, 60)
    },
    { color: false },
  )
}

export interface WatchTextures {
  dialPrint: Texture | null
  dialAccent: Texture | null
  dialArc: Texture | null
  dialLume: Texture | null
  date: Texture | null
  bezelPrint: Texture | null
  bezelArc: Texture | null
  bezelLume: Texture | null
  caseback: Texture | null
  rotor: Texture | null
  perlage: Texture | null
  matte: Texture | null
}

export function createWatchTextures(day = new Date().getDate()): WatchTextures {
  return {
    dialPrint: createDialPrintTexture(),
    dialAccent: createDialAccentTexture(),
    dialArc: createDialArcTexture(),
    dialLume: createDialLumeTexture(),
    date: createDateTexture(day),
    bezelPrint: createBezelPrintTexture(),
    bezelArc: createBezelArcTexture(),
    bezelLume: createBezelLumeTexture(),
    caseback: createCasebackTexture(),
    rotor: createRotorTexture(),
    perlage: createPerlageTexture(),
    matte: createMatteTexture(),
  }
}

export function disposeWatchTextures(textures: WatchTextures): void {
  for (const texture of Object.values(textures)) texture?.dispose()
}
