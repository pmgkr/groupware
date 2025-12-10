import { useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/useUser';

import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';
import { useAppDialog } from '@/components/common/ui/AppDialog/AppDialog';

import { Button } from '@components/ui/button';
import { Checkbox } from '@components/ui/checkbox';
import { AppPagination } from '@/components/ui/AppPagination';
import { type MultiSelectOption } from '@components/multiselect/multi-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { OctagonAlert } from 'lucide-react';

import { getExpenseType } from '@/api';
import {
  getManagerExpenseList,
  getManagerExpenseMine,
  confirmExpense,
  type ExpenseListParams,
  type ExpenseListItems,
} from '@/api/manager/nexpense';
import { ManagerListFilter } from '@components/features/Expense/_components/ManagerListFilter';
import { ManagerListRow } from '@components/features/Expense/_components/ManagerListRow';

export default function ExpenseList() {
  const navigate = useNavigate();
  const { user_id, user_name, user_level } = useUser();

  // ============================
  // ⭐ Filter States
  // ============================
  const [activeTab, setActiveTab] = useState<'all' | 'claimed'>('claimed');
  const [selectedYear, setSelectedYear] = useState('2025');
  const [selectedTeam, setSelectedTeam] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedProof, setSelectedProof] = useState<string[]>([]);
  const [selectedProofStatus, setSelectedProofStatus] = useState<string[]>([]);

  const [typeOptions, setTypeOptions] = useState<MultiSelectOption[]>([]);
  const [expenseList, setExpenseList] = useState<ExpenseListItems[]>([]);

  const { addAlert } = useAppAlert();
  const { addDialog } = useAppDialog();

  // ============================
  // 체크박스 / 리스트 / 페이지네이션
  // ============================
  const [checkedItems, setCheckedItems] = useState<number[]>([]); // 선택된 seq 목록
  const [checkAll, setCheckAll] = useState(false); // 전체 선택 상태

  const [loading, setLoading] = useState(true);

  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 15; // 한 페이지에 보여줄 개수

  // ============================
  // ⭐ 비용유형 가져오기
  // ============================
  useEffect(() => {
    async function loadExpenseTypes() {
      try {
        const data = await getExpenseType('nexp_type1');
        setTypeOptions(data.map((t: any) => ({ label: t.code, value: t.code })));
      } catch (err) {
        console.error('❌ 비용 유형 호출 실패:', err);
      }
    }

    loadExpenseTypes();
  }, []);

  // ============================
  // ⭐ 리스트 조회 (팀 선택 완료 후 실행)
  // ============================
  useEffect(() => {
    async function loadList() {
      try {
        setLoading(true);

        const params: Record<string, any> = {
          type: selectedType.join(',') || undefined,
          method: selectedProof.join(',') || undefined,
          attach: selectedProofStatus.join(',') || undefined,
          status: activeTab === 'claimed' ? activeTab : selectedStatus.join(',') || undefined,
          page,
          size: pageSize,
        };

        console.log('📦 리스트 요청', params);

        const res = activeTab === 'claimed' ? await getManagerExpenseMine(params) : await getManagerExpenseList(params);

        console.log('📦 리스트 조회', res);

        setExpenseList(res.items);
        setTotal(res.total);
      } catch (err) {
        console.error('❌ 리스트 조회 실패:', err);
      } finally {
        setLoading(false);
      }
    }

    loadList();
  }, [activeTab, selectedYear, selectedTeam, selectedType, selectedProof, selectedProofStatus, selectedStatus, page]);

  // ============================
  // 체크박스 전체선택
  // ============================
  const handleCheckAll = (checked: boolean) => {
    setCheckAll(checked);

    setCheckedItems(
      checked
        ? expenseList
            .filter((item) => user_id !== item.user_id) // disabled 대상 제외
            .map((item) => item.seq)
        : []
    );
  };

  // 개별 체크박스 핸들러
  const handleCheckItem = (seq: number, checked: boolean) => {
    setCheckedItems((prev) => (checked ? [...prev, seq] : prev.filter((id) => id !== seq)));
  };

  // 전체 선택 상태 반영
  useEffect(() => {
    if (expenseList.length === 0) return;
    const selectable = expenseList.filter((i) => i.user_id !== user_id).map((i) => i.seq);

    setCheckAll(selectable.length > 0 && selectable.every((id) => checkedItems.includes(id)));
  }, [checkedItems, expenseList]);

  // 탭 변경 시 필터 초기화
  const handleTabChange = (tab: 'all' | 'claimed') => {
    setActiveTab(tab);
    setPage(1);

    setSelectedYear('2025');
    setSelectedType([]);
    setSelectedStatus([]);
    setSelectedProof([]);
    setSelectedProofStatus([]);
    setCheckedItems([]);
  };

  const handleConfirm = () => {};

  return (
    <>
      <ManagerListFilter
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setPage(1);
        }}
        selectedYear={selectedYear}
        selectedType={selectedType}
        selectedStatus={selectedStatus}
        selectedProof={selectedProof}
        selectedProofStatus={selectedProofStatus}
        typeOptions={typeOptions}
        checkedItems={checkedItems}
        onYearChange={setSelectedYear}
        onTypeChange={setSelectedType}
        onStatusChange={setSelectedStatus}
        onProofChange={setSelectedProof}
        onProofStatusChange={setSelectedProofStatus}
        onRefresh={() => handleTabChange(activeTab)}
        onConfirm={() => handleConfirm()}
      />

      <Table variant="primary" align="center" className="table-fixed">
        <TableHeader>
          <TableRow className="[&_th]:px-2 [&_th]:text-[13px] [&_th]:font-medium">
            <TableHead className="w-[8%]">EXP#</TableHead>
            <TableHead className="w-[6%] whitespace-nowrap">증빙 수단</TableHead>
            <TableHead className="w-[7%]">비용 용도</TableHead>
            <TableHead>비용 제목</TableHead>
            <TableHead className="w-[5%] whitespace-nowrap">증빙 상태</TableHead>
            <TableHead className="w-[9%]">금액</TableHead>
            <TableHead className="w-[8%]">세금</TableHead>
            <TableHead className="w-[9%]">합계</TableHead>
            <TableHead className="w-[6%]">작성자</TableHead>
            <TableHead className="w-[6%]">상태</TableHead>
            <TableHead className="w-[12%]">작성 일시</TableHead>
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
              <ManagerListRow
                key={item.seq}
                item={item}
                activeTab={activeTab}
                checked={checkedItems.includes(item.seq)}
                onCheck={handleCheckItem}
              />
            ))
          )}
        </TableBody>
      </Table>

      {activeTab === 'claimed' && (
        <div className="mt-4 flex gap-2">
          {/* <Button type="button" size="sm" variant="outline" onClick={handleDeleteSelected}>
            선택 삭제
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={handleClaimSelected}>
            선택 청구
          </Button> */}
        </div>
      )}

      <div className="mt-5">
        {expenseList.length !== 0 && (
          <AppPagination
            totalPages={Math.ceil(total / pageSize)}
            initialPage={page}
            visibleCount={5}
            onPageChange={(p) => setPage(p)} //부모 state 업데이트
          />
        )}
      </div>
    </>
  );
}
