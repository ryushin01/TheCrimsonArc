import { type FormEvent, useEffect, useId, useRef, useState } from 'react'
import type { Artwork } from '@/entities/artwork'
import { cx } from '@/shared/lib/classnames'
import { formatBytes, toFileName } from '@/shared/lib/download'
import { Button, buttonClassName } from '@/shared/ui/button'
import { encodeGif } from '../lib/encode-gif'
import { rgbaToPngBlob } from '../lib/png'
import {
  type ExportScale,
  artworkToFrames,
  artworkToSpriteSheet,
  availableScales,
} from '../lib/prepare-frames'
import styles from './ExportPanel.module.css'

export type ExportFormat = 'gif' | 'png' | 'sheet'
export type ExportBackground = 'none' | 'white' | 'night'

const FORMAT_LABELS: Record<ExportFormat, string> = {
  gif: 'GIF 애니메이션',
  png: 'PNG 현재 프레임',
  sheet: 'PNG 스프라이트 시트',
}

const BACKGROUNDS: ReadonlyArray<{
  value: ExportBackground
  label: string
  color: string | null
}> = [
  { value: 'none', label: '투명', color: null },
  { value: 'white', label: '흰색', color: '#ffffff' },
  { value: 'night', label: '검은색', color: '#0f0308' },
]

interface ExportResult {
  url: string
  fileName: string
  format: ExportFormat
  size: number
  width: number
  height: number
  frameCount: number
  colorCount: number | null
  palette: string[]
}

type Status =
  | { kind: 'idle' }
  | { kind: 'working'; progress: number }
  | { kind: 'done'; message: string }
  | { kind: 'error'; message: string }

export interface ExportPanelProps {
  artwork: Artwork
  /** PNG 한 장으로 내보낼 프레임 (기본: 첫 프레임) */
  frameId?: string
  formats?: readonly ExportFormat[]
  defaultScale?: ExportScale
  defaultBackground?: ExportBackground
  /** 확장자를 뺀 파일 이름 */
  fileName?: string
  tone?: 'light' | 'dark'
}

function toHex(palette: Uint8Array, count: number): string[] {
  const colors: string[] = []
  for (let i = 0; i < count; i += 1) {
    const [r, g, b] = palette.subarray(i * 3, i * 3 + 3)
    colors.push(`rgb(${r} ${g} ${b})`)
  }
  return colors
}

/** 작품을 GIF·PNG로 만들어 미리 보고 내려받는 패널 */
export function ExportPanel({
  artwork,
  frameId,
  formats = ['gif'],
  defaultScale = 4,
  defaultBackground = 'none',
  fileName = 'crimson-arc',
  tone = 'light',
}: ExportPanelProps) {
  const scales = availableScales(artwork)
  const [format, setFormat] = useState<ExportFormat>(formats[0] ?? 'gif')
  const [scale, setScale] = useState<ExportScale>(defaultScale)
  const [background, setBackground] =
    useState<ExportBackground>(defaultBackground)
  const [loop, setLoop] = useState(true)
  const [dither, setDither] = useState(false)
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [result, setResult] = useState<ExportResult | null>(null)
  const busy = useRef(false)
  const groupId = useId()

  const effectiveScale = scales.includes(scale) ? scale : (scales.at(-1) ?? 1)
  const isGif = format === 'gif'

  // 새 결과를 만들거나 패널이 사라지면 이전 미리보기 주소를 놓아줍니다.
  useEffect(() => {
    if (!result) return
    return () => URL.revokeObjectURL(result.url)
  }, [result])

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    // 빠르게 두 번 눌러도 한 번만 만들도록 렌더와 상관없는 잠금을 씁니다.
    if (busy.current) return
    busy.current = true
    setStatus({ kind: 'working', progress: 0 })
    const color =
      BACKGROUNDS.find((option) => option.value === background)?.color ?? null
    try {
      let blob: Blob
      let width: number
      let height: number
      let frameCount = artwork.frames.length
      let colorCount: number | null = null
      let palette: string[] = []

      if (format === 'gif') {
        const prepared = artworkToFrames(artwork, {
          scale: effectiveScale,
          background: color,
        })
        const encoded = await encodeGif(
          {
            width: prepared.width,
            height: prepared.height,
            frames: prepared.frames,
            loop: loop ? 0 : undefined,
            dither,
          },
          (progress) => setStatus({ kind: 'working', progress }),
        )
        blob = new Blob([encoded.bytes as Uint8Array<ArrayBuffer>], {
          type: 'image/gif',
        })
        width = prepared.width
        height = prepared.height
        colorCount = encoded.colorCount + (encoded.transparent ? 1 : 0)
        palette = toHex(encoded.palette, encoded.colorCount)
      } else if (format === 'png') {
        const target = frameId ?? artwork.frames[0].id
        const prepared = artworkToFrames(artwork, {
          scale: effectiveScale,
          background: color,
          frameIds: [target],
        })
        blob = await rgbaToPngBlob(
          prepared.frames[0].rgba,
          prepared.width,
          prepared.height,
        )
        width = prepared.width
        height = prepared.height
        frameCount = 1
      } else {
        const sheet = artworkToSpriteSheet(artwork, {
          scale: effectiveScale,
          background: color,
        })
        blob = await rgbaToPngBlob(sheet.rgba, sheet.width, sheet.height)
        width = sheet.width
        height = sheet.height
      }

      const name = toFileName(
        format === 'sheet' ? `${fileName}-sheet` : fileName,
        format === 'gif' ? 'gif' : 'png',
      )
      setResult({
        url: URL.createObjectURL(blob),
        fileName: name,
        format,
        size: blob.size,
        width,
        height,
        frameCount,
        colorCount,
        palette,
      })
      setStatus({
        kind: 'done',
        message: `${FORMAT_LABELS[format]}을 만들었습니다. ${formatBytes(blob.size)}${
          colorCount === null ? '' : `, 팔레트 ${colorCount}색`
        }. 아래에서 미리 보고 내려받으세요.`,
      })
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      setStatus({
        kind: 'error',
        message: `파일을 만들지 못했습니다. (${reason}) 배율을 낮춰 다시 시도하세요.`,
      })
    } finally {
      busy.current = false
    }
  }

  const working = status.kind === 'working'

  return (
    <form className={cx(styles.panel, styles[tone])} onSubmit={onSubmit}>
      <div className={styles.options}>
        {formats.length > 1 ? (
          <fieldset className={styles.group}>
            <legend className={styles.legend}>형식</legend>
            <div className={styles.choices}>
              {formats.map((value) => (
                <label key={value} className={styles.choice}>
                  <input
                    className={styles.choiceInput}
                    type="radio"
                    name={`${groupId}-format`}
                    value={value}
                    checked={format === value}
                    onChange={() => setFormat(value)}
                  />
                  {FORMAT_LABELS[value]}
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}

        <fieldset className={styles.group}>
          <legend className={styles.legend}>배율</legend>
          <div className={styles.choices}>
            {scales.map((value) => (
              <label key={value} className={styles.choice}>
                <input
                  className={styles.choiceInput}
                  type="radio"
                  name={`${groupId}-scale`}
                  value={value}
                  checked={effectiveScale === value}
                  onChange={() => setScale(value)}
                />
                ×{value}{' '}
                <span className={styles.choiceHint}>
                  ({artwork.width * value}×{artwork.height * value})
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className={styles.group}>
          <legend className={styles.legend}>배경</legend>
          <div className={styles.choices}>
            {BACKGROUNDS.map((option) => (
              <label key={option.value} className={styles.choice}>
                <input
                  className={styles.choiceInput}
                  type="radio"
                  name={`${groupId}-background`}
                  value={option.value}
                  checked={background === option.value}
                  onChange={() => setBackground(option.value)}
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>

        {isGif ? (
          <div className={styles.checks}>
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={loop}
                onChange={(event) => setLoop(event.target.checked)}
              />
              무한 반복
            </label>
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={dither}
                onChange={(event) => setDither(event.target.checked)}
              />
              디더링 (색이 많은 사진에 알맞음)
            </label>
          </div>
        ) : null}
      </div>

      <div className={styles.actions}>
        <Button
          type="submit"
          variant="crimson"
          icon="sparkle"
          disabled={working}
        >
          {isGif ? 'GIF 만들기' : 'PNG 만들기'}
        </Button>
        {working ? (
          <progress
            className={styles.progress}
            aria-label="만드는 중"
            value={status.progress}
            max={1}
          />
        ) : null}
        <p
          role="status"
          className={cx(styles.status, status.kind === 'error' && styles.error)}
        >
          {status.kind === 'working'
            ? `${FORMAT_LABELS[format]}을 만드는 중입니다.`
            : status.kind === 'done' || status.kind === 'error'
              ? status.message
              : ''}
        </p>
      </div>

      {result ? (
        <figure className={styles.result}>
          <div className={styles.preview}>
            <img
              src={result.url}
              width={result.width}
              height={result.height}
              alt={`만든 ${FORMAT_LABELS[result.format]} 미리보기, ${result.width}×${result.height}픽셀, 프레임 ${result.frameCount}장`}
            />
          </div>
          <figcaption>
            <dl className={styles.stats}>
              <div>
                <dt>파일 크기</dt>
                <dd>{formatBytes(result.size)}</dd>
              </div>
              <div>
                <dt>해상도</dt>
                <dd>
                  {result.width}×{result.height}
                </dd>
              </div>
              <div>
                <dt>프레임</dt>
                <dd>{result.frameCount}장</dd>
              </div>
              {result.colorCount === null ? null : (
                <div>
                  <dt>팔레트</dt>
                  <dd>{result.colorCount}색</dd>
                </div>
              )}
            </dl>
            {result.palette.length > 0 ? (
              <div className={styles.palette} aria-hidden="true">
                {result.palette.map((color, index) => (
                  <span
                    key={`${color}-${index}`}
                    className={styles.swatch}
                    style={{ background: color }}
                  />
                ))}
              </div>
            ) : null}
            <a
              href={result.url}
              download={result.fileName}
              className={buttonClassName({
                variant: tone === 'dark' ? 'light' : 'solid',
                size: 'sm',
              })}
            >
              <span>{result.fileName} 내려받기</span>
            </a>
          </figcaption>
        </figure>
      ) : null}
    </form>
  )
}
