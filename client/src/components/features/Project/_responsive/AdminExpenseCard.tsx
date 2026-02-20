import { type ExpenseListItems } from '@/api/admin/pexpense';
import { AdminCardRow } from '../_components/AdminCardRow';

import { Checkbox } from '@components/ui/checkbox';
import { Button } from '@components/ui/button';
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
  onAInfo: (item: ExpenseListItems) => void;
}

export default function AdminExpenseCard({
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
  onAInfo,
}: ExpenseListProps) {
  const isEmpty = expenseList.length === 0;

  return (
    <>
      <div>
        <div className="mb-2 flex items-center">
          <Checkbox
            id="chk_all"
            label="전체 선택"
            className="flex size-4 items-center justify-center bg-white leading-none"
            checked={checkAll}
            onCheckedChange={(v) => handleCheckAll(!!v)}
          />
        </div>

        {loading ? (
          <p className="py-50 text-center text-base text-gray-500">비용 리스트 불러오는 중 . . .</p>
        ) : isEmpty ? (
          <p className="py-50 text-center text-base text-gray-500">등록된 비용이 없습니다.</p>
        ) : (
          <div className="space-y-4">
            {expenseList.map((item) => (
              <AdminCardRow
                key={item.seq}
                item={item}
                checked={checkedItems.includes(item.seq)}
                onCheck={handleCheckItem}
                onDdate={handleSetDdate}
                handlePDFDownload={handlePDFDownload}
                onAInfo={onAInfo}
              />
            ))}
          </div>
        )}
      </div>

      {/* <div className="mt-4 flex justify-between gap-2">
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

          <Button type="button" variant="outline" size="sm" onClick={handleExcelDownload}>
            Excel 다운로드
          </Button>
        </div>
      </div> */}

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
