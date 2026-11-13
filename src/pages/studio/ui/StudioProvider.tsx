import { type ReactNode, useState } from 'react'
import { type Artwork, addLayer, createSampleArtwork } from '@/entities/artwork'
import { type StudioStore, createStudioStore } from '../model/studio-store'
import { StudioContext } from '../model/use-studio'

/** 샘플 작품 위에 빈 '내 그림' 레이어를 얹어, 샘플을 망치지 않고 바로 그릴 수 있게 시작합니다. */
export function createInitialStore(artwork?: Artwork): StudioStore {
  if (artwork) return createStudioStore(artwork)
  const sample = createSampleArtwork()
  const result = addLayer(sample, { name: '내 그림' })
  return createStudioStore(result.artwork, {
    activeLayerId: result.layerId ?? undefined,
  })
}

export interface StudioProviderProps {
  /** 처음 작품 (없으면 샘플 + 빈 레이어) */
  artwork?: Artwork
  /** 테스트에서 상태를 직접 살필 때 넘깁니다. */
  store?: StudioStore
  children: ReactNode
}

export function StudioProvider({
  artwork,
  store,
  children,
}: StudioProviderProps) {
  const [value] = useState(() => store ?? createInitialStore(artwork))
  return <StudioContext value={value}>{children}</StudioContext>
}
