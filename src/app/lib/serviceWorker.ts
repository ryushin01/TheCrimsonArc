/**
 * 서비스 워커(빌드가 만든 sw.js)를 등록해, 한 번 들어온 뒤에는 인터넷이 끊겨도 모든 페이지가 뜨게 합니다.
 * - 첫 화면 자료를 받는 데 방해되지 않게 페이지를 다 읽은 뒤(load) 등록합니다.
 * - 개발 서버에는 sw.js가 없으므로 프로덕션 빌드에서만 부릅니다(mount.tsx).
 * - 서비스 워커를 쓸 수 없는 환경(비보안 주소, 일부 비공개 창)에서는 아무것도 하지 않습니다.
 */
export function registerServiceWorker(base: string): void {
  if (!('serviceWorker' in navigator)) return
  const container = navigator.serviceWorker
  // 처음 들어온 페이지는 서비스 워커가 맡기 전에 자료를 받으므로, 맡겨진 뒤 받은 자료를 알려 줍니다.
  const firstVisit = !container.controller
  const register = () => {
    container
      .register(`${base}sw.js`, { scope: base })
      .then(() => (firstVisit ? whenControlled(container) : null))
      .then((controller) => {
        controller?.postMessage({ type: 'cache-loaded', urls: loadedUrls() })
      })
      .catch(() => {
        // 등록하지 못해도 온라인에서는 그대로 동작합니다.
      })
  }
  if (document.readyState === 'complete') register()
  else window.addEventListener('load', register, { once: true })
}

/** 서비스 워커가 이 페이지를 맡을 때까지 (설치·활성화가 끝나면 clients.claim()으로 맡음) */
function whenControlled(
  container: ServiceWorkerContainer,
): Promise<ServiceWorker> {
  const { controller } = container
  if (controller) return Promise.resolve(controller)
  return new Promise((resolve) => {
    const onChange = () => {
      if (!container.controller) return
      container.removeEventListener('controllerchange', onChange)
      resolve(container.controller)
    }
    container.addEventListener('controllerchange', onChange)
  })
}

/** 지금까지 받은 자료 주소(같은 출처). 서비스 워커가 그중 시퀀스·라인업 이미지만 골라 받아 둡니다. */
function loadedUrls(): string[] {
  if (typeof performance.getEntriesByType !== 'function') return []
  return performance
    .getEntriesByType('resource')
    .map((entry) => entry.name)
    .filter((url) => url.startsWith(window.location.origin))
}
