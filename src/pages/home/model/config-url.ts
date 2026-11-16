import {
  CASES,
  type CaseId,
  DEFAULT_CONFIG,
  DIALS,
  type DialId,
  LIGHTS,
  type LightId,
  STRAPS,
  type StrapId,
  type WatchConfig,
} from '@/entities/watch'

/** 구성기에서 시계를 보는 방향 */
export const VIEWS = ['front', 'side', 'back'] as const
export type WatchView = (typeof VIEWS)[number]
export const DEFAULT_VIEW: WatchView = 'front'

const CONFIG_KEYS = ['dial', 'case', 'strap', 'light'] as const

function pick<T extends string>(
  value: string | null,
  allowed: readonly T[],
  fallback: T,
): T {
  return value !== null && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback
}

/** 주소의 `?dial=…&case=…&strap=…&light=…&view=…`에서 조합을 읽습니다. 없거나 모르는 값은 기본값입니다. */
export function readConfig(search: string): {
  config: WatchConfig
  view: WatchView
} {
  const params = new URLSearchParams(search)
  return {
    config: {
      dial: pick(
        params.get('dial'),
        Object.keys(DIALS) as DialId[],
        DEFAULT_CONFIG.dial,
      ),
      case: pick(
        params.get('case'),
        Object.keys(CASES) as CaseId[],
        DEFAULT_CONFIG.case,
      ),
      strap: pick(
        params.get('strap'),
        Object.keys(STRAPS) as StrapId[],
        DEFAULT_CONFIG.strap,
      ),
      light: pick(
        params.get('light'),
        Object.keys(LIGHTS) as LightId[],
        DEFAULT_CONFIG.light,
      ),
    },
    view: pick(params.get('view'), VIEWS, DEFAULT_VIEW),
  }
}

/**
 * 조합을 담은 주소의 검색 부분(`?…`, 없으면 빈 문자열)을 만듭니다.
 * 기본값은 빼서 주소를 짧게 두고, 다른 매개변수(`?debug` 등)는 그대로 둡니다.
 */
export function writeConfig(
  search: string,
  config: WatchConfig,
  view: WatchView,
): string {
  const params = new URLSearchParams(search)
  for (const key of CONFIG_KEYS) {
    if (config[key] === DEFAULT_CONFIG[key]) params.delete(key)
    else params.set(key, config[key])
  }
  if (view === DEFAULT_VIEW) params.delete('view')
  else params.set('view', view)
  const query = params.toString()
  return query ? `?${query}` : ''
}

/** 이 조합으로 구성기(#colors)를 바로 여는 공유 주소 */
export function shareUrl(
  location: Pick<Location, 'origin' | 'pathname'>,
  config: WatchConfig,
  view: WatchView,
): string {
  return `${location.origin}${location.pathname}${writeConfig('', config, view)}#colors`
}
