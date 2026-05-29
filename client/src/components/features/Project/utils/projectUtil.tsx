import { Badge } from '@/components/ui/badge';

export function SapStatusDot({ sap_status, size = 'md' }: { sap_status?: string | null; size?: 'sm' | 'md' }) {
  if (!sap_status) return null;
  const color =
    sap_status === 'ready'
      ? 'bg-primary-yellow-500'
      : sap_status === 'registered'
        ? 'bg-primary-blue-500'
        : sap_status === 'completed'
          ? 'bg-gray-400'
          : 'bg-destructive';
  const s = size === 'sm' ? 'size-2.5' : 'size-3';
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
