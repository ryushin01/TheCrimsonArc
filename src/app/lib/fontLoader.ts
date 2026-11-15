/**
 * 에스코어드림(수정할 수 없어 받은 파일을 통째로 씀)을 다 받은 뒤 화면을 보여 줍니다.
 * - 받는 동안 크림슨 호가 베젤을 따라 도는 로딩 화면을 덮습니다(html[data-fonts="loading"]).
 * - 8초가 지나거나 글꼴을 받지 못하면 운영체제 고딕으로 그대로 보여 줍니다.
 */
export const FONT_LOADER_TIMEOUT_MS = 8000

const WEIGHTS = ['400', '600', '700']

function loaderElement(): HTMLElement {
  const el = document.createElement('div')
  el.className = 'font-loader'
  el.setAttribute('role', 'status')
  el.innerHTML =
    '<span class="font-loader__bezel" aria-hidden="true"></span>' +
    '<p class="font-loader__text"><span class="font-loader__model" aria-hidden="true">A-01</span>무브먼트를 감는 중입니다</p>'
  return el
}

/** 글꼴 CSS를 붙이고 다 받을 때까지 로딩 화면을 보여 줍니다. 다 받거나 제한 시간이 지나면 끝납니다. */
export function showFontLoader(href: string): Promise<void> {
  const root = document.documentElement
  const fonts = document.fonts as FontFaceSet | undefined
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  if (!fonts?.load) {
    document.head.append(link)
    root.dataset.fonts = 'ready'
    return Promise.resolve()
  }
  root.dataset.fonts = 'loading'
  const loader = loaderElement()
  document.body.prepend(loader)
  const linkLoaded = new Promise<void>((resolve) => {
    link.onload = () => resolve()
    link.onerror = () => resolve()
  })
  document.head.append(link)
  const loaded = linkLoaded.then(() =>
    Promise.all(
      WEIGHTS.map((w) => fonts.load(`${w} 1em "S-Core Dream"`, '가')),
    ),
  )
  const timeout = new Promise((resolve) =>
    setTimeout(resolve, FONT_LOADER_TIMEOUT_MS),
  )
  return Promise.race([loaded, timeout])
    .catch(() => undefined)
    .then(() => {
      loader.remove()
      root.dataset.fonts = 'ready'
    })
}
