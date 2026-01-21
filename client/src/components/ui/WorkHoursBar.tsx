// WorkHoursBar.tsx
import { cn } from '@/lib/utils';

type Props = {
  hours: number; // 이번 주 근무시간
  max?: number; // 최대치(디폴트 52)
  safe?: number; // 정상 구간 끝(예: 40h)
  warn?: number; // 경고 구간 끝(예: 48h)
  className?: string;
  hide40h?: boolean; // 40h 텍스트 숨김 여부
};

export default function WorkHoursBar({ hours, max = 52, safe = 40, warn = 48, className, hide40h = false }: Props) {
  const pct = Math.min(100, Math.max(0, (hours / max) * 100));

  // 구간에 따라 그라데이션 클래스 결정
  const gradient =
    hours <= safe
      ? 'from-sky-500 via-teal-500 to-green-400' // 파랑~초록
      : hours <= warn
        ? 'from-green-400 via-yellow-400 to-amber-500' // 초록~주황
        : 'from-yellow-400 via-orange-500 to-rose-600'; // 주황~빨강

  return (
    <div className={cn('w-full', className)}>
      {/* 트랙 */}
      <div className="relative mb-4 h-3.5 max-md:h-2.5">
        {/* 진행 바 */}
        <div className="absolute inset-0 overflow-hidden rounded-xl bg-gray-300">
          <div
            className={cn('absolute top-0 left-0 h-full rounded-full bg-gradient-to-r', gradient)}
            style={{ width: `${pct}%` }}
            aria-valuemin={0}
            aria-valuemax={max}
            aria-valuenow={hours}
            role="progressbar"
          />
        </div>

        <div className="absolute top-full right-0 left-0">
          <div className={`absolute top-0 h-5 text-[11px] text-gray-500 ${hide40h ? 'max-[1800px]:hidden' : ''}`} style={{ left: `${(safe / max) * 100}%` }}>
            <div className="mt-1.5">40h</div>
          </div>
          <div className="absolute top-0 right-0 h-5 text-[11px] text-gray-500">
            <div className="mt-1.5">52h</div>
          </div>
        </div>
      </div>
    </div>
  );
}
