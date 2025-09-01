// .storybook/main.ts
import type { StorybookConfig } from '@storybook/react-vite';
import * as path from 'path'; // default → namespace import 로 변경
import tsconfigPaths from 'vite-tsconfig-paths';
import { fileURLToPath } from 'url'; // ESM에서 __dirname 대체용
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-docs',
    '@storybook/addon-onboarding',
    '@storybook/addon-a11y',
    '@storybook/addon-vitest',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  async viteFinal(baseConfig) {
    const { mergeConfig } = await import('vite');
    return mergeConfig(baseConfig, {
      plugins: [tsconfigPaths()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '../src'),
          '@components': path.resolve(__dirname, '../src/components'),
        },
      },
      define: {
        'process.env': {},
      },
    });
  },
};

export default config;
