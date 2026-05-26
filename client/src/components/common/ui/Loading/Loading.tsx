'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { LoadingIcon } from '@/components/common/ui/Loading/LoadingIcon';
import Lottie from 'lottie-react';
import check from '@/assets/images/common/check.json';
import close from '@/assets/images/common/close.json';
import { cn } from '@/lib/utils';

export interface LoadingOptions {
  title?: string;
  message?: string;
}

type ResultAction = {
  label: string;
  onClick?: () => void;
  keepLoading?: boolean; // true이면 버튼 클릭 후 overlay를 닫지 않고 로딩 화면 유지
  variant?: 'primary' | 'secondary'; // 버튼 스타일 (default: secondary)
};

type LoadingResult = {
  type: 'success' | 'error';
  message: string;
  actions?: ResultAction[];
} | null;

type ShowResultOptions = {
  duration?: number;
  actions?: ResultAction[];
};

type LoadingContextValue = {
  showLoading: (optionsOrPromise?: LoadingOptions | Promise<any>, options?: LoadingOptions) => Promise<any> | void;
  hideLoading: () => void;
  updateProgress: (value: number) => void;
  markProgressError: (duration?: number) => Promise<void>;
  showResult: (type: 'success' | 'error', message: string, options?: number | ShowResultOptions) => Promise<void>;
};

const LoadingContext = createContext<LoadingContextValue | null>(null);

export function useLoading() {
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error('useLoading must be used within LoadingProvider');
  return ctx;
}

function LoadingComponent({
  title,
  message,
  progress,
  progressError,
  result,
  className,
}: {
  title?: string;
  message?: string;
  progress?: number | null;
  progressError?: boolean;
  result?: LoadingResult;
  className?: string;
}) {
  const [animatedProgress, setAnimatedProgress] = useState<number>(0);
  const rafRef = useRef<number | null>(null);
  const currentProgressRef = useRef<number>(0);

  useEffect(() => {
    if (typeof progress !== 'number') {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      setAnimatedProgress(0);
      currentProgressRef.current = 0;
      return;
    }

    const from = currentProgressRef.current;
    const to = progress;
    const DURATION = 600;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / DURATION, 1);
      const eased = 1 - Math.pow(1 - t, 2); // ease-out quadratic
      const value = from + (to - from) * eased;
      setAnimatedProgress(value);
      currentProgressRef.current = value;

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [progress]);

  return (
    <>
      <style>{`
        .loading-title {
          line-height: 1.3;
        }
        .loading-title em {
          font-style: normal;
          color: rgb(31 41 55);
        }
      `}</style>
      <div
        className={cn(
          'bg-background/90 fixed inset-0 top-0 left-0 z-[150] flex h-[100vh] w-[100vw] flex-col items-center justify-center gap-3 p-4 backdrop-blur-[1px]',
          className
        )}>
        {result ? (
          <>
            {result.type === 'success' ? (
              <Lottie animationData={check} loop={false} className="size-16" />
            ) : (
              <Lottie animationData={close} loop={false} className="size-16" />
            )}
            <div
              className="text-center text-base font-medium break-keep whitespace-pre-wrap text-gray-700"
              dangerouslySetInnerHTML={{ __html: result.message }}
            />
            {result.actions && result.actions.length > 0 && (
              <div className="mt-2 flex gap-2">
                {result.actions.map((action, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={action.onClick}
                    className={cn(
                      'cursor-pointer rounded-md border px-4 py-2 text-sm font-medium',
                      action.variant === 'primary'
                        ? 'border-primary-blue-500 bg-primary-blue-500 hover:bg-primary-blue-600 text-white'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    )}>
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <LoadingIcon className="size-20" />
            {title && <p className="loading-title text-center text-lg text-gray-500" dangerouslySetInnerHTML={{ __html: title }} />}
            {typeof progress === 'number' && (
              <div className="mt-2 w-64">
                <div className="mb-1.5 flex justify-between text-sm text-gray-500">
                  <span className={progressError ? 'text-red-500' : ''}>{progressError ? '업로드 실패' : '업로드 중...'}</span>
                  <span className={progressError ? 'text-red-500' : ''}>{Math.round(animatedProgress)}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={cn('h-full rounded-full', progressError ? 'bg-red-500' : 'bg-primary-blue-500')}
                    style={{ width: `${animatedProgress}%` }}
                  />
                </div>
              </div>
            )}
            {message && !progressError && (
              <div className="text-primary-blue-500 mt-[10px] flex flex-col items-center justify-center gap-1">
                <p className="bg-primary-blue-100 flex h-[18px] w-[41px] items-center justify-center rounded-md text-sm">tip</p>
                <p className="text-sm">{message}</p>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState<LoadingOptions>({});
  const [progress, setProgress] = useState<number | null>(null);
  const [progressError, setProgressError] = useState(false);
  const [result, setResult] = useState<LoadingResult>(null);
  const dismissRef = useRef<(() => void) | null>(null);
  const keepLoadingRef = useRef(false);

  const showLoading = useCallback((optionsOrPromise?: LoadingOptions | Promise<any>, options?: LoadingOptions) => {
    setProgress(null);
    setProgressError(false);
    setResult(null);

    // Promise를 받은 경우 (자동 완료)
    if (optionsOrPromise instanceof Promise) {
      const promise = optionsOrPromise;
      const opts = options || {};
      setLoadingOptions(opts);
      setIsLoading(true);

      return promise
        .then((res) => {
          setIsLoading(false);
          setLoadingOptions({});
          setProgress(null);
          setResult(null);
          return res;
        })
        .catch((error) => {
          setIsLoading(false);
          setLoadingOptions({});
          setProgress(null);
          setResult(null);
          throw error;
        });
    }

    // 옵션만 받은 경우 (수동 제어)
    const opts = optionsOrPromise as LoadingOptions | undefined;
    setLoadingOptions(opts || {});
    setIsLoading(true);
  }, []);

  const hideLoading = useCallback(() => {
    setIsLoading(false);
    setLoadingOptions({});
    setProgress(null);
    setProgressError(false);
    setResult(null);
  }, []);

  const updateProgress = useCallback((value: number) => {
    setProgress(Math.min(100, Math.max(0, value)));
  }, []);

  const markProgressError = useCallback(async (duration = 800): Promise<void> => {
    setProgressError(true);
    await new Promise((r) => setTimeout(r, duration));
    setProgressError(false);
  }, []);

  const showResult = useCallback(
    async (type: 'success' | 'error', message: string, options?: number | ShowResultOptions): Promise<void> => {
      const duration = typeof options === 'number' ? options : (options?.duration ?? 1500);
      const rawActions = typeof options === 'object' ? options?.actions : undefined;
      const hasActions = !!rawActions?.length;

      // 성공 시 progress가 100%까지 애니메이션(600ms) 완료 후 결과 화면 표시
      if (type === 'success') {
        await new Promise((r) => setTimeout(r, 700));
      }

      setProgress(null);
      setProgressError(false);

      await new Promise<void>((resolve) => {
        dismissRef.current = resolve;

        const wrappedActions = rawActions?.map((a) => ({
          label: a.label,
          variant: a.variant,
          onClick: () => {
            a.onClick?.();
            if (a.keepLoading) keepLoadingRef.current = true;
            resolve();
          },
        }));

        setResult({ type, message, actions: wrappedActions });

        // 액션 버튼이 없으면 duration 후 자동 닫힘
        if (!hasActions) setTimeout(resolve, duration);
      });

      dismissRef.current = null;
      setResult(null);

      if (!keepLoadingRef.current) {
        setIsLoading(false);
        setLoadingOptions({});
      }
      keepLoadingRef.current = false;
    },
    []
  );

  return (
    <LoadingContext.Provider value={{ showLoading, hideLoading, updateProgress, markProgressError, showResult }}>
      {children}
      {isLoading && (
        <LoadingComponent
          title={loadingOptions.title}
          message={loadingOptions.message}
          progress={progress}
          progressError={progressError}
          result={result}
        />
      )}
    </LoadingContext.Provider>
  );
}

// 기존 Loading 컴포넌트도 export (직접 사용하는 경우를 위해)
export function Loading({ title, message, className }: { title?: string; message?: string; className?: string }) {
  return <LoadingComponent title={title} message={message} className={className} />;
}
