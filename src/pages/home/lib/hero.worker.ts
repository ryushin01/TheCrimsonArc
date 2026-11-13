import { FpsMeter, createFrameLoop } from '@/shared/lib/canvas'
import {
  type HeroMessage,
  type HeroReply,
  HeroRenderer,
  applyHeroMessage,
} from './hero-renderer'

// 첫 화면 캔버스는 OffscreenCanvas로 넘겨받아 Worker에서 그립니다.
// 메인 스레드가 시퀀스·입자·3D로 바빠도 로딩 애니메이션과 빛 효과가 끊기지 않습니다.
let renderer: HeroRenderer | null = null
let visible = true
const meter = new FpsMeter()
let lastReport = 0

const post = (message: HeroReply) => self.postMessage(message)

const loop = createFrameLoop((dt, now) => {
  renderer?.frame(dt)
  meter.tick(now)
  if (now - lastReport > 500) {
    lastReport = now
    post({ type: 'fps', fps: meter.fps, worstMs: meter.worstMs })
  }
})

self.onmessage = (event: MessageEvent<HeroMessage>) => {
  const message = event.data
  if (message.type === 'init') {
    const context = message.canvas.getContext('2d')
    if (!context) return
    renderer = new HeroRenderer(
      message.canvas,
      context,
      () => new OffscreenCanvas(1, 1),
    )
    renderer.setSettings(message.settings)
    renderer.setPaused(message.paused)
    renderer.resize(message.width, message.height, message.dpr)
    loop.start()
    return
  }
  if (message.type === 'visible') {
    visible = message.visible
    if (visible) loop.start()
    else loop.stop()
    return
  }
  if (renderer) applyHeroMessage(renderer, message)
}
