import type { CSSProperties } from 'react'
import styles from './OptionGroup.module.css'

export interface Option<T extends string> {
  id: T
  name: string
  /** 견본 색 (두 색이면 반씩 칠합니다) */
  swatch?: readonly [string] | readonly [string, string]
}

export interface OptionGroupProps<T extends string> {
  legend: string
  name: string
  options: readonly Option<T>[]
  value: T
  onChange: (value: T) => void
}

/** 견본 색이 있는 라디오 묶음. 네이티브 라디오라 화살표 키로 고를 수 있습니다. */
export function OptionGroup<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
}: OptionGroupProps<T>) {
  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.options}>
        {options.map((option) => (
          <label key={option.id} className={styles.option}>
            <input
              type="radio"
              className={styles.radio}
              name={name}
              value={option.id}
              checked={value === option.id}
              onChange={() => onChange(option.id)}
            />
            {option.swatch ? (
              <span
                className={styles.swatch}
                style={
                  {
                    '--swatch-a': option.swatch[0],
                    '--swatch-b': option.swatch[1] ?? option.swatch[0],
                  } as CSSProperties
                }
                aria-hidden="true"
              />
            ) : null}
            <span className={styles.name}>{option.name}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
