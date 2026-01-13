import { cn } from "@/lib/utils"

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
        className={cn(
          "relative flex gap-[8%] items-center justify-center w-[79px] h-[79px] rounded-full bg-primary-blue-500",
          className
        )}
        {...props}
      >
        {/* 첫 번째 원 (왼쪽) */}
        <div
          className="w-[13%] h-[13%] rounded-full bg-white flex-shrink-0"
          style={{
            animation: 'bounce 2s ease-in-out infinite',
            animationDelay: '0s',
          }}
        />
        {/* 두 번째 원 (중앙) */}
        <div
          className="w-[13%] h-[13%] rounded-full bg-white flex-shrink-0"
          style={{
            animation: 'bounce 2s ease-in-out infinite',
            animationDelay: '0.2s',
          }}
        />
        {/* 세 번째 원 (오른쪽) */}
        <div
          className="w-[13%] h-[13%] rounded-full bg-white flex-shrink-0"
          style={{
            animation: 'bounce 2s ease-in-out infinite',
            animationDelay: '0.4s',
          }}
        />
      </div>
    </>
  )
}

export { LoadingIcon }
