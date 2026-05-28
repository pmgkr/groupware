import { cn } from '@/lib/utils';
import { Button } from '@components/ui/button';
import { Checkbox } from '@components/ui/checkbox';
import { AppPagination } from '@/components/ui/AppPagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Mail } from 'lucide-react';
import { PExpenseRow } from '../_components/PExpenseRow';

type Role = 'admin' | 'manager' | 'user';
type ActiveTab = 'all' | 'claimed' | 'saved';

interface Props {
  role: Role;
  activeTab?: ActiveTab;
  loading: boolean;
  items: any[];
  checkAll: boolean;
  checkedItems: number[];
  onCheckAll: (checked: boolean) => void;
  onCheck: (seq: number, checked: boolean) => void;
  onAInfo: (item: any) => void;
  // admin-only
  onOpenCBox?: () => void;
  onDdate?: (seq: number, ddate: Date) => void;
  handlePDFDownload?: (seq: number, expId: string, userName: string) => void;
  onMultiPDFDownload?: (seqs: number[]) => void;
  onExcelDownload?: () => void;
  // pagination
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
}

function AdminHeader({ checkAll, onCheckAll }: { checkAll: boolean; onCheckAll: (v: boolean) => void }) {
  return (
    <TableHeader>
      <TableRow className="[&_th]:px-2 [&_th]:text-[13px] [&_th]:font-medium">
        <TableHead className="w-[7%]">프로젝트#</TableHead>
        <TableHead className="w-[7%]">EXP#</TableHead>
        <TableHead className="w-[5%] whitespace-nowrap">증빙 수단</TableHead>
        <TableHead className="w-[7%]">비용 용도</TableHead>
        <TableHead>비용 제목</TableHead>
        <TableHead className="w-[5.5%] whitespace-nowrap">증빙 상태</TableHead>
        <TableHead className="w-[5.5%] whitespace-nowrap">비용 유형</TableHead>
        <TableHead className="w-[10%]">합계 금액</TableHead>
        <TableHead className="w-[7%]">작성자</TableHead>
        <TableHead className="w-[6%]">상태</TableHead>
        <TableHead className="w-[7%]">작성일</TableHead>
        <TableHead className="w-[7%]">입금희망일</TableHead>
        <TableHead className="w-[8%]">지급예정일</TableHead>
        <TableHead className="w-[3%] px-0! transition-all duration-150">
          <Checkbox
            id="chk_all"
            className="mx-auto flex size-4 items-center justify-center bg-white leading-none"
            checked={checkAll}
            onCheckedChange={(v) => onCheckAll(!!v)}
          />
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}

function ManagerHeader({ checkAll, onCheckAll }: { checkAll: boolean; onCheckAll: (v: boolean) => void }) {
  return (
    <TableHeader>
      <TableRow className="[&_th]:px-2 [&_th]:text-[13px] [&_th]:font-medium">
        <TableHead className="w-[7%]">프로젝트#</TableHead>
        <TableHead className="w-[7%]">EXP#</TableHead>
        <TableHead className="w-[5%] whitespace-nowrap">증빙 수단</TableHead>
        <TableHead className="w-[8.5%]">비용 용도</TableHead>
        <TableHead>비용 제목</TableHead>
        <TableHead className="w-[5.5%] whitespace-nowrap">증빙 상태</TableHead>
        <TableHead className="w-[5.5%] whitespace-nowrap">비용 유형</TableHead>
        <TableHead className="w-[10%]">금액</TableHead>
        <TableHead className="w-[7%]">작성자</TableHead>
        <TableHead className="w-[6%]">상태</TableHead>
        <TableHead className="w-[7%]">작성일</TableHead>
        <TableHead className="w-[3%] px-0! transition-all duration-150">
          <Checkbox
            id="chk_all"
            className="mx-auto flex size-4 items-center justify-center bg-white leading-none"
            checked={checkAll}
            onCheckedChange={(v) => onCheckAll(!!v)}
          />
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}

function UserHeader({
  activeTab,
  checkAll,
  onCheckAll,
}: {
  activeTab?: ActiveTab;
  checkAll: boolean;
  onCheckAll: (v: boolean) => void;
}) {
  return (
    <TableHeader>
      <TableRow className="[&_th]:px-2 [&_th]:text-[13px] [&_th]:leading-[1.3] [&_th]:font-medium [&_th]:break-keep">
        <TableHead className={cn('w-[3%] px-0! transition-all duration-150', activeTab !== 'saved' && 'hidden')}>
          <Checkbox
            id="chk_all"
            className="mx-auto flex size-4 items-center justify-center bg-white leading-none"
            checked={checkAll}
            onCheckedChange={(v) => onCheckAll(!!v)}
          />
        </TableHead>
        <TableHead className="w-[8%] max-2xl:w-[10%]">EXP#</TableHead>
        <TableHead className="w-[6%]">증빙 수단</TableHead>
        <TableHead className="w-[8%]">비용 용도</TableHead>
        <TableHead>비용 제목</TableHead>
        <TableHead className="w-[6%]">증빙 상태</TableHead>
        <TableHead className="w-[7%]">비용 유형</TableHead>
        <TableHead className="w-[11%]">금액</TableHead>
        <TableHead className="w-[7%]">작성자</TableHead>
        <TableHead className="w-[7%]">상태</TableHead>
        <TableHead className="w-[12%] max-2xl:w-[10%]">작성일</TableHead>
      </TableRow>
    </TableHeader>
  );
}

export function PExpenseListTable({
  role,
  activeTab,
  loading,
  items,
  checkAll,
  checkedItems,
  onCheckAll,
  onCheck,
  onAInfo,
  onOpenCBox,
  onDdate,
  handlePDFDownload,
  onMultiPDFDownload,
  onExcelDownload,
  total,
  page,
  pageSize,
  onPageChange,
}: Props) {
  const isEmpty = items.length === 0;

  const colSpan =
    role === 'admin' ? 14 :
    role === 'manager' ? 12 :
    activeTab === 'saved' ? 11 : 10;

  const emptyText = role === 'admin' ? '리스트가 없습니다.' : '등록된 비용이 없습니다.';

  return (
    <>
      <Table variant="primary" align="center" className="table-fixed">
        {role === 'admin' && <AdminHeader checkAll={checkAll} onCheckAll={onCheckAll} />}
        {role === 'manager' && <ManagerHeader checkAll={checkAll} onCheckAll={onCheckAll} />}
        {role === 'user' && <UserHeader activeTab={activeTab} checkAll={checkAll} onCheckAll={onCheckAll} />}

        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell className="h-100 text-gray-500" colSpan={colSpan}>
                비용 리스트 불러오는 중 . . .
              </TableCell>
            </TableRow>
          ) : isEmpty ? (
            <TableRow>
              <TableCell className="h-100 text-gray-500" colSpan={colSpan}>
                {emptyText}
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <PExpenseRow
                key={item.seq}
                role={role}
                item={item}
                activeTab={activeTab}
                checked={checkedItems.includes(item.seq)}
                onCheck={onCheck}
                onAInfo={onAInfo}
                onDdate={onDdate}
                handlePDFDownload={handlePDFDownload}
              />
            ))
          )}
        </TableBody>
      </Table>

      {role === 'admin' && (
        <div className="mt-4 flex justify-between gap-2">
          <Button type="button" size="sm" variant="outline" className="text-primary" onClick={onOpenCBox}>
            <Mail className="size-3.5" />
            C-Box
          </Button>
          <div className="space-x-2">
            <Button type="button" size="sm" variant="outline" onClick={() => onMultiPDFDownload?.(checkedItems)}>
              선택 PDF 다운로드
            </Button>
            <Button variant="outline" size="sm" onClick={onExcelDownload}>
              Excel 다운로드
            </Button>
          </div>
        </div>
      )}

      {onPageChange && !isEmpty && (
        <div className="mt-5">
          <AppPagination
            totalPages={Math.ceil((total ?? 0) / (pageSize ?? 15))}
            initialPage={page ?? 1}
            visibleCount={5}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </>
  );
}
