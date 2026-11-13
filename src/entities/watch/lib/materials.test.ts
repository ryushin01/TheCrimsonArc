import { Color } from 'three'
import { ARC_COLOR, DEFAULT_CONFIG, DIALS } from '../model/config'
import { createWatchMaterials, stepMaterials, targetsFor } from './materials'
import type { WatchTextures } from './textures'

const noTextures = new Proxy(
  {},
  { get: () => null },
) as unknown as WatchTextures

describe('시계 재질', () => {
  it('다이얼 색은 lerp로 다가가고 t=1이면 바로 바뀐다', () => {
    const materials = createWatchMaterials(noTextures, DEFAULT_CONFIG)
    const crimson = targetsFor({ ...DEFAULT_CONFIG, dial: 'crimson' })
    stepMaterials(materials, crimson, 0.5)
    const halfway = materials.dialBase.color.clone()
    expect(halfway.equals(new Color(DIALS.crimson.base))).toBe(false)
    stepMaterials(materials, crimson, 1)
    expect(materials.dialBase.color.getHexString()).toBe(
      new Color(DIALS.crimson.base).getHexString(),
    )
  })

  it('크림슨 호(베젤·문자판 상징·브리지)는 어느 문자판이든 같은 색이다', () => {
    const arc = new Color(ARC_COLOR).getHexString()
    expect(arc).toBe('8b0000')
    for (const dial of Object.keys(DIALS) as (keyof typeof DIALS)[]) {
      const materials = createWatchMaterials(noTextures, {
        ...DEFAULT_CONFIG,
        dial,
      })
      expect(materials.bezelArc.color.getHexString()).toBe(arc)
      expect(materials.dialArc.color.getHexString()).toBe(arc)
      expect(materials.arcBridge.color.getHexString()).toBe(arc)
    }
  })

  it('야광 조명에서는 야광 재질이 빛난다', () => {
    const materials = createWatchMaterials(noTextures, DEFAULT_CONFIG)
    stepMaterials(
      materials,
      targetsFor({ ...DEFAULT_CONFIG, light: 'night' }),
      1,
    )
    expect(materials.dialLume.emissiveIntensity).toBeGreaterThan(2)
    stepMaterials(materials, targetsFor(DEFAULT_CONFIG), 1)
    expect(materials.handLume.emissiveIntensity).toBe(0)
  })
})
