import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button, ButtonLink } from './Button'

describe('Button', () => {
  it('기본 type은 button이고 글자가 접근 이름이 된다', async () => {
    const onClick = vi.fn()
    render(
      <Button icon="plus" onClick={onClick}>
        레이어 추가
      </Button>,
    )
    const button = screen.getByRole('button', { name: '레이어 추가' })
    expect(button).toHaveAttribute('type', 'button')
    await userEvent.click(button)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('ButtonLink는 링크로 읽힌다', () => {
    render(<ButtonLink href="/studio/">스튜디오 열기</ButtonLink>)
    expect(screen.getByRole('link', { name: '스튜디오 열기' })).toHaveAttribute(
      'href',
      '/studio/',
    )
  })
})
