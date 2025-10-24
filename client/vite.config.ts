/// <reference types="vitest/config" />
// vite.config.ts
import { defineConfig, loadEnv, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import * as path from 'node:path';
import svgr from 'vite-plugin-svgr';
import mkcert from 'vite-plugin-mkcert';
import tsconfigPaths from 'vite-tsconfig-paths';
import { fileURLToPath } from 'node:url';
import { visualizer } from 'rollup-plugin-visualizer';
import { createRequire } from 'node:module';

// ESM에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isVitest = !!process.env.VITEST;

  // 공통(앱) 플러그인
  const plugins = [
    react(),
    mkcert(),
    tailwindcss(),
    tsconfigPaths(),
    svgr({
      include: '**/*.svg?react',
      svgrOptions: {
        replaceAttrValues: { '#000': 'currentColor', black: 'currentColor' },
      },
    }),
    // 번들 분석(빌드 시 설정: ANALYZE=1)
    env.ANALYZE &&
      visualizer({
        filename: 'dist/bundle-analysis.html',
        open: true,
        gzipSize: true,
        brotliSize: true,
        template: 'treemap',
      }),
  ].filter(Boolean) as PluginOption[];

  // Vitest일 때만 Storybook 테스트 플러그인 동기 로드(비동기 X)
  let testConfig: any = undefined;
  if (isVitest) {
    const require = createRequire(import.meta.url);
    const { storybookTest } = require('@storybook/addon-vitest/vitest-plugin');
    testConfig = {
      projects: [
        {
          extends: true,
          plugins: [
            storybookTest({
              configDir: path.join(__dirname, '.storybook'),
            }),
          ],
          test: {
            name: 'storybook',
            browser: {
              enabled: true,
              headless: true,
              provider: 'playwright',
              instances: [{ browser: 'chromium' }],
            },
            setupFiles: ['.storybook/vitest.setup.ts'],
          },
        },
      ],
    };
  }

  return {
    plugins,

    build: {
      outDir: 'dist',
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router'],
            'ui-vendor': [
              '@radix-ui/react-avatar',
              '@radix-ui/react-checkbox',
              '@radix-ui/react-dialog',
              '@radix-ui/react-icons',
              '@radix-ui/react-label',
              '@radix-ui/react-popover',
              '@radix-ui/react-radio-group',
              '@radix-ui/react-scroll-area',
              '@radix-ui/react-select',
              '@radix-ui/react-separator',
              '@radix-ui/react-slot',
              '@radix-ui/react-switch',
              '@radix-ui/react-tabs',
              '@radix-ui/react-toast',
            ],
            'form-vendor': ['@hookform/resolvers', 'react-hook-form', 'zod'],
            'chart-vendor': ['recharts', 'react-big-calendar'],
            'date-vendor': ['date-fns', 'react-datetime', 'react-day-picker'],
            'utils-vendor': ['clsx', 'tailwind-merge', 'class-variance-authority', 'cmdk', 'framer-motion', 'lucide-react'],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },

    server: {
      open: true,
      // 프론트에서 직접 호출로 proxy 주석처리
      // proxy: {
      //   '/api': {
      //     target: 'https://gbend.cafe24.com',
      //     changeOrigin: true,
      //     secure: true,
      //     // 프론트에서 "/api/login" > 백엔드에선 "/login"
      //     rewrite: (pathStr: string) => pathStr.replace(/^\/api/, ''),
      //     // Vite 타입에 없지만 http-proxy가 지원
      //     cookieDomainRewrite: 'localhost',
      //   },
      // },
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@components': path.resolve(__dirname, 'src/components'),
      },
    },

    ...(isVitest ? { test: testConfig } : {}),

    optimizeDeps: {
      exclude: [
        'pdfjs-dist',
        '@storybook/*',
        '@storybook/addon-essentials',
        '@storybook/addon-docs',
        '@storybook/addon-a11y',
        '@storybook/addon-onboarding',
        '@storybook/addon-vitest',
        '@chromatic-com/storybook',
      ],
    },
  };
});
