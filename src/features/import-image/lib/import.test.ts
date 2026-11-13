import { createArtwork, getCel } from '@/entities/artwork'
import { encodeAnimation } from '@/shared/lib/gif'
import { readImageFile } from './read-image'
import { importedToArtwork, placeImageAsLayer } from './to-artwork'

function gifFile(
  width: number,
  height: number,
  frameCount: number,
  delayMs = 125,
  name = 'walk.gif',
) {
  const frames = Array.from({ length: frameCount }, (_, index) => {
    const rgba = new Uint8ClampedArray(width * height * 4)
    for (let i = 0; i < rgba.length; i += 4)
      rgba.set([index * 40, 20, 200, 255], i)
    return { rgba, delayMs }
  })
  const { bytes } = encodeAnimation({ width, height, frames, loop: 0 })
  return new File([bytes as Uint8Array<ArrayBuffer>], name, {
    type: 'image/gif',
  })
}

describe('readImageFile', () => {
  it('움직이는 GIF를 프레임과 FPS로 읽는다', async () => {
    const image = await readImageFile(gifFile(8, 6, 3))
    expect(image).toMatchObject({
      name: 'walk',
      width: 8,
      height: 6,
      fps: 8,
      animated: true,
    })
    expect(image.frames).toHaveLength(3)
    expect(Array.from(image.frames[1].subarray(0, 4))).toEqual([
      40, 20, 200, 255,
    ])
  })

  it('큰 GIF는 비율을 지켜 최대 크기 안으로 줄인다', async () => {
    const image = await readImageFile(gifFile(600, 30, 2), { maxSize: 256 })
    expect(image.width).toBe(256)
    expect(image.height).toBe(13)
    expect(image.originalWidth).toBe(600)
    expect(image.frames[0]).toHaveLength(256 * 13 * 4)
  })

  it('프레임 수 한도까지만 읽는다', async () => {
    const image = await readImageFile(gifFile(2, 2, 10), { maxFrames: 4 })
    expect(image.frames).toHaveLength(4)
  })

  it('형식이 맞지 않으면 원인과 방법을 알린다', async () => {
    const file = new File(['hello'], 'notes.txt', { type: 'text/plain' })
    await expect(readImageFile(file)).rejects.toThrow(
      '‘notes.txt’은(는) 열 수 없는 형식입니다. PNG · JPG · GIF · WebP 이미지를 골라 주세요.',
    )
  })

  it('너무 큰 파일은 열지 않는다', async () => {
    const file = gifFile(2, 2, 1)
    Object.defineProperty(file, 'size', { value: 40 * 1024 * 1024 })
    await expect(readImageFile(file)).rejects.toThrow('너무 큽니다')
  })

  it('끊긴 GIF는 읽지 못했다고 알린다', async () => {
    const whole = new Uint8Array(await gifFile(4, 4, 1).arrayBuffer())
    const broken = new File([whole.slice(0, 30)], 'broken.gif', {
      type: 'image/gif',
    })
    await expect(readImageFile(broken)).rejects.toThrow(
      '‘broken.gif’을(를) 읽지 못했습니다.',
    )
  })
})

describe('작품으로 바꾸기', () => {
  it('연 이미지로 새 작품을 만든다', async () => {
    const image = await readImageFile(gifFile(5, 4, 3))
    const artwork = importedToArtwork(image)
    expect(artwork).toMatchObject({ width: 5, height: 4, fps: 8 })
    expect(artwork.layers[0].name).toBe('walk')
    expect(artwork.frames).toHaveLength(3)
    expect(getCel(artwork, artwork.layers[0].id, artwork.frames[2].id)).toEqual(
      image.frames[2],
    )
  })

  it('지금 작품에 새 레이어로 가운데에 놓는다', async () => {
    const image = await readImageFile(gifFile(2, 2, 1, 100, 'dot.gif'))
    const base = createArtwork({ width: 4, height: 4 })
    const result = placeImageAsLayer(base, image, base.frames[0].id)
    expect(result.placedFrames).toBe(1)
    const layer = result.artwork.layers.at(-1)
    expect(layer?.name).toBe('dot')
    const cel = getCel(
      result.artwork,
      layer?.id as string,
      base.frames[0].id,
    ) as Uint8ClampedArray
    const alphaAt = (x: number, y: number) => cel[(y * 4 + x) * 4 + 3]
    expect(alphaAt(1, 1)).toBe(255)
    expect(alphaAt(0, 0)).toBe(0)
  })
})
