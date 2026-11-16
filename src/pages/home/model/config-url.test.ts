import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG } from '@/entities/watch'
import { readConfig, shareUrl, writeConfig } from './config-url'

describe('구성기 조합 주소', () => {
  it('주소에서 조합과 방향을 읽고, 없거나 모르는 값은 기본값으로 둔다', () => {
    expect(readConfig('')).toEqual({ config: DEFAULT_CONFIG, view: 'front' })
    expect(
      readConfig('?dial=crimson&case=dlc&strap=bracelet&light=night&view=back'),
    ).toEqual({
      config: {
        dial: 'crimson',
        case: 'dlc',
        strap: 'bracelet',
        light: 'night',
      },
      view: 'back',
    })
    expect(readConfig('?dial=gold&view=top')).toEqual({
      config: DEFAULT_CONFIG,
      view: 'front',
    })
  })

  it('기본값은 빼고 쓰며, 다른 매개변수는 남긴다', () => {
    expect(writeConfig('', DEFAULT_CONFIG, 'front')).toBe('')
    expect(
      writeConfig('?debug=', { ...DEFAULT_CONFIG, dial: 'navy' }, 'side'),
    ).toBe('?debug=&dial=navy&view=side')
    expect(writeConfig('?dial=navy', DEFAULT_CONFIG, 'front')).toBe('')
  })

  it('공유 주소는 디버그 같은 다른 매개변수 없이 구성기로 바로 연다', () => {
    expect(
      shareUrl(
        { origin: 'https://ryushin01.github.io', pathname: '/TheCrimsonArc/' },
        { ...DEFAULT_CONFIG, case: 'titanium' },
        'front',
      ),
    ).toBe('https://ryushin01.github.io/TheCrimsonArc/?case=titanium#colors')
  })

  it('쓴 주소를 다시 읽으면 같은 조합이다', () => {
    const config = {
      dial: 'snow',
      case: 'dlc',
      strap: 'crimson',
      light: 'sunset',
    } as const
    expect(readConfig(writeConfig('', config, 'back'))).toEqual({
      config,
      view: 'back',
    })
  })
})
