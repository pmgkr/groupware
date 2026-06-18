import { Badge } from '@/components/ui/badge';

export function SapStatusDot({ sap_status, size = 'md' }: { sap_status?: string | null; size?: 'sm' | 'md' }) {
  if (!sap_status) return null;
  const colorMap: Record<string, string> = {
    ready: 'bg-yellow-400', // 미등록
    registered: 'bg-primary-blue-500', // 등록
    check: 'bg-orange-400', // 수정필요
    applied: 'bg-emerald-500', // 반영완료
    completed: 'bg-gray-400', // 종료
  };
  const color = colorMap[sap_status] ?? 'bg-destructive';
  const s = size === 'sm' ? 'size-2.5' : 'size-3';

  if (sap_status === 'check') {
    return (
      <span className={`absolute -top-1 -right-1 flex ${s}`}>
        <span className={`${color} ${s} absolute inline-flex h-full w-full animate-ping rounded-full opacity-75`} />
        <span className={`${color} ${s} relative inline-flex rounded-full border border-white`} />
      </span>
    );
  }

  return (
    <span className={`absolute -top-1 -right-1 flex ${s}`}>
      <span className={`${color} ${s} relative inline-flex rounded-full border border-white`}></span>
    </span>
  );
}

type BadgeSize = 'default' | 'md' | 'table' | 'dot';

export function getStatusBadge(project_status: string, sap_status?: string | null, dotSize?: 'sm' | 'md', badgeSize?: BadgeSize) {
  const listClass = badgeSize ? undefined : 'h-6 md:h-auto';
  const sizeProps = badgeSize ? { size: badgeSize } : {};

  const badge = (
    {
      'in-progress': (
        <Badge variant="secondary" className={listClass} {...sizeProps}>
          진행중
        </Badge>
      ),
      Closed: (
        <Badge className={`bg-primary-blue ${listClass ?? ''}`.trim()} {...sizeProps}>
          종료됨
        </Badge>
      ),
      Completed: (
        <Badge variant="grayish" className={listClass} {...sizeProps}>
          정산완료
        </Badge>
      ),
      Cancelled: (
        <Badge className={`bg-destructive ${listClass ?? ''}`.trim()} {...sizeProps}>
          취소됨
        </Badge>
      ),
    } as Record<string, React.ReactNode>
  )[project_status];

  if (!badge) return null;

  if (sap_status) {
    return (
      <div className="relative inline-flex">
        {badge}
        <SapStatusDot sap_status={sap_status} size={dotSize} />
      </div>
    );
  }

  return badge;
}

export const parseCategories = (cate: string) => cate?.split('|').filter(Boolean) ?? [];
