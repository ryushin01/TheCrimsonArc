import {
  EXPLODE_START,
  SEQUENCE_FRAMES,
  type SequenceFormat,
  type SequenceSize,
  sequenceFrameUrl,
  sequenceSource,
} from '@/entities/watch'
import { getDpr } from '@/shared/lib/canvas'
import { smoothstep } from '@/shared/lib/math'
import { preloadImages, supportsAvif } from '@/shared/lib/preload'
import { loadStore } from '../model/load-store'

/** 처음에 받는 핵심 프레임 간격 (2의 거듭제곱). 나머지는 시퀀스 구간에서 스크롤을 시작하면 받습니다. */
export const KEY_FRAME_STEP = 8
/** 이 시간이 지나도 다 못 받으면 첫 화면은 그대로 열고 나머지는 계속 받습니다. */
export const LOAD_TIMEOUT_MS = 12_000

/** 0, 4, 8, … 과 마지막 프레임 */
export function keyFrameIndices(
  total = SEQUENCE_FRAMES,
  step = KEY_FRAME_STEP,
): number[] {
  const indices: number[] = []
  for (let i = 0; i < total; i += step) indices.push(i)
  if (indices[indices.length - 1] !== total - 1) indices.push(total - 1)
  return indices
}

/**
 * 핵심 프레임을 뺀 나머지를 받을 순서. 간격을 반씩 좁혀(8 → 4 → 2 → 1) 받으므로,
 * 다 받기 전에도 시퀀스 전체가 고르게 촘촘해집니다.
 */
export function restFrameIndices(
  total = SEQUENCE_FRAMES,
  step = KEY_FRAME_STEP,
): number[] {
  const seen = new Set(keyFrameIndices(total, step))
  const order: number[] = []
  for (let gap = Math.floor(step / 2); gap >= 1; gap = Math.floor(gap / 2)) {
    for (let i = 0; i < total; i += gap) {
      if (seen.has(i)) continue
      seen.add(i)
      order.push(i)
    }
  }
  return order
}

/**
 * 시퀀스를 그릴 정사각형 한 변(CSS px). 가로 화면은 높이에 맞춥니다.
 * 세로 화면은 시계가 작아 보이지 않게 폭보다 크게 그리되, 부품이 양옆으로 펼쳐지는 분해 구간에서는 폭에 맞게 줄입니다.
 */
export function sequenceDrawSize(
  width: number,
  height: number,
  progress = 0,
): number {
  if (width > height) return height
  const spread = smoothstep(
    EXPLODE_START - 0.02,
    EXPLODE_START + 0.12,
    progress,
  )
  return Math.min(height, width * (1.28 - spread * 0.3))
}

type Listener = (index: number) => void

/**
 * 스크롤 시퀀스 프레임을 받아 둡니다.
 * 1단계: 핵심 프레임과 제목 글꼴을 받으며 loadStore에 진행률을 남깁니다. (첫 화면 로딩 애니메이션)
 * 2단계: 시퀀스 구간에 다가가면 나머지 프레임을 받아 사이를 채웁니다.
 */
export class SequenceFrames {
  readonly frames: (HTMLImageElement | null)[]
  size: SequenceSize = 'lg'
  format: SequenceFormat = 'webp'
  private stage: 'idle' | 'keys' | 'ready' = 'idle'
  private restStarted = false
  private restRequested = false
  private readonly listeners = new Set<Listener>()
  private readonly controller = new AbortController()

  constructor(private readonly total = SEQUENCE_FRAMES) {
    this.frames = Array.from({ length: total }, () => null)
  }

  get loadedCount(): number {
    return this.frames.filter(Boolean).length
  }

  /** 프레임이 하나 들어올 때마다 알립니다. */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  async start(extra: readonly Promise<unknown>[] = []): Promise<void> {
    if (this.stage !== 'idle') return
    this.stage = 'keys'
    const source = sequenceSource(
      await supportsAvif(),
      sequenceDrawSize(window.innerWidth, window.innerHeight),
      getDpr(2),
    )
    this.size = source.size
    this.format = source.format
    const keys = keyFrameIndices(this.total)
    const units = keys.length + extra.length
    let done = 0
    const tick = () => {
      done += 1
      if (this.stage === 'keys') loadStore.set({ progress: done / units })
    }
    const timeout = window.setTimeout(() => this.finishKeys(), LOAD_TIMEOUT_MS)
    await Promise.all([
      preloadImages(
        keys.map((index) => sequenceFrameUrl(index, this.size, this.format)),
        {
          concurrency: 6,
          signal: this.controller.signal,
          onImage: (image, order) => this.put(keys[order]!, image),
          onProgress: tick,
        },
      ),
      ...extra.map((task) => task.then(tick, tick)),
    ])
    window.clearTimeout(timeout)
    this.finishKeys()
  }

  /**
   * 스크롤을 시작하면 부릅니다. 핵심 프레임을 받는 중이면 끝난 뒤 이어서 받습니다.
   * 핵심 프레임 가운데 받지 못한 것도 여기서 한 번 더 받아 빈틈이 남지 않게 합니다.
   */
  loadRest(): void {
    this.restRequested = true
    if (this.stage !== 'ready' || this.restStarted) return
    this.restStarted = true
    const missingKeys = keyFrameIndices(this.total).filter(
      (index) => !this.frames[index],
    )
    const rest = [...missingKeys, ...restFrameIndices(this.total)].filter(
      (index) => !this.frames[index],
    )
    void preloadImages(
      rest.map((index) => sequenceFrameUrl(index, this.size, this.format)),
      {
        concurrency: 6,
        signal: this.controller.signal,
        onImage: (image, order) => this.put(rest[order]!, image),
      },
    )
  }

  dispose(): void {
    this.controller.abort()
    this.listeners.clear()
  }

  private finishKeys(): void {
    if (this.stage !== 'keys') return
    this.stage = 'ready'
    loadStore.set({ progress: 1, done: true })
    if (this.restRequested) this.loadRest()
  }

  private put(index: number, image: HTMLImageElement): void {
    this.frames[index] = image
    for (const listener of this.listeners) listener(index)
  }
}

/** 페이지에 하나만 둡니다. (첫 화면 로딩, 시퀀스, 입자 실루엣이 함께 씁니다) */
export const sequenceFrames = new SequenceFrames()
