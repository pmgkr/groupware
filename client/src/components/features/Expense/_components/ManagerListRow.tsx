// src/components/features/Expense/_components/ExpensListeRow.tsx
import { memo } from 'react';
import { Link, useLocation } from 'react-router';
import { useUser } from '@/hooks/useUser';
import { TableCell, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { formatAmount, formatKST } from '@/utils';
import type { ExpenseListItem } from '@/api';

type ExpenseRowProps = {
  item: ExpenseListItem;
  checked: boolean;
  onCheck: (seq: number, checked: boolean) => void;
};

export const ManagerListRow = memo(({ item, checked, onCheck }: ExpenseRowProps) => {
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
      </TableCell>
      <TableCell>{item.el_attach === 'Y' ? <Badge variant="secondary">제출</Badge> : <Badge variant="grayish">미제출</Badge>}</TableCell>
      <TableCell className="text-right">{formatAmount(item.el_amount)}원</TableCell>
      <TableCell className="text-right">{item.el_tax === 0 ? 0 : `${formatAmount(item.el_tax)}원`}</TableCell>
      <TableCell className="text-right">{formatAmount(item.el_total)}원</TableCell>
      <TableCell>{item.user_nm}</TableCell>
      <TableCell>{statusMap[item.status as keyof typeof statusMap]}</TableCell>
      <TableCell>{formatKST(item.wdate)}</TableCell>
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
