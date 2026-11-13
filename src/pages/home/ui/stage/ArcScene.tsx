import { Environment, Grid, Lightformer, Sparkles } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import {
  Color,
  type Group,
  type Mesh,
  MeshPhysicalMaterial,
  type ShaderMaterial,
  Vector3,
} from 'three'
import { bell, damp, lerp, smoothstep } from '@/shared/lib/math'
import { motionStore, useMotion } from '@/shared/lib/motion'
import { pointerStore } from '@/shared/lib/pointer'
import { ANCHOR_COUNT, anchorStore } from '../../model/anchors'
import { chapterProgress } from '../../model/chapters'
import { tuningStore, useTuningValue } from '../../model/tuning'
import {
  ARC_OFFSET_Y,
  ARC_OUTER,
  SLICE_DEPTH,
  createArcSliceGeometry,
} from './arc-geometry'
import { createScratchTexture } from './scratch-texture'
import { Streaks, type StreaksHandle } from './Streaks'

export interface ArcSceneProps {
  /** 무대 전체 불투명도 (스크롤로 사라질 때) */
  onFade: (opacity: number) => void
}

const projected = new Vector3()

/**
 * 크림슨 호 3D 무대
 * - 첫 화면: 오른쪽에서 천천히 흔들리며 마우스를 따라 기울어짐 (lerp)
 * - 소개: 가운데로 와서 조각(레이어)이 펼쳐지고 바닥 격자가 나타남, 지시선이 조각을 가리킴
 * - 작동 원리: 빛줄기 속으로 멀어지며 사라짐
 */
export function ArcScene({ onFade }: ArcSceneProps) {
  const sliceCount = useTuningValue('sliceCount')
  const arcColor = useTuningValue('arcColor')
  const deepColor = useTuningValue('arcDeepColor')
  const metalness = useTuningValue('metalness')
  const roughness = useTuningValue('roughness')
  const clearcoat = useTuningValue('clearcoat')
  const scratch = useTuningValue('scratch')
  const sparkles = useTuningValue('sparkles')
  const sparkleCount = useTuningValue('sparkleCount')
  const { paused } = useMotion()
  const size = useThree((state) => state.size)
  const camera = useThree((state) => state.camera)

  const root = useRef<Group>(null)
  const spinner = useRef<Group>(null)
  const slices = useRef<Array<Mesh | null>>([])
  const grid = useRef<Mesh>(null)
  const streaks = useRef<StreaksHandle>(null)
  const motion = useRef({
    hero: 0,
    about: 0,
    process: 0,
    px: 0,
    py: 0,
    spin: 0,
  })

  const geometry = useMemo(() => createArcSliceGeometry(), [])
  const texture = useMemo(() => createScratchTexture(), [])
  const materials = useMemo(
    () =>
      Array.from(
        { length: sliceCount },
        () =>
          new MeshPhysicalMaterial({
            roughnessMap: texture,
            bumpMap: texture,
            clearcoatRoughness: 0.3,
          }),
      ),
    [sliceCount, texture],
  )

  // 조각마다 뒤쪽은 짙은 버건디, 앞쪽은 밝은 크림슨으로 칠합니다.
  useEffect(() => {
    const front = new Color(arcColor)
    const back = new Color(deepColor)
    materials.forEach((material, index) => {
      const t = materials.length === 1 ? 1 : index / (materials.length - 1)
      material.color.copy(back).lerp(front, t)
      material.metalness = metalness
      material.roughness = roughness
      material.clearcoat = clearcoat
      material.bumpScale = scratch * 2.2
      material.needsUpdate = true
    })
  }, [materials, arcColor, deepColor, metalness, roughness, clearcoat, scratch])

  useEffect(
    () => () => {
      for (const material of materials) material.dispose()
    },
    [materials],
  )
  useEffect(
    () => () => {
      geometry.dispose()
      texture?.dispose()
    },
    [geometry, texture],
  )

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1)
    const tuning = tuningStore.get()
    const { paused: isPaused, reduced } = motionStore.get()
    const pointer = pointerStore.get()
    const m = motion.current

    m.hero = damp(m.hero, chapterProgress('hero', 'leaving'), 7, dt)
    m.about = damp(m.about, chapterProgress('about', 'pinned'), 7, dt)
    m.process = damp(m.process, chapterProgress('process', 'through'), 7, dt)
    // 마우스를 바로 따라가지 않고 lerp로 부드럽게 다가갑니다.
    const follow = reduced ? tuning.pointerLerp * 0.5 : tuning.pointerLerp
    m.px = damp(m.px, pointer.x, follow, dt)
    m.py = damp(m.py, pointer.y, follow, dt)
    if (!isPaused) m.spin += dt * tuning.spinSpeed

    const wide = size.width >= 900
    const enter = smoothstep(0, 1, m.hero)
    const explode =
      smoothstep(0.06, 0.42, m.about) * (1 - smoothstep(0.86, 1, m.about))
    const fly = smoothstep(0.02, 0.3, m.process)
    const tilt = tuning.tilt * (reduced ? 0.5 : 1)

    const rootGroup = root.current
    const spin = spinner.current
    if (!rootGroup || !spin) return
    rootGroup.position.set(
      lerp(wide ? 1.85 : 0, wide ? 0.95 : 0, enter),
      lerp(wide ? 0.32 : 0.95, wide ? 0 : 0.85, enter) + fly * 2.2,
      -fly * 30,
    )
    rootGroup.visible = fly < 0.98
    rootGroup.scale.setScalar(lerp(wide ? 1.2 : 0.78, wide ? 1 : 0.7, enter))
    spin.rotation.y =
      Math.sin(m.spin) * 0.36 + m.px * 0.42 * tilt - explode * 0.8
    spin.rotation.x = -m.py * 0.26 * tilt + 0.05 + explode * 0.38
    spin.rotation.z = Math.sin(m.spin * 0.7) * 0.035

    const count = slices.current.length
    slices.current.forEach((mesh, index) => {
      if (!mesh) return
      const gap = SLICE_DEPTH + 0.018 + explode * 0.6 + tuning.extraGap
      mesh.position.z = (index - (count - 1) / 2) * gap
    })

    const gridMaterial = grid.current?.material as ShaderMaterial | undefined
    if (gridMaterial?.uniforms?.fadeDistance) {
      const visible = tuning.grid ? bell(m.about, 0.02, 0.3, 0.82, 1) : 0
      gridMaterial.uniforms.fadeDistance.value = Math.max(0.001, visible * 26)
      if (grid.current) grid.current.visible = visible > 0.001
    }

    streaks.current?.update(dt, bell(m.process, 0.04, 0.24, 0.6, 0.8), isPaused)

    // 소개 섹션의 지시선이 가리킬 화면 좌표: 앞쪽 조각 4장의 바깥 테두리
    rootGroup.updateMatrixWorld(true)
    const showAnchors = m.about > 0.04 && m.about < 0.96
    for (let i = 0; i < ANCHOR_COUNT; i += 1) {
      const mesh = slices.current[Math.max(0, count - 1 - i)]
      if (!mesh) {
        anchorStore.set(i, 0, 0, false)
        continue
      }
      const angle = Math.PI * (0.84 - i * 0.22)
      projected.set(
        Math.cos(angle) * ARC_OUTER,
        Math.sin(angle) * ARC_OUTER + ARC_OFFSET_Y,
        SLICE_DEPTH / 2,
      )
      mesh.localToWorld(projected).project(camera)
      anchorStore.set(
        i,
        (projected.x * 0.5 + 0.5) * size.width,
        (-projected.y * 0.5 + 0.5) * size.height,
        showAnchors && projected.z < 1,
      )
    }

    onFade(1 - smoothstep(0.66, 0.82, m.process))
  })

  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[3, 5, 6]} intensity={2.4} color="#fff1ea" />
      <directionalLight
        position={[-6, -2, 3]}
        intensity={1.2}
        color="#ff8a74"
      />
      <Environment resolution={256} frames={1}>
        <Lightformer
          form="rect"
          intensity={2.6}
          color="#fff6f0"
          position={[0, 3, 6]}
          scale={[10, 2.5, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.6}
          color="#ffb7a6"
          position={[-6, 0, 3]}
          rotation-y={Math.PI / 2.5}
          scale={[6, 5, 1]}
        />
        <Lightformer
          form="ring"
          intensity={3.2}
          color="#ff4d6a"
          position={[5, 1, -3]}
          scale={3}
        />
      </Environment>

      <group ref={root}>
        <group ref={spinner}>
          {materials.map((material, index) => (
            <mesh
              key={material.uuid}
              ref={(mesh) => {
                slices.current[index] = mesh
              }}
              geometry={geometry}
              material={material}
            />
          ))}
        </group>
      </group>

      {sparkles ? (
        <Sparkles
          count={sparkleCount}
          scale={[11, 6, 4]}
          size={3.4}
          speed={paused ? 0 : 0.35}
          opacity={0.85}
          color="#fff4ec"
        />
      ) : null}

      <Grid
        ref={grid}
        position={[0, -1.3, 0]}
        args={[44, 44]}
        cellSize={0.5}
        cellThickness={0.7}
        cellColor="#a58d89"
        sectionSize={2.5}
        sectionThickness={1.2}
        sectionColor="#b3203a"
        fadeDistance={0.001}
        fadeStrength={1.3}
      />

      <Streaks ref={streaks} />
    </>
  )
}
