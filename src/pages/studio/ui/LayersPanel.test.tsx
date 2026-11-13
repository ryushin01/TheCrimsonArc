import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LayersPanel } from './LayersPanel'
import { createInitialStore, StudioProvider } from './StudioProvider'

function setup() {
  const store = createInitialStore()
  render(
    <StudioProvider store={store}>
      <LayersPanel />
    </StudioProvider>,
  )
  return { store, user: userEvent.setup() }
}

describe('LayersPanel', () => {
  it('맨 위 레이어부터 보여 주고 고른 레이어를 표시한다', () => {
    setup()
    const radios = screen.getAllByRole('radio')
    expect(radios[0]).toHaveAccessibleName(/내 그림/)
    expect(radios[0]).toBeChecked()
    expect(radios.at(-1)).toHaveAccessibleName(/배경/)
  })

  it('보이기를 끄고, 레이어를 더하고, 이름과 불투명도를 바꾼다', async () => {
    const { store, user } = setup()
    await user.click(screen.getByRole('checkbox', { name: '혜성 보이기' }))
    expect(
      store.get().artwork.layers.find((layer) => layer.name === '혜성')
        ?.visible,
    ).toBe(false)

    await user.click(screen.getByRole('button', { name: '추가' }))
    expect(store.get().artwork.layers).toHaveLength(5)

    const name = screen.getByRole('textbox', { name: '이름' })
    await user.clear(name)
    await user.type(name, '별빛')
    expect(
      store.get().artwork.layers.some((layer) => layer.name === '별빛'),
    ).toBe(true)

    const past = store.get().past.length
    fireEvent.change(screen.getByRole('slider', { name: '불투명도' }), {
      target: { value: '40' },
    })
    fireEvent.change(screen.getByRole('slider', { name: '불투명도' }), {
      target: { value: '30' },
    })
    // 슬라이더를 끄는 동안의 변경은 되돌리기 한 번으로 묶입니다.
    expect(store.get().past.length).toBe(past + 1)
  })

  it('맨 아래 레이어에서는 아래로 버튼이 꺼진다', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('radio', { name: /배경/ }))
    expect(screen.getByRole('button', { name: '아래로' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '위로' })).toBeEnabled()
  })
})
