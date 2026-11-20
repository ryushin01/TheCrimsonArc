import { Canvas, useThree } from '@react-three/fiber'
import { useCallback, useEffect, useState } from 'react'
import {
  DEFAULT_CONFIG,
  EXPLODE_CENTER_SHIFT,
  type FrameState,
  LINEUP,
  LINEUP_IMAGE_SIZE,
  SEQUENCE_FRAMES,
  WATCH_SCALE,
  type WatchConfig,
  WatchLighting,
  WatchModel,
  frameState,
  showcaseTime,
} from '@/entities/watch'

declare global {
  interface Window {
    /** 시퀀스 생성 스크립트가 부르는 함수: i번째 프레임을 그려 data URL로 돌려줍니다. */
    __renderFrame?: (
      index: number,
      type?: string,
      quality?: number,
    ) => Promise<string>
    /** 라인업 생성 스크립트가 부르는 함수: 인트로 다이얼의 i번째 조합을 그려 data URL로 돌려줍니다. */
    __renderLineup?: (
      index: number,
      type?: string,
      quality?: number,
    ) => Promise<string>
    __renderReady?: boolean
    __sequenceFrames?: number
    __lineupCount?: number
    /** 라인업 이미지 한 변의 길이(px). 생성 스크립트가 이 크기로 줄입니다. */
    __lineupImageSize?: number
  }
}

/** 한 장에 그릴 자세와 조합 */
interface Shot {
  pose: FrameState
  config: WatchConfig
}

const SHOWCASE_TIME = showcaseTime()

/**
 * 라인업 자세: 정면에서 크라운 쪽으로 조금 돌려 케이스 옆면과 크라운이 보이게 합니다.
 * 인트로 다이얼에서는 작게 그리므로 문자판이 잘 읽히도록 많이 돌리지 않습니다.
 */
const LINEUP_POSE: FrameState = {
  rotationX: -0.1,
  rotationY: -0.42,
  explode: 0,
}

const nextFrame = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

function sequenceShot(index: number): Shot {
  return { pose: frameState(index), config: DEFAULT_CONFIG }
}

function lineupShot(index: number): Shot {
  const entry = LINEUP[index]
  // 없는 번호를 기본 조합으로 조용히 그리지 않습니다.
  if (!entry) throw new Error(`${index}번 라인업 조합은 없습니다.`)
  return {
    pose: LINEUP_POSE,
    config: { ...DEFAULT_CONFIG, ...entry, light: 'studio' },
  }
}

function Capture({ onShot }: { onShot: (shot: Shot) => void }) {
  const gl = useThree((state) => state.gl)
  useEffect(() => {
    const capture = async (shot: Shot, type: string, quality?: number) => {
      onShot(shot)
      await nextFrame()
      await nextFrame()
      await nextFrame()
      return gl.domElement.toDataURL(type, quality)
    }
    window.__sequenceFrames = SEQUENCE_FRAMES
    window.__lineupCount = LINEUP.length
    window.__lineupImageSize = LINEUP_IMAGE_SIZE
    window.__renderFrame = (index, type = 'image/png', quality) =>
      capture(sequenceShot(index), type, quality)
    window.__renderLineup = (index, type = 'image/png', quality) =>
      capture(lineupShot(index), type, quality)
    return () => {
      delete window.__renderFrame
      delete window.__renderLineup
    }
  }, [gl, onShot])
  return null
}

/** 이미지 시퀀스와 인트로 라인업을 만드는 개발용 페이지 (배포 빌드에는 넣지 않음) */
export function RenderPage() {
  const params = new URLSearchParams(window.location.search)
  const size = Number(params.get('size') ?? 840)
  const lineup = params.get('lineup')
  const [shot, setShot] = useState<Shot>(() =>
    lineup === null
      ? sequenceShot(Number(params.get('frame') ?? 0))
      : lineupShot(Number(lineup)),
  )
  const { pose, config } = shot
  const onReady = useCallback(() => {
    window.__renderReady = true
  }, [])

  return (
    <main style={{ width: size, height: size }}>
      <h1 className="visually-hidden">시퀀스 렌더</h1>
      <Canvas
        dpr={1}
        style={{ width: size, height: size }}
        gl={{ preserveDrawingBuffer: true, alpha: true, antialias: true }}
        camera={{ position: [0, 0, 11], fov: 30, near: 0.1, far: 100 }}
      >
        <WatchLighting light={config.light} />
        <group rotation={[pose.rotationX, pose.rotationY, 0]}>
          <group
            position={[0, 0, pose.explode * EXPLODE_CENTER_SHIFT * WATCH_SCALE]}
          >
            <WatchModel
              config={config}
              explode={pose.explode}
              time={SHOWCASE_TIME}
              smooth={false}
              onReady={onReady}
            />
          </group>
        </group>
        <Capture onShot={setShot} />
      </Canvas>
    </main>
  )
}
