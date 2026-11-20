import { afterEach, describe, expect, it } from 'vitest'
import {
  INTRO_SEEN_KEY,
  type IntroEnv,
  markIntroSeen,
  readIntroEnv,
  shouldShowIntro,
} from './intro'

const firstVisit: IntroEnv = {
  force: null,
  hash: '',
  shared: false,
  navigation: 'navigate',
  seen: false,
  reduced: false,
  paused: false,
}

describe('첫 화면 인트로를 보여 줄지', () => {
  it('처음 들어오면 보여 준다', () => {
    expect(shouldShowIntro(firstVisit)).toBe(true)
  })

  it.each<[string, Partial<IntroEnv>]>([
    ['이번 탭에서 이미 봤으면', { seen: true }],
    ['구간 링크로 오면', { hash: '#colors' }],
    ['주소창의 조합 주소(?dial=…, 해시 없음)로 오면', { shared: true }],
    ['새로고침이면', { navigation: 'reload' }],
    ['뒤로·앞으로 가기면', { navigation: 'back_forward' }],
    ['움직임을 멈췄으면', { paused: true }],
    ['동작 줄이기면', { reduced: true }],
    ['?intro=0이면', { force: '0' }],
  ])('%s 건너뛴다', (_, change) => {
    expect(shouldShowIntro({ ...firstVisit, ...change })).toBe(false)
  })

  it('?intro=1이면 이미 봤거나 구간 링크·공유 주소여도 보여 준다', () => {
    expect(
      shouldShowIntro({
        ...firstVisit,
        force: '1',
        seen: true,
        hash: '#specs',
        shared: true,
        navigation: 'reload',
      }),
    ).toBe(true)
  })

  it.each<[string, Partial<IntroEnv>]>([
    ['동작 줄이기면', { reduced: true }],
    ['움직임을 멈췄으면', { paused: true }],
  ])('?intro=1이어도 %s 건너뛴다', (_, change) => {
    expect(shouldShowIntro({ ...firstVisit, force: '1', ...change })).toBe(
      false,
    )
  })
})

describe('인트로 상태 읽기와 남기기', () => {
  afterEach(() => {
    window.sessionStorage.clear()
    window.history.replaceState(null, '', '/')
  })

  it('주소와 이번 탭 기록을 읽는다', () => {
    window.history.replaceState(null, '', '/?intro=1&dial=navy#anatomy')
    expect(readIntroEnv()).toMatchObject({
      force: '1',
      hash: '#anatomy',
      shared: true,
      seen: false,
    })
    markIntroSeen()
    expect(window.sessionStorage.getItem(INTRO_SEEN_KEY)).toBe('seen')
    expect(readIntroEnv().seen).toBe(true)
  })
})
