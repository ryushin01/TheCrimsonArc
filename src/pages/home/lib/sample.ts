import { type Artwork, createSampleArtwork } from '@/entities/artwork'

let sample: Artwork | null = null

/** 홍보 페이지의 데모들이 함께 쓰는 샘플 작품 (처음 쓸 때 한 번만 그림) */
export function getSampleArtwork(): Artwork {
  sample ??= createSampleArtwork()
  return sample
}
