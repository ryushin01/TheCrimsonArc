import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { encodeAnimation } from '@/shared/lib/gif'
import { OpenDemo } from './OpenDemo'

function gif() {
  const width = 40
  const height = 20
  const rgba = new Uint8ClampedArray(width * height * 4)
  for (let i = 0; i < rgba.length; i += 4)
    rgba.set([(i / 4) % 255, 80, 160, 255], i)
  const { bytes } = encodeAnimation({
    width,
    height,
    frames: [{ rgba, delayMs: 100 }],
  })
  return new File([bytes as Uint8Array<ArrayBuffer>], 'stripes.gif', {
    type: 'image/gif',
  })
}

describe('OpenDemo', () => {
  it('이미지를 열면 원본과 픽셀 아트를 비교하고 크기·색 수를 고른다', async () => {
    const user = userEvent.setup()
    const { container } = render(<OpenDemo />)
    await user.upload(
      container.querySelector('input[type="file"]') as HTMLInputElement,
      gif(),
    )
    expect(
      await screen.findByText('‘stripes.gif’을(를) 열었습니다. 40×20'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: '원본 이미지 stripes' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: '32px' }))
    expect(
      screen.getByRole('img', { name: /픽셀 아트로 바꾼 이미지, 32×16픽셀/ }),
    ).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: '색 수' })).toHaveValue('16')
  })

  it('열 수 없는 파일은 alert로 원인과 방법을 알린다', async () => {
    const user = userEvent.setup({ applyAccept: false })
    const { container } = render(<OpenDemo />)
    await user.upload(
      container.querySelector('input[type="file"]') as HTMLInputElement,
      new File(['x'], 'memo.txt', { type: 'text/plain' }),
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(
      '‘memo.txt’은(는) 열 수 없는 형식입니다.',
    )
  })
})
