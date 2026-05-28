import { memo, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { cn } from '@/lib/utils';
import { formatAmount, formatDate } from '@/utils';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { TableCell, TableRow } from '@/components/ui/table';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { DayPicker } from '@/components/daypicker';

import { CalendarIcon, Download, UserRoundPen } from 'lucide-react';

export interface ExpenseItem {
  seq: number;
  exp_id: string;
  el_title: string;
  el_total: number;
  el_tax: number;
  el_method: string;
  el_type: string;
  el_attach: string;
  status: string;
  wdate: string;
  user_nm: string;
  user_id: string;
  add_info?: any[];
  // admin-only
  ddate?: string | null;
  edate?: string | null;
  el_deposit?: string | null;
}

const statusMap = {
  Saved: <Badge variant="grayish" size="table">임시저장</Badge>,
  Claimed: <Badge variant="secondary" size="table">승인대기</Badge>,
  Confirmed: <Badge size="table">승인완료</Badge>,
  SAP: <Badge className="bg-primary-pink-500" size="table">SAP등록</Badge>,
  Approved: <Badge className="bg-primary-blue/80" size="table">지급대기</Badge>,
  Completed: <Badge className="bg-primary-blue" size="table">지급완료</Badge>,
  Rejected: <Badge className="bg-destructive" size="table">반려됨</Badge>,
} as const;

type ExpenseRowProps = {
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

export const ExpenseRow = memo(({ role, item, activeTab, checked, onCheck, onAInfo, onDdate, handlePDFDownload }: ExpenseRowProps) => {
  const { search } = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(item.ddate ? new Date(item.ddate) : undefined);

  const detailPath =
    role === 'admin'
      ? `/admin/finance/nexpense/${item.seq}${search}`
      : role === 'manager'
        ? `/manager/nexpense/${item.exp_id}${search}`
        : `/expense/${item.exp_id}${search}`;

  const isAddInfo = (item.add_info ?? []).length;

  const isCheckboxDisabled =
    role === 'admin'
      ? item.status === 'Saved' || item.status === 'Rejected'
      : role === 'manager'
        ? item.status !== 'Claimed'
        : false;

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    setIsOpen(false);
    onDdate?.(item.seq, date);
  };

  return (
    <TableRow className="[&_td]:px-2 [&_td]:text-[13px] [&_td]:leading-[1.3]">
      {/* user: checkbox at start, hidden on 'all' tab */}
      {role === 'user' && (
        <TableCell className={cn('px-0', activeTab !== 'saved' && 'hidden')}>
          <Checkbox
            id={`chk_${item.seq}`}
            className="mx-auto flex size-4 items-center justify-center bg-white leading-none"
            checked={checked}
            onCheckedChange={(v) => onCheck(item.seq, !!v)}
          />
        </TableCell>
      )}

      {/* EXP# */}
      <TableCell className={cn('whitespace-nowrap', role === 'admin' && 'px-0!')}>
        <Link to={detailPath} className="rounded-[4px] border-1 bg-white p-1 text-[11px] 2xl:text-sm">
          {item.exp_id}
        </Link>
        {role === 'admin' && handlePDFDownload && (
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => handlePDFDownload(item.seq, item.exp_id, item.user_nm)}
            className="ml-1 h-6 w-auto rounded-[4px] p-0.5! align-middle">
            <Download className="size-3" />
          </Button>
        )}
      </TableCell>

      <TableCell>{item.el_method}</TableCell>
      <TableCell>{item.el_type}</TableCell>

      <TableCell className="text-left">
        <Link to={detailPath} className="hover:underline">
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

      <TableCell>
        {item.el_attach === 'Y' ? <Badge variant="secondary" size="table">제출</Badge> : <Badge variant="grayish" size="table">미제출</Badge>}
      </TableCell>

      <TableCell className="text-right">
        {formatAmount(item.el_total)}원
        {(role === 'admin' || item.el_tax !== 0) && (
          <div className="mt-0.5 text-[11px] leading-[1.2] text-gray-600">
            세금 {item.el_tax === 0 ? '0' : formatAmount(item.el_tax)}원
          </div>
        )}
      </TableCell>

      {/* admin/manager: 작성자 column */}
      {role !== 'user' && <TableCell>{item.user_nm}</TableCell>}

      <TableCell>{statusMap[item.status as keyof typeof statusMap]}</TableCell>
      <TableCell>{formatDate(item.wdate)}</TableCell>

      {/* admin: 입금희망일 */}
      {role === 'admin' && <TableCell>{formatDate(item.el_deposit) || '-'}</TableCell>}

      {/* admin: 지급예정일 popover */}
      {role === 'admin' && (
        <TableCell>
          {selectedDate ? (
            formatDate(selectedDate)
          ) : (
            !item.edate && (
              <Popover open={isOpen} onOpenChange={setIsOpen} modal>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" size="sm" className="h-auto p-1">
                    날짜 지정 <CalendarIcon className="size-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="center" className="w-auto p-0">
                  <DayPicker mode="single" selected={selectedDate} onSelect={handleDateSelect} />
                </PopoverContent>
              </Popover>
            )
          )}
          {item.edate && <span className="block text-[11px] leading-[1.2] text-gray-600">지급일 {formatDate(item.edate)}</span>}
        </TableCell>
      )}

      {/* admin/manager: checkbox at end */}
      {role !== 'user' && (
        <TableCell className="px-0!">
          <Checkbox
            id={`chk_${item.seq}`}
            className="mx-auto flex size-4 items-center justify-center bg-white leading-none"
            checked={checked}
            onCheckedChange={(v) => onCheck(item.seq, !!v)}
            disabled={isCheckboxDisabled}
          />
        </TableCell>
      )}
    </TableRow>
  );
});

ExpenseRow.displayName = 'ExpenseRow';
