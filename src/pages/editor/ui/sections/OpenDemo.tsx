import { useId, useMemo, useRef, useState } from 'react'
import { PixelCanvas } from '@/entities/artwork'
import { encodeGif, rgbaToPngBlob } from '@/features/export-artwork'
import {
  HANDOFF_PARAM,
  ImageDropzone,
  type ImportedImage,
  handOffImage,
  readImageFile,
} from '@/features/import-image'
import { ROUTES } from '@/shared/config'
import { Button } from '@/shared/ui/button'
import { pixelate } from '../../lib/pixelate'
import { createSamplePhoto } from '../../lib/sample-photo'
import styles from './OpenDemo.module.css'

const SIZES = [32, 48, 64, 96] as const

/** 기존 이미지를 열어 픽셀 아트로 줄여 보고, 스튜디오로 넘겨 이어 그립니다. */
export function OpenDemo() {
  const [image, setImage] = useState<ImportedImage | null>(null)
  const [size, setSize] = useState<(typeof SIZES)[number]>(64)
  const [colors, setColors] = useState(16)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState('')
  const handing = useRef(false)
  const groupId = useId()
  const rangeId = useId()

  const art = useMemo(
    () => (image ? pixelate(image, size, colors) : null),
    [image, size, colors],
  )

  const open = async (file: File) => {
    setBusy(true)
    setError(null)
    setStatus('')
    try {
      const next = await readImageFile(file, { maxSize: 256 })
      setImage(next)
      setStatus(
        `‘${file.name}’을(를) 열었습니다. ${next.originalWidth}×${next.originalHeight}${
          next.animated ? `, 프레임 ${next.frames.length}장` : ''
        }`,
      )
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason))
    } finally {
      setBusy(false)
    }
  }

  const openSample = async () => {
    try {
      await open(await createSamplePhoto())
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason))
    }
  }

  const continueInStudio = async () => {
    if (!art || !image || handing.current) return
    handing.current = true
    setBusy(true)
    try {
      let file: File
      if (art.frames.length > 1) {
        const { bytes } = await encodeGif({
          width: art.width,
          height: art.height,
          frames: art.frames.map((rgba) => ({
            rgba: rgba.slice(),
            delayMs: 1000 / image.fps,
          })),
          loop: 0,
        })
        file = new File(
          [bytes as Uint8Array<ArrayBuffer>],
          `${image.name}-pixel.gif`,
          { type: 'image/gif' },
        )
      } else {
        const blob = await rgbaToPngBlob(art.frames[0], art.width, art.height)
        file = new File([blob], `${image.name}-pixel.png`, {
          type: 'image/png',
        })
      }
      if (!(await handOffImage(file))) {
        throw new Error(
          '브라우저 저장소를 쓸 수 없어 넘기지 못했습니다. 스튜디오에서 [열기]로 직접 열어 주세요.',
        )
      }
      // 성공하면 페이지를 떠나므로 잠금은 실패했을 때만 풉니다.
      window.location.assign(`${ROUTES.studio}?${HANDOFF_PARAM}=1`)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason))
      handing.current = false
      setBusy(false)
    }
  }

  return (
    <div className={styles.demo}>
      <ImageDropzone onFile={open} busy={busy} error={error}>
        <Button
          variant="outline"
          size="sm"
          icon="sparkle"
          iconPosition="start"
          disabled={busy}
          onClick={openSample}
        >
          샘플 이미지로 해 보기
        </Button>
      </ImageDropzone>

      <p role="status" className={styles.status}>
        {status}
      </p>

      {image && art ? (
        <>
          <div className={styles.compare}>
            <figure className={styles.figure}>
              <div className={styles.frame}>
                <PixelCanvas
                  data={image.frames[0]}
                  width={image.width}
                  height={image.height}
                  className={styles.smooth}
                  label={`원본 이미지 ${image.name}`}
                />
              </div>
              <figcaption>
                <span>원본</span>
                <span>
                  {image.width}×{image.height}
                </span>
              </figcaption>
            </figure>
            <figure className={styles.figure}>
              <div className={styles.frame}>
                <PixelCanvas
                  data={art.frames[0]}
                  width={art.width}
                  height={art.height}
                  label={`픽셀 아트로 바꾼 이미지, ${art.width}×${art.height}픽셀, ${art.colorCount}색`}
                />
              </div>
              <figcaption>
                <span>픽셀 아트</span>
                <span>
                  {art.width}×{art.height} · {art.colorCount}색
                </span>
              </figcaption>
            </figure>
          </div>

          <div className={styles.controls}>
            <fieldset className={styles.group}>
              <legend className={styles.legend}>픽셀 크기 (긴 변)</legend>
              <div className={styles.choices}>
                {SIZES.map((value) => (
                  <label key={value} className={styles.choice}>
                    <input
                      type="radio"
                      name={`${groupId}-size`}
                      value={value}
                      checked={size === value}
                      onChange={() => setSize(value)}
                    />
                    {value}px
                  </label>
                ))}
              </div>
            </fieldset>
            <div>
              <label htmlFor={rangeId} className={styles.rangeLabel}>
                색 수
              </label>
              <div className={styles.range}>
                <input
                  id={rangeId}
                  type="range"
                  min={4}
                  max={32}
                  step={2}
                  value={colors}
                  onChange={(event) => setColors(Number(event.target.value))}
                />
                <output htmlFor={rangeId}>{colors}</output>
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            <Button
              variant="crimson"
              icon="arrow-right"
              disabled={busy}
              onClick={continueInStudio}
            >
              스튜디오에서 이어 그리기
            </Button>
          </div>
        </>
      ) : null}
    </div>
  )
}
