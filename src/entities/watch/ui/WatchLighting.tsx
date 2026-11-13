import { Environment, Lightformer } from '@react-three/drei'
import type { LightId } from '../model/config'

export interface WatchLightingProps {
  light: LightId
}

/** 금속이 비칠 환경을 라이트포머로 직접 만듭니다. (외부 HDR 파일을 받지 않음) */
export function WatchLighting({ light }: WatchLightingProps) {
  if (light === 'night') {
    return (
      <>
        <ambientLight intensity={0.04} />
        <directionalLight
          position={[2, 4, 3]}
          intensity={0.12}
          color="#7d8fd6"
        />
        <Environment
          key="night"
          resolution={128}
          frames={1}
          environmentIntensity={0.18}
        >
          <Lightformer
            form="rect"
            intensity={1}
            color="#5b6db3"
            position={[0, 3, 3]}
            scale={[6, 1.5, 1]}
          />
          <Lightformer
            form="ring"
            intensity={0.6}
            color="#d23350"
            position={[-3, -1, -2]}
            scale={2}
          />
        </Environment>
      </>
    )
  }
  if (light === 'sunset') {
    return (
      <>
        <ambientLight intensity={0.18} color="#ffd2b8" />
        <directionalLight
          position={[-3, 2, 3]}
          intensity={2.1}
          color="#ffb27a"
        />
        <directionalLight
          position={[4, -1, -2]}
          intensity={1.4}
          color="#ff4d6a"
        />
        <Environment key="sunset" resolution={256} frames={1}>
          <color attach="background" args={['#4a3433']} />
          <Lightformer
            form="rect"
            intensity={2.6}
            color="#ffb98a"
            position={[-3, 1.5, 3]}
            scale={[6, 2, 1]}
          />
          <Lightformer
            form="rect"
            intensity={1.6}
            color="#ff5a74"
            position={[3.5, 0, 1]}
            rotation-y={-Math.PI / 2}
            scale={[4, 3, 1]}
          />
          <Lightformer
            form="ring"
            intensity={1.4}
            color="#ffd9b8"
            position={[0, 3, -3]}
            scale={2.5}
          />
        </Environment>
      </>
    )
  }
  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight
        position={[2.5, 3.5, 4]}
        intensity={2.3}
        color="#ffffff"
        castShadow
      />
      <Environment key="studio" resolution={256} frames={1}>
        {/* 금속이 빈 곳을 검게 비추지 않도록 환경 바탕을 회색으로 둡니다. */}
        <color attach="background" args={['#55565c']} />
        <Lightformer
          form="rect"
          intensity={3.2}
          position={[0, 2.6, 3]}
          scale={[7, 1.4, 1]}
        />
        <Lightformer
          form="rect"
          intensity={2}
          position={[-3.2, 0, 2]}
          rotation-y={Math.PI / 2}
          scale={[4, 4, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.4}
          position={[3.2, -0.6, 2]}
          rotation-y={-Math.PI / 2}
          scale={[4, 2, 1]}
        />
        <Lightformer
          form="ring"
          intensity={1.6}
          color="#ffd9cf"
          position={[0, -2, -3]}
          scale={2}
        />
        <Lightformer
          form="rect"
          intensity={1.2}
          position={[0, -3, 2]}
          rotation-x={-Math.PI / 2}
          scale={[8, 4, 1]}
        />
      </Environment>
    </>
  )
}
