import { render, screen } from '@testing-library/react'
import { ErrorBoundary } from './ErrorBoundary'

function Broken(): never {
  throw new Error('WebGL을 쓸 수 없음')
}

describe('ErrorBoundary', () => {
  it('자식이 실패하면 대체 내용을 보여 주고 오류를 알린다', () => {
    const onError = vi.fn()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <ErrorBoundary fallback={<p>3D 없이 봅니다</p>} onError={onError}>
        <Broken />
      </ErrorBoundary>,
    )
    expect(screen.getByText('3D 없이 봅니다')).toBeInTheDocument()
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'WebGL을 쓸 수 없음' }),
    )
  })
})
