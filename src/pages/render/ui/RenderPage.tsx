import { Canvas, useThree } from '@react-three/fiber'
import { useCallback, useEffect, useState } from 'react'
import {
  DEFAULT_CONFIG,
  EXPLODE_CENTER_SHIFT,
  type FrameState,
  SEQUENCE_FRAMES,
  WATCH_SCALE,
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
    __renderReady?: boolean
    __sequenceFrames?: number
  }
}

const SHOWCASE_TIME = showcaseTime()
const nextFrame = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

function Capture({ onFrame }: { onFrame: (state: FrameState) => void }) {
  const gl = useThree((state) => state.gl)
  useEffect(() => {
    window.__sequenceFrames = SEQUENCE_FRAMES
    window.__renderFrame = async (index, type = 'image/png', quality) => {
      onFrame(frameState(index))
      await nextFrame()
      await nextFrame()
      await nextFrame()
      return gl.domElement.toDataURL(type, quality)
    }
    return () => {
      delete window.__renderFrame
    }
  }, [gl, onFrame])
  return null
}

/** 이미지 시퀀스를 만드는 개발용 페이지 (배포 빌드에는 넣지 않음) */
export function RenderPage() {
  const size = Number(
    new URLSearchParams(window.location.search).get('size') ?? 840,
  )
  const start = Number(
    new URLSearchParams(window.location.search).get('frame') ?? 0,
  )
  const [state, setState] = useState<FrameState>(() => frameState(start))
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
        <WatchLighting light="studio" />
        <group rotation={[state.rotationX, state.rotationY, 0]}>
          <group
            position={[
              0,
              0,
              state.explode * EXPLODE_CENTER_SHIFT * WATCH_SCALE,
            ]}
          >
            <WatchModel
              config={DEFAULT_CONFIG}
              explode={state.explode}
              time={SHOWCASE_TIME}
              smooth={false}
              onReady={onReady}
            />
          </group>
        </group>
        <Capture onFrame={setState} />
      </Canvas>
    </main>
  )
}
