import { ExportPanel } from '@/features/export-artwork'
import { Dialog } from '@/shared/ui/dialog'
import { useStudio } from '../model/use-studio'

export interface ExportDialogProps {
  open: boolean
  onClose: () => void
}

export function ExportDialog({ open, onClose }: ExportDialogProps) {
  const artwork = useStudio((state) => state.artwork)
  const frameId = useStudio((state) => state.activeFrameId)
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="내보내기"
      description="GIF 애니메이션, 지금 프레임 PNG, 모든 프레임을 이은 스프라이트 시트 PNG로 내려받습니다. 숨긴 레이어는 빠집니다."
      tone="dark"
      size="wide"
    >
      {open ? (
        <ExportPanel
          artwork={artwork}
          frameId={frameId}
          formats={['gif', 'png', 'sheet']}
          defaultScale={4}
          fileName="crimson-arc-studio"
          tone="dark"
        />
      ) : null}
    </Dialog>
  )
}
