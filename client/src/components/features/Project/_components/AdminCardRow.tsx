// src/components/features/Project/_components/AdminCardRow.tsx
import { memo, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { cn } from '@/lib/utils';
import { formatAmount, formatDate } from '@/utils';
import { type ExpenseListItems } from '@/api/admin/pexpense';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

import { ChevronDown, UserRoundPen } from 'lucide-react';

type ExpenseRowProps = {
  item: ExpenseListItems;
  checked: boolean;
  onCheck: (seq: number, checked: boolean) => void;
  onDdate: (seq: number, ddate: Date) => void;
  onAInfo: (item: ExpenseListItems) => void;
  handlePDFDownload: (seq: number, expId: string, userName: string) => void;
};

export const AdminCardRow = memo(({ item, checked, onCheck, onDdate, onAInfo, handlePDFDownload }: ExpenseRowProps) => {
  const { search } = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const statusMap = {
    Saved: <Badge variant="grayish">임시저장</Badge>,
    Claimed: <Badge variant="secondary">승인대기</Badge>,
    Confirmed: <Badge>승인완료</Badge>,
    Approved: <Badge className="bg-primary-blue/80">지급대기</Badge>,
    Completed: <Badge className="bg-primary-blue">지급완료</Badge>,
    Rejected: <Badge className="bg-destructive">반려됨</Badge>,
  } as const;

  const status = statusMap[item.status as keyof typeof statusMap];

  // 비용 용도 슬라이드 유틸함수
  const parseCategories = (cate: string) => cate?.split('|').filter(Boolean) ?? [];
  const categories = Array.from(new Set(parseCategories(item.el_type))); // 중복 카테고리 제거

  // 비용 항목 & 견적서 매칭 누락 체크용
  const matchMissing = item.alloc_status === 'empty' && item.is_estimate === 'Y' && (
    <span className="absolute -top-1 -right-1 flex size-3">
      <span className={`bg-destructive absolute inline-flex h-full w-full animate-ping rounded-full opacity-75`}></span>
      <span className={`bg-destructive relative inline-flex size-3 rounded-full border border-white`}></span>
    </span>
  );

  const isAddInfo = (item.add_info ?? []).length;

  return (
    <div className="relative rounded-md border border-gray-300 bg-white p-4">
      {matchMissing}
      <div className="mb-1 flex justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Checkbox
            id={`chk_${item.seq}`}
            className="mx-auto flex size-4 items-center justify-center bg-white leading-none"
            checked={checked}
            onCheckedChange={(v) => onCheck(item.seq, !!v)}
            disabled={item.status === 'Saved' || item.status === 'Rejected'}
          />
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
        {status}
      </div>
      <div className="">
        <Link to={`/admin/finance/pexpense/${item.seq}${search}`}>
          <div className="my-2 flex items-center gap-2 overflow-hidden text-lg tracking-tight">
            <p className="flex-1 truncate">{item.el_title}</p>
            <strong className="shrink-0 font-medium">{formatAmount(item.el_total)}원</strong>
          </div>
        </Link>
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
          <Button
            type="button"
            variant="svgIcon"
            size="sm"
            className="h-6! shrink-0 has-[>svg]:px-0"
            onClick={() => setIsOpen((prev) => !prev)}>
            더보기 <ChevronDown className={cn('size-4 transition-transform duration-200', isOpen && 'rotate-180')} />
          </Button>
        </div>
        {isOpen && (
          <>
            <div className="mt-3 flex flex-wrap justify-between gap-2 border-t-1 border-dashed border-gray-300 pt-4">
              <InfoRow title="프로젝트 #" value={item.project_id.toString()} />
              <InfoRow title="비용 유형" value={item.is_estimate === 'Y' ? '견적서' : '견적서 외'} />
              <InfoRow title="작성자" value={item.user_nm} />
            </div>
          </>
        )}
      </div>
    </div>
  );
});

// 변경 감지 기준 최적화
AdminCardRow.displayName = 'AdminCardRow';

function InfoRow({ title, value }: { title: string; value: string }) {
  return (
    <dl className="flex-1 space-y-0.5 text-sm leading-[1.3] text-gray-600">
      <dt>{title}</dt>
      <dd className="text-[13px] break-keep text-gray-800">{value}</dd>
    </dl>
  );
}
