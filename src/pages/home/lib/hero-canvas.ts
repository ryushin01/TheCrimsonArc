import {
  type CanvasSize,
  createFrameLoop,
  FpsMeter,
  getDpr,
  observeCanvasSize,
} from '@/shared/lib/canvas'
import { loadStore } from '../model/load-store'
import { tuning, tuningEvents } from '../model/tuning'
import {
  type HeroMessage,
  type HeroReply,
  HeroRenderer,
  applyHeroMessage,
  heroCenter,
  paintTitle,
} from './hero-renderer'

const TITLE_FONT = '"Chakra Petch", "Arial Narrow", sans-serif'

/** 첫 화면 캔버스를 어디서 그리는지와 그 FPS. 디버그 패널이 읽습니다. */
export const heroRuntime = {
  mode: 'none' as 'worker' | 'main' | 'none',
  /** 화면 밖이라 그리기를 쉬는 중인지 */
  resting: false,
  fps: new FpsMeter(),
}

type Outgoing = Exclude<HeroMessage, { type: 'init' }>

export interface HeroCanvasController {
  setPaused(paused: boolean): void
  dispose(): void
}

function supportsOffscreen(canvas: HTMLCanvasElement): boolean {
  return (
    typeof Worker !== 'undefined' &&
    typeof OffscreenCanvas !== 'undefined' &&
    typeof canvas.transferControlToOffscreen === 'function'
  )
}

interface Channel {
  send(message: Outgoing, transfer?: Transferable[]): void
  stop(): void
}

function createCanvas(className: string): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.className = className
  canvas.setAttribute('aria-hidden', 'true')
  return canvas
}

/**
 * host 안에 첫 화면 캔버스를 만들고 그리기를 시작합니다.
 * OffscreenCanvas를 쓸 수 있으면 Worker로 넘기고, 아니면 같은 렌더러를 메인 스레드에서 돌립니다.
 * Worker가 뜨지 못하면(스크립트를 못 받거나 실행 오류) 새 캔버스를 만들어 메인 스레드로 넘어갑니다.
 * transferControlToOffscreen()은 캔버스마다 한 번만 부를 수 있으므로 캔버스를 여기서 새로 만듭니다.
 * (StrictMode가 effect를 두 번 실행해도 안전합니다)
 */
export function mountHeroCanvas(
  host: HTMLElement,
  className: string,
  { paused }: { paused: boolean },
): HeroCanvasController {
  let canvas = createCanvas(className)
  host.prepend(canvas)
  let pausedNow = paused
  let visibleNow = true
  let disposed = false
  let channel: Channel | null = null

  const rect = canvas.getBoundingClientRect()
  let size: CanvasSize = {
    width: Math.max(1, rect.width),
    height: Math.max(1, rect.height),
    dpr: getDpr(tuning.render.maxDpr),
  }
  const send = (message: Outgoing, transfer?: Transferable[]) =>
    channel?.send(message, transfer)

  const startMain = (target: HTMLCanvasElement): Channel | null => {
    const context = target.getContext('2d')
    if (!context) return null
    const renderer = new HeroRenderer(target, context, () =>
      document.createElement('canvas'),
    )
    renderer.setSettings(tuning.hero)
    renderer.setPaused(pausedNow)
    renderer.resize(size.width, size.height, size.dpr)
    const { progress, done } = loadStore.get()
    renderer.setProgress(progress, done)
    const loop = createFrameLoop((dt, now) => {
      renderer.frame(dt)
      heroRuntime.fps.tick(now)
    })
    // 화면 밖에서 시작하면(예: 스크롤한 뒤 Worker가 실패해 넘어온 경우) 보일 때까지 루프를 켜지 않습니다.
    if (visibleNow) loop.start()
    heroRuntime.mode = 'main'
    return {
      send(message) {
        if (message.type === 'visible') {
          if (message.visible) loop.start()
          else loop.stop()
          return
        }
        applyHeroMessage(renderer, message)
      },
      stop: () => loop.stop(),
    }
  }

  const startWorker = (target: HTMLCanvasElement): Channel => {
    const worker = new Worker(new URL('./hero.worker.ts', import.meta.url), {
      type: 'module',
    })
    const offscreen = target.transferControlToOffscreen()
    const init: HeroMessage = {
      type: 'init',
      canvas: offscreen,
      ...size,
      settings: { ...tuning.hero },
      paused: pausedNow,
    }
    worker.postMessage(init, [offscreen])
    worker.onmessage = (event: MessageEvent<HeroReply>) => {
      if (event.data.type === 'fps') {
        heroRuntime.fps.push(event.data.fps, event.data.worstMs)
      }
    }
    worker.onerror = (event) => {
      event.preventDefault()
      fallBackToMain()
    }
    heroRuntime.mode = 'worker'
    return {
      send: (message, transfer = []) => worker.postMessage(message, transfer),
      stop: () => worker.terminate(),
    }
  }

  // 큰 제목은 글꼴이 준비된 뒤 메인 스레드에서 그려 ImageBitmap으로 넘깁니다.
  let titleTimer = 0
  let titleToken = 0
  const makeTitle = async (target: CanvasSize, token: number) => {
    if (typeof createImageBitmap !== 'function') return
    try {
      await document.fonts?.load(`700 100px ${TITLE_FONT}`)
    } catch {
      // 글꼴을 못 받아도 대체 글꼴로 그립니다.
    }
    if (disposed || token !== titleToken) return
    const buffer = document.createElement('canvas')
    buffer.width = Math.max(1, Math.round(target.width * target.dpr))
    buffer.height = Math.max(1, Math.round(target.height * target.dpr))
    const context = buffer.getContext('2d')
    if (!context) return
    context.scale(target.dpr, target.dpr)
    paintTitle(context, target.width, target.height, TITLE_FONT)
    const bitmap = await createImageBitmap(buffer)
    if (disposed || token !== titleToken) {
      bitmap.close()
      return
    }
    send({ type: 'title', bitmap }, [bitmap])
  }
  const scheduleTitle = (target: CanvasSize) => {
    window.clearTimeout(titleTimer)
    const token = ++titleToken
    titleTimer = window.setTimeout(() => void makeTitle(target, token), 120)
  }

  // 캔버스는 hero의 여백(padding)까지 덮으므로 hero가 아니라 캔버스 자신의 크기를 잽니다.
  const watchSize = (target: HTMLCanvasElement) =>
    observeCanvasSize(
      target,
      (next) => {
        size = next
        send({ type: 'resize', ...next })
        scheduleTitle(next)
      },
      () => tuning.render.maxDpr,
    )

  channel = supportsOffscreen(canvas) ? startWorker(canvas) : startMain(canvas)
  if (!channel) {
    canvas.remove()
    return { setPaused() {}, dispose() {} }
  }
  let stopResize = watchSize(canvas)

  function fallBackToMain() {
    if (disposed || heroRuntime.mode === 'main') return
    channel?.stop()
    // 넘겨준 캔버스는 다시 쓸 수 없으므로 새 캔버스로 바꿔 끼웁니다.
    const replacement = createCanvas(className)
    canvas.replaceWith(replacement)
    canvas = replacement
    stopResize()
    channel = startMain(replacement)
    stopResize = watchSize(replacement)
    scheduleTitle(size)
  }

  const sendProgress = () => {
    const { progress, done } = loadStore.get()
    send({ type: 'progress', progress, done })
  }
  sendProgress()
  const stopLoad = loadStore.subscribe(sendProgress)

  const stopTuning = tuningEvents.subscribe(() => {
    send({ type: 'settings', settings: { ...tuning.hero } })
    stopResize.refresh()
  })

  // 빛이 아래쪽 본문 글자 뒤로 내려가 대비를 떨어뜨리지 않도록 높이를 제한합니다.
  const onPointerMove = (event: PointerEvent) => {
    const box = canvas.getBoundingClientRect()
    const { portrait } = heroCenter(box.width, box.height)
    const maxY = box.height * (portrait ? 0.56 : 0.64)
    send({
      type: 'pointer',
      x: event.clientX - box.left,
      y: Math.min(maxY, event.clientY - box.top),
      active: true,
    })
  }
  const onPointerLeave = () =>
    send({ type: 'pointer', x: 0, y: 0, active: false })
  host.addEventListener('pointermove', onPointerMove, { passive: true })
  host.addEventListener('pointerleave', onPointerLeave)
  host.addEventListener('pointercancel', onPointerLeave)

  const visibility = new IntersectionObserver(([entry]) => {
    if (!entry) return
    visibleNow = entry.isIntersecting
    heroRuntime.resting = !entry.isIntersecting
    if (heroRuntime.resting) heroRuntime.fps.push(0)
    send({ type: 'visible', visible: entry.isIntersecting })
  })
  visibility.observe(host)

  return {
    setPaused(next) {
      pausedNow = next
      send({ type: 'paused', paused: next })
    },
    dispose() {
      disposed = true
      window.clearTimeout(titleTimer)
      stopResize()
      stopLoad()
      stopTuning()
      visibility.disconnect()
      host.removeEventListener('pointermove', onPointerMove)
      host.removeEventListener('pointerleave', onPointerLeave)
      host.removeEventListener('pointercancel', onPointerLeave)
      channel?.stop()
      canvas.remove()
      heroRuntime.mode = 'none'
    },
  }
}
