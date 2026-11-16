import { afterEach, describe, expect, it, vi } from 'vitest'
import { mountCanvasStage } from './canvas-stage'

describe('mountCanvasStage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('무대가 보일 때만 루프를 돌리고, 정리하면 관찰과 루프를 모두 멈춘다', () => {
    let report: (visible: boolean) => void = () => {}
    const disconnect = vi.fn()
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: IntersectionObserverCallback) {
          report = (visible) =>
            callback(
              [{ isIntersecting: visible } as IntersectionObserverEntry],
              this as unknown as IntersectionObserver,
            )
        }
        observe() {}
        disconnect = disconnect
      },
    )
    const request = vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(7)
    const cancel = vi.spyOn(window, 'cancelAnimationFrame')
    const canvas = document.createElement('canvas')
    const context = {
      setTransform: vi.fn(),
      scale: vi.fn(),
    } as unknown as CanvasRenderingContext2D

    const dispose = mountCanvasStage(canvas, context, {
      visibilityTarget: canvas,
      onFrame: vi.fn(),
    })
    expect(request).not.toHaveBeenCalled()
    report(true)
    expect(request).toHaveBeenCalledTimes(1)
    report(false)
    expect(cancel).toHaveBeenCalledWith(7)
    report(true)
    dispose()
    expect(disconnect).toHaveBeenCalled()
    expect(cancel).toHaveBeenCalledTimes(2)
  })
})
