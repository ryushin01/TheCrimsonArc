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

  it('크로노그래프 상태를 주면 가운데 초침과 적산계가 잰 시간을 가리킨다', async () => {
    // 15분 15초에 멈춘 크로노그래프
    const chrono = { running: false, elapsedMs: 915_000, since: 0 }
    const renderer = await render(
      <WatchModel
        config={DEFAULT_CONFIG}
        time={TIME}
        chrono={chrono}
        smooth={false}
      />,
    )
    await renderer.advanceFrames(1, 0.016)
    const rotations = renderer.scene
      .findAll((node) => node.type === 'Group')
      .map((node) => (node.instance as Group).rotation.z)
    expect(rotations).toContainEqual(expect.closeTo(-Math.PI / 2, 5))
    expect(rotations).toContainEqual(
      expect.closeTo(-(915_000 / 1_800_000) * Math.PI * 2, 5),
    )
    // 시·분침은 그대로 시각을 가리킵니다.
    expect(rotations).toContainEqual(expect.closeTo(-handAngles(TIME).hour, 5))
    await renderer.unmount()
  })

  it('푸셔를 누르면 그 푸셔만 케이스 안쪽으로 잠깐 들어간다', async () => {
    const pressedAt = 1_000
    vi.spyOn(performance, 'now').mockReturnValue(pressedAt + 90)
    const renderer = await render(
      <WatchModel
        config={DEFAULT_CONFIG}
        time={TIME}
        smooth={false}
        pushers={{ startStop: pressedAt, reset: 0 }}
      />,
    )
    await renderer.advanceFrames(1, 0.016)
    const pusherX = renderer.scene
      .findAll((node) => node.type === 'Group')
      .map((node) => node.instance as Group)
      .filter((group) => Math.abs(Math.abs(group.position.y) - 9.2) < 1e-6)
      .map((group) => [
        group.position.y > 0 ? 'start' : 'reset',
        group.position.x,
      ])
    expect(Object.fromEntries(pusherX)).toEqual({
      start: expect.closeTo(20.4 - 0.7, 5),
      reset: expect.closeTo(20.4, 5),
    })
    vi.restoreAllMocks()
    await renderer.unmount()
  })

  it('도형은 한 번만 만들어 여러 모델이 함께 쓴다', () => {
    expect(getWatchGeometries()).toBe(getWatchGeometries())
  })
})
