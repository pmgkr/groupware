import { useRef, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { useUser } from '@/hooks/useUser';
import { formatDate } from '@/utils';

import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';
import { useAppDialog } from '@/components/common/ui/AppDialog/AppDialog';

import { type MultiSelectOption, type MultiSelectRef } from '@components/multiselect/multi-select';
import type { DateRange } from 'react-day-picker';
import { OctagonAlert } from 'lucide-react';

import { getExpenseType } from '@/api';
import { getAdminExpenseList, confirmExpense, setDdate, type ExpenseListItems } from '@/api/admin/pexpense';
import { AdminListFilter } from '@components/features/Project/_components/AdminListFilter';
import AdminExpenseList from '@components/features/Project/AdminExpenseList';

export default function Pexpense() {
  const { user_id } = useUser();
  const [searchParams, setSearchParams] = useSearchParams(); // 파라미터 값 저장

  // ============================
  // Filter States
  // ============================
  const [selectedYear, setSelectedYear] = useState(() => searchParams.get('year') || '2025');
  const [selectedType, setSelectedType] = useState<string[]>(() => searchParams.get('type')?.split(',') ?? []);
  const [selectedStatus, setSelectedStatus] = useState<string[]>(() => searchParams.get('status')?.split(',') ?? []);
  const [selectedProof, setSelectedProof] = useState<string[]>(() => searchParams.get('method')?.split(',') ?? []);
  const [selectedProofStatus, setSelectedProofStatus] = useState<string[]>(() => searchParams.get('attach')?.split(',') ?? []);
  const [selectedDdate, setSelectedDdate] = useState(() => searchParams.get('ddate') || '');
  const [datePickerKey, setDatePickerKey] = useState(0); // DateRange 마운트용 State
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | undefined>(undefined);
  const [searchInput, setSearchInput] = useState(''); // 사용자가 입력중인 Input 저장값
  const [searchQuery, setSearchQuery] = useState(''); // 실제 검색 Input 저장값
  const [page, setPage] = useState<number>(() => Number(searchParams.get('page') || 1));

  const typeRef = useRef<MultiSelectRef>(null);
  const statusRef = useRef<MultiSelectRef>(null);
  const proofRef = useRef<MultiSelectRef>(null);
  const proofStatusRef = useRef<MultiSelectRef>(null);

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
  const [pageSize, setPageSize] = useState(15); // 한 페이지에 보여줄 개수

  // ============================
  // 비용유형 가져오기
  // ============================
  useEffect(() => {
    async function loadExpenseTypes() {
      try {
        const data = await getExpenseType('exp_type2');
        setTypeOptions(data.map((t: any) => ({ label: t.code, value: t.code })));
      } catch (err) {
        console.error('❌ 비용 유형 호출 실패:', err);
      }
    }

    loadExpenseTypes();
  }, []);

  // ============================
  // 리스트 조회 (팀 선택 완료 후 실행)
  // ============================
  useEffect(() => {
    async function loadList() {
      try {
        setLoading(true);

        const params: Record<string, string> = {
          year: selectedYear,
          page: String(page),
        };

        if (!selectedStatus.length) {
          params.status = 'Confirmed';
        } else {
          params.status = selectedStatus.join(',');
        }
        if (selectedType.length) params.type = selectedType.join(',');
        if (selectedProof.length) params.method = selectedProof.join(',');
        if (selectedProofStatus.length) params.attach = selectedProofStatus.join(',');
        if (selectedDdate !== '') params.ddate = selectedDdate;
        if (selectedDateRange?.from) {
          params.sdate = formatDate(selectedDateRange.from.toISOString());
        }
        if (selectedDateRange?.to) {
          params.edate = formatDate(selectedDateRange.to.toISOString());
        }
        if (searchQuery) params.q = searchQuery;

        console.log(params);

        setSearchParams(params);
        const res = await getAdminExpenseList(params);

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
  }, [selectedYear, selectedType, selectedProof, selectedProofStatus, selectedStatus, selectedDdate, searchQuery, selectedDateRange, page]);

  // ============================
  // Input 핸들러
  // ============================
  const handleSearchInputChange = (val: string) => {
    setSearchInput(val);
  };

  const handleSearchSubmit = () => {
    setSearchQuery(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
  };

  const handleDateRange = (range: DateRange | undefined) => {
    setPage(1); // 날짜 바뀌면 페이지 초기화
    setSelectedDateRange(range);
  };

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

  const resetAllFilters = () => {
    setSearchInput('');
    setSearchQuery('');

    setSelectedYear('2025');
    setSelectedType([]);
    setSelectedStatus([]);
    setSelectedProof([]);
    setSelectedProofStatus([]);
    setSelectedDdate('');
    setCheckedItems([]);
    setSelectedDateRange(undefined);
    setDatePickerKey((prev) => prev + 1);

    // MultiSelect 내부 상태 초기화
    typeRef.current?.clear();
    statusRef.current?.clear();
    proofRef.current?.clear();
    proofStatusRef.current?.clear();
  };

  const handleConfirm = () => {
    if (checkedItems.length === 0) {
      addAlert({
        title: '선택된 비용 항목이 없습니다.',
        message: '승인할 비용 항목을 선택해주세요.',
        icon: <OctagonAlert />,
        duration: 2000,
      });
      return;
    }

    const selectedRows = expenseList.filter((item) => checkedItems.includes(item.seq));
    const nonSaved = selectedRows.filter((item) => item.status === 'Saved');

    if (nonSaved.length > 0) {
      const invalidIds = nonSaved.map((i) => i.exp_id).join(', ');

      addAlert({
        title: '승인 불가한 비용 항목이 포함되어 있습니다.',
        message: `임시저장 상태인 항목(${invalidIds})은 승인할 수 없습니다.`,
        icon: <OctagonAlert />,
        duration: 2000,
      });
      return;
    }

    addDialog({
      title: '선택한 비용 항목을 승인합니다.',
      message: `<span class="text-primary-blue-500 font-semibold">${checkedItems.length}</span>건의 비용을 지급 완료 처리 하시겠습니까?`,
      confirmText: '승인',
      cancelText: '취소',
      onConfirm: async () => {
        try {
          const payload = { seqs: checkedItems };
          const res = await confirmExpense(payload);

          if (res.ok) {
            addAlert({
              title: '비용 승인이 완료되었습니다.',
              message: `<p><span class="text-primary-blue-500 font-semibold">${res.updated_count}</span>건의 비용이 완료 처리되었습니다.</p>`,
              icon: <OctagonAlert />,
              duration: 2000,
            });
          }

          setExpenseList((prev) => prev.filter((item) => !checkedItems.includes(item.seq)));
          setCheckedItems([]);
        } catch (err) {
          console.error('❌ 지급 실패:', err);

          addAlert({
            title: '비용 승인 실패',
            message: `비용 지급 처리 중 오류가 발생했습니다. \n잠시 후 다시 시도해주세요.`,
            icon: <OctagonAlert />,
            duration: 2000,
          });
        } finally {
          setCheckAll(false);
        }
      },
    });
  };

  // 비용 반려 이벤트 핸들러
  const handleReject = () => {};

  const handleSetDdate = async (seq: number, ddate: Date) => {
    if (seq === null || ddate === undefined) {
      addAlert({
        title: '지급 예정일 지정 실패',
        message: '지급예정일 지정에 실패했습니다. 잠시 후 다시 시도해 주세요.',
        icon: <OctagonAlert />,
        duration: 2000,
      });
    }

    try {
      const payload = [{ seq, ddate }];
      const res = await setDdate(payload);

      if (res.updatedCount) {
        addAlert({
          title: '지급 예정일 지정',
          message: '지급 예정일이 정상적으로 저장되었습니다.',
          icon: <OctagonAlert />,
          duration: 2000,
        });
      }
    } catch (err) {
      console.error('❌ 지정 실패:', err);

      addAlert({
        title: '지급 예정일 지정 실패',
        message: '지급 예정일 지정 중 오류가 발생했습니다.',
        duration: 2000,
      });
    }
  };

  return (
    <>
      <AdminListFilter
        selectedYear={selectedYear}
        selectedType={selectedType}
        selectedStatus={selectedStatus}
        selectedProof={selectedProof}
        selectedProofStatus={selectedProofStatus}
        selectedDdate={selectedDdate}
        typeRef={typeRef}
        statusRef={statusRef}
        proofRef={proofRef}
        proofStatusRef={typeRef}
        typeOptions={typeOptions}
        checkedItems={checkedItems}
        onYearChange={setSelectedYear}
        onTypeChange={setSelectedType}
        onStatusChange={setSelectedStatus}
        onProofChange={setSelectedProof}
        onProofStatusChange={setSelectedProofStatus}
        onDdateChange={setSelectedDdate}
        onRefresh={() => resetAllFilters()}
        onConfirm={() => handleConfirm()}
        onReject={() => handleReject()}
        searchInput={searchInput}
        onSearchInputChange={handleSearchInputChange}
        onSearchSubmit={handleSearchSubmit}
        onClearSearch={handleClearSearch}
        datePickerKey={datePickerKey}
        selectedDateRange={selectedDateRange}
        onDateRangeChange={handleDateRange}
      />

      <AdminExpenseList
        loading={loading}
        expenseList={expenseList}
        checkAll={checkAll}
        checkedItems={checkedItems}
        handleCheckAll={handleCheckAll}
        handleCheckItem={handleCheckItem}
        handleSetDdate={handleSetDdate}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
      />
    </>
  );
}
