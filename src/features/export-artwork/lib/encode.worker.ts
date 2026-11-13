import { type EncodeAnimationInput, encodeAnimation } from '@/shared/lib/gif'

export interface EncodeRequest {
  input: Omit<EncodeAnimationInput, 'onProgress'>
}

export type EncodeResponse =
  | { type: 'progress'; ratio: number }
  | { type: 'done'; result: ReturnType<typeof encodeAnimation> }
  | { type: 'error'; message: string }

// 화면이 멈추지 않도록 GIF 압축은 Web Worker에서 합니다.
self.onmessage = (event: MessageEvent<EncodeRequest>) => {
  const post = (message: EncodeResponse, transfer: Transferable[] = []) =>
    self.postMessage(message, { transfer })
  try {
    const result = encodeAnimation({
      ...event.data.input,
      onProgress: (ratio) => post({ type: 'progress', ratio }),
    })
    post({ type: 'done', result }, [result.bytes.buffer])
  } catch (error) {
    post({
      type: 'error',
      message: error instanceof Error ? error.message : String(error),
    })
  }
}
