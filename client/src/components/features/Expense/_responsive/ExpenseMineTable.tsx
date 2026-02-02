import type { JSX } from 'react';
import { Link } from 'react-router';
import { formatAmount, formatDate } from '@/utils';
import type { PExpenseItem, NExpenseItem } from '@/api/mypage/expense';

import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableHead, TableRow, TableCell, TableBody } from '@/components/ui/table';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

type Props = {
  type: 'P' | 'N';
  list: (PExpenseItem | NExpenseItem)[];
  loading: boolean;
  search: string;
  statusMap: Record<string, JSX.Element>;
};

function isPExpense(item: any): item is PExpenseItem {
  return 'alloc_status' in item && 'is_estimate' in item;
}

function isNExpense(item: any): item is NExpenseItem {
  return !('alloc_status' in item);
}

const renderEmptyRow = (colSpan: number, text: string) => (
  <TableRow>
    <TableCell colSpan={colSpan} className="h-100 text-center text-gray-500">
      {text}
    </TableCell>
  </TableRow>
);

export function ExpenseMineTable({ type, list, loading, search, statusMap }: Props) {
  const isEmpty = list.length === 0;
  const colSpan = type === 'P' ? 11 : 10;

  return (
    <Table variant="primary" align="center" className="table-fixed">
      <TableHeader>
        <TableRow className="[&_th]:px-2 [&_th]:text-[13px] [&_th]:font-medium">
          <TableHead className="w-[8%]">EXP#</TableHead>
          <TableHead className="w-[6%]">증빙 수단</TableHead>
          <TableHead className="w-[8%]">비용 용도</TableHead>
          <TableHead>비용 제목</TableHead>
          <TableHead className="w-[6%]">증빙 상태</TableHead>
          {type === 'P' && <TableHead className="w-[6%]">비용 유형</TableHead>}
          <TableHead className="w-[11%]">금액</TableHead>
          <TableHead className="w-[7%]">상태</TableHead>
          <TableHead className="w-[7%]">작성일</TableHead>
          <TableHead className="w-[7%]">지급예정일</TableHead>
          <TableHead className="w-[7%]">지급완료일</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading && renderEmptyRow(colSpan, '비용 리스트 불러오는 중 . . .')}
        {!loading && isEmpty && renderEmptyRow(colSpan, '등록된 비용이 없습니다.')}
        {!loading &&
          list.map((item) => {
            const isP = type === 'P' && isPExpense(item);
            const categories = Array.from(new Set(item.el_type?.split('|').filter(Boolean)));

            const matchMissing = isP && item.alloc_status === 'empty' && item.is_estimate === 'Y' && item.status !== 'Rejected' && (
              <span className="absolute -top-1 -right-1 flex size-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-500 opacity-75" />
                <span className="relative inline-flex size-3 rounded-full border border-white bg-orange-500" />
              </span>
            );

            const link = isP ? `/project/${item.project_id}/expense/${item.seq}${search}` : `/expense/${item.exp_id}${search}`;

            return (
              <TableRow key={item.seq} className="hover:bg-gray-50 [&_td]:px-2 [&_td]:text-[13px]">
                <TableCell>
                  <Link to={link} className="rounded-[4px] border bg-white p-1 text-sm max-2xl:text-[11px]">
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
                  <Link to={link} className="hover:underline">
                    {item.el_title}
                  </Link>
                </TableCell>
                <TableCell>
                  {item.el_attach === 'Y' ? <Badge variant="secondary">제출</Badge> : <Badge variant="grayish">미제출</Badge>}
                </TableCell>
                {isP && (
                  <TableCell>
                    <div className="relative inline-flex justify-center">
                      <Badge variant="grayish" className="border-gray-300 bg-white">
                        {item.is_estimate === 'Y' ? '견적서' : '견적서 외'}
                      </Badge>
                      {matchMissing}
                    </div>
                  </TableCell>
                )}
                <TableCell className="text-right">
                  {formatAmount(item.el_total)}원
                  {item.el_tax !== 0 && <div className="mt-0.5 text-[11px] text-gray-600">세금 {formatAmount(item.el_tax)}원</div>}
                </TableCell>

                <TableCell>{statusMap[item.status]}</TableCell>
                <TableCell>{formatDate(item.wdate)}</TableCell>
                <TableCell>{item.status !== 'Rejected' && item.ddate ? formatDate(item.ddate) : '-'}</TableCell>
                <TableCell>{item.status !== 'Rejected' && item.edate ? formatDate(item.edate) : '-'}</TableCell>
              </TableRow>
            );
          })}
      </TableBody>
    </Table>
  );
}
