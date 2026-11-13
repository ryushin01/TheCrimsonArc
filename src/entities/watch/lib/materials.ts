import {
  Color,
  type Material,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  type Texture,
} from 'three'
import {
  ARC_COLOR,
  CASES,
  DIALS,
  STRAPS,
  type WatchConfig,
} from '../model/config'
import type { WatchTextures } from './textures'

const LUME_DAY = new Color('#e8e2c6')
const LUME_GLOW = new Color('#9dffbf')

function metal(
  color: string,
  roughness: number,
  extra: Partial<MeshPhysicalMaterial> = {},
) {
  return new MeshPhysicalMaterial({ color, metalness: 1, roughness, ...extra })
}

/** 흰색 인쇄 텍스처를 재질 색으로 물들이는 겹 */
function overlay(map: Texture | null, color: string) {
  return new MeshStandardMaterial({
    map,
    color,
    transparent: true,
    roughness: 0.55,
    metalness: 0,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  })
}

/**
 * 조명에 밝아지거나 톤 매핑으로 색이 바래지 않는 인쇄. 크림슨 호가 화면에서도 ARC_COLOR 그대로 보이게 합니다.
 * 대신 조명마다 밝기를 targetsFor의 arc 값으로 직접 맞춥니다.
 */
function ink(map: Texture | null, color: string) {
  return new MeshBasicMaterial({
    map,
    color,
    transparent: true,
    toneMapped: false,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  })
}

/** 조명별 크림슨 호 밝기 (스튜디오에서 ARC_COLOR 그대로) */
const ARC_BRIGHTNESS: Record<WatchConfig['light'], number> = {
  studio: 1,
  sunset: 0.9,
  night: 0.1,
}

/** 낮에는 크림색, 밤에는 초록빛으로 빛나는 야광 */
function lume(map: Texture | null) {
  return new MeshStandardMaterial({
    map,
    color: LUME_DAY,
    emissive: LUME_GLOW,
    emissiveMap: map,
    emissiveIntensity: 0,
    transparent: Boolean(map),
    roughness: 0.5,
    depthWrite: !map,
    polygonOffset: true,
    polygonOffsetFactor: -3,
    polygonOffsetUnits: -3,
  })
}

export interface WatchMaterials {
  case: MeshPhysicalMaterial
  polished: MeshPhysicalMaterial
  bezelInsert: MeshPhysicalMaterial
  bezelPrint: MeshStandardMaterial
  bezelArc: MeshBasicMaterial
  bezelLume: MeshStandardMaterial
  dialBase: MeshStandardMaterial
  dialPrint: MeshStandardMaterial
  dialAccent: MeshStandardMaterial
  dialArc: MeshBasicMaterial
  dialLume: MeshStandardMaterial
  date: MeshStandardMaterial
  handFrame: MeshPhysicalMaterial
  handLume: MeshStandardMaterial
  seconds: MeshPhysicalMaterial
  crystal: MeshPhysicalMaterial
  caseback: MeshPhysicalMaterial
  plate: MeshPhysicalMaterial
  bridge: MeshPhysicalMaterial
  arcBridge: MeshPhysicalMaterial
  gold: MeshPhysicalMaterial
  jewel: MeshPhysicalMaterial
  screw: MeshPhysicalMaterial
  rotor: MeshPhysicalMaterial
  strap: MeshPhysicalMaterial
}

export function createWatchMaterials(
  textures: WatchTextures,
  config: WatchConfig,
): WatchMaterials {
  const dial = DIALS[config.dial]
  const caseOption = CASES[config.case]
  const strap = STRAPS[config.strap]
  return {
    case: metal(caseOption.color, caseOption.roughness),
    polished: metal('#e7e9ec', 0.12, { clearcoat: 0.5 }),
    bezelInsert: new MeshPhysicalMaterial({
      color: '#0d0d0f',
      roughness: 0.3,
      metalness: 0.1,
      clearcoat: 0.8,
      clearcoatRoughness: 0.18,
    }),
    bezelPrint: overlay(textures.bezelPrint, '#f2f0e9'),
    bezelArc: ink(textures.bezelArc, ARC_COLOR),
    bezelLume: lume(textures.bezelLume),
    dialBase: new MeshStandardMaterial({
      color: dial.base,
      roughness: 0.82,
      metalness: 0.05,
      roughnessMap: textures.matte,
    }),
    dialPrint: overlay(textures.dialPrint, dial.print),
    dialAccent: overlay(textures.dialAccent, dial.accent),
    dialArc: ink(textures.dialArc, ARC_COLOR),
    dialLume: lume(textures.dialLume),
    date: new MeshStandardMaterial({ map: textures.date, roughness: 0.6 }),
    handFrame: metal('#eceef1', 0.16),
    handLume: lume(null),
    seconds: new MeshPhysicalMaterial({
      color: '#d42c4a',
      roughness: 0.35,
      metalness: 0.2,
      clearcoat: 0.5,
    }),
    crystal: new MeshPhysicalMaterial({
      color: '#ffffff',
      roughness: 0.02,
      metalness: 0,
      transparent: true,
      opacity: 0.14,
      clearcoat: 1,
      envMapIntensity: 2.4,
      depthWrite: false,
    }),
    caseback: new MeshPhysicalMaterial({
      map: textures.caseback,
      bumpMap: textures.caseback,
      bumpScale: 0.6,
      metalness: 1,
      roughness: 0.45,
    }),
    plate: metal('#ffffff', 0.3, {
      map: textures.perlage,
      bumpMap: textures.perlage,
      bumpScale: 0.3,
    }),
    bridge: metal('#d9dce0', 0.22),
    arcBridge: new MeshPhysicalMaterial({
      color: ARC_COLOR,
      metalness: 0.75,
      roughness: 0.3,
      clearcoat: 0.6,
    }),
    gold: metal('#cfa760', 0.25),
    jewel: new MeshPhysicalMaterial({
      color: '#cf1340',
      roughness: 0.05,
      metalness: 0,
      clearcoat: 1,
      emissive: '#5b0012',
      emissiveIntensity: 0.6,
    }),
    screw: metal('#2b4192', 0.2),
    rotor: metal('#ffffff', 0.26, { map: textures.rotor }),
    strap: new MeshPhysicalMaterial({
      color: strap.color,
      roughness: strap.roughness,
      metalness: 0,
      sheen: 0.4,
    }),
  }
}

export interface MaterialTargets {
  caseColor: Color
  caseRoughness: number
  dialBase: Color
  dialPrint: Color
  dialAccent: Color
  arc: Color
  strapColor: Color
  strapRoughness: number
  lume: number
}

export function targetsFor(config: WatchConfig): MaterialTargets {
  const dial = DIALS[config.dial]
  const caseOption = CASES[config.case]
  const strap = STRAPS[config.strap]
  return {
    caseColor: new Color(caseOption.color),
    caseRoughness: caseOption.roughness,
    dialBase: new Color(dial.base),
    dialPrint: new Color(dial.print),
    dialAccent: new Color(dial.accent),
    arc: new Color(ARC_COLOR).multiplyScalar(ARC_BRIGHTNESS[config.light]),
    strapColor: new Color(strap.color),
    strapRoughness: strap.roughness,
    lume: config.light === 'night' ? 2.6 : 0,
  }
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** 목표 색·거칠기·야광으로 t만큼 다가갑니다. (t=1이면 바로 바뀜) */
export function stepMaterials(
  materials: WatchMaterials,
  targets: MaterialTargets,
  t: number,
): void {
  materials.case.color.lerp(targets.caseColor, t)
  materials.case.roughness = lerp(
    materials.case.roughness,
    targets.caseRoughness,
    t,
  )
  materials.dialBase.color.lerp(targets.dialBase, t)
  materials.dialPrint.color.lerp(targets.dialPrint, t)
  materials.dialAccent.color.lerp(targets.dialAccent, t)
  materials.bezelArc.color.lerp(targets.arc, t)
  materials.dialArc.color.lerp(targets.arc, t)
  materials.strap.color.lerp(targets.strapColor, t)
  materials.strap.roughness = lerp(
    materials.strap.roughness,
    targets.strapRoughness,
    t,
  )
  for (const material of [
    materials.dialLume,
    materials.bezelLume,
    materials.handLume,
  ]) {
    material.emissiveIntensity = lerp(
      material.emissiveIntensity,
      targets.lume,
      t,
    )
  }
}

export function disposeWatchMaterials(materials: WatchMaterials): void {
  for (const material of Object.values(materials) as Material[])
    material.dispose()
}
