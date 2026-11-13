// 반투명 빨간 점 1×1 AVIF (알파 채널까지 읽는지 함께 봅니다)
const AVIF_PROBE =
  'data:image/avif;base64,AAAAHGZ0eXBhdmlmAAAAAG1pZjFhdmlmbWlhZgAAAXBtZXRhAAAAAAAAACFoZGxyAAAAAAAAAABwaWN0AAAAAAAAAAAAAAAAAAAAADRpbG9jAAAAAERAAAIAAQAAAAABlAABAAAAAAAAACQAAgAAAAABuAABAAAAAAAAABAAAAA4aWluZgAAAAAAAgAAABVpbmZlAgAAAAABAABhdjAxAAAAABVpbmZlAgAAAAACAABhdjAxAAAAAA5waXRtAAAAAAABAAAAr2lwcnAAAACKaXBjbwAAAAxhdjFDgSACAAAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAcAAAAAA5waXhpAAAAAAEIAAAAOGF1eEMAAAAAdXJuOm1wZWc6bXBlZ0I6Y2ljcDpzeXN0ZW1zOmF1eGlsaWFyeTphbHBoYQAAAAAdaXBtYQAAAAAAAAACAAEDgQIDAAIEhAIFhgAAABppcmVmAAAAAAAAAA5hdXhsAAIAAQABAAAAPG1kYXQSAAoHOAAGkBDQaTIXGUJjBMAANAAAkEDJHGFLjRrWEFSx+yASAAoEGAAGFTIGGAAAAUAP'

let cached: Promise<boolean> | null = null

/** 브라우저가 AVIF(알파 포함)를 그릴 수 있는지. 한 번만 확인하고 기억합니다. */
export function supportsAvif(): Promise<boolean> {
  cached ??= new Promise<boolean>((resolve) => {
    if (typeof Image === 'undefined') {
      resolve(false)
      return
    }
    const image = new Image()
    image.onload = () => resolve(image.naturalWidth === 1)
    image.onerror = () => resolve(false)
    image.src = AVIF_PROBE
  })
  return cached
}
