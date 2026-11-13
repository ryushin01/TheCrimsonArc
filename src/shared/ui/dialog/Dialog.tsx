import { type ReactNode, useEffect, useId, useRef } from 'react'
import { cx } from '@/shared/lib/classnames'
import { Icon } from '../icon'
import styles from './Dialog.module.css'

export interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  description?: ReactNode
  children: ReactNode
  /** 확인·취소만 받는 차단형이면 alertdialog */
  role?: 'dialog' | 'alertdialog'
  tone?: 'light' | 'dark'
  size?: 'md' | 'wide'
}

/**
 * 네이티브 <dialog>와 showModal()로 여는 대화상자.
 * 초점 가두기, Esc 닫기, 배경 비활성화는 브라우저가 맡고, 닫으면 연 버튼으로 초점을 돌려줍니다.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  role = 'dialog',
  tone = 'light',
  size = 'md',
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const opener = useRef<HTMLElement | null>(null)
  // Safari는 마우스로 누른 버튼에 초점을 주지 않아 activeElement가 body로 남습니다.
  // 마지막으로 누른 대화형 요소를 기억해 두었다가 그때는 그 요소로 초점을 돌려줍니다.
  const lastTrigger = useRef<HTMLElement | null>(null)
  const titleId = useId()
  const descriptionId = useId()
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    const remember = (event: MouseEvent) => {
      const target = (event.target as Element | null)?.closest?.(
        'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      if (target instanceof HTMLElement && !ref.current?.contains(target)) {
        lastTrigger.current = target
      }
    }
    document.addEventListener('click', remember, true)
    return () => document.removeEventListener('click', remember, true)
  }, [])

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      const active = document.activeElement
      opener.current =
        active instanceof HTMLElement && active !== document.body
          ? active
          : lastTrigger.current
      dialog.showModal()
      // data-autofocus가 붙은 첫 입력 칸으로 초점을 옮깁니다. (없으면 브라우저 기본: 첫 컨트롤)
      dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    const handleClose = () => {
      onCloseRef.current()
      const target = opener.current
      opener.current = null
      if (target?.isConnected) target.focus()
    }
    dialog.addEventListener('close', handleClose)
    return () => dialog.removeEventListener('close', handleClose)
  }, [])

  return (
    <dialog
      ref={ref}
      role={role === 'alertdialog' ? 'alertdialog' : undefined}
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      className={cx(
        styles.dialog,
        styles[tone],
        size === 'wide' && styles.wide,
      )}
    >
      <div className={styles.panel}>
        <div className={styles.header}>
          <div>
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className={styles.description}>
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            className={styles.close}
            aria-label="닫기"
            onClick={() => ref.current?.close()}
          >
            <Icon name="close" />
          </button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </dialog>
  )
}
