'use client';

import { LoadingIcon } from '@/components/common/ui/Loading/LoadingIcon';
import { cn } from '@/lib/utils';

interface LoadingProps {
  title?: string;
  message?: string;
  className?: string;
}

export function Loading({ title, message, className }: LoadingProps) {
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
          'flex flex-col items-center justify-center gap-3 inset-0 z-50 bg-background/60 backdrop-blur-[1px] fixed left-0 top-0 w-[100vw] h-[100vh]',
          className
        )}
      >
        <LoadingIcon className="size-20" />
        {title && (
          <p 
            className="loading-title text-lg text-gray-500 text-center"
            dangerouslySetInnerHTML={{ __html: title }}
          />
        )}
      {message && (
        <div className="flex flex-col items-center justify-center gap-1 text-primary-blue-500 mt-[10px]">
          <p className="text-sm bg-primary-blue-100 w-[41px] h-[18px] rounded-md flex items-center justify-center">tip</p>
          <p className="text-sm">{message}</p>
        </div>
      )}
      </div>
    </>
  );
}

