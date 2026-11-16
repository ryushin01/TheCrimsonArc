import {
  type EncodeAnimationInput,
  type EncodeAnimationResult,
  encodeAnimation,
} from '@/shared/lib/gif'
import type { EncodeRequest, EncodeResponse } from './encode.worker'

/** 그만둔 내보내기의 오류 (호출한 쪽에서 error.name === 'AbortError'로 가려냅니다) */
function abortError(): DOMException {
  return new DOMException('내보내기를 그만두었습니다.', 'AbortError')
}

/**
 * GIF를 Web Worker에서 만듭니다. Worker를 쓸 수 없는 환경(테스트 등)에서는 메인 스레드에서 만듭니다.
 * 프레임 버퍼는 Worker로 넘기면서 비워지므로 다시 쓸 버퍼를 넘기지 마세요.
 * signal로 그만두면 Worker를 바로 멈추고 AbortError로 끝납니다. (창을 닫으면 끝까지 돌지 않게)
 */
export function encodeGif(
  input: Omit<EncodeAnimationInput, 'onProgress'>,
  onProgress?: (ratio: number) => void,
  signal?: AbortSignal,
): Promise<EncodeAnimationResult> {
  if (signal?.aborted) return Promise.reject(abortError())

  if (typeof Worker === 'undefined') {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (signal?.aborted) {
          reject(abortError())
          return
        }
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
    const onAbort = () => {
      worker.terminate()
      reject(abortError())
    }
    const finish = () => {
      signal?.removeEventListener('abort', onAbort)
      worker.terminate()
    }
    signal?.addEventListener('abort', onAbort, { once: true })
    worker.onmessage = (event: MessageEvent<EncodeResponse>) => {
      const message = event.data
      if (message.type === 'progress') {
        onProgress?.(message.ratio)
        return
      }
      finish()
      if (message.type === 'done') resolve(message.result)
      else reject(new Error(message.message))
    }
    worker.onerror = (event) => {
      finish()
      reject(new Error(event.message || 'GIF를 만드는 중에 오류가 났습니다.'))
    }
    const request: EncodeRequest = { input }
    worker.postMessage(
      request,
      input.frames.map((frame) => frame.rgba.buffer as ArrayBuffer),
    )
  })
}
