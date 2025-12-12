import { useRef, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { useUser } from '@/hooks/useUser';
import { notificationApi } from '@/api/notification';
import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';
import { useAppDialog } from '@/components/common/ui/AppDialog/AppDialog';

import { type MultiSelectOption, type MultiSelectRef } from '@components/multiselect/multi-select';
import { OctagonAlert } from 'lucide-react';

import { getExpenseType } from '@/api';
import { getManagerExpenseList, getManagerExpenseMine, confirmExpense, type ExpenseListItems } from '@/api/manager/pexpense';
import { ManagerListFilter } from '@components/features/Project/_components/ManagerListFilter';
import ManagerExpenseList from '@components/features/Project/ManagerExpenseList';

export default function Pexpense() {
  const { user_id } = useUser();
  const [searchParams, setSearchParams] = useSearchParams(); // 파라미터 값 저장

  // ============================
  // Filter States
  // ============================
  const [activeTab, setActiveTab] = useState<'all' | 'claimed'>(() => {
    return (searchParams.get('tab') as 'all' | 'claimed') || 'claimed';
  });
  const [selectedYear, setSelectedYear] = useState(() => searchParams.get('year') || '2025');
  const [selectedType, setSelectedType] = useState<string[]>(() => searchParams.get('type')?.split(',') ?? []);
  const [selectedStatus, setSelectedStatus] = useState<string[]>(() => searchParams.get('status')?.split(',') ?? []);
  const [selectedProof, setSelectedProof] = useState<string[]>(() => searchParams.get('method')?.split(',') ?? []);
  const [selectedProofStatus, setSelectedProofStatus] = useState<string[]>(() => searchParams.get('attach')?.split(',') ?? []);
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
        const data = await getExpenseType('nexp_type1');
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
          tab: activeTab,
          year: selectedYear,
          page: String(page),
        };

        if (activeTab === 'claimed') {
          params.status = 'claimed';
        } else {
          if (selectedStatus.length) params.status = selectedStatus.join(',');
        }
        if (selectedType.length) params.type = selectedType.join(',');
        if (selectedProof.length) params.method = selectedProof.join(',');
        if (selectedProofStatus.length) params.attach = selectedProofStatus.join(',');

        setSearchParams(params);
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
  }, [activeTab, selectedYear, selectedType, selectedProof, selectedProofStatus, selectedStatus, page]);

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
    resetAllFilters();
  };

  const resetAllFilters = () => {
    setSelectedYear('2025');
    setSelectedType([]);
    setSelectedStatus([]);
    setSelectedProof([]);
    setSelectedProofStatus([]);
    setCheckedItems([]);

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
      message: `<span class="text-primary-blue-500 font-semibold">${checkedItems.length}</span>건의 비용을 승인하시겠습니까?`,
      confirmText: '승인',
      cancelText: '취소',
      onConfirm: async () => {
        try {
          const payload = { seqs: checkedItems };
          const res = await confirmExpense(payload);

          if (res.ok) {
            for (const row of selectedRows) {
              await notificationApi.registerNotification({
                user_id: row.user_id,
                user_name: row.user_nm,
                noti_target: user_id!,
                noti_title: `${row.exp_id} · ${row.el_title}`,
                noti_message: `청구한 프로젝트 비용을 승인했습니다.`,
                noti_type: 'expense',
                noti_url: `/project/${row.project_id}/expense/${row.seq}`,
              });
            }

            addAlert({
              title: '비용 승인이 완료되었습니다.',
              message: `<p><span class="text-primary-blue-500 font-semibold">${res.updated_count}</span>건의 비용이 승인 완료되었습니다.</p>`,
              icon: <OctagonAlert />,
              duration: 2000,
            });
          }

          setExpenseList((prev) => prev.filter((item) => !checkedItems.includes(item.seq)));
          setCheckedItems([]);
        } catch (err) {
          console.error('❌ 승인 실패:', err);

          addAlert({
            title: '비용 승인 실패',
            message: `승인 중 오류가 발생했습니다. \n잠시 후 다시 시도해주세요.`,
            icon: <OctagonAlert />,
            duration: 2000,
          });
        } finally {
          setCheckAll(false);
        }
      },
    });
  };

  return (
    <>
      <ManagerListFilter
        activeTab={activeTab}
        onTabChange={(tab) => {
          handleTabChange(tab);
        }}
        selectedYear={selectedYear}
        selectedType={selectedType}
        selectedStatus={selectedStatus}
        selectedProof={selectedProof}
        selectedProofStatus={selectedProofStatus}
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
        onRefresh={() => resetAllFilters()}
        onConfirm={() => handleConfirm()}
      />

      <ManagerExpenseList
        loading={loading}
        expenseList={expenseList}
        checkAll={checkAll}
        checkedItems={checkedItems}
        handleCheckAll={handleCheckAll}
        handleCheckItem={handleCheckItem}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
      />
    </>
  );
}
