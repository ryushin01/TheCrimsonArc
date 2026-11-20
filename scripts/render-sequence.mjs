/**
 * 첫 화면 스크롤 시퀀스에 쓰는 시계 프레임을 만듭니다.
 *
 * 개발 서버의 /render/ 페이지(배포 빌드에는 없음, scripts/lib/render-page.mjs)에서 프레임마다 투명 PNG를 받아
 * sharp로 줄인 뒤 저장합니다. 큰 프레임은 AVIF만, 작은 프레임은 AVIF와 WebP(AVIF를 못 읽는 브라우저용)를 둡니다.
 *   public/sequence/lg/000.avif … (960px)
 *   public/sequence/sm/000.avif, 000.webp … (540px)
 *
 * 사용: pnpm sequence [--only=0,64,191]
 * 실행 중에 vite.config.ts를 고치면 개발 서버가 다시 시작되어 멈춥니다.
 */
import { mkdir, readdir, rm, stat } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { dataUrlToBuffer, openRenderPage } from './lib/render-page.mjs'

const RENDER_SIZE = 1080
const OUTPUTS = {
  lg: { size: 960, formats: ['avif'] },
  sm: { size: 540, formats: ['avif', 'webp'] },
}
const OUT_DIR = path.resolve('public/sequence')
const only = process.argv
  .find((arg) => arg.startsWith('--only='))
  ?.slice('--only='.length)
  .split(',')
  .map((value) => {
    if (!/^\d+$/.test(value)) {
      throw new Error(
        `--only에는 0 이상의 번호를 쉼표로 적습니다. ('${value}')`,
      )
    }
    return Number(value)
  })

const { page, close } = await openRenderPage({ size: RENDER_SIZE })

try {
  const total = await page.evaluate(() => window.__sequenceFrames ?? 0)
  if (!total) throw new Error('렌더 페이지에서 프레임 수를 읽지 못했습니다.')

  for (const index of only ?? []) {
    if (!Number.isInteger(index) || index < 0 || index >= total) {
      throw new Error(`--only의 ${index}번 프레임은 없습니다. (0~${total - 1})`)
    }
  }
  if (!only) await rm(OUT_DIR, { recursive: true, force: true })
  for (const name of Object.keys(OUTPUTS)) {
    await mkdir(path.join(OUT_DIR, name), { recursive: true })
  }

  const indices = only ?? Array.from({ length: total }, (_, index) => index)
  for (const index of indices) {
    const started = Date.now()
    const dataUrl = await page.evaluate(
      (frame) => window.__renderFrame?.(frame, 'image/png'),
      index,
    )
    if (!dataUrl) throw new Error(`${index}번 프레임을 그리지 못했습니다.`)
    const png = dataUrlToBuffer(dataUrl)
    const file = String(index).padStart(3, '0')
    for (const [name, { size, formats }] of Object.entries(OUTPUTS)) {
      const resized = sharp(png).resize(size, size, { kernel: 'lanczos3' })
      if (formats.includes('avif')) {
        await resized
          .clone()
          .avif({ quality: 52, effort: 6 })
          .toFile(path.join(OUT_DIR, name, `${file}.avif`))
      }
      if (formats.includes('webp')) {
        await resized
          .clone()
          .webp({ quality: 78, alphaQuality: 90, effort: 6 })
          .toFile(path.join(OUT_DIR, name, `${file}.webp`))
      }
    }
    console.log(`${file} ${Date.now() - started}ms`)
  }

  for (const [name, { formats }] of Object.entries(OUTPUTS)) {
    const files = await readdir(path.join(OUT_DIR, name))
    for (const format of formats) {
      let bytes = 0
      for (const file of files.filter((item) => item.endsWith(format))) {
        bytes += (await stat(path.join(OUT_DIR, name, file))).size
      }
      console.log(`${name} ${format}: ${(bytes / 1024).toFixed(0)} KB`)
    }
  }
} finally {
  await close()
}
