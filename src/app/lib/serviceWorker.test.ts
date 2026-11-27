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
})
