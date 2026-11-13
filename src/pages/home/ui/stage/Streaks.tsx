import { type Ref, useImperativeHandle, useMemo } from 'react'
import {
  BoxGeometry,
  Color,
  InstancedMesh,
  MeshBasicMaterial,
  Object3D,
} from 'three'

export interface StreaksHandle {
  /** intensity 0이면 숨깁니다. paused면 제자리에 멈춥니다. */
  update(dt: number, intensity: number, paused: boolean): void
}

const COUNT = 150
const NEAR = 7
const FAR = -42

/** 렌더마다 같은 배치가 나오도록 씨앗값으로 만드는 의사 난수 */
function seeded(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 2 ** 32
  }
}

/** 화면 가운데에서 바깥으로 쏟아지는 빛줄기 (작동 원리 섹션의 '가속' 연출) */
export function Streaks({ ref }: { ref?: Ref<StreaksHandle> }) {
  const { mesh, items } = useMemo(() => {
    const random = seeded(42)
    const geometry = new BoxGeometry(0.014, 0.014, 1)
    const material = new MeshBasicMaterial({
      color: '#ffffff',
      transparent: true,
      opacity: 0,
      depthWrite: false,
    })
    const instanced = new InstancedMesh(geometry, material, COUNT)
    instanced.frustumCulled = false
    instanced.visible = false
    const crimson = new Color('#d23350')
    const white = new Color('#ffffff')
    const list = Array.from({ length: COUNT }, (_, index) => {
      const angle = random() * Math.PI * 2
      const radius = 1.2 + random() * 6
      instanced.setColorAt(index, index % 7 === 0 ? crimson : white)
      return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius * 0.7,
        z: FAR + random() * (NEAR - FAR),
        length: 0.8 + random() * 2.6,
        speed: 14 + random() * 22,
      }
    })
    return { mesh: instanced, items: list }
  }, [])

  useImperativeHandle(ref, () => {
    const dummy = new Object3D()
    const material = mesh.material as MeshBasicMaterial
    return {
      update(dt, intensity, paused) {
        if (intensity < 0.01) {
          mesh.visible = false
          return
        }
        mesh.visible = true
        material.opacity = Math.min(1, intensity * 1.1)
        items.forEach((item, index) => {
          if (!paused) {
            item.z += item.speed * dt * (0.4 + intensity)
            if (item.z > NEAR) item.z = FAR
          }
          dummy.position.set(item.x, item.y, item.z)
          dummy.scale.set(1, 1, item.length * (0.5 + intensity * 1.5))
          dummy.updateMatrix()
          mesh.setMatrixAt(index, dummy.matrix)
        })
        mesh.instanceMatrix.needsUpdate = true
      },
    }
  }, [mesh, items])

  return <primitive object={mesh} />
}
