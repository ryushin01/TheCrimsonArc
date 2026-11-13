import type { Meta, StoryObj } from '@storybook/react-vite'
import { Canvas } from '@react-three/fiber'
import { LIGHTS, type LightId } from '../model/config'
import { WatchLighting } from './WatchLighting'

/** 조명만 보기 쉽게 금속 구와 크림슨 고리에 비춥니다. */
function Swatch({ light }: { light: LightId }) {
  return (
    <div
      style={{ width: 420, height: 300, background: '#1a1b1f' }}
      role="img"
      aria-label={`${LIGHTS[light].name} 조명 아래의 금속 구와 크림슨 고리. ${LIGHTS[light].description}`}
    >
      <Canvas camera={{ position: [0, 0, 6], fov: 35 }} dpr={[1, 2]}>
        <WatchLighting light={light} />
        <mesh position={[-1, 0, 0]}>
          <sphereGeometry args={[0.9, 64, 32]} />
          <meshPhysicalMaterial color="#c3c7cc" metalness={1} roughness={0.3} />
        </mesh>
        <mesh position={[1.2, 0, 0]} rotation={[0.6, 0.4, 0]}>
          <torusGeometry args={[0.7, 0.22, 32, 96]} />
          <meshPhysicalMaterial
            color="#8b0000"
            metalness={0.75}
            roughness={0.3}
            clearcoat={0.6}
          />
        </mesh>
      </Canvas>
    </div>
  )
}

const meta = {
  title: 'entities/watch/WatchLighting',
  component: Swatch,
  args: { light: 'studio' },
  argTypes: { light: { control: 'select', options: Object.keys(LIGHTS) } },
  globals: { backgrounds: { value: 'studio' } },
} satisfies Meta<typeof Swatch>

export default meta
type Story = StoryObj<typeof meta>

export const Studio: Story = {}
export const Sunset: Story = { args: { light: 'sunset' } }
export const Night: Story = { args: { light: 'night' } }
