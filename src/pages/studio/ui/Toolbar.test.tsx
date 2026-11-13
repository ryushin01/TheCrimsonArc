import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { addFrame } from '@/entities/artwork'
import { createInitialStore, StudioProvider } from './StudioProvider'
import { Toolbar } from './Toolbar'

describe('Toolbar', () => {
  it('되돌릴 것이 생기면 되돌리기가 켜지고, 파일을 고르면 넘긴다', async () => {
    const user = userEvent.setup()
    const store = createInitialStore()
    const onOpenFile = vi.fn()
    const { container } = render(
      <StudioProvider store={store}>
        <Toolbar
          busy={false}
          error={null}
          onNew={vi.fn()}
          onOpenFile={onOpenFile}
          onPlaceFile={vi.fn()}
          onExport={vi.fn()}
        />
      </StudioProvider>,
    )
    expect(
      screen.getByRole('heading', { level: 1, name: 'Studio' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '되돌리기' })).toBeDisabled()
    act(() => store.commit(addFrame(store.get().artwork).artwork))
    expect(screen.getByRole('button', { name: '되돌리기' })).toBeEnabled()
    expect(screen.getByText(/프레임 13/)).toBeInTheDocument()

    const file = new File(['GIF89a'], 'walk.gif', { type: 'image/gif' })
    await user.upload(
      container.querySelectorAll('input[type="file"]')[0] as HTMLInputElement,
      file,
    )
    expect(onOpenFile).toHaveBeenCalledWith(file)
  })
})
