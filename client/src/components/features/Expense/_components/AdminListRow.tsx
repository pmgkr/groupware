// src/components/features/Expense/_components/ExpensListeRow.tsx
import { memo, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { formatAmount, formatDate } from '@/utils';
import { type ExpenseListItems } from '@/api/admin/nexpense';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { TableCell, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Popover, PopoverTrigger, PopoverContent } from '@components/ui/popover';
import { DayPicker } from '@components/daypicker';

import { CalendarIcon, Download } from 'lucide-react';

type ExpenseRowProps = {
  item: ExpenseListItems;
  checked: boolean;
  onCheck: (seq: number, checked: boolean) => void;
  onDdate: (seq: number, ddate: Date) => void;
  handlePDFDownload: (seq: number, expId: string, userName: string) => void;
};

export const AdminListRow = memo(({ item, checked, onCheck, onDdate, handlePDFDownload }: ExpenseRowProps) => {
  const { search } = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(item.ddate ? new Date(item.ddate) : undefined);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    setSelectedDate(date);
    setIsOpen(false);

    console.log(date);

    onDdate(item.seq, date);
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

  return (
    <TableRow className="[&_td]:px-2 [&_td]:text-[13px] [&_td]:leading-[1.3]">
      <TableCell className="px-0! whitespace-nowrap">
        <Link to={`/admin/finance/nexpense/${item.seq}${search}`} className="rounded-[4px] border-1 bg-white p-1 text-[11px] 2xl:text-sm">
          {item.exp_id}
        </Link>
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={() => handlePDFDownload(item.seq, item.exp_id, item.user_nm)}
          className="ml-1 h-6 w-auto rounded-[4px] p-0.5! align-middle">
          <Download className="size-3" />
        </Button>
      </TableCell>
      <TableCell>{item.el_method}</TableCell>
      <TableCell>{item.el_type}</TableCell>
      <TableCell className="text-left">
        <Link to={`/admin/finance/nexpense/${item.seq}${search}`} className="hover:underline">
          {item.el_title}
        </Link>
      </TableCell>
      <TableCell>{item.el_attach === 'Y' ? <Badge variant="secondary">제출</Badge> : <Badge variant="grayish">미제출</Badge>}</TableCell>
      <TableCell className="text-right">
        {formatAmount(item.el_total)}원
        <div className="mt-0.5 text-[11px] leading-[1.2] text-gray-600">
          세금 {item.el_tax === 0 ? `0` : ` ${formatAmount(item.el_tax)}`}원
        </div>
      </TableCell>
      <TableCell>{item.user_nm}</TableCell>
      <TableCell>{statusMap[item.status as keyof typeof statusMap]}</TableCell>
      <TableCell>{formatDate(item.wdate)}</TableCell>
      <TableCell>{formatDate(item.el_deposit) || '-'}</TableCell>
      <TableCell>
        {selectedDate ? (
          formatDate(selectedDate)
        ) : (
          <Popover open={isOpen} onOpenChange={setIsOpen} modal>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="text h-auto p-1">
                {selectedDate ?? (
                  <>
                    날짜 지정 <CalendarIcon className="size-3" />
                  </>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="center" className="w-auto p-0">
              <DayPicker mode="single" selected={selectedDate} onSelect={handleDateSelect} />
            </PopoverContent>
          </Popover>
        )}
      </TableCell>
      <TableCell className="px-0!">
        <Checkbox
          id={`chk_${item.seq}`}
          className="mx-auto flex size-4 items-center justify-center bg-white leading-none"
          checked={checked}
          onCheckedChange={(v) => onCheck(item.seq, !!v)}
          disabled={item.status !== 'Claimed' && item.status !== 'Confirmed'}
        />
      </TableCell>
    </TableRow>
  );
});

// 변경 감지 기준 최적화
AdminListRow.displayName = 'AdminListRow';
