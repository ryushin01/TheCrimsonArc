import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ImageDropzone } from './ImageDropzone'

describe('ImageDropzone', () => {
  it('버튼으로 파일을 고르면 onFile을 부른다', async () => {
    const onFile = vi.fn()
    const { container } = render(<ImageDropzone onFile={onFile} />)
    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement
    const file = new File(['x'], 'a.png', { type: 'image/png' })
    await userEvent.upload(input, file)
    expect(onFile).toHaveBeenCalledWith(file)
    expect(
      screen.getByRole('button', { name: '파일 고르기' }),
    ).toHaveAccessibleDescription('PNG · JPG · GIF · WebP, 15 MB 이하')
  })

  it('끌어다 놓은 첫 파일을 넘긴다', () => {
    const onFile = vi.fn()
    render(<ImageDropzone onFile={onFile} />)
    const zone = screen.getByText('이미지를 여기에 끌어다 놓으세요')
      .parentElement as HTMLElement
    const file = new File(['x'], 'b.gif', { type: 'image/gif' })
    fireEvent.drop(zone, { dataTransfer: { files: [file], types: ['Files'] } })
    expect(onFile).toHaveBeenCalledWith(file)
  })

  it('오류는 처음부터 있던 alert 영역에 나온다', () => {
    const { rerender } = render(<ImageDropzone onFile={() => {}} />)
    const alert = screen.getByRole('alert')
    expect(alert).toBeEmptyDOMElement()
    rerender(<ImageDropzone onFile={() => {}} error="열 수 없는 형식입니다." />)
    expect(alert).toHaveTextContent('열 수 없는 형식입니다.')
  })
})
