import { useMemo } from 'react'
import { getFrameComposite } from '../model/composite-cache'
import type { Artwork } from '../model/types'
import { PixelCanvas } from './PixelCanvas'

export interface FrameThumbnailProps {
  artwork: Artwork
  frameId: string
  className?: string
}

/** 프레임 하나를 합성한 작은 미리보기 (꾸밈용, 이름은 감싼 요소가 붙입니다) */
export function FrameThumbnail({
  artwork,
  frameId,
  className,
}: FrameThumbnailProps) {
  const data = useMemo(
    () => getFrameComposite(artwork, frameId),
    [artwork, frameId],
  )
  return (
    <PixelCanvas
      data={data}
      width={artwork.width}
      height={artwork.height}
      checkerboard
      className={className}
    />
  )
}
