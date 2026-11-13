import { useRef } from 'react'
import { ACCEPT_ATTRIBUTE } from '@/features/import-image'
import { Button } from '@/shared/ui/button'
import { Icon } from '@/shared/ui/icon'
import { useStudio, useStudioStore } from '../model/use-studio'
import panel from './Panel.module.css'
import styles from './Toolbar.module.css'

export interface ToolbarProps {
  busy: boolean
  /** 열기·가져오기 실패 안내 (원인과 방법) */
  error: string | null
  onNew: () => void
  onOpenFile: (file: File) => void
  onPlaceFile: (file: File) => void
  onExport: () => void
}

export function Toolbar({
  busy,
  error,
  onNew,
  onOpenFile,
  onPlaceFile,
  onExport,
}: ToolbarProps) {
  const store = useStudioStore()
  const artwork = useStudio((state) => state.artwork)
  const canUndo = useStudio((state) => state.past.length > 0)
  const canRedo = useStudio((state) => state.future.length > 0)
  const openInput = useRef<HTMLInputElement>(null)
  const placeInput = useRef<HTMLInputElement>(null)

  const take = (input: HTMLInputElement, handler: (file: File) => void) => {
    const file = input.files?.[0]
    input.value = ''
    if (file) handler(file)
  }

  return (
    <div className={styles.toolbar}>
      <div className={styles.heading}>
        <h1 className={styles.title} lang="en">
          Studio
        </h1>
        <p className={styles.meta}>
          {artwork.width}×{artwork.height} · {artwork.fps}fps · 레이어{' '}
          {artwork.layers.length} · 프레임 {artwork.frames.length}
        </p>
      </div>
      <div className={styles.actions}>
        <button type="button" className={panel.action} onClick={onNew}>
          <Icon name="file-new" size={16} />
          새로 만들기
        </button>
        <button
          type="button"
          className={panel.action}
          disabled={busy}
          onClick={() => openInput.current?.click()}
        >
          <Icon name="upload" size={16} />
          열기
        </button>
        <button
          type="button"
          className={panel.action}
          disabled={busy}
          onClick={() => placeInput.current?.click()}
        >
          <Icon name="image" size={16} />
          레이어로 가져오기
        </button>
        <button
          type="button"
          className={panel.action}
          disabled={!canUndo}
          onClick={() => store.undo()}
        >
          <Icon name="undo" size={16} />
          되돌리기
        </button>
        <button
          type="button"
          className={panel.action}
          disabled={!canRedo}
          onClick={() => store.redo()}
        >
          <Icon name="redo" size={16} />
          다시 하기
        </button>
        <Button
          size="sm"
          variant="crimson"
          icon="download"
          iconPosition="start"
          onClick={onExport}
        >
          내보내기
        </Button>
      </div>
      <input
        ref={openInput}
        type="file"
        accept={ACCEPT_ATTRIBUTE}
        hidden
        onChange={(event) => take(event.target, onOpenFile)}
      />
      <input
        ref={placeInput}
        type="file"
        accept={ACCEPT_ATTRIBUTE}
        hidden
        onChange={(event) => take(event.target, onPlaceFile)}
      />
      <p role="alert" className={styles.error}>
        {error ?? ''}
      </p>
    </div>
  )
}
