import ReactThreeTestRenderer from '@react-three/test-renderer'
import type { ReactNode } from 'react'
import type { AmbientLight, DirectionalLight } from 'three'
import { WatchLighting } from './WatchLighting'

// 환경 맵(큐브 카메라)은 WebGL이 있어야 하므로 자리만 남긴 대역으로 바꿉니다.
vi.mock('@react-three/drei', () => ({
  Environment: ({ children }: { children?: ReactNode }) => (
    <group name="environment">{children}</group>
  ),
  Lightformer: () => <mesh name="lightformer" />,
}))

async function lightsOf(light: 'studio' | 'sunset' | 'night') {
  const renderer = await ReactThreeTestRenderer.create(
    <WatchLighting light={light} />,
  )
  const ambient = renderer.scene.findByType('AmbientLight')
    .instance as AmbientLight
  const directional = renderer.scene
    .findAllByType('DirectionalLight')
    .map((node) => node.instance as DirectionalLight)
  const formers = renderer.scene.findAll(
    (node) => node.props.name === 'lightformer',
  )
  await renderer.unmount()
  return { ambient, directional, formers }
}

describe('WatchLighting', () => {
  it('야광 조명은 거의 끄고 푸른 달빛만 남긴다', async () => {
    const night = await lightsOf('night')
    const studio = await lightsOf('studio')
    expect(night.ambient.intensity).toBeLessThan(studio.ambient.intensity)
    expect(
      Math.max(...night.directional.map((light) => light.intensity)),
    ).toBeLessThan(0.5)
  })

  it('노을은 따뜻한 주광과 크림슨 역광 두 개를 둔다', async () => {
    const sunset = await lightsOf('sunset')
    expect(sunset.directional).toHaveLength(2)
    const [key, rim] = sunset.directional
    expect(key!.color.r).toBeGreaterThan(key!.color.b)
    expect(rim!.color.r).toBeGreaterThan(rim!.color.g)
    expect(sunset.formers.length).toBeGreaterThan(0)
  })
})
