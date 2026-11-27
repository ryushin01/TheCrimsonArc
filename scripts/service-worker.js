/*
 * The Crimson Arc 서비스 워커 (빌드할 때 vite.config.ts의 serviceWorker 플러그인이 dist/sw.js로 만듭니다)
 * - 설치할 때 모든 페이지 HTML·JS·CSS·글꼴·아이콘을 미리 받아 두어, 한 번 들어온 뒤에는 인터넷이 끊겨도 모든 페이지가 뜹니다.
 * - 페이지(HTML)와 해시 없는 자료(시퀀스·라인업 이미지)는 네트워크를 먼저 쓰고, 받지 못하면 저장해 둔 것을 씁니다.
 *   그래서 인터넷이 될 때는 지금과 똑같이 늘 새 배포를 받습니다.
 * - 이름에 해시가 든 자료(assets/)는 바뀌지 않으므로 저장해 둔 것을 먼저 씁니다.
 * - ryushin01.github.io를 다른 프로젝트와 함께 쓰므로 캐시 이름은 crimson-arc:로 시작하고, 이 범위(scope) 밖과 Storybook은 건드리지 않습니다.
 */
const VERSION = '__VERSION__'
/** 범위(scope) 기준 상대 경로 목록 */
const PRECACHE = __PRECACHE__
const PREFIX = 'crimson-arc:sw-'
const CACHE = `${PREFIX}${VERSION}`
const scope = new URL(self.registration.scope)
/**
 * 모듈 스크립트·글꼴은 CORS 요청(Origin 머리글)이라 미리 받은 요청과 머리글이 다릅니다.
 * 응답에 Vary: Origin이 붙는 서버에서도 같은 주소면 찾도록 Vary는 보지 않습니다(같은 출처 정적 파일뿐).
 */
const MATCH = { ignoreVary: true }

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        cache.addAll(PRECACHE.map((path) => new URL(path, scope).href)),
      )
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(PREFIX) && key !== CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

/** 받은 응답을 캐시에 남기고 그대로 돌려줍니다. */
async function store(request, response) {
  if (response.ok && response.type === 'basic') {
    const cache = await caches.open(CACHE)
    await cache.put(request, response.clone())
  }
  return response
}

/**
 * 네트워크를 먼저 쓰고, 받지 못하면 저장해 둔 것을 씁니다.
 * 페이지(HTML)는 설치할 때 받아 둔 것만 쓰므로 남기지 않습니다(공유 주소마다 캐시가 늘지 않게).
 */
async function networkFirst(request, fallbacks, save = true) {
  try {
    const response = await fetch(request)
    return save ? await store(request, response) : response
  } catch (error) {
    for (const candidate of [request, ...fallbacks]) {
      const cached = await caches.match(candidate, {
        ...MATCH,
        ignoreSearch: true,
      })
      if (cached) return cached
    }
    throw error
  }
}

/** 저장해 둔 것을 먼저 쓰고, 없으면 받아서 남깁니다. */
async function cacheFirst(request) {
  const cached = await caches.match(request, MATCH)
  return cached ?? store(request, await fetch(request))
}

/** 설치할 때 받지 않고, 쓰일 때 받아 두는 자료(시퀀스·라인업 이미지)인지 */
function isRuntimeCached(url) {
  if (url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname))
    return false
  const path = url.pathname.slice(scope.pathname.length)
  return path.startsWith('sequence/') || path.startsWith('lineup/')
}

/**
 * 서비스 워커는 페이지를 다 읽은 뒤 등록되므로, 그 전에 받은 첫 화면 시퀀스 프레임은 이 워커를 거치지 않아 캐시에 없습니다.
 * 페이지가 맡겨지면 이미 받은 자료 주소를 보내오고(serviceWorker.ts), 그중 시퀀스·라인업 이미지를 받아 둡니다.
 * (브라우저 HTTP 캐시에서 오므로 다시 내려받지 않는 경우가 대부분입니다)
 */
self.addEventListener('message', (event) => {
  const { data } = event
  if (data?.type !== 'cache-loaded' || !Array.isArray(data.urls)) return
  const urls = data.urls
    .filter((value) => typeof value === 'string')
    .map((value) => {
      try {
        return new URL(value)
      } catch {
        return null
      }
    })
    .filter((url) => url !== null && isRuntimeCached(url))
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all(
        urls.map(async (url) => {
          if (await cache.match(url.href, MATCH)) return
          try {
            await store(new Request(url.href), await fetch(url.href))
          } catch {
            // 받지 못한 것은 다음에 쓰일 때 다시 받습니다.
          }
        }),
      ),
    ),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname))
    return
  const path = url.pathname.slice(scope.pathname.length)
  if (path.startsWith('storybook/')) return
  if (request.mode === 'navigate') {
    // /editor 처럼 끝 빗금이 없는 주소와 없는 페이지(404)도 끊긴 상태에서 답합니다.
    const withSlash = url.pathname.endsWith('/')
      ? []
      : [new URL(`${url.pathname}/`, url).href]
    event.respondWith(
      networkFirst(
        request,
        [...withSlash, new URL('404.html', scope).href],
        false,
      ),
    )
    return
  }
  event.respondWith(
    path.startsWith('assets/')
      ? cacheFirst(request)
      : networkFirst(request, []),
  )
})
