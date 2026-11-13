import { type FormEvent, useId, useRef, useState } from 'react'
import { LIMITS } from '@/shared/config'
import { Button } from '@/shared/ui/button'
import { Dialog } from '@/shared/ui/dialog'
import panel from './Panel.module.css'
import styles from './NewArtworkDialog.module.css'

export interface NewArtworkSize {
  width: number
  height: number
  fps: number
}

type FieldName = 'width' | 'height' | 'fps'

const FIELDS: ReadonlyArray<{
  name: FieldName
  label: string
  min: number
  max: number
}> = [
  { name: 'width', label: '너비', min: LIMITS.minSize, max: LIMITS.maxSize },
  { name: 'height', label: '높이', min: LIMITS.minSize, max: LIMITS.maxSize },
  {
    name: 'fps',
    label: '재생 속도(fps)',
    min: LIMITS.minFps,
    max: LIMITS.maxFps,
  },
]

const PRESETS = [16, 32, 64, 128] as const

/** 원인과 고치는 방법을 함께 알려 주는 검사 */
export function validateField(
  label: string,
  value: string,
  min: number,
  max: number,
): string | null {
  if (value.trim() === '')
    return `${label}을(를) 입력하세요. ${min}에서 ${max} 사이의 정수입니다.`
  const number = Number(value)
  if (!Number.isInteger(number) || number < min || number > max) {
    return `${label}은(는) ${min}에서 ${max} 사이의 정수로 입력하세요. 지금 값은 ‘${value}’입니다.`
  }
  return null
}

export interface NewArtworkDialogProps {
  open: boolean
  onClose: () => void
  onCreate: (size: NewArtworkSize) => void
}

export function NewArtworkDialog({
  open,
  onClose,
  onCreate,
}: NewArtworkDialogProps) {
  const [values, setValues] = useState<Record<FieldName, string>>({
    width: '64',
    height: '64',
    fps: '12',
  })
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({})
  const inputs = useRef<Partial<Record<FieldName, HTMLInputElement | null>>>({})
  const id = useId()

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const next: Partial<Record<FieldName, string>> = {}
    for (const field of FIELDS) {
      const error = validateField(
        field.label,
        values[field.name],
        field.min,
        field.max,
      )
      if (error) next[field.name] = error
    }
    setErrors(next)
    const firstInvalid = FIELDS.find((field) => next[field.name])
    if (firstInvalid) {
      inputs.current[firstInvalid.name]?.focus()
      return
    }
    onCreate({
      width: Number(values.width),
      height: Number(values.height),
      fps: Number(values.fps),
    })
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="새로 만들기"
      description="빈 캔버스의 크기와 재생 속도를 정합니다. 지금 작품은 되돌리기로 되찾을 수 있습니다."
      tone="dark"
    >
      <form className={styles.form} noValidate onSubmit={onSubmit}>
        <fieldset className={panel.group}>
          <legend className={panel.legend}>빠른 크기</legend>
          <div className={styles.presets}>
            {PRESETS.map((size) => (
              <button
                key={size}
                type="button"
                className={panel.action}
                onClick={() => {
                  setValues((current) => ({
                    ...current,
                    width: String(size),
                    height: String(size),
                  }))
                  setErrors((current) => ({
                    ...current,
                    width: undefined,
                    height: undefined,
                  }))
                }}
              >
                {size}×{size}
              </button>
            ))}
          </div>
        </fieldset>

        <div className={styles.fields}>
          {FIELDS.map((field, index) => {
            const inputId = `${id}-${field.name}`
            const errorId = `${inputId}-error`
            const error = errors[field.name]
            return (
              <div key={field.name} className={styles.field}>
                <label htmlFor={inputId} className={styles.label}>
                  {field.label}
                </label>
                <input
                  ref={(element) => {
                    inputs.current[field.name] = element
                  }}
                  id={inputId}
                  className={styles.input}
                  type="number"
                  inputMode="numeric"
                  min={field.min}
                  max={field.max}
                  value={values[field.name]}
                  data-autofocus={index === 0 ? true : undefined}
                  aria-invalid={error ? true : undefined}
                  aria-errormessage={error ? errorId : undefined}
                  aria-describedby={`${id}-hint${error ? ` ${errorId}` : ''}`}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      [field.name]: event.target.value,
                    }))
                  }
                />
                <p id={errorId} className={styles.error}>
                  {error ?? ''}
                </p>
              </div>
            )
          })}
        </div>
        <p id={`${id}-hint`} className={styles.hint}>
          크기는 {LIMITS.minSize}~{LIMITS.maxSize}픽셀, 재생 속도는{' '}
          {LIMITS.minFps}~{LIMITS.maxFps}fps입니다.
        </p>

        <div className={styles.actions}>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button
            type="submit"
            variant="crimson"
            icon="file-new"
            iconPosition="start"
          >
            만들기
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
