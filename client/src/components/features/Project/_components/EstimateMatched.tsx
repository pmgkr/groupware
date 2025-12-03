import { useState, useEffect } from 'react';
import { formatAmount } from '@/utils';
import { type EstimateItemsView, expenseEstimateMatch } from '@/api';
import { type expenseInfo } from '@/types/estimate';

import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';
import { useAppDialog } from '@/components/common/ui/AppDialog/AppDialog';

import { Input } from '@components/ui/input';
import { Button } from '@components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { Link2, Info, OctagonAlert, CheckCircle } from 'lucide-react';

// 견적서 매칭확인 Response Type
export interface EstimateMatchedItem {
  seq: number;
  target_seq: number;
  ei_name: string;
  alloc_amount: number;
  ava_amount: number;
  pl_seq: number;
}

export default function EstimateMatchedView({ items }: { items: EstimateMatchedItem[] }) {
  return (
    <>
      <Table variant="primary" className="w-full table-fixed">
        <TableHeader>
          <TableRow className="[&_th]:px-2 [&_th]:text-[13px] [&_th]:font-medium">
            <TableHead className="text-left">항목명</TableHead>
            <TableHead className="w-[28%]">가용 금액</TableHead>
            <TableHead className="w-[28%]">매칭된 금액</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-gray-500">
                매칭된 견적서 항목이 없습니다.
              </TableCell>
            </TableRow>
          )}

          {items.map((item) => (
            <TableRow key={item.target_seq} className="[&_td]:px-2 [&_td]:text-[12px] [&_td]:leading-[1.3]">
              <TableCell className="text-left">{item.ei_name}</TableCell>
              <TableCell className="text-right">{formatAmount(item.ava_amount)}</TableCell>
              <TableCell className="text-right">{formatAmount(item.alloc_amount)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="align-items mt-2 flex justify-between">
        {/* <Button type="button" size="sm" variant="outline">
          매칭 리셋
        </Button> */}
        <div className="ml-auto flex gap-1.5">
          <Button type="button" size="sm">
            견적서 보기
          </Button>
        </div>
      </div>
    </>
  );
}
