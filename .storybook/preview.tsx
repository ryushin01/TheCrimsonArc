import type { Preview } from '@storybook/react-vite'
import '../src/app/styles/index.css'

const preview: Preview = {
  parameters: {
    layout: 'padded',
    // 스토리마다 axe 검사를 돌려 위반이 있으면 실패로 표시합니다.
    a11y: { test: 'error' },
    backgrounds: {
      options: {
        paper: { name: 'Paper', value: '#eeebe6' },
        maroon: { name: 'Maroon', value: '#3a0a1c' },
        studio: { name: 'Studio', value: '#16070d' },
      },
    },
  },
  initialGlobals: {
    backgrounds: { value: 'paper' },
  },
  decorators: [
    (Story) => (
      <div lang="ko">
        <Story />
      </div>
    ),
  ],
}

export default preview
