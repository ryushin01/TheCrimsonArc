import { stashBlob, takeStashedBlob } from '@/shared/lib/storage'

const KEY = 'open-in-studio'

/** 스튜디오 주소에 붙여 '넘겨받을 이미지가 있다'고 알리는 검색어 */
export const HANDOFF_PARAM = 'open'

/** 홍보 페이지에서 연 파일을 스튜디오로 넘기려고 잠시 맡깁니다. */
export function handOffImage(file: File): Promise<boolean> {
  return stashBlob(KEY, file)
}

/** 맡겨 둔 파일을 받습니다. 없으면 null */
export async function receiveHandedOffImage(): Promise<File | null> {
  const blob = await takeStashedBlob(KEY)
  if (!blob) return null
  return blob instanceof File
    ? blob
    : new File([blob], 'image', { type: blob.type })
}
