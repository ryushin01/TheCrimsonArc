import type { Meta, StoryObj } from '@storybook/react-vite'
import { Provider, createStore } from 'jotai'
import { useEffect, useState } from 'react'
import { DEFAULT_CONFIG, type WatchConfig } from '@/entities/watch'
import type { WatchView } from '../../model/config-url'
import { watchConfigAtom, watchViewAtom } from '../../model/configurator'
import WatchStage, { type WatchStageProps } from './WatchStage'

interface FramedProps extends WatchStageProps {
  config: WatchConfig
  view: WatchView
}

/** 조합·방향은 구성기 atom으로 넣습니다. (Canvas 안의 시계가 같은 store에서 읽음) */
function Framed({ config, view, ...props }: FramedProps) {
  const [store] = useState(() => {
    const next = createStore()
    next.set(watchConfigAtom, config)
    next.set(watchViewAtom, view)
    return next
  })
  // 컨트롤 패널에서 바꾼 값도 반영합니다.
  useEffect(() => {
    store.set(watchConfigAtom, config)
    store.set(watchViewAtom, view)
  }, [store, config, view])
  return (
    <Provider store={store}>
      <div
        style={{ width: 520, height: 520, background: '#1a1b1f' }}
        role="img"
        aria-label={`A-01 3D 모델 (${view})`}
      >
        <WatchStage {...props} />
      </div>
    </Provider>
  )
}

const meta = {
  title: 'pages/home/WatchStage',
  component: Framed,
  args: {
    config: { ...DEFAULT_CONFIG },
    view: 'front',
    active: true,
    paused: false,
  },
  argTypes: {
    view: { control: 'inline-radio', options: ['front', 'side', 'back'] },
  },
  globals: { backgrounds: { value: 'studio' } },
} satisfies Meta<typeof Framed>

export default meta
type Story = StoryObj<typeof meta>

/** 저절로 흔들리고 마우스를 따라 기울어지는 구성기 무대 */
export const Front: Story = {}

/** 움직임을 멈추면 고른 방향에 그대로 섭니다. */
export const BackPaused: Story = { args: { view: 'back', paused: true } }
