import type { Box3 } from 'three'
import {
  createArcBridgeGeometry,
  createBezelGeometry,
  createCaseGeometry,
  createGearGeometry,
  createHandGeometry,
  createLinkGeometry,
  createStrapGeometry,
  strapPoint,
} from './geometry'

function size(geometry: {
  boundingBox: Box3 | null
  computeBoundingBox: () => void
}) {
  geometry.computeBoundingBox()
  const box = geometry.boundingBox as Box3
  return {
    x: box.max.x - box.min.x,
    y: box.max.y - box.min.y,
    z: box.max.z - box.min.z,
    box,
  }
}

describe('시계 형상', () => {
  it('케이스는 러그 끝까지 50mm, 크라운 가드 쪽이 더 넓고 두께는 약 9.8mm다', () => {
    const { x, y, z, box } = size(createCaseGeometry())
    expect(y).toBeCloseTo(50, 0)
    expect(box.min.x).toBeLessThan(-22)
    expect(box.max.x).toBeLessThan(21.5)
    expect(x).toBeGreaterThan(43)
    expect(z).toBeCloseTo(9.8, 1)
  })

  it('베젤은 41mm 남짓이고 널링 때문에 바깥 반지름이 들쑥날쑥하다', () => {
    const geometry = createBezelGeometry()
    const { x } = size(geometry)
    expect(x).toBeGreaterThan(42.5)
    expect(x).toBeLessThan(43.5)
  })

  it('핸즈·톱니바퀴·브리지·링크·스트랩 형상이 만들어진다', () => {
    expect(size(createHandGeometry(14.5, 1.9)).y).toBeGreaterThan(16)
    expect(size(createGearGeometry(48, 4)).x).toBeCloseTo(8, 0)
    expect(size(createArcBridgeGeometry()).x).toBeGreaterThan(20)
    expect(size(createLinkGeometry(9, 5)).z).toBeCloseTo(3.1, 1)
    expect(size(createStrapGeometry()).y).toBeGreaterThan(20)
  })

  it('스트랩 경로는 러그에서 수평으로 시작해 아래로 휜다', () => {
    const start = strapPoint(0)
    const later = strapPoint(30)
    expect(start.tilt).toBe(0)
    expect(later.z).toBeLessThan(start.z)
    expect(later.y).toBeGreaterThan(start.y)
  })
})
