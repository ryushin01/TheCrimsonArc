import { useCallback, useEffect, useState } from 'react'
import { createArtwork } from '@/entities/artwork'
import {
  HANDOFF_PARAM,
  importedToArtwork,
  placeImageAsLayer,
  readImageFile,
  receiveHandedOffImage,
} from '@/features/import-image'
import { EDITOR_SECTIONS, ROUTES, sectionNav } from '@/shared/config'
import { SiteHeader } from '@/widgets/site-header'
import {
  useHistoryShortcuts,
  useLeaveGuard,
  usePlayback,
} from '../lib/use-studio-effects'
import type { StudioStore } from '../model/studio-store'
import { useStudio, useStudioStore } from '../model/use-studio'
import { CanvasView } from './CanvasView'
import { ExportDialog } from './ExportDialog'
import { LayersPanel } from './LayersPanel'
import { NewArtworkDialog } from './NewArtworkDialog'
import { StudioProvider } from './StudioProvider'
import styles from './StudioPage.module.css'
import { Timeline } from './Timeline'
import { ToolPanel } from './ToolPanel'
import { Toolbar } from './Toolbar'

function Announcer() {
  const message = useStudio((state) => state.message)
  const messageId = useStudio((state) => state.messageId)
  // 같은 문장이 이어져도 다시 읽히도록 보이지 않는 글자를 번갈아 붙입니다.
  return (
    <p role="status" className="visually-hidden">
      {message ? `${message}${messageId % 2 ? '​' : ''}` : ''}
    </p>
  )
}

function StatusBar() {
  const artwork = useStudio((state) => state.artwork)
  const frameIndex = useStudio((state) =>
    state.artwork.frames.findIndex((frame) => frame.id === state.activeFrameId),
  )
  const layer = useStudio((state) =>
    state.artwork.layers.find((item) => item.id === state.activeLayerId),
  )
  const past = useStudio((state) => state.past.length)
  return (
    <p className={styles.status}>
      <span>
        {artwork.width}×{artwork.height}px
      </span>
      <span>
        프레임 {frameIndex + 1}/{artwork.frames.length}
      </span>
      <span>레이어 ‘{layer?.name}’</span>
      <span>되돌리기 {past}단계</span>
      <span>작업은 이 브라우저에만 있습니다. 떠나기 전에 내보내세요.</span>
    </p>
  )
}

function StudioScreen() {
  const store: StudioStore = useStudioStore()
  const [newOpen, setNewOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  usePlayback(store)
  useHistoryShortcuts(store)
  useLeaveGuard()

  const importFile = useCallback(
    async (file: File, mode: 'open' | 'layer', origin = '') => {
      setBusy(true)
      setError(null)
      try {
        const image = await readImageFile(file)
        const resized =
          image.width !== image.originalWidth
            ? ` (원본 ${image.originalWidth}×${image.originalHeight}에서 줄임)`
            : ''
        if (mode === 'open') {
          store.replaceArtwork(
            importedToArtwork(image),
            `${origin}‘${file.name}’을(를) 열었습니다. ${image.width}×${image.height}${resized}, 프레임 ${image.frames.length}장.`,
          )
          return
        }
        const state = store.get()
        const result = placeImageAsLayer(
          state.artwork,
          image,
          state.activeFrameId,
        )
        if (!result.layerId) {
          setError(
            '레이어가 가득 찼습니다. 레이어를 하나 지운 뒤 다시 가져와 주세요.',
          )
          return
        }
        store.commit(result.artwork, {
          message: `‘${file.name}’을(를) 새 레이어로 놓았습니다${resized}. 프레임 ${result.placedFrames}장에 들어갔습니다.`,
        })
        store.selectLayer(result.layerId)
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : String(reason))
      } finally {
        setBusy(false)
      }
    },
    [store],
  )

  // 홍보 페이지의 '스튜디오에서 이어 그리기'로 넘어온 이미지를 엽니다.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (!params.has(HANDOFF_PARAM)) return
    params.delete(HANDOFF_PARAM)
    const query = params.toString()
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${query ? `?${query}` : ''}`,
    )
    void receiveHandedOffImage().then((file) => {
      if (file) void importFile(file, 'open', '홍보 페이지에서 넘긴 ')
      else
        store.announce('넘겨받은 이미지가 없습니다. [열기]로 직접 열어 주세요.')
    })
  }, [importFile, store])

  return (
    <>
      <SiteHeader
        page="studio"
        dark
        nav={sectionNav(EDITOR_SECTIONS, ROUTES.editor)}
        cta={{
          href: ROUTES.studio,
          label: 'Studio',
          title: '스튜디오',
          current: true,
        }}
      />
      <main id="main" className={styles.studio}>
        <Toolbar
          busy={busy}
          error={error}
          onNew={() => setNewOpen(true)}
          onOpenFile={(file) => void importFile(file, 'open')}
          onPlaceFile={(file) => void importFile(file, 'layer')}
          onExport={() => setExportOpen(true)}
        />
        <div className={styles.workspace}>
          <ToolPanel />
          <CanvasView onDropFile={(file) => void importFile(file, 'layer')} />
          <LayersPanel />
        </div>
        <Timeline />
        <StatusBar />
        <Announcer />
      </main>
      <NewArtworkDialog
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onCreate={({ width, height, fps }) => {
          store.replaceArtwork(
            createArtwork({ width, height, fps }),
            `${width}×${height} 새 작품을 만들었습니다. 되돌리기로 이전 작품을 되찾을 수 있습니다.`,
          )
          setNewOpen(false)
        }}
      />
      <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} />
    </>
  )
}

export function StudioPage() {
  return (
    <StudioProvider>
      <StudioScreen />
    </StudioProvider>
  )
}
