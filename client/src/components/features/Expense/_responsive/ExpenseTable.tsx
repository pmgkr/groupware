import { cn } from '@/lib/utils';
import { type ExpenseListItem } from '@/api';

import { Checkbox } from '@components/ui/checkbox';
import { Table, TableHeader, TableHead, TableRow, TableCell, TableBody } from '@/components/ui/table';
import { ExpenseRow } from '../_components/ExpenseListRow';

type Props = {
  items: ExpenseListItem[];
  loading: boolean;
  activeTab: 'all' | 'saved';
  checkAll: boolean;
  checkedItems: number[];
  onCheckAll: (checked: boolean) => void;
  onCheck: (seq: number, checked: boolean) => void;
};

export function ExpenseTable({ items, loading, activeTab, checkAll, checkedItems, onCheckAll, onCheck }: Props) {
  const isEmpty = items.length === 0;

  return (
    <Table variant="primary" align="center" className="table-fixed">
      <TableHeader>
        <TableRow className="[&_th]:px-2 [&_th]:text-[13px] [&_th]:font-medium">
          <TableHead className={cn('w-[3%] px-0 transition-all duration-150', activeTab !== 'saved' && 'hidden')}>
            <Checkbox
              id="chk_all"
              className="mx-auto flex size-4 items-center justify-center bg-white leading-none"
              checked={checkAll}
              onCheckedChange={(v) => onCheckAll(!!v)}
            />
          </TableHead>
          <TableHead className="w-[8%]">EXP#</TableHead>
          <TableHead className="w-[6%]">증빙 수단</TableHead>
          <TableHead className="w-[8%]">비용 용도</TableHead>
          <TableHead>비용 제목</TableHead>
          <TableHead className="w-[6%]">증빙 상태</TableHead>
          <TableHead className="w-[11%]">금액</TableHead>
          <TableHead className="w-[7%]">상태</TableHead>
          <TableHead className="w-[12%]">작성일</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell className="h-100 text-gray-500" colSpan={activeTab === 'saved' ? 9 : 8}>
              비용 리스트 불러오는 중 . . .
            </TableCell>
          </TableRow>
        ) : isEmpty ? (
          <TableRow>
            <TableCell className="h-100 text-gray-500" colSpan={activeTab === 'saved' ? 9 : 8}>
              등록된 비용이 없습니다.
            </TableCell>
          </TableRow>
        ) : (
          items.map((item) => (
            <ExpenseRow key={item.seq} item={item} activeTab={activeTab} checked={checkedItems.includes(item.seq)} onCheck={onCheck} />
          ))
        )}
      </TableBody>
    </Table>
  );
}
