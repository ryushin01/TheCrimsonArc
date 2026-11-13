import { type DragEvent, type ReactNode, useId, useRef, useState } from 'react'
import { cx } from '@/shared/lib/classnames'
import { Button } from '@/shared/ui/button'
import { Icon } from '@/shared/ui/icon'
import { ACCEPTED_LABEL, ACCEPT_ATTRIBUTE } from '../lib/read-image'
import styles from './ImageDropzone.module.css'

export interface ImageDropzoneProps {
  onFile: (file: File) => void
  busy?: boolean
  /** 읽기 실패 안내 (원인과 고치는 방법) */
  error?: string | null
  tone?: 'light' | 'dark'
  title?: string
  hint?: string
  buttonLabel?: string
  /** 파일 고르기 옆에 둘 버튼 */
  children?: ReactNode
  className?: string
}

/** 이미지 파일을 끌어다 놓거나 버튼으로 고르는 영역 */
export function ImageDropzone({
  onFile,
  busy = false,
  error = null,
  tone = 'light',
  title = '이미지를 여기에 끌어다 놓으세요',
  hint = `${ACCEPTED_LABEL}, 15 MB 이하`,
  buttonLabel = '파일 고르기',
  children,
  className,
}: ImageDropzoneProps) {
  const input = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const hintId = useId()

  const take = (files: FileList | null | undefined) => {
    const file = files?.[0]
    if (file && !busy) onFile(file)
  }

  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!event.dataTransfer.types.includes('Files')) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
    setDragging(true)
  }

  const onDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null))
      setDragging(false)
  }

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    take(event.dataTransfer.files)
  }

  return (
    // 끌어다 놓기는 마우스 전용 보조 수단이고, 키보드로는 '파일 고르기' 버튼을 씁니다.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      className={cx(styles.zone, styles[tone], className)}
      data-dragging={dragging}
      onDragEnter={onDragOver}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <Icon name="upload" size={28} className={styles.icon} />
      <p className={styles.title}>{title}</p>
      <p id={hintId} className={styles.hint}>
        {hint}
      </p>
      <div className={styles.actions}>
        <Button
          variant={tone === 'dark' ? 'light' : 'solid'}
          size="sm"
          icon="image"
          iconPosition="start"
          disabled={busy}
          aria-describedby={hintId}
          onClick={() => input.current?.click()}
        >
          {busy ? '여는 중…' : buttonLabel}
        </Button>
        {children}
      </div>
      <input
        ref={input}
        type="file"
        accept={ACCEPT_ATTRIBUTE}
        hidden
        onChange={(event) => {
          take(event.target.files)
          // 같은 파일을 다시 골라도 change가 일어나도록 비웁니다.
          event.target.value = ''
        }}
      />
      <p role="alert" className={styles.error}>
        {error ?? ''}
      </p>
    </div>
  )
}
