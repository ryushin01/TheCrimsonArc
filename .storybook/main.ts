import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-a11y'],
  framework: {
    name: '@storybook/react-vite',
    // 앱의 다중 페이지 입력 설정 없이 React와 경로 별칭만 씁니다.
    options: { builder: { viteConfigPath: '.storybook/vite.config.ts' } },
  },
  staticDirs: ['../public'],
}

export default config
