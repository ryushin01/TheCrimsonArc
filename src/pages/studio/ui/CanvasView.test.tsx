import { fireEvent, render, screen } from '@testing-library/react'
import { getCel } from '@/entities/artwork'
import { CanvasView } from './CanvasView'
import { createInitialStore, StudioProvider } from './StudioProvider'

function setup() {
  const store = createInitialStore()
  render(
    <StudioProvider store={store}>
      <CanvasView onDropFile={vi.fn()} />
    </StudioProvider>,
  )
  const canvas = screen.getByRole('application', {
    name: /그림 캔버스, 64×64픽셀/,
  })
  return { store, canvas }
}

describe('CanvasView', () => {
  it('키보드로 커서를 옮기고 Space를 누른 채 움직이면 한 획으로 저장된다', () => {
    const { store, canvas } = setup()
    canvas.focus()
    fireEvent.keyDown(canvas, { key: ' ' })
    fireEvent.keyDown(canvas, { key: 'ArrowRight' })
    fireEvent.keyDown(canvas, { key: 'ArrowRight' })
    fireEvent.keyUp(canvas, { key: ' ' })
    const state = store.get()
    expect(state.past).toHaveLength(1)
    expect(
      getCel(state.artwork, state.activeLayerId, state.activeFrameId),
    ).toBeDefined()
    expect(screen.getByRole('status')).toHaveTextContent('x 34, y 32')
  })

  it('도구 단축키와 Esc 취소가 동작하고, 사용법이 설명으로 연결된다', () => {
    const { store, canvas } = setup()
    fireEvent.keyDown(canvas, { key: 'e' })
    expect(store.get().tool).toBe('eraser')
    fireEvent.keyDown(canvas, { key: ']' })
    expect(store.get().brushSize).toBe(2)
    fireEvent.keyDown(canvas, { key: ' ' })
    fireEvent.keyDown(canvas, { key: 'Escape' })
    fireEvent.keyUp(canvas, { key: ' ' })
    expect(store.get().past).toHaveLength(0)
    expect(canvas).toHaveAccessibleDescription(/화살표로 커서를 옮기고/)
  })

  it('숨긴 레이어에는 그리지 않고 이유를 알린다', () => {
    const { store, canvas } = setup()
    store.updateLayer(store.get().activeLayerId, { visible: false })
    const before = store.get().past.length
    fireEvent.keyDown(canvas, { key: 'Enter' })
    expect(store.get().past).toHaveLength(before)
    expect(store.get().message).toContain('숨겨져 있어 그릴 수 없습니다')
  })
})
