// src/components/features/Expense/_components/ExpensListeRow.tsx
import { memo } from 'react';
import { Link, useLocation } from 'react-router';
import { formatAmount, formatKST } from '@/utils';
import { format } from 'date-fns';
import { useUser } from '@/hooks/useUser';

import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { TableCell, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

import { type ExpenseListItems } from '@/api/manager/pexpense';

type ExpenseRowProps = {
  item: ExpenseListItems;
  checked: boolean;
  onCheck: (seq: number, checked: boolean) => void;
};

export const ManagerListRow = memo(({ item, checked, onCheck }: ExpenseRowProps) => {
  const { user_id } = useUser();
  const { search } = useLocation();

  const formatDate = (d?: string | Date | null) => {
    if (!d) return '';
    const date = typeof d === 'string' ? new Date(d) : d;
    return format(date, 'yyyy-MM-dd');
  };

  const statusMap = {
    Saved: (
      <Badge variant="grayish" size="table">
        임시저장
      </Badge>
    ),
    Claimed: (
      <Badge variant="secondary" size="table">
        승인대기
      </Badge>
    ),
    Confirmed: <Badge size="table">승인완료</Badge>,
    Approved: (
      <Badge className="bg-primary-blue/80" size="table">
        지급대기
      </Badge>
    ),
    Completed: (
      <Badge className="bg-primary-blue" size="table">
        지급완료
      </Badge>
    ),
    Rejected: (
      <Badge className="bg-destructive" size="table">
        반려됨
      </Badge>
    ),
  } as const;

  // 비용 용도 슬라이드 유틸함수
  const parseCategories = (cate: string) => cate?.split('|').filter(Boolean) ?? [];
  const categories = Array.from(new Set(parseCategories(item.el_type))); // 중복 카테고리 제거

  // 비용 항목 & 견적서 매칭 누락 체크용
  const matchMissing = item.alloc_status === 'empty' && item.is_estimate === 'Y' && (
    <span className="absolute -top-1 -right-1 flex size-3">
      {/* 애니메이션 */}
      <span className={`bg-destructive absolute inline-flex h-full w-full animate-ping rounded-full opacity-75`}></span>
      {/* 도트 */}
      <span className={`bg-destructive relative inline-flex size-3 rounded-full border border-white`}></span>
    </span>
  );

  return (
    <TableRow className="[&_td]:px-2 [&_td]:text-sm [&_td]:leading-[1.3] 2xl:[&_td]:text-[13px]">
      <TableCell className="whitespace-nowrap">
        <Link to={`/project/${item.project_id}`} target="_blank" className="rounded-[4px] border-1 bg-white p-1 text-[11px] 2xl:text-sm">
          {item.project_id}
        </Link>
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <Link
          to={`/project/${item.project_id}/expense/${item.seq}`}
          target="_blank"
          className="rounded-[4px] border-1 bg-white p-1 text-[11px] 2xl:text-sm">
          {item.exp_id}
        </Link>
      </TableCell>
      <TableCell>{item.el_method}</TableCell>
      <TableCell>
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
      </TableCell>
      <TableCell className="text-left">
        <Link to={`/manager/pexpense/${item.seq}${search}`} className="hover:underline">
          {item.el_title}
        </Link>
      </TableCell>
      <TableCell>{item.el_attach === 'Y' ? <Badge variant="secondary">제출</Badge> : <Badge variant="grayish">미제출</Badge>}</TableCell>
      <TableCell>
        <div className="relative inline-flex justify-center">
          <Badge variant="grayish" className="border-gray-300 bg-white">
            {item.is_estimate === 'Y' ? '견적서' : '견적서 외'}
          </Badge>
          {matchMissing}
        </div>
      </TableCell>
      <TableCell className="text-right">
        {formatAmount(item.el_total)}원
        {item.el_tax !== 0 && <div className="mt-0.5 text-[11px] leading-[1.2] text-gray-600">세금 {formatAmount(item.el_tax)}원</div>}
      </TableCell>
      <TableCell>{item.user_nm}</TableCell>
      <TableCell>{statusMap[item.status as keyof typeof statusMap]}</TableCell>
      <TableCell>{formatDate(item.wdate)}</TableCell>
      <TableCell className="px-0!">
        <Checkbox
          id={`chk_${item.seq}`}
          className="mx-auto flex size-4 items-center justify-center bg-white leading-none"
          checked={checked}
          onCheckedChange={(v) => onCheck(item.seq, !!v)}
          disabled={user_id === item.user_id || item.status !== 'Claimed'}
        />
      </TableCell>
    </TableRow>
  );
});

// 변경 감지 기준 최적화
ManagerListRow.displayName = 'ManagerListRow';
