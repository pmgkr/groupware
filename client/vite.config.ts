/// <reference types="vitest/config" />
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import * as path from 'node:path';
import svgr from 'vite-plugin-svgr';
import tsconfigPaths from 'vite-tsconfig-paths';
import { fileURLToPath } from 'node:url';
import { visualizer } from 'rollup-plugin-visualizer';

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
    // 번들 분석을 위한 visualizer 플러그인 (빌드 시에만 실행)
    process.env.ANALYZE && visualizer({
      filename: 'dist/bundle-analysis.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap', // 'treemap', 'sunburst', 'network' 중 선택
    }),
  ].filter(Boolean);

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
      rollupOptions: {
        output: {
          manualChunks: {
            // React 관련 라이브러리들을 별도 청크로 분리
            'react-vendor': ['react', 'react-dom', 'react-router'],
            
            // UI 라이브러리들을 별도 청크로 분리
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
              '@radix-ui/react-toast'
            ],
            
            // 폼 관련 라이브러리들
            'form-vendor': [
              '@hookform/resolvers',
              'react-hook-form',
              'zod'
            ],
            
            // 차트 및 시각화 라이브러리들
            'chart-vendor': [
              'recharts',
              'react-big-calendar'
            ],
            
            // 날짜 관련 라이브러리들
            'date-vendor': [
              'date-fns',
              'react-datetime',
              'react-day-picker'
            ],
            
            // 유틸리티 라이브러리들
            'utils-vendor': [
              'clsx',
              'tailwind-merge',
              'class-variance-authority',
              'cmdk',
              'framer-motion',
              'lucide-react'
            ],
            
            // 폰트 파일들을 별도 청크로 분리
            'fonts': [
              './src/assets/fonts/Pretendard-Regular.woff2',
              './src/assets/fonts/Pretendard-Medium.woff2',
              './src/assets/fonts/Pretendard-SemiBold.woff2',
              './src/assets/fonts/Pretendard-Bold.woff2'
            ]
          },
          // 청크 크기 제한 설정
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
            return `assets/js/[name]-[hash].js`;
          },
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.');
            const ext = info[info.length - 1];
            if (/\.(woff2?|eot|ttf|otf)$/.test(assetInfo.name)) {
              return `assets/fonts/[name]-[hash].${ext}`;
            }
            if (/\.(png|jpe?g|gif|svg)$/.test(assetInfo.name)) {
              return `assets/images/[name]-[hash].${ext}`;
            }
            return `assets/[name]-[hash].${ext}`;
          }
        }
      },
      // 청크 크기 경고 제한을 1000KB로 증가
      chunkSizeWarningLimit: 1000
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
      // API 프록시 설정 (도커 환경)
      proxy: {
        '/api': {
          target: 'http://groupware-server:3001',
          changeOrigin: true,
        },
      },
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
