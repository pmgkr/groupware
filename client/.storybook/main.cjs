// .storybook/main.cjs
/** @type {import('@storybook/react-vite').StorybookConfig} */
const path = require('node:path');
const tsconfigPaths = require('vite-tsconfig-paths').default;

module.exports = {
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
    const { mergeConfig } = require('vite'); // CJS require 사용
    return mergeConfig(baseConfig, {
      plugins: [tsconfigPaths()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '../src'),
          '@components': path.resolve(__dirname, '../src/components'),
        },
      },
    });
  },
};
