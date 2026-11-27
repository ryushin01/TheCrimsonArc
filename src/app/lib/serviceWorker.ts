/**
 * 서비스 워커(빌드가 만든 sw.js)를 등록해, 한 번 들어온 뒤에는 인터넷이 끊겨도 모든 페이지가 뜨게 합니다.
 * - 첫 화면 자료를 받는 데 방해되지 않게 페이지를 다 읽은 뒤(load) 등록합니다.
 * - 개발 서버에는 sw.js가 없으므로 프로덕션 빌드에서만 부릅니다(mount.tsx).
 * - 서비스 워커를 쓸 수 없는 환경(비보안 주소, 일부 비공개 창)에서는 아무것도 하지 않습니다.
 */
export function registerServiceWorker(base: string): void {
  if (!('serviceWorker' in navigator)) return
  const register = () => {
    navigator.serviceWorker
      .register(`${base}sw.js`, { scope: base })
      .catch(() => {
        // 등록하지 못해도 온라인에서는 그대로 동작합니다.
      })
  }
  if (document.readyState === 'complete') register()
  else window.addEventListener('load', register, { once: true })
}
