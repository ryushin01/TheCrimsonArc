export interface PreloadOptions {
  /** 한 번에 받을 수 (브라우저의 같은 출처 연결 수에 맞춤) */
  concurrency?: number
  signal?: AbortSignal
  /** 하나를 받을 때마다 (실패도 셉니다) */
  onProgress?: (done: number, total: number) => void
  /** 하나를 받아 디코딩까지 끝냈을 때 (실패하면 부르지 않습니다) */
  onImage?: (image: HTMLImageElement, index: number) => void
}

/** 이미지를 받아 디코딩까지 끝냅니다. 실패하면 null. */
export async function loadImage(
  url: string,
  signal?: AbortSignal,
): Promise<HTMLImageElement | null> {
  if (signal?.aborted) return null
  const image = new Image()
  image.decoding = 'async'
  const abort = () => {
    image.src = ''
  }
  signal?.addEventListener('abort', abort, { once: true })
  image.src = url
  try {
    // decode()까지 기다려야 첫 drawImage에서 디코딩하느라 프레임이 끊기지 않습니다.
    await image.decode()
    return signal?.aborted ? null : image
  } catch {
    return null
  } finally {
    signal?.removeEventListener('abort', abort)
  }
}

/**
 * 여러 이미지를 concurrency개씩 나눠 받고, 받을 때마다 진행률을 알립니다.
 * 결과는 urls와 같은 순서이며, 실패하거나 취소된 자리는 null입니다.
 */
export async function preloadImages(
  urls: readonly string[],
  { concurrency = 6, signal, onProgress, onImage }: PreloadOptions = {},
): Promise<(HTMLImageElement | null)[]> {
  const results: (HTMLImageElement | null)[] = urls.map(() => null)
  let next = 0
  let done = 0

  const worker = async () => {
    while (next < urls.length && !signal?.aborted) {
      const index = next++
      const image = await loadImage(urls[index]!, signal)
      results[index] = image
      done += 1
      if (image) onImage?.(image, index)
      if (!signal?.aborted) onProgress?.(done, urls.length)
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.max(1, Math.min(concurrency, urls.length)) },
      worker,
    ),
  )
  return results
}
