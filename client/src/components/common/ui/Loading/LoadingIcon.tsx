import { cn } from '@/lib/utils';

function LoadingIcon({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <>
      <style>{`
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          20% {
            transform: translateY(-70%);
          }
          42%, 100% {
            transform: translateY(0);
          }
        }
      `}</style>
      <div
        role="status"
        aria-label="Loading"
        className={cn('bg-primary-blue-500 relative flex h-[79px] w-[79px] items-center justify-center gap-[8%] rounded-full', className)}
        {...props}>
        {/* 첫 번째 원 (왼쪽) */}
        <div
          className="h-[13%] w-[13%] flex-shrink-0 rounded-full bg-white"
          style={{
            animation: 'bounce 2s ease-in-out infinite',
            animationDelay: '0s',
          }}
        />
        {/* 두 번째 원 (중앙) */}
        <div
          className="h-[13%] w-[13%] flex-shrink-0 rounded-full bg-white"
          style={{
            animation: 'bounce 2s ease-in-out infinite',
            animationDelay: '0.2s',
          }}
        />
        {/* 세 번째 원 (오른쪽) */}
        <div
          className="h-[13%] w-[13%] flex-shrink-0 rounded-full bg-white"
          style={{
            animation: 'bounce 2s ease-in-out infinite',
            animationDelay: '0.4s',
          }}
        />
      </div>
    </>
  );
}

export { LoadingIcon };
