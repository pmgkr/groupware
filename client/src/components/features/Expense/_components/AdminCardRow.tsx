// src/components/features/Expense/_components/AdminCardRow.tsx
import { memo, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { formatAmount, formatDate } from '@/utils';
import { type ExpenseListItems } from '@/api/admin/nexpense';

import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

type ExpenseRowProps = {
  item: ExpenseListItems;
  checked: boolean;
  onCheck: (seq: number, checked: boolean) => void;
  onDdate: (seq: number, ddate: Date) => void;
  handlePDFDownload: (seq: number, expId: string, userName: string) => void;
};

export const AdminCardRow = memo(({ item, checked, onCheck, onDdate, handlePDFDownload }: ExpenseRowProps) => {
  const { search } = useLocation();

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

  return (
    <div className="relative rounded-md border border-gray-300 bg-white p-4">
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
        </div>
        {status}
      </div>
      <div className="">
        <Link to={`/admin/finance/nexpense/${item.seq}${search}`}>
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
          <p className="shrink-0">{item.user_nm}</p>
        </div>
      </div>
    </div>
  );
});

// 변경 감지 기준 최적화
AdminCardRow.displayName = 'AdminCardRow';
