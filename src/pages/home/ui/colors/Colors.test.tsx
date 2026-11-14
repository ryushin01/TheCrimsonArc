import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Colors, describeConfig } from './Colors'

describe('Colors', () => {
  it('지금 조합을 상태 메시지와 3D 무대 이름으로 알려 준다', async () => {
    render(<Colors />)
    // 무대 안내와 조합 설명, 상태 영역이 둘이라 조합 설명을 글로 찾습니다.
    const status = screen.getByText(
      /매트 블랙 문자판, 비드블라스트 스틸 케이스/,
    )
    expect(status).toHaveAttribute('role', 'status')
    expect(status).toHaveTextContent(
      '매트 블랙 문자판, 비드블라스트 스틸 케이스',
    )
    await userEvent.click(screen.getByRole('radio', { name: '딥 네이비' }))
    await userEvent.click(screen.getByRole('radio', { name: '야광' }))
    expect(status).toHaveTextContent('딥 네이비 문자판')
    expect(status).toHaveTextContent('야광 조명')
    expect(
      screen.getByRole('img', { name: /딥 네이비 문자판.*A-01 \(앞면\)/ }),
    ).toBeInTheDocument()
  })

  it('보는 방향을 바꾸면 무대 이름에 반영한다', async () => {
    render(<Colors />)
    await userEvent.click(screen.getByRole('radio', { name: '뒷면' }))
    expect(screen.getByRole('img', { name: /\(뒷면\)$/ })).toBeInTheDocument()
  })

  it('조합을 한 문장으로 설명한다', () => {
    expect(
      describeConfig({
        dial: 'snow',
        case: 'dlc',
        strap: 'crimson',
        light: 'sunset',
      }),
    ).toBe('스노우 화이트 문자판, 블랙 DLC 케이스, 크림슨 가죽, 노을 조명')
  })
})
