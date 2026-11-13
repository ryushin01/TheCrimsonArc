import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Flipbook } from './Flipbook'

describe('Flipbook', () => {
  it('지금 프레임과 어니언 스킨 상태를 그림 이름으로 알린다', async () => {
    const user = userEvent.setup()
    render(<Flipbook />)
    expect(
      screen.getByRole('img', {
        name: '샘플 애니메이션 12프레임 중 1번째 프레임, 앞뒤 프레임 비춰 보기 켜짐',
      }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('checkbox', { name: /어니언 스킨/ }))
    expect(
      screen.getByRole('img', {
        name: '샘플 애니메이션 12프레임 중 1번째 프레임',
      }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '자동 재생' }))
    expect(
      screen.getByRole('button', { name: '재생 멈춤' }),
    ).toBeInTheDocument()
  })
})
