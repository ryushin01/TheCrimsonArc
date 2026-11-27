import { registerServiceWorker } from './serviceWorker'

describe('registerServiceWorker', () => {
  const register =
    vi.fn<(url: string, options?: RegistrationOptions) => Promise<void>>()

  beforeEach(() => {
    register.mockReset().mockResolvedValue()
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('하위 경로 배포에서도 그 경로의 sw.js를 그 범위로 등록한다', () => {
    vi.stubGlobal('navigator', { serviceWorker: { register } })
    registerServiceWorker('/TheCrimsonArc/')
    expect(register).toHaveBeenCalledWith('/TheCrimsonArc/sw.js', {
      scope: '/TheCrimsonArc/',
    })
  })

  it('서비스 워커를 쓸 수 없는 브라우저에서는 아무것도 하지 않는다', () => {
    vi.stubGlobal('navigator', {})
    expect(() => registerServiceWorker('/')).not.toThrow()
  })

  it('등록에 실패해도 오류를 내지 않는다', async () => {
    register.mockRejectedValue(new Error('SecurityError'))
    vi.stubGlobal('navigator', { serviceWorker: { register } })
    registerServiceWorker('/')
    await expect(register.mock.results[0]?.value).rejects.toThrow()
  })

  describe('맡기 전에 받은 자료 알리기', () => {
    const postMessage = vi.fn()
    const worker = { postMessage }

    /** controllerchange를 직접 일으킬 수 있는 serviceWorker 흉내 */
    function fakeContainer(controller: typeof worker | null) {
      const target = new EventTarget()
      return Object.assign(target, {
        controller,
        register,
        takeControl() {
          this.controller = worker
          target.dispatchEvent(new Event('controllerchange'))
        },
      })
    }

    beforeEach(() => {
      postMessage.mockReset()
      const entry = (name: string): PerformanceEntry => ({
        name,
        entryType: 'resource',
        startTime: 0,
        duration: 0,
        toJSON: () => ({ name }),
      })
      vi.spyOn(performance, 'getEntriesByType').mockReturnValue([
        entry(`${location.origin}/sequence/lg/000.avif`),
        entry('https://example.com/other.png'),
      ])
    })
    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('처음 들어온 페이지는 서비스 워커가 맡으면 이미 받은 같은 출처 자료 주소를 보낸다', async () => {
      const container = fakeContainer(null)
      vi.stubGlobal('navigator', { serviceWorker: container })
      registerServiceWorker('/')
      await vi.waitFor(() => expect(register).toHaveBeenCalled())
      expect(postMessage).not.toHaveBeenCalled()

      container.takeControl()
      await vi.waitFor(() =>
        expect(postMessage).toHaveBeenCalledWith({
          type: 'cache-loaded',
          urls: [`${location.origin}/sequence/lg/000.avif`],
        }),
      )
    })

    it('이미 맡겨진 채 열린 페이지(다시 방문)는 보내지 않는다', async () => {
      vi.stubGlobal('navigator', { serviceWorker: fakeContainer(worker) })
      registerServiceWorker('/')
      await vi.waitFor(() => expect(register).toHaveBeenCalled())
      await Promise.resolve()
      expect(postMessage).not.toHaveBeenCalled()
    })
  })
})
