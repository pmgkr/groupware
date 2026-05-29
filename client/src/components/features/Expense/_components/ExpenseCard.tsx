import { memo } from 'react';
import { Link, useLocation } from 'react-router';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/useUser';
import { formatAmount, formatDate } from '@/utils';
import type { ExpenseItem } from './ExpenseRow';

import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

import { UserRoundPen } from 'lucide-react';

const statusMap = {
  Saved: <Badge variant="grayish">임시저장</Badge>,
  Claimed: <Badge variant="secondary">승인대기</Badge>,
  Confirmed: <Badge>승인완료</Badge>,
  SAP: <Badge className="bg-primary-pink-500">SAP등록</Badge>,
  Approved: <Badge className="bg-primary-blue/80">지급대기</Badge>,
  Completed: <Badge className="bg-primary-blue">지급완료</Badge>,
  Rejected: <Badge className="bg-destructive">반려됨</Badge>,
} as const;

type ExpenseCardProps = {
  role: 'admin' | 'manager' | 'user';
  item: ExpenseItem;
  activeTab?: 'all' | 'saved' | 'claimed';
  checked: boolean;
  onCheck: (seq: number, checked: boolean) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onAInfo: (item: any) => void;
  onDdate?: (seq: number, ddate: Date) => void;
  handlePDFDownload?: (seq: number, expId: string, userName: string) => void;
};

export const ExpenseCard = memo(({ role, item, activeTab, checked, onCheck, onAInfo }: ExpenseCardProps) => {
  const { user_id } = useUser();
  const { search } = useLocation();

  const categories = Array.from(new Set((item.el_type?.split('|') ?? []).filter(Boolean)));
  const isAddInfo = (item.add_info ?? []).length;

  const detailPath =
    role === 'admin'
      ? `/admin/finance/nexpense/${item.seq}${search}`
      : role === 'manager'
        ? `/manager/nexpense/${item.exp_id}${search}`
        : `/expense/${item.exp_id}${search}`;

  const showCheckbox =
    role === 'admin' || activeTab === 'saved' || activeTab === 'claimed';

  const isCheckboxDisabled =
    role === 'admin'
      ? item.status === 'Saved' || item.status === 'Rejected'
      : role === 'manager'
        ? item.status !== 'Claimed'
        : activeTab === 'saved'
          ? item.user_id !== user_id
          : item.status !== 'Claimed';

  const header = (
    <div className={cn('mb-1 flex justify-between', role !== 'admin' && 'border-b border-gray-300 pb-1')}>
      <div className="flex items-center gap-2 text-sm text-gray-600">
        {showCheckbox && (
          <Checkbox
            id={`chk_${item.seq}`}
            className="mx-auto flex size-4 items-center justify-center bg-white leading-none"
            checked={checked}
            onCheckedChange={(v) => onCheck(item.seq, !!v)}
            disabled={isCheckboxDisabled}
          />
        )}
        <span>EXP #{item.exp_id}</span>
        {isAddInfo > 0 && (
          <span
            className="ml-1 inline-flex cursor-pointer items-center gap-0.5 align-middle text-xs text-gray-500"
            onClick={() => onAInfo(item)}>
            <UserRoundPen className="size-3" />
            {isAddInfo}
          </span>
        )}
      </div>
      {statusMap[item.status as keyof typeof statusMap]}
    </div>
  );

  const titleRow = (
    <div className="my-2 flex items-center gap-2 overflow-hidden text-lg tracking-tight">
      <p className="flex-1 truncate">{item.el_title}</p>
      <strong className="shrink-0 font-medium">{formatAmount(item.el_total)}원</strong>
    </div>
  );

  const footerRow = (
    <div className="flex items-center justify-between text-sm text-gray-500">
      <div className="flex flex-1 gap-2 overflow-hidden">
        <span className="relative pr-2 after:absolute after:top-1/2 after:left-full after:h-3 after:w-px after:-translate-y-1/2 after:bg-gray-300 after:content-['']">
          {formatDate(item.wdate, true)}
        </span>
        <span className="relative pr-2 after:absolute after:top-1/2 after:left-full after:h-3 after:w-px after:-translate-y-1/2 after:bg-gray-300 after:content-['']">
          {item.el_method}
        </span>
        <TooltipProvider>
          <Tooltip>
            <div className="flex cursor-default items-center justify-center gap-1">
              {categories.length === 1 ? (
                <span>{categories[0]}</span>
              ) : (
                <>
                  <span>{categories[0]}</span>
                  <TooltipTrigger asChild>
                    <Badge variant="grayish" className="px-1 py-0 text-xs">
                      +{categories.length - 1}
                    </Badge>
                  </TooltipTrigger>
                </>
              )}
            </div>
            {categories.length > 1 && <TooltipContent>{categories.join(', ')}</TooltipContent>}
          </Tooltip>
        </TooltipProvider>
      </div>
      <p className="shrink-0">{item.user_nm}</p>
    </div>
  );

  return (
    <div className="relative rounded-md border border-gray-300 bg-white p-4">
      {header}
      {role === 'admin' ? (
        <>
          <Link to={detailPath}>{titleRow}</Link>
          {footerRow}
        </>
      ) : (
        <Link to={detailPath}>
          {titleRow}
          {footerRow}
        </Link>
      )}
    </div>
  );
});

ExpenseCard.displayName = 'ExpenseCard';
