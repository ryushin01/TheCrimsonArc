import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OptionGroup } from './OptionGroup'

const OPTIONS = [
  { id: 'a', name: '첫째', swatch: ['#000000'] as const },
  { id: 'b', name: '둘째', swatch: ['#ffffff', '#8b0000'] as const },
] as const

describe('OptionGroup', () => {
  it('fieldset 이름과 라디오 이름으로 묶고, 고르면 알려 준다', async () => {
    const onChange = vi.fn()
    render(
      <OptionGroup
        legend="문자판"
        name="dial"
        options={OPTIONS}
        value="a"
        onChange={onChange}
      />,
    )
    expect(screen.getByRole('group', { name: '문자판' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '첫째' })).toBeChecked()
    await userEvent.click(screen.getByRole('radio', { name: '둘째' }))
    expect(onChange).toHaveBeenCalledWith('b')
  })

  it('화살표 키로 고를 수 있다', async () => {
    const onChange = vi.fn()
    render(
      <OptionGroup
        legend="문자판"
        name="dial"
        options={OPTIONS}
        value="a"
        onChange={onChange}
      />,
    )
    screen.getByRole('radio', { name: '첫째' }).focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(onChange).toHaveBeenCalledWith('b')
  })
})
