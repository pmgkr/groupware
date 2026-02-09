import { memo, useMemo } from 'react';
import { Link, useParams, useLocation } from 'react-router';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/useUser';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { formatAmount, formatKST, formatDate } from '@/utils';
import type { pExpenseListItem } from '@/api';

const statusMap = {
  Saved: <Badge variant="grayish">임시저장</Badge>,
  Claimed: <Badge variant="secondary">승인대기</Badge>,
  Confirmed: <Badge>승인완료</Badge>,
  Approved: <Badge className="bg-primary-blue/80">지급대기</Badge>,
  Completed: <Badge className="bg-primary-blue">지급완료</Badge>,
  Rejected: <Badge className="bg-destructive">반려됨</Badge>,
} as const;

const parseCategories = (value?: string) => (value ? Array.from(new Set(value.split('|').filter(Boolean))) : []);

type ExpenseRowProps = {
  role?: 'manager';
  activeTab: 'all' | 'saved' | 'claimed';
  item: pExpenseListItem;
  checked: boolean;
  onCheck: (seq: number, checked: boolean) => void;
};

export const ExpenseCardRow = memo(({ item, activeTab, checked, onCheck, role }: ExpenseRowProps) => {
  const { user_id } = useUser();
  const { search } = useLocation();

  const categories = useMemo(() => parseCategories(item.el_type), [item.el_type]);

  const canCheck = (activeTab === 'saved' && item.user_id === user_id) || (activeTab === 'claimed' && item.status === 'Claimed');
  const showCheckbox = activeTab === 'saved' || activeTab === 'claimed';

  const showMatchMissing = item.alloc_status === 'empty' && item.is_estimate === 'Y' && item.status !== 'Rejected';

  const expenseDetail = useMemo(() => {
    return role === 'manager' ? `/manager/pexpense/${item.seq}${search}` : `/project/${item.project_id}/expense/${item.seq}${search}`;
  }, [role, item.seq, item.project_id, search]);

  return (
    <div className="relative rounded-md border border-gray-300 bg-white p-4">
      {showMatchMissing && (
        <span className="absolute -top-1 -right-1 flex size-3.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-500 opacity-75" />
          <span className="relative inline-flex size-3.5 rounded-full border border-white bg-orange-500" />
        </span>
      )}
      <div className="mb-1 flex justify-between border-b border-gray-300 pb-1">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          {showCheckbox && (
            <Checkbox
              id={`chk_${item.seq}`}
              className="mx-auto flex size-4 items-center justify-center bg-white leading-none"
              checked={checked}
              disabled={!canCheck}
              onCheckedChange={(v) => onCheck(item.seq, !!v)}
            />
          )}
          <span>EXP #{item.exp_id}</span>
        </div>
        {statusMap[item.status as keyof typeof statusMap]}
      </div>

      <Link to={expenseDetail}>
        <div className="my-2 flex items-center gap-2 overflow-hidden text-lg tracking-tight">
          <p className="flex-1 truncate">{item.el_title}</p>
          <strong className="shrink-0 font-medium">{formatAmount(item.el_total)}원</strong>
        </div>
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
      </Link>
    </div>
  );
});
