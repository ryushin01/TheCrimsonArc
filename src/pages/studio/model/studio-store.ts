import {
  type Artwork,
  type Layer,
  addFrame,
  addLayer,
  duplicateFrame,
  duplicateLayer,
  findFrameIndex,
  findLayerIndex,
  moveFrame,
  moveLayer,
  removeFrame,
  removeLayer,
  setFps,
  updateLayer,
} from '@/entities/artwork'
import { LIMITS } from '@/shared/config'

export type Tool = 'pen' | 'eraser' | 'fill' | 'picker'

export interface StudioState {
  artwork: Artwork
  past: readonly Artwork[]
  future: readonly Artwork[]
  activeLayerId: string
  activeFrameId: string
  tool: Tool
  /** '#rrggbb' */
  color: string
  brushSize: number
  playing: boolean
  onionSkin: boolean
  grid: boolean
  /** 불러온 뒤 바꾼 것이 있는지 (떠날 때 확인용) */
  dirty: boolean
  /** 화면 낭독기에 알릴 마지막 메시지 */
  message: string
  /** 같은 메시지도 다시 알리도록 바뀌는 번호 */
  messageId: number
}

export interface CommitOptions {
  message?: string
  /** 같은 키로 이어지는 변경(슬라이더 끌기, 이름 입력)은 되돌리기 한 번으로 묶습니다. */
  coalesce?: string
}

type Listener = () => void

function pickNear<T extends { id: string }>(
  list: readonly T[],
  id: string,
  previous: readonly T[],
): string {
  if (list.some((item) => item.id === id)) return id
  const oldIndex = previous.findIndex((item) => item.id === id)
  const index = Math.max(
    0,
    Math.min(list.length - 1, oldIndex === -1 ? 0 : oldIndex),
  )
  return list[index].id
}

export interface StudioStore {
  get(): StudioState
  subscribe(listener: Listener): () => void
  commit(next: Artwork, options?: CommitOptions): void
  replaceArtwork(next: Artwork, message: string): void
  undo(): void
  redo(): void
  announce(message: string): void
  setTool(tool: Tool): void
  setColor(color: string): void
  setBrushSize(size: number): void
  setOnionSkin(on: boolean): void
  setGrid(on: boolean): void
  setPlaying(playing: boolean): void
  selectLayer(layerId: string): void
  selectFrame(frameId: string): void
  stepFrame(delta: number): void
  addLayer(): void
  duplicateLayer(): void
  removeLayer(): void
  moveLayer(delta: 1 | -1): void
  updateLayer(
    layerId: string,
    patch: Partial<Omit<Layer, 'id'>>,
    coalesce?: string,
  ): void
  addFrame(): void
  duplicateFrame(): void
  removeFrame(): void
  moveFrame(delta: 1 | -1): void
  setFps(fps: number): void
  markSaved(): void
}

export function createStudioStore(
  artwork: Artwork,
  initial: Partial<
    Pick<StudioState, 'activeLayerId' | 'activeFrameId' | 'color' | 'tool'>
  > = {},
): StudioStore {
  let state: StudioState = {
    artwork,
    past: [],
    future: [],
    activeLayerId:
      initial.activeLayerId ?? artwork.layers[artwork.layers.length - 1].id,
    activeFrameId: initial.activeFrameId ?? artwork.frames[0].id,
    tool: initial.tool ?? 'pen',
    color: initial.color ?? '#d23350',
    brushSize: 1,
    playing: false,
    onionSkin: true,
    grid: true,
    dirty: false,
    message: '',
    messageId: 0,
  }
  let lastCoalesce: string | null = null
  const listeners = new Set<Listener>()

  const set = (patch: Partial<StudioState>) => {
    state = { ...state, ...patch }
    for (const listener of listeners) listener()
  }

  const withMessage = (message?: string): Partial<StudioState> =>
    message ? { message, messageId: state.messageId + 1 } : {}

  const store: StudioStore = {
    get: () => state,
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },

    commit(next, { message, coalesce } = {}) {
      if (next === state.artwork) {
        if (message) set(withMessage(message))
        return
      }
      const merge = coalesce !== undefined && coalesce === lastCoalesce
      lastCoalesce = coalesce ?? null
      const past = merge
        ? state.past
        : [...state.past, state.artwork].slice(-LIMITS.historyDepth)
      set({
        artwork: next,
        past,
        future: [],
        dirty: true,
        activeLayerId: pickNear(
          next.layers,
          state.activeLayerId,
          state.artwork.layers,
        ),
        activeFrameId: pickNear(
          next.frames,
          state.activeFrameId,
          state.artwork.frames,
        ),
        ...withMessage(message),
      })
    },

    replaceArtwork(next, message) {
      lastCoalesce = null
      set({
        artwork: next,
        past: [...state.past, state.artwork].slice(-LIMITS.historyDepth),
        future: [],
        dirty: true,
        playing: false,
        activeLayerId: next.layers[next.layers.length - 1].id,
        activeFrameId: next.frames[0].id,
        ...withMessage(message),
      })
    },

    undo() {
      const previous = state.past.at(-1)
      if (!previous) {
        set(withMessage('더 되돌릴 것이 없습니다.'))
        return
      }
      lastCoalesce = null
      set({
        artwork: previous,
        past: state.past.slice(0, -1),
        future: [state.artwork, ...state.future],
        dirty: true,
        activeLayerId: pickNear(
          previous.layers,
          state.activeLayerId,
          state.artwork.layers,
        ),
        activeFrameId: pickNear(
          previous.frames,
          state.activeFrameId,
          state.artwork.frames,
        ),
        ...withMessage('되돌렸습니다.'),
      })
    },

    redo() {
      const next = state.future[0]
      if (!next) {
        set(withMessage('다시 할 것이 없습니다.'))
        return
      }
      lastCoalesce = null
      set({
        artwork: next,
        past: [...state.past, state.artwork],
        future: state.future.slice(1),
        dirty: true,
        activeLayerId: pickNear(
          next.layers,
          state.activeLayerId,
          state.artwork.layers,
        ),
        activeFrameId: pickNear(
          next.frames,
          state.activeFrameId,
          state.artwork.frames,
        ),
        ...withMessage('다시 했습니다.'),
      })
    },

    announce(message) {
      set(withMessage(message))
    },

    setTool(tool) {
      set({ tool })
    },
    setColor(color) {
      set({ color })
    },
    setBrushSize(size) {
      set({ brushSize: Math.max(1, Math.min(8, Math.round(size))) })
    },
    setOnionSkin(onionSkin) {
      set({ onionSkin })
    },
    setGrid(grid) {
      set({ grid })
    },
    setPlaying(playing) {
      set({ playing })
    },

    selectLayer(activeLayerId) {
      if (findLayerIndex(state.artwork, activeLayerId) !== -1)
        set({ activeLayerId })
    },
    selectFrame(activeFrameId) {
      if (findFrameIndex(state.artwork, activeFrameId) !== -1)
        set({ activeFrameId })
    },
    stepFrame(delta) {
      const frames = state.artwork.frames
      const index = findFrameIndex(state.artwork, state.activeFrameId)
      const next = (index + delta + frames.length) % frames.length
      set({ activeFrameId: frames[next].id })
    },

    addLayer() {
      const index = findLayerIndex(state.artwork, state.activeLayerId) + 1
      const result = addLayer(state.artwork, { index })
      if (!result.layerId) {
        store.announce(`레이어는 ${LIMITS.maxLayers}장까지 만들 수 있습니다.`)
        return
      }
      const name = result.artwork.layers[index].name
      store.commit(result.artwork, {
        message: `‘${name}’ 레이어를 더했습니다.`,
      })
      set({ activeLayerId: result.layerId })
    },
    duplicateLayer() {
      const result = duplicateLayer(state.artwork, state.activeLayerId)
      if (!result.layerId) {
        store.announce(`레이어는 ${LIMITS.maxLayers}장까지 만들 수 있습니다.`)
        return
      }
      store.commit(result.artwork, { message: '레이어를 복제했습니다.' })
      set({ activeLayerId: result.layerId })
    },
    removeLayer() {
      if (state.artwork.layers.length <= 1) {
        store.announce('마지막 레이어는 지울 수 없습니다.')
        return
      }
      const layer =
        state.artwork.layers[findLayerIndex(state.artwork, state.activeLayerId)]
      store.commit(removeLayer(state.artwork, state.activeLayerId), {
        message: `‘${layer.name}’ 레이어를 지웠습니다. 되돌리기로 되찾을 수 있습니다.`,
      })
    },
    moveLayer(delta) {
      const next = moveLayer(state.artwork, state.activeLayerId, delta)
      store.commit(next, {
        message:
          next === state.artwork
            ? undefined
            : delta > 0
              ? '레이어를 위로 옮겼습니다.'
              : '레이어를 아래로 옮겼습니다.',
      })
    },
    updateLayer(layerId, patch, coalesce) {
      store.commit(updateLayer(state.artwork, layerId, patch), { coalesce })
    },

    addFrame() {
      const result = addFrame(state.artwork, state.activeFrameId)
      if (!result.frameId) {
        store.announce(`프레임은 ${LIMITS.maxFrames}장까지 만들 수 있습니다.`)
        return
      }
      store.commit(result.artwork, { message: '빈 프레임을 더했습니다.' })
      set({ activeFrameId: result.frameId })
    },
    duplicateFrame() {
      const result = duplicateFrame(state.artwork, state.activeFrameId)
      if (!result.frameId) {
        store.announce(`프레임은 ${LIMITS.maxFrames}장까지 만들 수 있습니다.`)
        return
      }
      store.commit(result.artwork, { message: '프레임을 복제했습니다.' })
      set({ activeFrameId: result.frameId })
    },
    removeFrame() {
      if (state.artwork.frames.length <= 1) {
        store.announce('마지막 프레임은 지울 수 없습니다.')
        return
      }
      const index = findFrameIndex(state.artwork, state.activeFrameId)
      store.commit(removeFrame(state.artwork, state.activeFrameId), {
        message: `${index + 1}번 프레임을 지웠습니다. 되돌리기로 되찾을 수 있습니다.`,
      })
    },
    moveFrame(delta) {
      const next = moveFrame(state.artwork, state.activeFrameId, delta)
      store.commit(next, {
        message:
          next === state.artwork
            ? undefined
            : delta > 0
              ? '프레임을 뒤로 옮겼습니다.'
              : '프레임을 앞으로 옮겼습니다.',
      })
    },
    setFps(fps) {
      store.commit(setFps(state.artwork, fps), { coalesce: 'fps' })
    },

    markSaved() {
      set({ dirty: false })
    },
  }
  return store
}
