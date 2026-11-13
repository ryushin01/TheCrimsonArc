import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LayerStack } from './LayerStack'

describe('LayerStack', () => {
  it('레이어를 끄면 무대와 합친 결과의 설명이 함께 바뀐다', async () => {
    const user = userEvent.setup()
    render(<LayerStack />)
    expect(
      screen.getByRole('img', {
        name: /펼쳐 놓은 모습. 보이는 레이어: 배경, 아치, 혜성/,
      }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('checkbox', { name: /혜성/ }))
    expect(
      screen.getByRole('img', { name: '합친 결과: 배경, 아치' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('checkbox', { name: '레이어 펼쳐 보기' }))
    expect(
      screen.getByRole('img', { name: /겹쳐 놓은 모습/ }),
    ).toBeInTheDocument()
  })
})
