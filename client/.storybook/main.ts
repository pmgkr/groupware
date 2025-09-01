// .storybook/main.ts
import type { StorybookConfig } from '@storybook/react-vite';
import * as path from 'node:path'; // ESM 안전
import tsconfigPaths from 'vite-tsconfig-paths';
import { fileURLToPath } from 'node:url'; // __dirname 대체

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-docs',
    '@storybook/addon-onboarding',
    '@storybook/addon-a11y',
    '@storybook/addon-vitest',
  ],
  framework: { name: '@storybook/react-vite', options: {} },

  async viteFinal(baseConfig) {
    const { mergeConfig } = await import('vite'); // 동적 ESM import
    return mergeConfig(baseConfig, {
      plugins: [tsconfigPaths()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '../src'),
          '@components': path.resolve(__dirname, '../src/components'),
        },
      },
      // 필요할 때만:
      // define: { 'process.env': {} },
    });
  },
};

export default config;
