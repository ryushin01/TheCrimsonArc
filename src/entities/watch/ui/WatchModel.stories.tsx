import type { Meta, StoryObj } from '@storybook/react-vite'
import { Canvas } from '@react-three/fiber'
import {
  CASES,
  type CaseId,
  DIALS,
  type DialId,
  LIGHTS,
  type LightId,
  STRAPS,
  type StrapId,
} from '../model/config'
import { showcaseTime } from '../model/time'
import { WatchLighting } from './WatchLighting'
import { WatchModel } from './WatchModel'

interface StageProps {
  dial: DialId
  caseId: CaseId
  strap: StrapId
  light: LightId
  /** 0이면 조립, 1이면 완전히 분해 */
  explode: number
}

const TIME = showcaseTime()

function Stage({ dial, caseId, strap, light, explode }: StageProps) {
  return (
    <div
      style={{ width: 520, height: 520, background: '#1a1b1f' }}
      role="img"
      aria-label={`${DIALS[dial].name} 문자판, ${CASES[caseId].name} 케이스, ${STRAPS[strap].name}, ${LIGHTS[light].name} 조명의 A-01`}
    >
      <Canvas camera={{ position: [0, 0, 11], fov: 30 }} dpr={[1, 2]}>
        <WatchLighting light={light} />
        <group rotation={[-0.1, explode > 0 ? -0.8 * explode : 0, 0]}>
          <WatchModel
            config={{ dial, case: caseId, strap, light }}
            explode={explode}
            time={TIME}
          />
        </group>
      </Canvas>
    </div>
  )
}

const meta = {
  title: 'entities/watch/WatchModel',
  component: Stage,
  args: {
    dial: 'black',
    caseId: 'steel',
    strap: 'bracelet',
    light: 'studio',
    explode: 0,
  },
  argTypes: {
    dial: { control: 'select', options: Object.keys(DIALS) },
    caseId: { control: 'select', options: Object.keys(CASES) },
    strap: { control: 'select', options: Object.keys(STRAPS) },
    light: { control: 'select', options: Object.keys(LIGHTS) },
    explode: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
  },
  globals: { backgrounds: { value: 'studio' } },
} satisfies Meta<typeof Stage>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** 크림슨 래커 문자판: 문구·상징·초침은 묻히지 않게 밝은 인쇄색으로 그립니다. */
export const CrimsonDial: Story = {
  args: { dial: 'crimson', caseId: 'dlc', light: 'sunset' },
}

export const Night: Story = { args: { light: 'night' } }

export const Exploded: Story = { args: { explode: 1 } }
