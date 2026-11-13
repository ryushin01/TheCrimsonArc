import { useRef } from 'react'
import { useChapter } from '../../model/chapters'
import { Flipbook } from './Flipbook'
import { Showcase } from './Showcase'

export function FramesShowcase() {
  const ref = useRef<HTMLElement>(null)
  useChapter('frames', ref)
  return (
    <Showcase
      sectionRef={ref}
      id="frames"
      index="02"
      label="Frames"
      reverse
      pinned
      titleLines={['Frame', 'by frame']}
      lead="애니메이션은 조금씩 다른 그림을 빠르게 넘기는 것입니다. 스크롤을 내리면 혜성이 호를 따라 한 프레임씩 나아갑니다."
      points={[
        '프레임을 최대 48장까지 더하고, 복제하고, 순서를 바꿉니다.',
        '1~24fps로 재생 속도를 정하고 바로 돌려 봅니다.',
        '어니언 스킨으로 앞(빨강)·뒤(파랑) 프레임을 비춰 보며 다음 그림을 그립니다.',
      ]}
      demo={<Flipbook />}
    />
  )
}
