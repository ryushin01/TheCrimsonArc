import type { BufferGeometry } from 'three'
import {
  CatmullRomCurve3,
  CircleGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  LatheGeometry,
  Path,
  RingGeometry,
  Shape,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
} from 'three'

/*
 * 단위는 mm, 다이얼 면이 +Z를 봅니다. (모델 묶음에서 0.05배로 줄여 씁니다)
 * 레퍼런스: 41mm 비드블라스트 파일럿 워치 (각진 러그, 3시 양파 크라운, 크라운 가드 없음)
 */

export const CASE_TOP = 2.5
export const CASE_BOTTOM = -7.3
export const DIAL_Z = 3.3
export const DIAL_RADIUS = 16.6
/** 6시 크로노그래프 30분 적산계의 가운데(y)와 반지름 (mm) */
export const SUBDIAL_Y = -6.9
export const SUBDIAL_RADIUS = 3.4
export const BEZEL_INNER = 16.8
export const CRYSTAL_TOP = 6.6

/** 위에서 본 케이스 외곽선: 둥근 몸통, 네 러그, 좌우 대칭의 평평한 옆면 */
export function caseOutline(): Shape {
  const top = Math.sqrt(21 * 21 - 10.4 * 10.4)
  const shape = new Shape()
  shape.moveTo(15.8, 25)
  shape.lineTo(10.4, 25)
  shape.lineTo(10.4, top)
  shape.absarc(0, 0, 21, Math.atan2(top, 10.4), Math.atan2(top, -10.4), false)
  shape.lineTo(-10.4, 25)
  shape.lineTo(-15.8, 25)
  shape.lineTo(-20.6, 12.5)
  shape.lineTo(-21.2, 0)
  shape.lineTo(-20.6, -12.5)
  shape.lineTo(-15.8, -25)
  shape.lineTo(-10.4, -25)
  shape.lineTo(-10.4, -top)
  shape.absarc(0, 0, 21, Math.atan2(-top, -10.4), Math.atan2(-top, 10.4), false)
  shape.lineTo(10.4, -25)
  shape.lineTo(15.8, -25)
  shape.lineTo(20.6, -12.5)
  shape.lineTo(21.2, 0)
  shape.lineTo(20.6, 12.5)
  shape.closePath()
  return shape
}

export function createCaseGeometry(): BufferGeometry {
  const bevel = 1.1
  const depth = CASE_TOP - CASE_BOTTOM - bevel * 2
  const geometry = new ExtrudeGeometry(caseOutline(), {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: 1,
    bevelOffset: -1,
    bevelSegments: 3,
    curveSegments: 64,
  })
  geometry.translate(0, 0, CASE_BOTTOM + bevel)
  // 러그 윗면을 끝으로 갈수록 낮춰 손목을 따라 내려가는 모양으로 만듭니다.
  const position = geometry.attributes.position
  for (let i = 0; i < position.count; i += 1) {
    const y = Math.abs(position.getY(i))
    const t = Math.min(1, Math.max(0, (y - 17.5) / 7.5))
    if (t === 0) continue
    const z = position.getZ(i)
    const height = (z - CASE_BOTTOM) / (CASE_TOP - CASE_BOTTOM)
    position.setZ(i, z - t * t * 3.4 * height)
  }
  geometry.computeVertexNormals()
  return geometry
}

/** (r, z) 단면을 Z축으로 돌린 회전체 */
function lathe(
  points: ReadonlyArray<readonly [number, number]>,
  segments: number,
): LatheGeometry {
  const geometry = new LatheGeometry(
    points.map(([r, z]) => new Vector2(r, z)),
    segments,
  )
  geometry.rotateX(Math.PI / 2)
  return geometry
}

/** 동전 테두리가 깎인 회전 베젤 몸체 */
export function createBezelGeometry(): BufferGeometry {
  const geometry = lathe(
    [
      [BEZEL_INNER, 2.7],
      [21.4, 2.7],
      [21.6, 3.1],
      [21.6, 4.6],
      [21.1, 5.6],
      [20.3, 5.95],
      [BEZEL_INNER + 0.1, 5.95],
      [BEZEL_INNER, 5.6],
    ],
    480,
  )
  // 바깥 띠(반지름 21.6 근처) 꼭짓점만 120홈으로 들쑥날쑥하게 밀어 널링을 만듭니다.
  const position = geometry.attributes.position
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i)
    const y = position.getY(i)
    const r = Math.hypot(x, y)
    if (r < 21.5) continue
    const angle = Math.atan2(y, x)
    const ridge = Math.cos(angle * 120) > 0 ? 0 : -0.32
    const scale = (r + ridge) / r
    position.setXY(i, x * scale, y * scale)
  }
  geometry.computeVertexNormals()
  return geometry
}

/** 베젤 인서트(인쇄 면). 평면 UV라 정사각 텍스처가 그대로 맞습니다. */
export function createBezelInsertGeometry(): RingGeometry {
  return new RingGeometry(17.25, 20.25, 240, 1)
}

export function createDialGeometry(radius = DIAL_RADIUS): CircleGeometry {
  return new CircleGeometry(radius, 160)
}

/** 다이얼 가장자리에서 크리스털로 올라가는 비스듬한 고리 */
export function createChapterRingGeometry(): BufferGeometry {
  return lathe(
    [
      [DIAL_RADIUS - 0.4, DIAL_Z + 0.02],
      [BEZEL_INNER, DIAL_Z + 1.4],
      [BEZEL_INNER, DIAL_Z + 1.5],
    ],
    160,
  )
}

/** 살짝 볼록한 사파이어 크리스털 */
export function createCrystalGeometry(): BufferGeometry {
  return lathe(
    [
      [0, CRYSTAL_TOP],
      [8, CRYSTAL_TOP - 0.06],
      [14, CRYSTAL_TOP - 0.24],
      [BEZEL_INNER, CRYSTAL_TOP - 0.55],
      [BEZEL_INNER, CRYSTAL_TOP - 0.85],
    ],
    96,
  )
}

/**
 * 파일럿 워치의 양파 모양 크라운: 장갑을 낀 손으로도 잡히도록 크고 홈이 깊습니다.
 * 바탕(local y=0)이 케이스 쪽이고 +x 방향(3시)으로 뻗습니다.
 */
export function createCrownGeometry(): BufferGeometry {
  const profile = [
    [0.01, 0],
    [1.75, 0],
    [1.75, 0.45],
    [2.85, 0.85],
    [3.55, 1.6],
    [3.85, 2.5],
    [3.75, 3.4],
    [3.2, 4.25],
    [2.25, 4.85],
    [1.0, 5.2],
    [0.01, 5.25],
  ].map(([r, y]) => new Vector2(r, y))
  const geometry = new LatheGeometry(profile, 108)
  const position = geometry.attributes.position
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i)
    const z = position.getZ(i)
    const r = Math.hypot(x, z)
    if (r < 2.4) continue
    // 바깥쪽일수록 깊어지는 세로 홈 18개
    const angle = Math.atan2(z, x)
    const groove = Math.cos(angle * 18) > 0.3 ? 0 : 0.26 * ((r - 2.4) / 1.45)
    const scale = (r - groove) / r
    position.setX(i, x * scale)
    position.setZ(i, z * scale)
  }
  geometry.rotateZ(-Math.PI / 2)
  geometry.computeVertexNormals()
  return geometry
}

/** 크로노그래프 푸셔: 케이스 옆면에서 +x로 뻗는 짧은 원통 (2시·4시) */
export function createPusherGeometry(): BufferGeometry {
  const profile = [
    [0.01, 0],
    [0.8, 0],
    [0.8, 1.0],
    [1.35, 1.0],
    [1.35, 2.45],
    [1.22, 2.75],
    [0.9, 2.86],
    [0.01, 2.88],
  ].map(([r, y]) => new Vector2(r, y))
  const geometry = new LatheGeometry(profile, 48)
  geometry.rotateZ(-Math.PI / 2)
  geometry.computeVertexNormals()
  return geometry
}

export function createCrownTubeGeometry(): BufferGeometry {
  const geometry = new CylinderGeometry(1.5, 1.5, 2.4, 32)
  geometry.rotateZ(Math.PI / 2)
  return geometry
}

/** 나사식 케이스백 (그룹 0 옆면, 1 윗면, 2 각인 면) */
export function createCasebackGeometry(): BufferGeometry {
  const geometry = new CylinderGeometry(17.6, 18.2, 1.6, 128, 1)
  geometry.rotateX(Math.PI / 2)
  return geometry
}

/** 소드 핸즈: 중심 원과 끝이 뾰족한 칼날 */
export function swordShape(length: number, width: number, tail = 2.6): Shape {
  const half = width / 2
  const shape = new Shape()
  shape.moveTo(-half * 0.55, -tail)
  shape.lineTo(half * 0.55, -tail)
  shape.lineTo(half, length * 0.18)
  shape.lineTo(half, length - width * 1.1)
  shape.lineTo(0, length)
  shape.lineTo(-half, length - width * 1.1)
  shape.lineTo(-half, length * 0.18)
  shape.closePath()
  const hole = new Path()
  hole.absarc(0, 0, 0.45, 0, Math.PI * 2, true)
  shape.holes.push(hole)
  return shape
}

/** 야광이 채워지는 칼날 안쪽 */
export function lumeShape(length: number, width: number): Shape {
  const half = width / 2 - 0.32
  const shape = new Shape()
  shape.moveTo(-half, length * 0.24)
  shape.lineTo(half, length * 0.24)
  shape.lineTo(half, length - width * 1.25)
  shape.lineTo(0, length - 0.55)
  shape.lineTo(-half, length - width * 1.25)
  shape.closePath()
  return shape
}

export function createHandGeometry(
  length: number,
  width: number,
): BufferGeometry {
  return new ExtrudeGeometry(swordShape(length, width), {
    depth: 0.28,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.06,
    bevelSegments: 1,
  })
}

export function createHandLumeGeometry(
  length: number,
  width: number,
): BufferGeometry {
  const geometry = new ExtrudeGeometry(lumeShape(length, width), {
    depth: 0.12,
    bevelEnabled: false,
  })
  geometry.translate(0, 0, 0.3)
  return geometry
}

/** 가는 초침 (끝이 크림슨, 꼬리에 균형추) */
export function createSecondsGeometry(length = 15.6): BufferGeometry {
  const shape = new Shape()
  shape.moveTo(-0.16, -4.2)
  shape.lineTo(0.16, -4.2)
  shape.lineTo(0.12, length)
  shape.lineTo(-0.12, length)
  shape.closePath()
  const weight = new Shape()
  weight.absarc(0, -3.4, 0.75, 0, Math.PI * 2, false)
  const geometry = new ExtrudeGeometry([shape, weight], {
    depth: 0.2,
    bevelEnabled: false,
  })
  return geometry
}

export function createPinionGeometry(): BufferGeometry {
  const geometry = new CylinderGeometry(0.75, 0.75, 1.3, 32)
  geometry.rotateX(Math.PI / 2)
  return geometry
}

/** 톱니바퀴 외곽선 (사다리꼴 톱니, 가운데 구멍과 살 4개) */
export function gearShape(teeth: number, outer: number, inner: number): Shape {
  const shape = new Shape()
  const step = (Math.PI * 2) / teeth
  for (let i = 0; i < teeth; i += 1) {
    const a = i * step
    const points: Array<[number, number]> = [
      [inner, a],
      [outer, a + step * 0.18],
      [outer, a + step * 0.48],
      [inner, a + step * 0.66],
    ]
    points.forEach(([r, angle], index) => {
      const x = Math.cos(angle) * r
      const y = Math.sin(angle) * r
      if (i === 0 && index === 0) shape.moveTo(x, y)
      else shape.lineTo(x, y)
    })
  }
  shape.closePath()
  // 살 사이의 빈 공간 네 개
  const rimInner = inner * 0.78
  const hub = Math.max(0.6, inner * 0.22)
  for (let k = 0; k < 4; k += 1) {
    const start = (k * Math.PI) / 2 + 0.18
    const end = start + Math.PI / 2 - 0.36
    const window = new Path()
    window.absarc(0, 0, rimInner, start, end, false)
    window.absarc(0, 0, hub + 0.35, end, start, true)
    window.closePath()
    shape.holes.push(window)
  }
  const axle = new Path()
  axle.absarc(0, 0, 0.32, 0, Math.PI * 2, true)
  shape.holes.push(axle)
  return shape
}

export function createGearGeometry(
  teeth: number,
  outer: number,
): BufferGeometry {
  const geometry = new ExtrudeGeometry(
    gearShape(teeth, outer, outer - Math.max(0.35, outer * 0.09)),
    {
      depth: 0.35,
      bevelEnabled: false,
      curveSegments: 6,
    },
  )
  geometry.translate(0, 0, -0.175)
  return geometry
}

/** 크림슨으로 양극 산화한 호 모양 브리지 (이름의 유래가 되는 부품) */
export function createArcBridgeGeometry(): BufferGeometry {
  const shape = new Shape()
  const outer = 11.6
  const inner = 8.2
  const from = Math.PI * 0.08
  const to = Math.PI * 0.92
  shape.absarc(0, 0, outer, from, to, false)
  shape.absarc(
    Math.cos(to) * ((outer + inner) / 2),
    Math.sin(to) * ((outer + inner) / 2),
    (outer - inner) / 2,
    to,
    to + Math.PI,
    false,
  )
  shape.absarc(0, 0, inner, to, from, true)
  shape.absarc(
    Math.cos(from) * ((outer + inner) / 2),
    Math.sin(from) * ((outer + inner) / 2),
    (outer - inner) / 2,
    from + Math.PI,
    from + Math.PI * 2,
    false,
  )
  shape.closePath()
  for (const angle of [from + 0.12, (from + to) / 2, to - 0.12]) {
    const screw = new Path()
    screw.absarc(
      Math.cos(angle) * 9.9,
      Math.sin(angle) * 9.9,
      0.55,
      0,
      Math.PI * 2,
      true,
    )
    shape.holes.push(screw)
  }
  return new ExtrudeGeometry(shape, {
    depth: 0.9,
    bevelEnabled: true,
    bevelThickness: 0.15,
    bevelSize: 0.15,
    bevelSegments: 2,
    curveSegments: 48,
  })
}

/** 아래쪽 주 브리지: 둥근 판에서 반달을 덜어 낸 모양 */
export function createMainBridgeGeometry(): BufferGeometry {
  const shape = new Shape()
  shape.absarc(0, 0, 12.4, Math.PI * 1.06, Math.PI * 1.94, false)
  shape.absarc(
    0,
    -2.4,
    6.2,
    Math.PI * 1.94 - Math.PI,
    Math.PI * 1.06 - Math.PI,
    true,
  )
  shape.closePath()
  return new ExtrudeGeometry(shape, {
    depth: 0.8,
    bevelEnabled: true,
    bevelThickness: 0.12,
    bevelSize: 0.12,
    bevelSegments: 2,
    curveSegments: 48,
  })
}

export function createPlateGeometry(): BufferGeometry {
  const geometry = new CylinderGeometry(13.4, 13.4, 1.4, 128)
  geometry.rotateX(Math.PI / 2)
  return geometry
}

/** 밸런스 휠과 헤어스프링 */
export function createBalanceRimGeometry(): BufferGeometry {
  return new TorusGeometry(3.3, 0.28, 12, 96)
}

export function createHairspringGeometry(): BufferGeometry {
  const points: Vector3[] = []
  const turns = 6
  for (let i = 0; i <= 360; i += 1) {
    const t = i / 360
    const angle = t * turns * Math.PI * 2
    const r = 0.5 + t * 2.2
    points.push(new Vector3(Math.cos(angle) * r, Math.sin(angle) * r, 0.25))
  }
  return new TubeGeometry(new CatmullRomCurve3(points), 720, 0.045, 5, false)
}

/** 자동 감김 로터: 반원 띠 */
export function createRotorGeometry(): BufferGeometry {
  const shape = new Shape()
  shape.absarc(0, 0, 13, Math.PI * 1.02, Math.PI * 1.98, false)
  shape.absarc(0, 0, 2.6, Math.PI * 1.98, Math.PI * 1.02, true)
  shape.closePath()
  return new ExtrudeGeometry(shape, {
    depth: 0.7,
    bevelEnabled: true,
    bevelThickness: 0.12,
    bevelSize: 0.12,
    bevelSegments: 2,
    curveSegments: 64,
  })
}

export function createJewelGeometry(): BufferGeometry {
  const geometry = new CylinderGeometry(0.5, 0.5, 0.3, 20)
  geometry.rotateX(Math.PI / 2)
  return geometry
}

export function createScrewGeometry(): BufferGeometry {
  const geometry = new CylinderGeometry(0.55, 0.55, 0.35, 20)
  geometry.rotateX(Math.PI / 2)
  return geometry
}

/* ---------- 줄 ---------- */

export const STRAP_RADIUS = 27
export const STRAP_START_Y = 24.6
export const STRAP_Z = -3.2

/** 러그에서 손목을 감듯 둥글게 내려가는 경로 위의 점과 기울기 */
export function strapPoint(distance: number): {
  y: number
  z: number
  tilt: number
} {
  const angle = distance / STRAP_RADIUS
  return {
    y: STRAP_START_Y + Math.sin(angle) * STRAP_RADIUS,
    z: STRAP_Z - (1 - Math.cos(angle)) * STRAP_RADIUS,
    tilt: angle,
  }
}

function roundedRect(width: number, height: number, radius: number): Shape {
  const x = -width / 2
  const y = -height / 2
  const shape = new Shape()
  shape.moveTo(x + radius, y)
  shape.lineTo(x + width - radius, y)
  shape.quadraticCurveTo(x + width, y, x + width, y + radius)
  shape.lineTo(x + width, y + height - radius)
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  shape.lineTo(x + radius, y + height)
  shape.quadraticCurveTo(x, y + height, x, y + height - radius)
  shape.lineTo(x, y + radius)
  shape.quadraticCurveTo(x, y, x + radius, y)
  return shape
}

/** 브레이슬릿 링크 하나 (가로 width, 세로 length, 두께 thickness) */
export function createLinkGeometry(
  width: number,
  length: number,
  thickness = 3.1,
): BufferGeometry {
  const geometry = new ExtrudeGeometry(
    roundedRect(width, length, Math.min(width, length) * 0.22),
    {
      depth: thickness - 0.6,
      bevelEnabled: true,
      bevelThickness: 0.3,
      bevelSize: 0.3,
      bevelOffset: -0.3,
      bevelSegments: 2,
      curveSegments: 6,
    },
  )
  geometry.translate(0, 0, -(thickness - 0.6) / 2)
  return geometry
}

/** 가죽 스트랩: 둥근 경로를 따라 뽑아 낸 판 (위쪽 하나, 아래는 뒤집어 씀) */
/** 가죽 스트랩의 리벳 머리: 납작한 돔 (+z가 위) */
export function createRivetGeometry(): BufferGeometry {
  const profile = [
    [0.01, 0.55],
    [0.5, 0.5],
    [0.8, 0.32],
    [0.9, 0.1],
    [0.9, 0],
    [0.01, 0],
  ].map(([r, y]) => new Vector2(r, y))
  const geometry = new LatheGeometry(profile, 32)
  geometry.rotateX(Math.PI / 2)
  geometry.computeVertexNormals()
  return geometry
}

/** 가죽 스트랩 두께(mm). 리벳을 윗면에 얹을 때도 씁니다. */
export const STRAP_THICKNESS = 3.3

export function createStrapGeometry(
  length = 34,
  width = 20,
  thickness = STRAP_THICKNESS,
): BufferGeometry {
  // 러그 사이 틈을 메우도록 케이스 가장자리(y≈20.8)에서 시작합니다.
  const points: Vector3[] = [new Vector3(0, 20.8, STRAP_Z)]
  for (let i = 0; i <= 24; i += 1) {
    const { y, z } = strapPoint((length * i) / 24)
    points.push(new Vector3(0, y, z))
  }
  const path = new CatmullRomCurve3(points)
  // y-z 평면의 경로에서 three.js가 고르는 단면의 x축(법선)은 손목 너비 방향(x)이므로,
  // 단면의 x에 너비를, y에 두께를 둡니다. (반대로 두면 좁고 높은 띠가 됩니다)
  const section = roundedRect(width, thickness, thickness * 0.45)
  const geometry = new ExtrudeGeometry(section, {
    steps: 48,
    bevelEnabled: false,
    extrudePath: path,
  })
  geometry.computeVertexNormals()
  return geometry
}
