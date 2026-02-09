import { type ExpenseListItems } from '@/api/manager/nexpense';
import { AdminListRow } from '@components/features/Expense/_components/AdminListRow';

import { Button } from '@components/ui/button';
import { Checkbox } from '@components/ui/checkbox';
import { AppPagination } from '@/components/ui/AppPagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Mail } from 'lucide-react';

interface ExpenseListProps {
  loading: boolean;
  expenseList: ExpenseListItems[];
  checkAll: boolean;
  checkedItems: number[];

  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;

  handleCheckAll: (val: boolean) => void;
  handleCheckItem: (seq: number, checked: boolean) => void;
  handleSetDdate: (seq: number, ddate: Date) => void;
  handlePDFDownload: (seq: number, expId: string, userName: string) => void;
  handleMultiPDFDownload: (seqs: number[]) => void;
  handleExcelDownload: () => void;

  onOpenCBox: () => void;
}

export default function AdminExpenseTable({
  loading,
  expenseList,
  checkAll,
  checkedItems,

  total,
  page,
  pageSize,
  onPageChange,

  handleCheckAll,
  handleCheckItem,
  handleSetDdate,
  handlePDFDownload,
  handleMultiPDFDownload,
  handleExcelDownload,

  onOpenCBox,
}: ExpenseListProps) {
  return (
    <>
      <Table variant="primary" align="center" className="table-fixed">
        <TableHeader>
          <TableRow className="[&_th]:px-2 [&_th]:text-[13px] [&_th]:font-medium">
            <TableHead className="w-[8%]">EXP#</TableHead>
            <TableHead className="w-[6%] whitespace-nowrap">증빙 수단</TableHead>
            <TableHead className="w-[7%]">비용 용도</TableHead>
            <TableHead>비용 제목</TableHead>
            <TableHead className="w-[5%] whitespace-nowrap">증빙 상태</TableHead>
            <TableHead className="w-[11%]">합계 금액</TableHead>
            <TableHead className="w-[7%]">작성자</TableHead>
            <TableHead className="w-[6%]">상태</TableHead>
            <TableHead className="w-[8%]">작성일</TableHead>
            <TableHead className="w-[8%]">입금희망일</TableHead>
            <TableHead className="w-[8%]">지급예정일</TableHead>
            <TableHead className="w-[3%] px-0! transition-all duration-150">
              <Checkbox
                id="chk_all"
                className="mx-auto flex size-4 items-center justify-center bg-white leading-none"
                checked={checkAll}
                onCheckedChange={(v) => handleCheckAll(!!v)}
              />
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell className="h-100 text-gray-500" colSpan={12}>
                비용 리스트 불러오는 중 . . .
              </TableCell>
            </TableRow>
          ) : expenseList.length === 0 ? (
            <TableRow>
              <TableCell className="h-100 text-gray-500" colSpan={12}>
                리스트가 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            expenseList.map((item) => (
              <AdminListRow
                key={item.seq}
                item={item}
                checked={checkedItems.includes(item.seq)}
                onCheck={handleCheckItem}
                onDdate={handleSetDdate}
                handlePDFDownload={handlePDFDownload}
              />
            ))
          )}
        </TableBody>
      </Table>

      <div className="mt-4 flex justify-between gap-2">
        <Button type="button" size="sm" variant="outline" className="text-primary" onClick={onOpenCBox}>
          <Mail className="size-3.5" />
          C-Box
        </Button>

        <div className="space-x-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              handleMultiPDFDownload(checkedItems);
            }}>
            선택 PDF 다운로드
          </Button>

          <Button variant="outline" size="sm" onClick={handleExcelDownload}>
            Excel 다운로드
          </Button>
        </div>
      </div>

      <div className="mt-5">
        {expenseList.length !== 0 && (
          <AppPagination
            totalPages={Math.ceil(total / pageSize)}
            initialPage={page}
            visibleCount={5}
            onPageChange={onPageChange} //부모 state 업데이트
          />
        )}
      </div>
    </>
  );
}
