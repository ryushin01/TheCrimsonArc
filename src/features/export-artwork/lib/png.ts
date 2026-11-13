/** RGBA를 PNG 파일로 만듭니다. (브라우저 canvas 사용) */
export async function rgbaToPngBlob(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('이 브라우저에서는 PNG를 만들 수 없습니다.')
  context.putImageData(
    new ImageData(rgba as Uint8ClampedArray<ArrayBuffer>, width, height),
    0,
    0,
  )
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('PNG를 만들지 못했습니다.'))
    }, 'image/png')
  })
}
