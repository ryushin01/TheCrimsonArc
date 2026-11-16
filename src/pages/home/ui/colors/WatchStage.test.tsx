import ReactThreeTestRenderer from '@react-three/test-renderer'
import type { Group } from 'three'
import { FrameBudget, WatchRig } from './WatchStage'

async function settle(view: 'front' | 'side' | 'back', paused: boolean) {
  const renderer = await ReactThreeTestRenderer.create(
    <WatchRig view={view} paused={paused}>
      <mesh />
    </WatchRig>,
  )
  await renderer.advanceFrames(240, 1 / 60)
  const rig = renderer.scene.children[0]!.instance as Group
  const rotation = rig.rotation.y
  await renderer.unmount()
  return rotation
}

describe('WatchRig', () => {
  it('움직임을 멈추면 고른 방향(뒷면 = 180°)에 그대로 선다', async () => {
    expect(await settle('back', true)).toBeCloseTo(Math.PI, 2)
    expect(await settle('side', true)).toBeCloseTo(-Math.PI / 2, 2)
  })

  it('움직임이 켜져 있으면 고른 방향 둘레에서만 살짝 흔들린다', async () => {
    const rotation = await settle('front', false)
    expect(Math.abs(rotation)).toBeLessThan(0.2)
  })
})

describe('FrameBudget', () => {
  async function run(frames: number, delta: number) {
    const onSlow = vi.fn()
    const renderer = await ReactThreeTestRenderer.create(
      <FrameBudget onSlow={onSlow} />,
    )
    await renderer.advanceFrames(frames, delta)
    await renderer.unmount()
    return onSlow
  }

  it('처음 몇 초의 평균 FPS가 아주 낮으면(소프트웨어 렌더링 등) 알린다', async () => {
    // 0.2초 간격 = 5fps, 준비 1초 + 재는 2초
    expect(await run(16, 0.2)).toHaveBeenCalledTimes(1)
  })

  it('보통 기기의 FPS에서는 알리지 않는다', async () => {
    expect(await run(200, 1 / 60)).not.toHaveBeenCalled()
  })

  it('프레임마다 0.5초씩 걸리는 아주 느린 기기도 재서 알린다', async () => {
    expect(await run(8, 0.5)).toHaveBeenCalledTimes(1)
  })

  it('탭을 숨긴 사이 같은 긴 공백은 세지 않는다', async () => {
    expect(await run(20, 5)).not.toHaveBeenCalled()
  })
})
