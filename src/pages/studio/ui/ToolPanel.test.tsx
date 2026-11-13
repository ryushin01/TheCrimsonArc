import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createInitialStore, StudioProvider } from './StudioProvider'
import { ToolPanel } from './ToolPanel'

describe('ToolPanel', () => {
  it('도구·색·붓 크기를 고르면 상태가 바뀐다', async () => {
    const user = userEvent.setup()
    const store = createInitialStore()
    render(
      <StudioProvider store={store}>
        <ToolPanel />
      </StudioProvider>,
    )
    await user.click(screen.getByRole('radio', { name: /채우기/ }))
    expect(store.get().tool).toBe('fill')

    await user.click(screen.getByRole('radio', { name: '하늘' }))
    expect(store.get().color).toBe('#7ec4ff')

    await user.click(screen.getByRole('checkbox', { name: '픽셀 격자 보기' }))
    expect(store.get().grid).toBe(false)
    expect(
      screen.getByRole('group', { name: '그리기 도구' }),
    ).toBeInTheDocument()
  })
})
