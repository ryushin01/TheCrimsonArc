/**
 * 개발 서버의 /render/ 페이지(배포 빌드에는 없음)를 헤드리스 Chromium으로 엽니다.
 * 시퀀스(render-sequence.mjs)와 인트로 라인업(render-lineup.mjs)이 함께 씁니다.
 * 실행 중에 vite.config.ts를 고치면 개발 서버가 다시 시작되어 멈춥니다.
 */
import { chromium } from '@playwright/test'
import { createServer } from 'vite'

/** 렌더 페이지를 열고 3D 시계가 준비될 때까지 기다립니다. 다 쓰면 close()를 부릅니다. */
export async function openRenderPage({ size }) {
  const server = await createServer({
    logLevel: 'warn',
    server: { port: 5899, strictPort: false },
  })
  await server.listen()
  const base = server.resolvedUrls?.local[0] ?? 'http://localhost:5899/'

  // GPU가 없는 환경에서도 같은 결과가 나오도록 소프트웨어 WebGL로 그립니다.
  const browser = await chromium.launch({
    args: [
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--ignore-gpu-blocklist',
    ],
  })
  const close = async () => {
    await browser.close()
    await server.close()
  }

  try {
    const page = await browser.newPage({
      viewport: { width: size, height: size },
    })
    page.on('pageerror', (error) =>
      console.error('페이지 오류:', error.message),
    )
    await page.goto(`${base}render/?size=${size}`)
    await page.waitForFunction(() => window.__renderReady === true, null, {
      timeout: 120_000,
    })
    // 글꼴로 그린 문자판 질감이 자리 잡을 때까지 잠시 기다립니다.
    await page.waitForTimeout(800)
    return { page, close }
  } catch (error) {
    await close()
    throw error
  }
}

/** 렌더 페이지가 돌려준 data URL을 바이트로 바꿉니다. */
export function dataUrlToBuffer(dataUrl) {
  return Buffer.from(dataUrl.split(',')[1], 'base64')
}
