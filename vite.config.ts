import { readFileSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import { type HtmlTagDescriptor, type Plugin, defineConfig } from 'vite'

// GitHub Pages처럼 하위 경로에 올릴 때 BASE_PATH=/TheCrimsonArc/ 로 빌드합니다.
const base = process.env.BASE_PATH ?? '/'

/** 한글 글꼴 에스코어드림의 CSS (public/fonts) */
const KOREAN_FONT_CSS = 'fonts/s-core-dream.css'

/**
 * 에스코어드림(통파일, 굵기마다 약 350KB)을 HTML을 읽는 즉시 받기 시작합니다.
 * 글꼴 로딩 화면(showFontLoader)은 JS를 받아 실행한 뒤에야 글꼴 CSS를 붙이므로, 미리 받지 않으면
 * 글꼴 요청이 JS 뒤로 밀려 로딩 화면이 그만큼 길어집니다.
 * 받을 파일은 CSS의 @font-face에서 읽어 한곳(public/fonts/s-core-dream.css)에서만 관리합니다.
 */
export function preloadKoreanFont(): Plugin {
  const css = readFileSync(
    new URL(`./public/${KOREAN_FONT_CSS}`, import.meta.url),
    'utf8',
  )
  const files = [...css.matchAll(/url\(['"]?\.\/([^'")]+)['"]?\)/g)].map(
    (match) => match[1]!,
  )
  const tags: HtmlTagDescriptor[] = [
    {
      tag: 'link',
      attrs: { rel: 'preload', href: `${base}${KOREAN_FONT_CSS}`, as: 'style' },
      injectTo: 'head',
    },
    ...files.map((file): HtmlTagDescriptor => ({
      tag: 'link',
      attrs: {
        rel: 'preload',
        href: `${base}fonts/${file}`,
        as: 'font',
        type: file.endsWith('.woff2') ? 'font/woff2' : 'font/woff',
        // 글꼴은 늘 CORS로 받으므로 crossorigin이 있어야 미리 받은 것을 그대로 씁니다.
        crossorigin: true,
      },
      injectTo: 'head',
    })),
  ]
  return { name: 'preload-korean-font', transformIndexHtml: () => tags }
}

export default defineConfig({
  base,
  plugins: [react(), preloadKoreanFont()],
  resolve: { tsconfigPaths: true },
  build: {
    target: 'es2022',
    // three.js가 든 3D 조각은 첫 화면 뒤에 따로 받으므로 경고 기준을 넉넉히 둡니다.
    chunkSizeWarningLimit: 1100,
    rolldownOptions: {
      // 시계 쇼케이스, 편집기 소개, 스튜디오, 성능 비교, 404 페이지를 각각 HTML로 내보냅니다.
      // (render/는 시퀀스를 만드는 개발용 페이지라 넣지 않습니다)
      input: {
        main: 'index.html',
        editor: 'editor/index.html',
        studio: 'studio/index.html',
        bench: 'bench/index.html',
        notFound: '404.html',
      },
    },
  },
  worker: { format: 'es' },
  preview: { port: 4173 },
})
