import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createInitialStore, StudioProvider } from './StudioProvider'
import { Timeline } from './Timeline'

describe('Timeline', () => {
  it('프레임을 고르고, 복제하고, 재생 버튼 글자가 바뀐다', async () => {
    const user = userEvent.setup()
    const store = createInitialStore()
    render(
      <StudioProvider store={store}>
        <Timeline />
      </StudioProvider>,
    )
    expect(
      screen.getByRole('heading', { name: '프레임 1/12' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: '프레임 03' }))
    expect(
      screen.getByRole('heading', { name: '프레임 3/12' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '복제' }))
    expect(store.get().artwork.frames).toHaveLength(13)
    expect(screen.getByRole('radio', { name: '프레임 04' })).toBeChecked()

    await user.click(screen.getByRole('button', { name: '재생' }))
    expect(screen.getByRole('button', { name: '정지' })).toBeInTheDocument()
    expect(store.get().playing).toBe(true)
  })

  it('첫 프레임에서는 앞으로 버튼이 꺼진다', () => {
    render(
      <StudioProvider>
        <Timeline />
      </StudioProvider>,
    )
    expect(screen.getByRole('button', { name: '앞으로' })).toBeDisabled()
  })
})
