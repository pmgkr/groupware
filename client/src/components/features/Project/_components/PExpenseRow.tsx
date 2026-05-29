import { memo, useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router';
import { cn } from '@/lib/utils';
import { formatAmount, formatDate } from '@/utils';
import { useUser } from '@/hooks/useUser';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { TableCell, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Popover, PopoverTrigger, PopoverContent } from '@components/ui/popover';
import { DayPicker } from '@components/daypicker';
import { CalendarIcon, Download, UserRoundPen, TriangleAlert } from 'lucide-react';

type Role = 'admin' | 'manager' | 'user';

const parseCategories = (value?: string) =>
  value ? Array.from(new Set(value.split('|').filter(Boolean))) : [];

// admin/manager: smaller badge (size="table")
const statusMapSm = {
  Saved: <Badge variant="grayish" size="table">임시저장</Badge>,
  Claimed: <Badge variant="secondary" size="table">승인대기</Badge>,
  Confirmed: <Badge size="table">승인완료</Badge>,
  SAP: <Badge className="bg-primary-pink-500" size="table">SAP등록</Badge>,
  Approved: <Badge className="bg-primary-blue/80" size="table">지급대기</Badge>,
  Completed: <Badge className="bg-primary-blue" size="table">지급완료</Badge>,
  Rejected: <Badge className="bg-destructive" size="table">반려됨</Badge>,
} as const;

// user: regular badge size
const statusMapMd = {
  Saved: <Badge variant="grayish">임시저장</Badge>,
  Claimed: <Badge variant="secondary">승인대기</Badge>,
  Confirmed: <Badge>승인완료</Badge>,
  SAP: <Badge className="bg-primary-pink-500">SAP등록</Badge>,
  Approved: <Badge className="bg-primary-blue/80">지급대기</Badge>,
  Completed: <Badge className="bg-primary-blue">지급완료</Badge>,
  Rejected: <Badge className="bg-destructive">반려됨</Badge>,
} as const;

function CategoryCell({ categories }: { categories: string[] }) {
  return (
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
  );
}

function AdminDdateCell({
  seq,
  ddate,
  edate,
  onDdate,
}: {
  seq: number;
  ddate?: string | null;
  edate?: string | null;
  onDdate: (seq: number, date: Date) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(ddate ? new Date(ddate) : undefined);

  const handleSelect = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    setIsOpen(false);
    onDdate(seq, date);
  };

  return (
    <TableCell>
      {selectedDate
        ? formatDate(selectedDate)
        : !edate && (
            <Popover open={isOpen} onOpenChange={setIsOpen} modal>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="text h-auto p-1">
                  날짜 지정 <CalendarIcon className="size-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="center" className="w-auto p-0">
                <DayPicker mode="single" selected={selectedDate} onSelect={handleSelect} />
              </PopoverContent>
            </Popover>
          )}
      {edate && <span className="block text-[11px] leading-[1.2] text-gray-600">지급일 {formatDate(edate)}</span>}
    </TableCell>
  );
}

type Props = {
  role: Role;
  item: any;
  activeTab?: 'all' | 'saved' | 'claimed';
  checked: boolean;
  onCheck: (seq: number, checked: boolean) => void;
  onAInfo: (item: any) => void;
  onDdate?: (seq: number, ddate: Date) => void;
  handlePDFDownload?: (seq: number, expId: string, userName: string) => void;
};

export const PExpenseRow = memo(({ role, item, activeTab, checked, onCheck, onAInfo, onDdate, handlePDFDownload }: Props) => {
  const { user_id } = useUser();
  const { search } = useLocation();

  const categories = useMemo(() => parseCategories(item.el_type), [item.el_type]);
  const isAddInfo = (item.add_info ?? []).length;

  const missingColor = role === 'user' ? 'bg-orange-500' : 'bg-destructive';
  const showMatchMissing =
    item.alloc_status === 'empty' &&
    item.is_estimate === 'Y' &&
    (role === 'user' ? item.status !== 'Rejected' : true);

  const matchMissing = showMatchMissing && (
    <span className="absolute -top-1 -right-1 flex size-3">
      <span className={`${missingColor} absolute inline-flex h-full w-full animate-ping rounded-full opacity-75`} />
      <span className={`${missingColor} relative inline-flex size-3 rounded-full border border-white`} />
    </span>
  );

  const statusMap = role === 'user' ? statusMapMd : statusMapSm;

  // EXP# 링크: admin=admin경로, manager=프로젝트경로(새탭), user=프로젝트경로
  const expIdHref =
    role === 'admin'
      ? `/admin/finance/pexpense/${item.seq}${search}`
      : role === 'manager'
      ? `/project/${item.project_id}/expense/${item.seq}`
      : `/project/${item.project_id}/expense/${item.seq}${search}`;

  // 제목 링크: manager=매니저경로, 나머지=expIdHref
  const titleHref =
    role === 'manager' ? `/manager/pexpense/${item.seq}${search}` : expIdHref;

  // user 전용 레이아웃 (체크박스 첫 열, 프로젝트# 없음)
  if (role === 'user') {
    return (
      <TableRow className="[&_td]:px-2 [&_td]:text-[13px] max-2xl:[&_td]:px-1 max-2xl:[&_td]:text-sm">
        <TableCell className={cn('px-0!', activeTab !== 'saved' && 'hidden')}>
          <Checkbox
            id={`chk_${item.seq}`}
            className="mx-auto flex size-4 items-center justify-center bg-white leading-none"
            checked={checked}
            onCheckedChange={(v) => onCheck(item.seq, !!v)}
            disabled={item.user_id !== user_id}
          />
        </TableCell>
        <TableCell>
          <Link to={expIdHref} className="rounded-[4px] border-1 bg-white p-1 text-sm max-2xl:text-[11px]">
            {item.exp_id}
          </Link>
        </TableCell>
        <TableCell>{item.el_method}</TableCell>
        <TableCell>
          <CategoryCell categories={categories} />
        </TableCell>
        <TableCell className="text-left">
          <Link to={titleHref} className="relative hover:underline">
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
          {item.el_tax !== 0 && (
            <div className="mt-0.5 text-[11px] leading-[1.2] text-gray-600">세금 {formatAmount(item.el_tax)}원</div>
          )}
        </TableCell>
        <TableCell>{item.user_nm}</TableCell>
        <TableCell>{statusMap[item.status as keyof typeof statusMap]}</TableCell>
        <TableCell>{formatDate(item.wdate)}</TableCell>
      </TableRow>
    );
  }

  // admin/manager 공통 레이아웃 (프로젝트# 첫 열, 체크박스 마지막 열)
  return (
    <TableRow className="[&_td]:px-2 [&_td]:text-sm [&_td]:leading-[1.3] 2xl:[&_td]:text-[13px]">
      <TableCell className="whitespace-nowrap">
        <Link to={`/project/${item.project_id}`} target="_blank" className="rounded-[4px] border-1 bg-white p-1 text-[11px] 2xl:text-sm">
          {item.project_id}
        </Link>
      </TableCell>
      <TableCell className={cn('whitespace-nowrap', role === 'admin' && 'px-0!')}>
        <Link
          to={expIdHref}
          {...(role === 'manager' && { target: '_blank' })}
          className="rounded-[4px] border-1 bg-white p-1 text-[11px] 2xl:text-sm">
          {item.exp_id}
        </Link>
        {role === 'admin' && (
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => handlePDFDownload?.(item.seq, item.exp_id, item.user_nm)}
            className="ml-1 h-6 w-auto rounded-[4px] p-0.5! align-middle">
            <Download className="size-3" />
          </Button>
        )}
      </TableCell>
      <TableCell>{item.el_method}</TableCell>
      <TableCell>
        <CategoryCell categories={categories} />
      </TableCell>
      <TableCell className="text-left">
        <Link to={titleHref} className="hover:underline">
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
      <TableCell>
        <div className="relative inline-flex justify-center">
          <Badge variant="grayish" className="border-gray-300 bg-white">
            {role === 'admin' && (item.allocated_amount ?? 0) < 0 && <TriangleAlert className="animate-blink triangle-alert" />}
            {item.is_estimate === 'Y' ? '견적서' : '견적서 외'}
          </Badge>
          {matchMissing}
        </div>
      </TableCell>
      <TableCell className="text-right">
        {formatAmount(item.el_total)}원
        {role === 'admin' ? (
          <div className="mt-0.5 text-[11px] leading-[1.2] text-gray-600">
            세금 {item.el_tax === 0 ? '0' : formatAmount(item.el_tax)}원
          </div>
        ) : (
          item.el_tax !== 0 && (
            <div className="mt-0.5 text-[11px] leading-[1.2] text-gray-600">세금 {formatAmount(item.el_tax)}원</div>
          )
        )}
      </TableCell>
      <TableCell>{item.user_nm}</TableCell>
      <TableCell>{statusMap[item.status as keyof typeof statusMap]}</TableCell>
      <TableCell>{formatDate(item.wdate)}</TableCell>
      {role === 'admin' && (
        <>
          <TableCell>{formatDate(item.el_deposit) || '-'}</TableCell>
          <AdminDdateCell seq={item.seq} ddate={item.ddate} edate={item.edate} onDdate={onDdate!} />
        </>
      )}
      <TableCell className="px-0!">
        <Checkbox
          id={`chk_${item.seq}`}
          className="mx-auto flex size-4 items-center justify-center bg-white leading-none"
          checked={checked}
          onCheckedChange={(v) => onCheck(item.seq, !!v)}
          disabled={
            role === 'admin' ? item.status === 'Saved' || item.status === 'Rejected' : item.status !== 'Claimed'
          }
        />
      </TableCell>
    </TableRow>
  );
});

PExpenseRow.displayName = 'PExpenseRow';
