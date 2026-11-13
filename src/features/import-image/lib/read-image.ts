import { LIMITS } from '@/shared/config'
import { formatBytes } from '@/shared/lib/download'
import { GifDecodeError, visitGifFrames } from '@/shared/lib/gif'
import { fitWithin, resizeArea } from '@/shared/lib/pixel'

export interface ImportedImage {
  /** 확장자를 뺀 파일 이름 */
  name: string
  width: number
  height: number
  originalWidth: number
  originalHeight: number
  fps: number
  /** 프레임마다 width×height×4 RGBA */
  frames: Uint8ClampedArray[]
  animated: boolean
}

export class ImageImportError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ImageImportError'
  }
}

const TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
}

export const ACCEPTED_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
] as const
export const ACCEPT_ATTRIBUTE =
  '.png,.jpg,.jpeg,.gif,.webp,image/png,image/jpeg,image/gif,image/webp'
export const ACCEPTED_LABEL = 'PNG · JPG · GIF · WebP'

/** 브라우저가 type을 비워 두는 경우 확장자로 형식을 알아냅니다. */
export function detectType(file: Pick<File, 'name' | 'type'>): string | null {
  if ((ACCEPTED_TYPES as readonly string[]).includes(file.type))
    return file.type
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  return TYPES[extension] ?? null
}

export function baseName(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '') || '이미지'
}

export interface ReadImageOptions {
  /** 가로·세로 최대 크기. 넘으면 비율을 지켜 줄입니다. */
  maxSize?: number
  maxFrames?: number
}

/**
 * 이미지 파일을 열어 편집할 수 있는 RGBA 프레임으로 바꿉니다.
 * 움직이는 GIF는 프레임마다 합성해 읽고, 큰 그림은 maxSize 안으로 줄입니다.
 */
export async function readImageFile(
  file: File,
  {
    maxSize = LIMITS.maxSize,
    maxFrames = LIMITS.maxFrames,
  }: ReadImageOptions = {},
): Promise<ImportedImage> {
  const type = detectType(file)
  if (!type) {
    throw new ImageImportError(
      `‘${file.name}’은(는) 열 수 없는 형식입니다. ${ACCEPTED_LABEL} 이미지를 골라 주세요.`,
    )
  }
  if (file.size > LIMITS.maxFileBytes) {
    throw new ImageImportError(
      `‘${file.name}’이(가) 너무 큽니다(${formatBytes(file.size)}). ${formatBytes(LIMITS.maxFileBytes)} 이하 이미지를 골라 주세요.`,
    )
  }
  const name = baseName(file.name)
  if (type === 'image/gif') return readGif(file, name, maxSize, maxFrames)
  return readBitmap(file, name, maxSize)
}

async function readGif(
  file: File,
  name: string,
  maxSize: number,
  maxFrames: number,
): Promise<ImportedImage> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  if (bytes.length < 10) {
    throw new ImageImportError(
      `‘${file.name}’을(를) 읽지 못했습니다. GIF 파일이 비어 있거나 끊겨 있습니다.`,
    )
  }
  // 헤더에서 크기를 먼저 읽어, 프레임을 풀 때마다 바로 줄입니다. (큰 GIF도 메모리를 적게 씀)
  const original = {
    width: bytes[6] | (bytes[7] << 8),
    height: bytes[8] | (bytes[9] << 8),
  }
  const size = fitWithin(
    original.width || 1,
    original.height || 1,
    maxSize,
    maxSize,
  )
  const sameSize =
    size.width === original.width && size.height === original.height
  const frames: Uint8ClampedArray[] = []
  let totalDelay = 0
  try {
    visitGifFrames(
      bytes,
      ({ rgba, delayMs }) => {
        frames.push(
          sameSize
            ? rgba.slice()
            : resizeArea({ ...original, data: rgba }, size.width, size.height)
                .data,
        )
        totalDelay += delayMs
      },
      { maxFrames, maxDimension: 4096 },
    )
  } catch (error) {
    if (error instanceof GifDecodeError) {
      throw new ImageImportError(
        `‘${file.name}’을(를) 읽지 못했습니다. ${error.message}`,
      )
    }
    throw error
  }
  const averageDelay = totalDelay / Math.max(1, frames.length)
  return {
    name,
    width: size.width,
    height: size.height,
    originalWidth: original.width,
    originalHeight: original.height,
    fps: Math.round(
      Math.min(LIMITS.maxFps, Math.max(LIMITS.minFps, 1000 / averageDelay)),
    ),
    frames,
    animated: frames.length > 1,
  }
}

async function readBitmap(
  file: File,
  name: string,
  maxSize: number,
): Promise<ImportedImage> {
  if (typeof createImageBitmap === 'undefined') {
    throw new ImageImportError(
      '이 브라우저에서는 이미지를 열 수 없습니다. 최신 브라우저에서 다시 시도해 주세요.',
    )
  }
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new ImageImportError(
      `‘${file.name}’을(를) 읽지 못했습니다. 파일이 손상되었는지 확인하고 다른 이미지를 골라 주세요.`,
    )
  }
  const original = { width: bitmap.width, height: bitmap.height }
  const size = fitWithin(original.width, original.height, maxSize, maxSize)
  const canvas = document.createElement('canvas')
  canvas.width = size.width
  canvas.height = size.height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) {
    bitmap.close()
    throw new ImageImportError('이 브라우저에서는 이미지를 열 수 없습니다.')
  }
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(bitmap, 0, 0, size.width, size.height)
  bitmap.close()
  const { data } = context.getImageData(0, 0, size.width, size.height)
  return {
    name,
    width: size.width,
    height: size.height,
    originalWidth: original.width,
    originalHeight: original.height,
    fps: 12,
    frames: [data],
    animated: false,
  }
}
