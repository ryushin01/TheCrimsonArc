/**
 * 글꼴 로딩 화면(`html[data-fonts="loading"]`, app의 showFontLoader)이 끝날 때까지 기다립니다.
 * 글꼴을 다 받았거나 제한 시간이 지나 화면을 열면 끝납니다. 로딩 화면이 없으면(테스트·Storybook 등) 바로 끝납니다.
 */
export function whenFontsSettled(): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve()
  const root = document.documentElement
  if (root.dataset.fonts !== 'loading') return Promise.resolve()
  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      if (root.dataset.fonts === 'loading') return
      observer.disconnect()
      resolve()
    })
    observer.observe(root, {
      attributes: true,
      attributeFilter: ['data-fonts'],
    })
  })
}
