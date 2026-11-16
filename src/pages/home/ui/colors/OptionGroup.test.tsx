import { useState } from 'react'
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

  it('고른 견본은 감싼 칸의 data-checked로 그려, 해제된 칸이 고른 모양으로 남지 않는다', async () => {
    function Demo() {
      const [value, setValue] = useState<'a' | 'b'>('a')
      return (
        <OptionGroup
          legend="조명"
          name="light"
          options={[
            { id: 'a', name: '스튜디오' },
            { id: 'b', name: '노을' },
          ]}
          value={value}
          onChange={setValue}
        />
      )
    }
    render(<Demo />)
    const studio = screen.getByRole('radio', { name: '스튜디오' })
    const sunset = screen.getByRole('radio', { name: '노을' })
    expect(studio.closest('label')).toHaveAttribute('data-checked', 'true')
    await userEvent.click(sunset)
    expect(sunset.closest('label')).toHaveAttribute('data-checked', 'true')
    expect(studio.closest('label')).toHaveAttribute('data-checked', 'false')
  })
})
