import type { Box3 } from 'three'
import {
  caseOutline,
  createArcBridgeGeometry,
  createBezelGeometry,
  createCaseGeometry,
  createCrownGeometry,
  createGearGeometry,
  createHandGeometry,
  createLinkGeometry,
  createStrapGeometry,
  STRAP_THICKNESS,
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
  it('케이스는 러그 끝까지 50mm, 크라운 가드 없이 좌우 대칭이고 두께는 약 9.8mm다', () => {
    const { x, y, z, box } = size(createCaseGeometry())
    expect(y).toBeCloseTo(50, 0)
    expect(box.min.x).toBeCloseTo(-box.max.x, 1)
    expect(box.max.x).toBeLessThan(21.5)
    expect(x).toBeGreaterThan(41)
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

  it('파일럿 케이스: 크라운 가드 없이 좌우가 대칭이다', () => {
    const points = caseOutline().getPoints(64)
    const xs = points.map((point) => point.x)
    expect(Math.max(...xs)).toBeCloseTo(21.2, 1)
    expect(Math.min(...xs)).toBeCloseTo(-21.2, 1)
  })

  it('양파 크라운은 3시(+x)로 뻗고 장갑 낀 손에 맞게 크다', () => {
    const crown = createCrownGeometry()
    crown.computeBoundingBox()
    const box = crown.boundingBox!
    expect(box.min.x).toBeCloseTo(0, 1)
    expect(box.max.x).toBeGreaterThan(5)
    expect(box.max.y - box.min.y).toBeGreaterThan(7)
  })

  it('가죽 스트랩은 손목 너비(x) 방향으로 20mm, 두께는 얇다', () => {
    const strap = createStrapGeometry()
    strap.computeBoundingBox()
    const box = strap.boundingBox!
    expect(box.max.x - box.min.x).toBeCloseTo(20, 0)
    expect(STRAP_THICKNESS).toBeLessThan(4)
  })
})
