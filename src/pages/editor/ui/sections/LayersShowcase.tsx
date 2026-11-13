import { LayerStack } from './LayerStack'
import { Showcase } from './Showcase'

export function LayersShowcase() {
  return (
    <Showcase
      id="layers"
      index="01"
      label="Layers"
      titleLines={['Layer', 'by layer']}
      lead="배경, 선화, 채색, 효과를 레이어로 나눠 그리면 한 부분만 고치기 쉽습니다. 레이어는 아래부터 차례로 겹쳐 하나의 그림이 됩니다."
      points={[
        '레이어를 최대 8장까지 더하고, 복제하고, 순서를 바꿉니다.',
        '보이기·숨기기와 불투명도로 겹치는 정도를 조절합니다.',
        '오른쪽 데모에서 레이어를 끄고 켜 보세요. 마우스를 올리면 쌓인 층이 기울어집니다.',
      ]}
      demo={<LayerStack />}
    />
  )
}
