import { useFrame } from '@react-three/fiber'
import { type ReactNode, useEffect, useMemo, useRef } from 'react'
import type { BufferGeometry, Group } from 'three'
import { useFontsReady } from '@/shared/lib/fonts'
import type { WatchConfig } from '../model/config'
import { STRAP_SPREAD, type WatchPart, explodeOffset } from '../model/explode'
import { handAngles } from '../model/time'
import * as shapes from '../lib/geometry'
import {
  type WatchMaterials,
  createWatchMaterials,
  disposeWatchMaterials,
  stepMaterials,
  targetsFor,
} from '../lib/materials'
import {
  DATE_WINDOW,
  createWatchTextures,
  disposeWatchTextures,
} from '../lib/textures'

/** 모델은 mm 단위라 0.05배로 줄여 장면에 놓습니다. (지름 41mm → 약 2) */
export const WATCH_SCALE = 0.05

let geometryCache: ReturnType<typeof buildGeometries> | null = null

function buildGeometries() {
  return {
    case: shapes.createCaseGeometry(),
    bezel: shapes.createBezelGeometry(),
    bezelInsert: shapes.createBezelInsertGeometry(),
    dial: shapes.createDialGeometry(),
    chapter: shapes.createChapterRingGeometry(),
    crystal: shapes.createCrystalGeometry(),
    crown: shapes.createCrownGeometry(),
    crownTube: shapes.createCrownTubeGeometry(),
    caseback: shapes.createCasebackGeometry(),
    hour: shapes.createHandGeometry(9.8, 2.5),
    hourLume: shapes.createHandLumeGeometry(9.8, 2.5),
    minute: shapes.createHandGeometry(14.8, 2.1),
    minuteLume: shapes.createHandLumeGeometry(14.8, 2.1),
    seconds: shapes.createSecondsGeometry(),
    pinion: shapes.createPinionGeometry(),
    arcBridge: shapes.createArcBridgeGeometry(),
    mainBridge: shapes.createMainBridgeGeometry(),
    plate: shapes.createPlateGeometry(),
    gearLarge: shapes.createGearGeometry(64, 5.2),
    gearMedium: shapes.createGearGeometry(48, 3.6),
    gearSmall: shapes.createGearGeometry(30, 2.4),
    balanceRim: shapes.createBalanceRimGeometry(),
    hairspring: shapes.createHairspringGeometry(),
    rotor: shapes.createRotorGeometry(),
    jewel: shapes.createJewelGeometry(),
    screw: shapes.createScrewGeometry(),
    centerLink: shapes.createLinkGeometry(9.2, 6.9),
    sideLink: shapes.createLinkGeometry(5.3, 6.9),
    endLink: shapes.createLinkGeometry(20.4, 4.4),
    strap: shapes.createStrapGeometry(),
  }
}

/** 형상은 바뀌지 않으므로 처음 한 번만 만들어 여러 장면이 함께 씁니다. */
export function getWatchGeometries() {
  geometryCache ??= buildGeometries()
  return geometryCache
}

export interface WatchModelProps {
  config: WatchConfig
  /** 0이면 조립, 1이면 완전히 분해 */
  explode?: number
  /** 'live'면 지금 시각을 가리키고, Date를 주면 그 시각에 멈춥니다. */
  time?: 'live' | Date
  /** 색을 바꿀 때 lerp로 넘어갈지 (false면 바로 바뀜) */
  smooth?: boolean
  /** 렌더할 준비(글꼴·텍스처)가 끝나면 부릅니다. */
  onReady?: () => void
}

function Part({
  part,
  explode,
  children,
  register,
}: {
  part: WatchPart
  explode: number
  children: ReactNode
  register: (part: WatchPart, group: Group | null) => void
}) {
  const offset = explodeOffset(part, explode)
  return (
    <group
      ref={(group) => register(part, group)}
      position={[offset.x, offset.y, offset.z]}
    >
      {children}
    </group>
  )
}

/**
 * 가상의 다이버 워치 The Crimson Arc.
 * 41mm 비드블라스트 케이스, 9시 용두, 첫 15분이 크림슨인 회전 베젤, 매트 다이얼과 야광 소드 핸즈.
 */
export function WatchModel({
  config,
  explode = 0,
  time = 'live',
  smooth = true,
  onReady,
}: WatchModelProps) {
  const fontsReady = useFontsReady([
    '600 32px "Chakra Petch"',
    '700 32px "Chakra Petch"',
  ])
  const geometries = getWatchGeometries()
  const textures = useMemo(
    () => (fontsReady ? createWatchTextures() : null),
    [fontsReady],
  )
  const materials = useMemo<WatchMaterials | null>(
    () => (textures ? createWatchMaterials(textures, config) : null),
    // 색은 아래에서 lerp로 바꾸므로 처음 구성만 씁니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [textures],
  )
  const targets = useMemo(() => targetsFor(config), [config])
  const parts = useRef(new Map<WatchPart, Group>())
  const hour = useRef<Group>(null)
  const minute = useRef<Group>(null)
  const second = useRef<Group>(null)
  const explodeRef = useRef(explode)
  useEffect(() => {
    explodeRef.current = explode
  }, [explode])

  // onReady가 렌더마다 새 함수여도 재질·질감을 버렸다 다시 만들지 않도록 ref로 붙잡습니다.
  const onReadyRef = useRef(onReady)
  useEffect(() => {
    onReadyRef.current = onReady
  })

  useEffect(() => {
    if (!textures || !materials) return
    onReadyRef.current?.()
    return () => {
      disposeWatchMaterials(materials)
      disposeWatchTextures(textures)
    }
  }, [textures, materials])

  useEffect(() => {
    if (materials && !smooth) stepMaterials(materials, targets, 1)
  }, [materials, targets, smooth])

  useFrame((_, delta) => {
    if (!materials) return
    if (smooth)
      stepMaterials(materials, targets, 1 - Math.exp(-7 * Math.min(delta, 0.1)))
    const angles = handAngles(time === 'live' ? new Date() : time)
    if (hour.current) hour.current.rotation.z = -angles.hour
    if (minute.current) minute.current.rotation.z = -angles.minute
    if (second.current) second.current.rotation.z = -angles.second
    for (const [part, group] of parts.current) {
      const offset = explodeOffset(part, explodeRef.current)
      group.position.set(offset.x, offset.y, offset.z)
    }
  })

  if (!materials) return null
  const m = materials
  const g = geometries
  const register = (part: WatchPart, group: Group | null) => {
    if (group) parts.current.set(part, group)
    else parts.current.delete(part)
  }
  const isBracelet = config.strap === 'bracelet'
  const dateX = Math.sin(DATE_WINDOW.angle) * DATE_WINDOW.radius
  const dateY = Math.cos(DATE_WINDOW.angle) * DATE_WINDOW.radius

  const mesh = (
    geometry: BufferGeometry,
    material: WatchMaterials[keyof WatchMaterials],
    props = {},
    key?: string,
  ) => (
    <mesh
      key={key}
      geometry={geometry}
      material={material}
      castShadow
      receiveShadow
      {...props}
    />
  )

  return (
    <group scale={WATCH_SCALE}>
      <Part part="case" explode={explode} register={register}>
        {mesh(g.case, m.case)}
      </Part>

      <Part part="crown" explode={explode} register={register}>
        {mesh(g.crownTube, m.polished, { position: [-22.6, 0, -2.8] })}
        {mesh(g.crown, m.case, { position: [-25.2, 0, -2.8] })}
      </Part>

      <Part part="bezel" explode={explode} register={register}>
        {mesh(g.bezel, m.case)}
        <mesh
          geometry={g.bezelInsert}
          material={m.bezelInsert}
          position={[0, 0, 5.96]}
        />
        <mesh
          geometry={g.bezelInsert}
          material={m.bezelArc}
          position={[0, 0, 5.97]}
        />
        <mesh
          geometry={g.bezelInsert}
          material={m.bezelPrint}
          position={[0, 0, 5.98]}
        />
        <mesh
          geometry={g.bezelInsert}
          material={m.bezelLume}
          position={[0, 0, 5.99]}
        />
      </Part>

      <Part part="crystal" explode={explode} register={register}>
        <mesh geometry={g.crystal} material={m.crystal} renderOrder={10} />
      </Part>

      <Part part="chapter" explode={explode} register={register}>
        {mesh(g.chapter, m.polished)}
      </Part>

      <Part part="dial" explode={explode} register={register}>
        <mesh
          geometry={g.dial}
          material={m.dialBase}
          position={[0, 0, shapes.DIAL_Z]}
          receiveShadow
        />
        <mesh
          position={[dateX, dateY, shapes.DIAL_Z + 0.004]}
          material={m.date}
        >
          <planeGeometry args={[DATE_WINDOW.width, DATE_WINDOW.height]} />
        </mesh>
        <mesh
          geometry={g.dial}
          material={m.dialPrint}
          position={[0, 0, shapes.DIAL_Z + 0.01]}
        />
        <mesh
          geometry={g.dial}
          material={m.dialAccent}
          position={[0, 0, shapes.DIAL_Z + 0.012]}
        />
        <mesh
          geometry={g.dial}
          material={m.dialArc}
          position={[0, 0, shapes.DIAL_Z + 0.013]}
        />
        <mesh
          geometry={g.dial}
          material={m.dialLume}
          position={[0, 0, shapes.DIAL_Z + 0.015]}
        />
      </Part>

      <Part part="hands" explode={explode} register={register}>
        <group ref={hour} position={[0, 0, shapes.DIAL_Z + 0.3]}>
          {mesh(g.hour, m.handFrame)}
          <mesh geometry={g.hourLume} material={m.handLume} />
        </group>
        <group ref={minute} position={[0, 0, shapes.DIAL_Z + 0.8]}>
          {mesh(g.minute, m.handFrame)}
          <mesh geometry={g.minuteLume} material={m.handLume} />
        </group>
        <group ref={second} position={[0, 0, shapes.DIAL_Z + 1.3]}>
          {mesh(g.seconds, m.seconds)}
        </group>
        {mesh(g.pinion, m.polished, { position: [0, 0, shapes.DIAL_Z + 1.1] })}
      </Part>

      <Part part="arcBridge" explode={explode} register={register}>
        {mesh(g.arcBridge, m.arcBridge, { position: [0, 0, -1.6] })}
        {[0.3, Math.PI / 2, Math.PI - 0.3].map((angle) =>
          mesh(
            g.jewel,
            m.jewel,
            { position: [Math.cos(angle) * 9.9, Math.sin(angle) * 9.9, -0.45] },
            `jewel-${angle}`,
          ),
        )}
      </Part>

      <Part part="bridges" explode={explode} register={register}>
        {mesh(g.mainBridge, m.bridge, { position: [0, 0, -1.9] })}
        {[
          [-6.4, -8.4],
          [6.4, -8.4],
          [0, -11.4],
        ].map(([x, y]) =>
          mesh(g.screw, m.screw, { position: [x, y, -0.9] }, `screw-${x}-${y}`),
        )}
      </Part>

      <Part part="gears" explode={explode} register={register}>
        {mesh(g.gearLarge, m.gold, { position: [-4.2, -4.6, -2.3] })}
        {mesh(g.gearMedium, m.gold, {
          position: [3.9, -3.2, -2.3],
          rotation: [0, 0, 0.3],
        })}
        {mesh(g.gearSmall, m.gold, {
          position: [0.2, 2.4, -2.3],
          rotation: [0, 0, 0.6],
        })}
        {mesh(g.gearSmall, m.gold, {
          position: [6.6, 2.6, -2.3],
          rotation: [0, 0, 1.1],
        })}
      </Part>

      <Part part="balance" explode={explode} register={register}>
        <group position={[-6.2, 5.6, -1.2]}>
          {mesh(g.balanceRim, m.gold)}
          {mesh(g.hairspring, m.polished)}
          {[0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((angle) => (
            <mesh
              key={angle}
              material={m.gold}
              rotation={[0, 0, angle]}
              position={[0, 0, 0]}
            >
              <boxGeometry args={[0.36, 6.4, 0.3]} />
            </mesh>
          ))}
          {mesh(g.jewel, m.jewel, { position: [0, 0, 0.35] })}
        </group>
      </Part>

      <Part part="plate" explode={explode} register={register}>
        {mesh(g.plate, m.plate, { position: [0, 0, -3.4] })}
      </Part>

      <Part part="rotor" explode={explode} register={register}>
        {mesh(g.rotor, m.rotor, {
          position: [0, 0, -6.2],
          rotation: [0, 0, 0.5],
        })}
      </Part>

      <Part part="caseback" explode={explode} register={register}>
        <mesh
          geometry={g.caseback}
          material={[m.case, m.case, m.caseback]}
          position={[0, 0, shapes.CASE_BOTTOM - 0.7]}
          rotation={[0, 0, -Math.PI / 2]}
          castShadow
        />
      </Part>

      <Part part="strap" explode={explode} register={register}>
        {[1, -1].map((side) => (
          <group
            key={side}
            position={[
              0,
              (side * STRAP_SPREAD * explodeOffset('strap', explode).z) / -4,
              0,
            ]}
            scale={[1, side, 1]}
          >
            {isBracelet ? (
              <>
                {mesh(g.endLink, m.case, {
                  position: [0, shapes.STRAP_START_Y + 1.4, shapes.STRAP_Z],
                })}
                {Array.from({ length: 6 }, (_, index) => {
                  // 가운데 링크와 옆 링크를 반 칸씩 엇갈려 놓아 틈 없이 이어지게 합니다.
                  const center = shapes.strapPoint(6.2 + index * 6.4)
                  const side = shapes.strapPoint(3 + index * 6.4)
                  return (
                    <group key={index}>
                      <group
                        position={[0, center.y, center.z]}
                        rotation={[center.tilt, 0, 0]}
                      >
                        {mesh(g.centerLink, m.case)}
                      </group>
                      <group
                        position={[0, side.y, side.z]}
                        rotation={[side.tilt, 0, 0]}
                      >
                        {mesh(g.sideLink, m.case, { position: [-7.6, 0, 0] })}
                        {mesh(g.sideLink, m.case, { position: [7.6, 0, 0] })}
                      </group>
                    </group>
                  )
                })}
              </>
            ) : (
              mesh(g.strap, m.strap)
            )}
          </group>
        ))}
      </Part>
    </group>
  )
}
