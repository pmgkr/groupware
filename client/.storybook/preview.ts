import type { Preview } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router';
import '../src/index.css'; // Tailwind 포함된 전역 CSS

const preview: Preview = {
  parameters: {
    controls: {
      expanded: true, // 컨트롤 패널을 기본적으로 확장된 상태로 표시
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },
  },
};

export default preview;
