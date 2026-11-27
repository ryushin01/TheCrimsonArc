import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'
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

/** 서비스 워커가 미리 받지 않는 것: Storybook, 처음부터 다 받지 않는 시퀀스·라인업 이미지, 공유 이미지 */
const NOT_PRECACHED = [
  /\.txt$/,
  /^storybook\//,
  /^sequence\//,
  /^lineup\//,
  /^og.*\.jpg$/,
]

function listFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile())
    .map((entry) => relative(dir, join(entry.parentPath, entry.name)))
    .map((path) => path.split(sep).join('/'))
}

/**
 * 빌드가 끝나면 scripts/service-worker.js에 미리 받을 파일 목록과 버전을 넣어 dist/sw.js로 씁니다.
 * 페이지 HTML은 'editor/'처럼 폴더 주소로 받아 두어, 끊긴 상태에서 같은 주소로 찾습니다.
 * 버전은 파일 내용의 해시라 배포가 바뀔 때만 서비스 워커가 새로 설치됩니다.
 */
export function serviceWorker(): Plugin {
  let outDir = 'dist'
  return {
    name: 'crimson-arc-service-worker',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      const files = listFiles(outDir)
        .filter((file) => file !== 'sw.js')
        .filter((file) => !NOT_PRECACHED.some((pattern) => pattern.test(file)))
        .sort()
      const hash = createHash('sha256')
      for (const file of files)
        hash.update(file).update(readFileSync(join(outDir, file)))
      const precache = files.map((file) =>
        file === 'index.html' ? './' : file.replace(/(^|\/)index\.html$/, '$1'),
      )
      const source = readFileSync(
        new URL('./scripts/service-worker.js', import.meta.url),
        'utf8',
      )
        .replace(
          "'__VERSION__'",
          JSON.stringify(hash.digest('hex').slice(0, 12)),
        )
        .replace('__PRECACHE__', JSON.stringify(precache))
      writeFileSync(join(outDir, 'sw.js'), source)
    },
  }
}

export default defineConfig({
  base,
  plugins: [react(), preloadKoreanFont(), serviceWorker()],
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
