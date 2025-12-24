// src/components/features/Project/_components/ExpensListeRow.tsx
import { memo } from 'react';
import { Link, useParams } from 'react-router';
import { cn } from '@/lib/utils';
import { TableCell, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { formatAmount, formatKST } from '@/utils';
import type { pExpenseListItem } from '@/api';

type ExpenseRowProps = {
  item: pExpenseListItem;
  activeTab: 'all' | 'saved';
  checked: boolean;
  onCheck: (seq: number, checked: boolean) => void;
};

export const ExpenseRow = memo(({ item, activeTab, checked, onCheck }: ExpenseRowProps) => {
  const { projectId } = useParams();

  const statusMap = {
    Saved: <Badge variant="grayish">임시저장</Badge>,
    Claimed: <Badge variant="secondary">승인대기</Badge>,
    Confirmed: <Badge>승인완료</Badge>,
    Approved: <Badge className="bg-primary-blue/80">지급대기</Badge>,
    Completed: <Badge className="bg-primary-blue">지급완료</Badge>,
    Rejected: <Badge className="bg-destructive">반려됨</Badge>,
  } as const;

  // 비용 용도 슬라이드 유틸함수
  const parseCategories = (cate: string) => cate?.split('|').filter(Boolean) ?? [];
  const categories = Array.from(new Set(parseCategories(item.el_type))); // 중복 카테고리 제거

  // 비용 항목 & 견적서 매칭 누락 체크용
  const matchMissing = item.alloc_status === 'empty' && item.is_estimate === 'Y' && item.status !== 'Rejected' && (
    <span className="absolute -top-1 -right-1 flex size-3">
      {/* 애니메이션 */}
      <span className={`absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-500 opacity-75`}></span>
      {/* 도트 */}
      <span className={`relative inline-flex size-3 rounded-full border border-white bg-orange-500`}></span>
    </span>
  );

  return (
    <TableRow className="[&_td]:px-2 [&_td]:text-[13px]">
      <TableCell className={cn('px-0!', activeTab !== 'saved' && 'hidden')}>
        <Checkbox
          id={`chk_${item.seq}`}
          className="mx-auto flex size-4 items-center justify-center bg-white leading-none"
          checked={checked}
          onCheckedChange={(v) => onCheck(item.seq, !!v)}
        />
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
        <Link to={`/project/${projectId}/expense/${item.seq}`} className="relative hover:underline">
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
      <TableCell className="text-right">{formatAmount(item.el_amount)}원</TableCell>
      <TableCell className="text-right">{item.el_tax === 0 ? 0 : `${formatAmount(item.el_tax)}원`}</TableCell>
      <TableCell className="text-right">{formatAmount(item.el_total)}원</TableCell>
      <TableCell>{item.user_nm}</TableCell>
      <TableCell>{statusMap[item.status as keyof typeof statusMap]}</TableCell>
      <TableCell>{formatKST(item.wdate)}</TableCell>
    </TableRow>
  );
});

// 변경 감지 기준 최적화
ExpenseRow.displayName = 'ExpenseRow';
