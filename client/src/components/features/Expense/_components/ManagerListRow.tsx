// src/components/features/Expense/_components/ExpensListeRow.tsx
import { memo } from 'react';
import { Link, useLocation } from 'react-router';
import { useUser } from '@/hooks/useUser';
import { TableCell, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { formatAmount, formatDate } from '@/utils';

import type { ExpenseListItems } from '@/api/manager/nexpense';
import { UserRoundPen } from 'lucide-react';

type ExpenseRowProps = {
  item: ExpenseListItems;
  checked: boolean;
  onCheck: (seq: number, checked: boolean) => void;
  onAInfo: (item: ExpenseListItems) => void;
};

export const ManagerListRow = memo(({ item, checked, onCheck, onAInfo }: ExpenseRowProps) => {
  const { user_id } = useUser();
  const { search } = useLocation();

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

  const isAddInfo = (item.add_info ?? []).length;

  return (
    <TableRow className="[&_td]:px-2 [&_td]:text-[13px] [&_td]:leading-[1.3]">
      <TableCell className="whitespace-nowrap">
        <Link to={`/manager/nexpense/${item.exp_id}${search}`} className="rounded-[4px] border-1 bg-white p-1 text-sm">
          {item.exp_id}
        </Link>
      </TableCell>
      <TableCell>{item.el_method}</TableCell>
      <TableCell>{item.el_type}</TableCell>
      <TableCell className="text-left">
        <Link to={`/manager/nexpense/${item.exp_id}${search}`} className="hover:underline">
          {item.el_title}
        </Link>
        {isAddInfo > 0 && (
          <span
            className="ml-1 inline-flex cursor-pointer items-center gap-0.5 align-middle text-xs text-gray-500"
            onClick={() => onAInfo(item)}>
            <UserRoundPen className="size-3" />
            {isAddInfo}
          </span>
        )}
      </TableCell>
      <TableCell>{item.el_attach === 'Y' ? <Badge variant="secondary">제출</Badge> : <Badge variant="grayish">미제출</Badge>}</TableCell>
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
          disabled={item.status !== 'Claimed'}
        />
      </TableCell>
    </TableRow>
  );
});

// 변경 감지 기준 최적화
ManagerListRow.displayName = 'ManagerListRow';
