/**
 * 에스코어드림(수정할 수 없어 받은 파일을 통째로 씀)을 다 받은 뒤 화면을 보여 줍니다.
 * - 받는 동안 크림슨 호가 베젤을 따라 도는 로딩 화면을 덮습니다(html[data-fonts="loading"]).
 * - 8초가 지나거나 글꼴을 받지 못하면 운영체제 고딕으로 그대로 보여 줍니다.
 * - 글꼴 파일은 HTML의 preload로 이미 받는 중이라, 여기서는 CSS를 붙이고 다 받기를 기다리기만 합니다.
 * - 로딩 화면이 끝나기를 기다릴 곳(첫 화면 핵심 프레임 등)은 shared/lib/fonts의 whenFontsSettled를 씁니다.
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
  const linkLoaded = new Promise<void>((resolve, reject) => {
    link.onload = () => resolve()
    link.onerror = () => reject(new Error('글꼴 CSS를 받지 못했습니다.'))
  })
  document.head.append(link)
  return new Promise<void>((resolve) => {
    let settled = false
    // 제한 시간이 지나거나 받지 못하면 글꼴 CSS를 꺼서, 글꼴이 늦게 도착해도 글자가 바뀌지 않게 합니다.
    const finish = (loaded: boolean) => {
      if (settled) return
      settled = true
      if (!loaded) link.disabled = true
      loader.remove()
      root.dataset.fonts = 'ready'
      resolve()
    }
    setTimeout(() => finish(false), FONT_LOADER_TIMEOUT_MS)
    linkLoaded
      .then(() =>
        Promise.all(
          WEIGHTS.map((w) => fonts.load(`${w} 1em "S-Core Dream"`, '가')),
        ),
      )
      .then(
        () => finish(true),
        () => finish(false),
      )
  })
}
