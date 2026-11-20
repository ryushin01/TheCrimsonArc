/**
 * 첫 화면 인트로의 조디악 다이얼에 놓는 A-01 열두 조합(entities/watch의 LINEUP) 이미지를 만듭니다.
 *
 * 개발 서버의 /render/ 페이지(scripts/lib/render-page.mjs)에서 조합마다 투명 PNG를 받아
 * 시계 둘레만 정사각형으로 잘라 줄인 뒤, AVIF와 WebP(AVIF를 못 읽는 브라우저용)로 저장합니다.
 *   public/lineup/00.avif, 00.webp … (LINEUP_IMAGE_SIZE, 256px)
 *
 * 사용: pnpm lineup [--only=0,5] [--raw]  (--raw: 자르기 전 PNG를 저장소 밖 임시 폴더에 함께 저장)
 */
import { mkdir, readdir, rm, stat } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import { dataUrlToBuffer, openRenderPage } from './lib/render-page.mjs'

const RENDER_SIZE = 1080
/** 렌더 한가운데에서 잘라 낼 정사각형 한 변의 비율. 케이스와 러그, 스트랩 시작 부분까지 담습니다. */
const CROP_RATIO = 0.66
const OUT_DIR = path.resolve('public/lineup')
/** 확인용 원본은 public에 두면 빌드·커밋에 섞이므로 운영체제 임시 폴더에 둡니다. */
const RAW_DIR = path.join(os.tmpdir(), 'crimson-arc-lineup-raw')
const only = process.argv
  .find((arg) => arg.startsWith('--only='))
  ?.slice('--only='.length)
  .split(',')
  .map(Number)
const raw = process.argv.includes('--raw')

const { page, close } = await openRenderPage({ size: RENDER_SIZE })

try {
  const { total, outSize } = await page.evaluate(() => ({
    total: window.__lineupCount ?? 0,
    outSize: window.__lineupImageSize ?? 0,
  }))
  if (!total || !outSize) {
    throw new Error(
      '렌더 페이지에서 라인업 수나 이미지 크기를 읽지 못했습니다.',
    )
  }

  for (const index of only ?? []) {
    if (!Number.isInteger(index) || index < 0 || index >= total) {
      throw new Error(`--only의 ${index}번 조합은 없습니다. (0~${total - 1})`)
    }
  }
  if (!only) await rm(OUT_DIR, { recursive: true, force: true })
  await mkdir(OUT_DIR, { recursive: true })
  if (raw) {
    await mkdir(RAW_DIR, { recursive: true })
    console.log('원본 PNG:', RAW_DIR)
  }

  const crop = Math.round(RENDER_SIZE * CROP_RATIO)
  const offset = Math.round((RENDER_SIZE - crop) / 2)
  const indices = only ?? Array.from({ length: total }, (_, index) => index)
  for (const index of indices) {
    const started = Date.now()
    const dataUrl = await page.evaluate(
      (item) => window.__renderLineup?.(item, 'image/png'),
      index,
    )
    if (!dataUrl) throw new Error(`${index}번 조합을 그리지 못했습니다.`)
    const png = dataUrlToBuffer(dataUrl)
    const file = String(index).padStart(2, '0')
    if (raw) await sharp(png).toFile(path.join(RAW_DIR, `${file}.png`))
    const resized = sharp(png)
      .extract({ left: offset, top: offset, width: crop, height: crop })
      .resize(outSize, outSize, { kernel: 'lanczos3' })
    await resized
      .clone()
      .avif({ quality: 56, effort: 6 })
      .toFile(path.join(OUT_DIR, `${file}.avif`))
    await resized
      .clone()
      .webp({ quality: 80, alphaQuality: 90, effort: 6 })
      .toFile(path.join(OUT_DIR, `${file}.webp`))
    console.log(`${file} ${Date.now() - started}ms`)
  }

  const files = await readdir(OUT_DIR)
  for (const format of ['avif', 'webp']) {
    let bytes = 0
    for (const file of files.filter((item) => item.endsWith(format))) {
      bytes += (await stat(path.join(OUT_DIR, file))).size
    }
    console.log(`lineup ${format}: ${(bytes / 1024).toFixed(0)} KB`)
  }
} finally {
  await close()
}
