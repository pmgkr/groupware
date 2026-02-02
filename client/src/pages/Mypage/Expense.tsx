import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useUser } from '@/hooks/useUser';
import { getExpenseType } from '@/api';
import { getExpenseMine } from '@/api/mypage/expense';
import type { ExpenseListResponse, ExpenseListParams, PExpenseItem, NExpenseItem } from '@/api/mypage/expense';
import { getGrowingYears } from '@/utils';
import { useIsMobileViewport } from '@/hooks/useViewport';

import { Badge } from '@/components/ui/badge';
import { AppPagination } from '@/components/ui/AppPagination';
import { type MultiSelectOption, type MultiSelectRef } from '@components/multiselect/multi-select';

import { ExpenseMineTable } from '@components/features/Expense/_responsive/ExpenseMineTable';
import { ExpenseMineCard } from '@components/features/Expense/_responsive/ExpenseMineCard';
import { ExpenseMineFilter } from '@components/features/Expense/_components/ExpenseMineFilter';
import { ExpenseMineMo } from '@components/features/Expense/_components/ExpenseMineMo';

function isPExpense(item: any): item is PExpenseItem {
  return 'alloc_status' in item && 'is_estimate' in item;
}

function isNExpense(item: any): item is NExpenseItem {
  return !('alloc_status' in item);
}

export default function Expense() {
  const isMobile = useIsMobileViewport();
  const { user_id, user_level } = useUser();
  const [searchParams, setSearchParams] = useSearchParams(); // 파라미터 값 저장

  // 상단 필터용 state
  const [activeTab, setActiveTab] = useState<'pexpense' | 'nexpense'>(() => {
    const flag = searchParams.get('flag');
    if (flag === 'P') return 'pexpense';
    if (flag === 'N') return 'nexpense';
    return 'pexpense';
  });
  const currentYear = String(new Date().getFullYear()); // 올해 구하기
  const yearOptions = getGrowingYears(); // yearOptions
  const [selectedYear, setSelectedYear] = useState(() => searchParams.get('year') || currentYear);
  const [selectedType, setSelectedType] = useState<string[]>(() => searchParams.get('type')?.split(',') ?? []);
  const [selectedStatus, setSelectedStatus] = useState<string[]>(() => searchParams.get('status')?.split(',') ?? []);
  const [selectedProof, setSelectedProof] = useState<string[]>(() => searchParams.get('method')?.split(',') ?? []);
  const [selectedProofStatus, setSelectedProofStatus] = useState<string[]>(() => searchParams.get('attach')?.split(',') ?? []);

  const [page, setPage] = useState<number>(() => Number(searchParams.get('page') || 1));
  const [total, setTotal] = useState(0);
  const pageSize = 15;

  const typeRef = useRef<MultiSelectRef>(null);
  const statusRef = useRef<MultiSelectRef>(null);
  const proofRef = useRef<MultiSelectRef>(null);
  const proofStatusRef = useRef<MultiSelectRef>(null);

  const [typeOptions, setTypeOptions] = useState<MultiSelectOption[]>([]);
  const [expenseData, setExpenseData] = useState<ExpenseListResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // 필터 옵션 정의
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

  // 필터 변경 시 page 초기화
  type FilterKey = 'year' | 'type' | 'status' | 'method' | 'attach';
  const handleFilterChange = (key: FilterKey, value: any) => {
    setPage(1);

    switch (key) {
      case 'year':
        setSelectedYear(value as string);
        break;

      case 'type':
        setSelectedType(value as string[]);
        break;

      case 'status':
        setSelectedStatus(value as string[]);
        break;

      case 'method':
        setSelectedProof(value as string[]);
        break;

      case 'attach':
        setSelectedProofStatus(value as string[]);
        break;

      default:
        break;
    }
  };

  // 탭 변경 시 필터 초기화
  const resetAllFilters = () => {
    setSelectedYear(currentYear);
    setSelectedType([]);
    setSelectedStatus([]);
    setSelectedProof([]);
    setSelectedProofStatus([]);
    setPage(1);

    // MultiSelect 내부 상태 초기화
    typeRef.current?.clear();
    statusRef.current?.clear();
    proofRef.current?.clear();
    proofStatusRef.current?.clear();
  };

  // 탭 변경 시 필터 초기화
  const handleTabChange = (tab: 'pexpense' | 'nexpense') => {
    setActiveTab(tab);
    setPage(1);

    setSelectedYear(currentYear);
    setSelectedType([]);
    setSelectedStatus([]);
    setSelectedProof([]);
    setSelectedProofStatus([]);

    // MultiSelect 내부 상태 초기화
    typeRef.current?.clear();
    statusRef.current?.clear();
    proofRef.current?.clear();
    proofStatusRef.current?.clear();
  };

  const statusMap = {
    Saved: <Badge variant="grayish">임시저장</Badge>,
    Claimed: <Badge variant="secondary">승인대기</Badge>,
    Confirmed: <Badge>승인완료</Badge>,
    Approved: <Badge className="bg-primary-blue/80">지급대기</Badge>,
    Completed: <Badge className="bg-primary-blue">지급완료</Badge>,
    Rejected: <Badge className="bg-destructive">반려됨</Badge>,
  } as const;

  // ============================
  // 비용유형 가져오기
  // ============================
  useEffect(() => {
    (async () => {
      try {
        let expenseTypeParam;
        if (activeTab === 'pexpense') {
          expenseTypeParam = user_level === 'user' ? 'exp_type1' : 'exp_type2';
        } else {
          expenseTypeParam = user_level === 'user' ? 'nexp_type2' : 'nexp_type1';
        }

        const data = await getExpenseType(expenseTypeParam);
        const mapped = data.map((t: any) => ({
          label: t.code,
          value: t.code,
        }));
        setTypeOptions(mapped);
      } catch (err) {
        console.error('❌ 비용유형 불러오기 실패:', err);
      }
    })();
  }, [activeTab]);

  // params에 따라 상단 필터 복구
  useEffect(() => {
    const flag = searchParams.get('flag');
    setActiveTab(flag === 'N' ? 'nexpense' : 'pexpense');

    setSelectedYear(searchParams.get('year') || currentYear);
    setSelectedType(searchParams.get('type')?.split(',') ?? []);
    setSelectedStatus(searchParams.get('status')?.split(',') ?? []);
    setSelectedProof(searchParams.get('method')?.split(',') ?? []);
    setSelectedProofStatus(searchParams.get('attach')?.split(',') ?? []);

    setPage(Number(searchParams.get('page') || 1));
  }, []); // 최초 1회

  useEffect(() => {
    if (!user_id) return;

    (async () => {
      try {
        setLoading(true);

        const params: ExpenseListParams = {
          flag: activeTab === 'pexpense' ? 'P' : 'N',
          year: selectedYear,
          page,
        };

        if (selectedStatus.length) params.status = selectedStatus.join(',');
        if (selectedType.length) params.type = selectedType.join(',');
        if (selectedProof.length) params.method = selectedProof.join(',');
        if (selectedProofStatus.length) params.attach = selectedProofStatus.join(',');

        const res = await getExpenseMine(params);

        console.log('✅ 비용 리스트 응답:', res);

        setExpenseData(res);
        setTotal(res.total);
      } catch (err) {
        console.error('❌ 비용 리스트 불러오기 실패:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user_id, activeTab, selectedYear, selectedType, selectedStatus, selectedProof, selectedProofStatus, page, pageSize]);

  // URL 파라미터 업데이트
  useEffect(() => {
    updateSearchParams({
      flag: activeTab === 'pexpense' ? 'P' : 'N',
      page,
      year: selectedYear,
      type: selectedType,
      status: selectedStatus,
      method: selectedProof,
      attach: selectedProofStatus,
    });
  }, [activeTab, page, selectedYear, selectedType, selectedStatus, selectedProof, selectedProofStatus]);

  // 파라미터 업데이트 유틸 함수
  const updateSearchParams = useCallback(
    (next: Record<string, any>) => {
      const params = new URLSearchParams(searchParams);

      Object.entries(next).forEach(([key, value]) => {
        if (!value || (Array.isArray(value) && value.length === 0)) {
          params.delete(key);
        } else {
          params.set(key, Array.isArray(value) ? value.join(',') : String(value));
        }
      });

      setSearchParams(params);
      console.log('파라미터', params);
    },
    [searchParams, setSearchParams]
  );

  const rawList = expenseData?.list ?? [];

  const filteredList = useMemo(() => {
    return rawList.filter((item) => {
      if (selectedType.length) {
        const types = item.el_type?.split('|') ?? [];
        if (!selectedType.some((t) => types.includes(t))) return false;
      }
      if (selectedStatus.length && !selectedStatus.includes(item.status)) return false;
      if (selectedProof.length && !selectedProof.includes(item.el_method)) return false;
      if (selectedProofStatus.length && !selectedProofStatus.includes(item.el_attach)) return false;
      return true;
    });
  }, [rawList, selectedType, selectedStatus, selectedProof, selectedProofStatus]);

  const filteredPList = useMemo(() => (activeTab === 'pexpense' ? filteredList.filter(isPExpense) : []), [filteredList, activeTab]);
  const filteredNList = useMemo(() => (activeTab === 'nexpense' ? filteredList.filter(isNExpense) : []), [filteredList, activeTab]);

  const totalFiltered = filteredList.length;

  const filterProps = {
    activeTab,
    onTabChange: handleTabChange,

    yearOptions,
    selectedYear,
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

    onYearChange: (v: string) => handleFilterChange('year', v),
    onTypeChange: (v: string[]) => handleFilterChange('type', v),
    onStatusChange: (v: string[]) => handleFilterChange('status', v),
    onProofChange: (v: string[]) => handleFilterChange('method', v),
    onProofStatusChange: (v: string[]) => handleFilterChange('attach', v),

    onReset: resetAllFilters,
  };

  const search = `?${searchParams.toString()}`;

  return (
    <>
      {isMobile ? <ExpenseMineMo {...filterProps} /> : <ExpenseMineFilter {...filterProps} />}

      {isMobile ? (
        <ExpenseMineCard
          type={activeTab === 'pexpense' ? 'P' : 'N'}
          list={filteredList}
          loading={loading}
          search={search}
          statusMap={statusMap}
        />
      ) : (
        <ExpenseMineTable
          type={activeTab === 'pexpense' ? 'P' : 'N'}
          list={filteredList}
          loading={loading}
          search={search}
          statusMap={statusMap}
        />
      )}

      <div className="mt-5">
        {expenseData && filteredList.length !== 0 && (
          <AppPagination
            totalPages={Math.ceil(totalFiltered / pageSize)}
            initialPage={page}
            visibleCount={5}
            onPageChange={setPage} //부모 state 업데이트
          />
        )}
      </div>
    </>
  );
}
