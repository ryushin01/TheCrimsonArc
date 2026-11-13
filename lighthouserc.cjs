/** Lighthouse CI: 프로덕션 빌드(dist)를 모바일 기준으로 측정합니다. */
module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      url: ['http://localhost/', 'http://localhost/studio/'],
      numberOfRuns: 1,
      settings: {
        // GPU가 없는 CI에서도 WebGL이 돌도록 소프트웨어 렌더링을 씁니다.
        chromeFlags:
          '--headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --no-sandbox',
      },
    },
    assert: {
      assertions: {
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        // 소프트웨어 WebGL이라 실제 기기보다 낮게 나오므로 경고만 냅니다.
        'categories:performance': ['warn', { minScore: 0.6 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 3000 }],
        'total-byte-weight': ['warn', { maxNumericValue: 1_600_000 }],
      },
    },
    upload: { target: 'filesystem', outputDir: './lhci-report' },
  },
}
