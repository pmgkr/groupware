'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { LoadingIcon } from '@/components/common/ui/Loading/LoadingIcon';
import { cn } from '@/lib/utils';

export interface LoadingOptions {
  title?: string;
  message?: string;
}

type LoadingContextValue = {
  showLoading: (optionsOrPromise?: LoadingOptions | Promise<any>, options?: LoadingOptions) => Promise<any> | void;
  hideLoading: () => void;
};

const LoadingContext = createContext<LoadingContextValue | null>(null);

export function useLoading() {
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error('useLoading must be used within LoadingProvider');
  return ctx;
}

function LoadingComponent({ title, message, className }: { title?: string; message?: string; className?: string }) {
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
          'bg-background/90 fixed inset-0 top-0 left-0 z-[150] flex h-[100vh] w-[100vw] flex-col items-center justify-center gap-3 backdrop-blur-[1px]',
          className
        )}>
        <LoadingIcon className="size-20" />
        {title && <p className="loading-title text-center text-lg text-gray-500" dangerouslySetInnerHTML={{ __html: title }} />}
        {message && (
          <div className="text-primary-blue-500 mt-[10px] flex flex-col items-center justify-center gap-1">
            <p className="bg-primary-blue-100 flex h-[18px] w-[41px] items-center justify-center rounded-md text-sm">tip</p>
            <p className="text-sm">{message}</p>
          </div>
        )}
      </div>
    </>
  );
}

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState<LoadingOptions>({});

  const showLoading = useCallback((optionsOrPromise?: LoadingOptions | Promise<any>, options?: LoadingOptions) => {
    // Promise를 받은 경우 (자동 완료)
    if (optionsOrPromise instanceof Promise) {
      const promise = optionsOrPromise;
      const opts = options || {};
      setLoadingOptions(opts);
      setIsLoading(true);

      return promise
        .then((result) => {
          setIsLoading(false);
          setLoadingOptions({});
          return result;
        })
        .catch((error) => {
          setIsLoading(false);
          setLoadingOptions({});
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
  }, []);

  return (
    <LoadingContext.Provider value={{ showLoading, hideLoading }}>
      {children}
      {isLoading && <LoadingComponent title={loadingOptions.title} message={loadingOptions.message} />}
    </LoadingContext.Provider>
  );
}

// 기존 Loading 컴포넌트도 export (직접 사용하는 경우를 위해)
export function Loading({ title, message, className }: { title?: string; message?: string; className?: string }) {
  return <LoadingComponent title={title} message={message} className={className} />;
}
