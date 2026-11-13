import ReactThreeTestRenderer from '@react-three/test-renderer'
import type { Group } from 'three'
import { WatchRig } from './WatchStage'

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
