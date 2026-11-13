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

  it('베젤 호와 브리지는 늘 크림슨, 문자판 인쇄와 초침은 빨간 문자판에서만 밝은 색이다', () => {
    const arc = new Color(ARC_COLOR).getHexString()
    expect(arc).toBe('8b0000')
    for (const dial of Object.keys(DIALS) as (keyof typeof DIALS)[]) {
      const materials = createWatchMaterials(noTextures, {
        ...DEFAULT_CONFIG,
        dial,
      })
      expect(materials.bezelArc.color.getHexString()).toBe(arc)
      expect(materials.arcBridge.color.getHexString()).toBe(arc)
      const ink = new Color(DIALS[dial].ink ?? ARC_COLOR).getHexString()
      for (const material of [
        materials.dialArc,
        materials.dialAccent,
        materials.seconds,
      ]) {
        expect(material.color.getHexString()).toBe(ink)
      }
    }
    expect(DIALS.crimson.ink).toBe(DIALS.crimson.print)
    expect(DIALS.black.ink).toBeUndefined()
  })

  it('빨간 문자판으로 바꾸면 문자판 인쇄와 초침이 밝은 색으로 이어서 바뀐다', () => {
    const materials = createWatchMaterials(noTextures, DEFAULT_CONFIG)
    stepMaterials(
      materials,
      targetsFor({ ...DEFAULT_CONFIG, dial: 'crimson' }),
      1,
    )
    expect(materials.seconds.color.getHexString()).toBe(
      new Color(DIALS.crimson.print).getHexString(),
    )
    expect(materials.bezelArc.color.getHexString()).toBe('8b0000')
  })

  it('조명을 끄면 인쇄와 날짜 원판도 함께 어두워진다', () => {
    const materials = createWatchMaterials(noTextures, DEFAULT_CONFIG)
    stepMaterials(
      materials,
      targetsFor({ ...DEFAULT_CONFIG, light: 'night' }),
      1,
    )
    expect(materials.seconds.color.r).toBeLessThan(new Color(ARC_COLOR).r * 0.2)
    expect(materials.date.color.r).toBeLessThan(0.2)
    stepMaterials(materials, targetsFor(DEFAULT_CONFIG), 1)
    expect(materials.seconds.color.getHexString()).toBe('8b0000')
    expect(materials.date.color.getHexString()).toBe('ffffff')
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
