import { ExtrudeGeometry, Shape } from 'three'

export const ARC_INNER = 1.0
export const ARC_OUTER = 1.62
export const SLICE_DEPTH = 0.13
/** 호의 무게 중심이 원점에 오도록 내리는 거리 */
export const ARC_OFFSET_Y = -0.78

/** 위쪽 반원 띠(아치)를 두께 있게 뽑아 낸 한 장 (레이어 하나에 해당) */
export function createArcSliceGeometry(): ExtrudeGeometry {
  const shape = new Shape()
  shape.absarc(0, 0, ARC_OUTER, 0, Math.PI, false)
  shape.lineTo(-ARC_INNER, 0)
  shape.absarc(0, 0, ARC_INNER, Math.PI, 0, true)
  shape.closePath()
  const geometry = new ExtrudeGeometry(shape, {
    depth: SLICE_DEPTH,
    bevelEnabled: true,
    bevelThickness: 0.028,
    bevelSize: 0.028,
    bevelSegments: 4,
    curveSegments: 72,
  })
  geometry.translate(0, ARC_OFFSET_Y, -SLICE_DEPTH / 2)
  geometry.computeVertexNormals()
  return geometry
}
