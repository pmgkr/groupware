import { type ExpenseListItems } from '@/api/manager/pexpense';

import { Checkbox } from '@components/ui/checkbox';
import { AppPagination } from '@/components/ui/AppPagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { ManagerListRow } from './_components/ManagerListRow';

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
}

export default function ManagerExpenseList({
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
}: ExpenseListProps) {
  return (
    <>
      <Table variant="primary" align="center" className="table-fixed">
        <TableHeader>
          <TableRow className="[&_th]:px-2 [&_th]:text-[13px] [&_th]:font-medium">
            <TableHead className="w-[8%]">프로젝트#</TableHead>
            <TableHead className="w-[5%] whitespace-nowrap">증빙 수단</TableHead>
            <TableHead className="w-[7%]">비용 용도</TableHead>
            <TableHead>비용 제목</TableHead>
            <TableHead className="w-[5.5%] whitespace-nowrap">증빙 상태</TableHead>
            <TableHead className="w-[5.5%] whitespace-nowrap">비용 유형</TableHead>
            <TableHead className="w-[9%]">금액</TableHead>
            <TableHead className="w-[8%]">세금</TableHead>
            <TableHead className="w-[9%]">합계</TableHead>
            <TableHead className="w-[7%]">작성자</TableHead>
            <TableHead className="w-[6%]">상태</TableHead>
            <TableHead className="w-[8%]">작성일</TableHead>
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
              <TableCell className="h-100 text-gray-500" colSpan={13}>
                비용 리스트 불러오는 중 . . .
              </TableCell>
            </TableRow>
          ) : expenseList.length === 0 ? (
            <TableRow>
              <TableCell className="h-100 text-gray-500" colSpan={13}>
                리스트가 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            expenseList.map((item) => (
              <ManagerListRow key={item.seq} item={item} checked={checkedItems.includes(item.seq)} onCheck={handleCheckItem} />
            ))
          )}
        </TableBody>
      </Table>

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
