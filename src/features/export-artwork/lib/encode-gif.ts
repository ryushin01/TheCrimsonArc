import {
  type EncodeAnimationInput,
  type EncodeAnimationResult,
  encodeAnimation,
} from '@/shared/lib/gif'
import type { EncodeRequest, EncodeResponse } from './encode.worker'

/**
 * GIF를 Web Worker에서 만듭니다. Worker를 쓸 수 없는 환경(테스트 등)에서는 메인 스레드에서 만듭니다.
 * 프레임 버퍼는 Worker로 넘기면서 비워지므로 다시 쓸 버퍼를 넘기지 마세요.
 */
export function encodeGif(
  input: Omit<EncodeAnimationInput, 'onProgress'>,
  onProgress?: (ratio: number) => void,
): Promise<EncodeAnimationResult> {
  if (typeof Worker === 'undefined') {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          resolve(encodeAnimation({ ...input, onProgress }))
        } catch (error) {
          reject(error)
        }
      }, 0)
    })
  }

  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./encode.worker.ts', import.meta.url), {
      type: 'module',
    })
    worker.onmessage = (event: MessageEvent<EncodeResponse>) => {
      const message = event.data
      if (message.type === 'progress') {
        onProgress?.(message.ratio)
        return
      }
      worker.terminate()
      if (message.type === 'done') resolve(message.result)
      else reject(new Error(message.message))
    }
    worker.onerror = (event) => {
      worker.terminate()
      reject(new Error(event.message || 'GIF를 만드는 중에 오류가 났습니다.'))
    }
    const request: EncodeRequest = { input }
    worker.postMessage(
      request,
      input.frames.map((frame) => frame.rgba.buffer as ArrayBuffer),
    )
  })
}
