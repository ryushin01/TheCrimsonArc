import {
  type PixelBuffer,
  type Rgba,
  TRANSPARENT,
  floodFill,
  hexToRgba,
  line,
  rgbaToHex,
  stamp,
} from '@/shared/lib/pixel'
import type { Tool } from '../model/studio-store'

export const TOOL_LABELS: Record<Tool, string> = {
  pen: '펜',
  eraser: '지우개',
  fill: '채우기',
  picker: '스포이트',
}

/** 캔버스에 초점이 있을 때만 동작하는 한 글자 단축키 (KWCAG 6.1.4) */
export const TOOL_KEYS: Record<Tool, string> = {
  pen: 'B',
  eraser: 'E',
  fill: 'G',
  picker: 'I',
}

export interface Point {
  x: number
  y: number
}

/**
 * 작업 버퍼에 도구를 한 번 적용합니다. 펜·지우개는 앞 점(from)과 선으로 잇습니다.
 * 바뀐 것이 있으면 true
 */
export function applyTool(
  buffer: PixelBuffer,
  tool: Tool,
  color: string,
  size: number,
  at: Point,
  from: Point | null,
): boolean {
  if (tool === 'picker') return false
  if (tool === 'fill') return floodFill(buffer, at.x, at.y, hexToRgba(color))
  const paint: Rgba = tool === 'eraser' ? TRANSPARENT : hexToRgba(color)
  if (from) line(buffer, from.x, from.y, at.x, at.y, size, paint)
  else stamp(buffer, at.x, at.y, size, paint)
  return true
}

/** 합친 그림에서 (x, y)의 색. 투명하면 null */
export function pickColor(
  composite: Uint8ClampedArray,
  width: number,
  height: number,
  at: Point,
): string | null {
  if (at.x < 0 || at.y < 0 || at.x >= width || at.y >= height) return null
  const i = (at.y * width + at.x) * 4
  if (composite[i + 3] === 0) return null
  return rgbaToHex([composite[i], composite[i + 1], composite[i + 2], 255])
}
