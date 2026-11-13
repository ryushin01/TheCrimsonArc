import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createSampleArtwork } from '@/entities/artwork'
import { ExportPanel } from './ExportPanel'

describe('ExportPanel', () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:preview')
    URL.revokeObjectURL = vi.fn()
  })

  it('GIF를 만들어 상태를 알리고 미리보기와 내려받기 링크를 보여 준다', async () => {
    const user = userEvent.setup()
    render(
      <ExportPanel
        artwork={createSampleArtwork()}
        fileName="sample"
        defaultScale={1}
      />,
    )

    const status = screen.getByRole('status')
    expect(status).toBeEmptyDOMElement()
    await user.click(screen.getByRole('button', { name: 'GIF 만들기' }))

    await waitFor(() =>
      expect(status).toHaveTextContent('GIF 애니메이션을 만들었습니다.'),
    )
    expect(
      screen.getByRole('img', {
        name: /만든 GIF 애니메이션 미리보기, 64×64픽셀, 프레임 12장/,
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'sample.gif 내려받기' }),
    ).toHaveAttribute('download', 'sample.gif')
  })

  it('빠르게 두 번 눌러도 한 번만 만든다', async () => {
    // 클릭 사이에 기다리지 않아 첫 작업이 끝나기 전에 두 번째 클릭이 들어갑니다.
    const user = userEvent.setup({ delay: null })
    render(<ExportPanel artwork={createSampleArtwork()} defaultScale={1} />)
    const button = screen.getByRole('button', { name: 'GIF 만들기' })
    await user.dblClick(button)
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('만들었습니다'),
    )
    expect(URL.createObjectURL).toHaveBeenCalledOnce()
  })

  it('배율 선택지는 그림 크기와 함께 보여 준다', () => {
    render(<ExportPanel artwork={createSampleArtwork()} />)
    expect(screen.getByRole('radio', { name: '×4 (256×256)' })).toBeChecked()
    expect(screen.getByRole('group', { name: '배경' })).toBeInTheDocument()
  })
})
