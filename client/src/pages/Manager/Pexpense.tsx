import { useRef, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { useUser } from '@/hooks/useUser';
import { getGrowingYears } from '@/utils';
import { useIsMobileViewport } from '@/hooks/useViewport';

import { notificationApi } from '@/api/notification';
import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';
import { useAppDialog } from '@/components/common/ui/AppDialog/AppDialog';

import { ManagerFilterPC } from '@/components/features/Project/_responsive/ManagerFilterPC';
import { ManagerFilterMo } from '@/components/features/Project/_responsive/ManagerFilterMo';
import { ManagerCardList } from '@/components/features/Project/_responsive/ManagerCardList';
import ManagerExpenseList from '@/components/features/Project/_responsive/ManagerTable';

import { type MultiSelectOption, type MultiSelectRef } from '@components/multiselect/multi-select';
import { OctagonAlert } from 'lucide-react';

import { getExpenseType } from '@/api';
import { getManagerExpenseList, getManagerExpenseMine, confirmExpense, type ExpenseListItems } from '@/api/manager/pexpense';

export default function Pexpense() {
  const { user_id } = useUser();
  const isMobile = useIsMobileViewport();
  const [searchParams, setSearchParams] = useSearchParams(); // 파라미터 값 저장

  // ============================
  // Filter States
  // ============================
  const currentYear = String(new Date().getFullYear()); // 올해 구하기
  const yearOptions = getGrowingYears(); // yearOptions
  const [selectedYear, setSelectedYear] = useState(() => searchParams.get('year') || currentYear);
  const [activeTab, setActiveTab] = useState<'all' | 'claimed'>(() => {
    return (searchParams.get('tab') as 'all' | 'claimed') || 'claimed';
  });
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

        console.log('매니저 플젝비용 파라미터', params);
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
    if (!checked) {
      setCheckedItems([]);
      return;
    }

    const selectableSeqs = expenseList.filter((item) => item.status === 'Claimed').map((item) => item.seq);

    setCheckedItems(selectableSeqs);
  };

  // 개별 체크박스 핸들러
  const handleCheckItem = (seq: number, checked: boolean) => {
    const item = expenseList.find((i) => i.seq === seq);
    if (!item) return;

    if (item.status !== 'Claimed') return;

    setCheckedItems((prev) => (checked ? [...prev, seq] : prev.filter((id) => id !== seq)));
  };

  // 탭 변경 시 필터 초기화
  const handleTabChange = (tab: 'all' | 'claimed') => {
    setActiveTab(tab);
    setPage(1);
    resetAllFilters();
  };

  const resetAllFilters = () => {
    setSelectedYear(currentYear);
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

  const statusOptions: MultiSelectOption[] = [
    { label: '임시저장', value: 'Saved' },
    { label: '승인대기', value: 'Claimed' },
    { label: '승인완료', value: 'Confirmed' },
    { label: '지급대기', value: 'Approved' },
    { label: '지급완료', value: 'Completed' },
    { label: '반려됨', value: 'Rejected' },
  ];

  const proofMethod: MultiSelectOption[] = [
    { label: 'PMG', value: 'PMG' },
    { label: 'MCS', value: 'MCS' },
    { label: '개인카드', value: '개인카드' },
    { label: '세금계산서', value: '세금계산서' },
    { label: '현금영수증', value: '현금영수증' },
    { label: '기타', value: '기타' },
  ];

  const proofStatusOptions: MultiSelectOption[] = [
    { label: '제출', value: 'Y' },
    { label: '미제출', value: 'N' },
  ];

  const filterProps = {
    activeTab,
    onTabChange: handleTabChange,

    selectedYear,
    yearOptions,
    onYearChange: (v: string) => {
      setSelectedYear(v);
      setPage(1);
    },

    selectedType,
    selectedStatus,
    selectedProof,
    selectedProofStatus,

    typeOptions,
    statusOptions,
    proofMethod,
    proofStatusOptions,

    typeRef,
    statusRef,
    proofRef,
    proofStatusRef,

    onTypeChange: (v: string[]) => {
      setSelectedType(v);
      setPage(1);
    },
    onStatusChange: (v: string[]) => {
      setSelectedStatus(v);
      setPage(1);
    },
    onProofChange: (v: string[]) => {
      setSelectedProof(v);
      setPage(1);
    },
    onProofStatusChange: (v: string[]) => {
      setSelectedProofStatus(v);
      setPage(1);
    },

    checkedItems,
    onRefresh: resetAllFilters,
    onConfirm: handleConfirm,
  };

  return (
    <>
      {isMobile ? (
        <>
          <ManagerFilterMo {...filterProps} />
          <ManagerCardList
            activeTab={activeTab}
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
      ) : (
        <>
          <ManagerFilterPC {...filterProps} />
          <ManagerExpenseList
            activeTab={activeTab}
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
      )}
    </>
  );
}
