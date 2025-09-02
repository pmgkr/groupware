/// <reference types="vitest/config" />
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import * as path from 'node:path';
import svgr from 'vite-plugin-svgr';
import tsconfigPaths from 'vite-tsconfig-paths';
import { fileURLToPath } from 'node:url';

// ESM에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(async ({}) => {
  const isVitest = !!process.env.VITEST;

  // 공통(앱) 플러그인
  const plugins = [
    react(),
    tailwindcss(),
    tsconfigPaths(),
    svgr({
      include: '**/*.svg?react',
      svgrOptions: {
        replaceAttrValues: {
          '#000': 'currentColor',
          black: 'currentColor',
        },
      },
    }),
  ];




  // Vitest에서만 Storybook 테스트 플러그인 동적 로드
  let testConfig: any = undefined;
  if (isVitest) {
    const { storybookTest } = await import('@storybook/addon-vitest/vitest-plugin');
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
    // Vercel의 Output 디렉토리와 일치시키는 걸 권장 (client 프로젝트면 보통 'dist')
    build: {
      outDir: 'dist',
    },
    server: {
      open: true,
      // 공휴일 API 프록시 서버 사용
      // proxy: {
      //   '/api/holidays': {
      //     target: 'http://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService',
      //     changeOrigin: true,
      //     rewrite: (pathStr: string) => pathStr.replace(/^\/api\/holidays/, ''), // path → pathStr 타입 명시
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
    // 안전장치: 앱 번들 최적화에서 Storybook 패키지 제외 (혹시 간접 import가 있어도 차단)
    optimizeDeps: {
      exclude: [
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
