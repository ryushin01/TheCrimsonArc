import ReactThreeTestRenderer from '@react-three/test-renderer'
import type { Group, Mesh } from 'three'
import { DEFAULT_CONFIG } from '../model/config'
import { explodeOffset } from '../model/explode'
import { handAngles, showcaseTime } from '../model/time'
import { WATCH_SCALE, WatchModel, getWatchGeometries } from './WatchModel'

const TIME = showcaseTime()

/** 글꼴 준비(마이크로태스크) 뒤 다시 그려질 때까지 기다립니다. */
async function render(element: React.ReactNode) {
  const renderer = await ReactThreeTestRenderer.create(element)
  await ReactThreeTestRenderer.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
  return renderer
}

describe('WatchModel', () => {
  it('mm 단위 모델을 장면 단위로 줄이고 바늘을 시각에 맞춘다', async () => {
    const renderer = await render(
      <WatchModel config={DEFAULT_CONFIG} time={TIME} smooth={false} />,
    )
    const root = renderer.scene.children[0]!.instance as Group
    expect(root.scale.x).toBeCloseTo(WATCH_SCALE)
    await renderer.advanceFrames(1, 0.016)
    const angles = handAngles(TIME)
    const rotations = renderer.scene
      .findAll((node) => node.type === 'Group')
      .map((node) => (node.instance as Group).rotation.z)
    expect(rotations).toContainEqual(expect.closeTo(-angles.hour, 5))
    expect(rotations).toContainEqual(expect.closeTo(-angles.minute, 5))
    await renderer.unmount()
  })

  it('분해 값만큼 부품을 앞뒤로 띄운다', async () => {
    const renderer = await render(
      <WatchModel
        config={DEFAULT_CONFIG}
        time={TIME}
        explode={1}
        smooth={false}
      />,
    )
    await renderer.advanceFrames(1, 0.016)
    const offsets = renderer.scene
      .findAll((node) => node.type === 'Group')
      .map((node) => (node.instance as Group).position.z)
    expect(offsets).toContainEqual(
      expect.closeTo(explodeOffset('caseback', 1).z, 5),
    )
    expect(offsets).toContainEqual(
      expect.closeTo(explodeOffset('crystal', 1).z, 5),
    )
    await renderer.unmount()
  })

  it('onReady가 렌더마다 새 함수여도 재질을 버리고 다시 만들지 않는다', async () => {
    const first = vi.fn()
    const renderer = await render(
      <WatchModel config={DEFAULT_CONFIG} time={TIME} onReady={first} />,
    )
    const mesh = renderer.scene.findAll((node) => node.type === 'Mesh')[0]!
    const material = (mesh.instance as Mesh).material
    await renderer.update(
      <WatchModel
        config={DEFAULT_CONFIG}
        time={TIME}
        onReady={() => undefined}
      />,
    )
    expect((mesh.instance as Mesh).material).toBe(material)
    expect(first).toHaveBeenCalledTimes(1)
    await renderer.unmount()
  })

  it('도형은 한 번만 만들어 여러 모델이 함께 쓴다', () => {
    expect(getWatchGeometries()).toBe(getWatchGeometries())
  })
})
