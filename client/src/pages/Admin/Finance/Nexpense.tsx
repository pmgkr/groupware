import { useRef, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { useUser } from '@/hooks/useUser';
import { useIsMobileViewport } from '@/hooks/useViewport';

import { formatDate, getGrowingYears, sanitizeFilename, formatYYMMDD } from '@/utils';
import { triggerDownload } from '@components/features/Project/utils/download';
import { downloadExpenseExcel } from '@/components/features/Expense/utils/excelDown';

import { notificationApi } from '@/api/notification';
import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';
import { useAppDialog } from '@/components/common/ui/AppDialog/AppDialog';

import { type MultiSelectOption, type MultiSelectRef } from '@components/multiselect/multi-select';
import type { DateRange } from 'react-day-picker';
import { OctagonAlert } from 'lucide-react';

import { getExpenseType, type addInfoDTO } from '@/api';
import {
  getAdminExpenseList,
  confirmExpense,
  setDdate,
  getPDFDownload,
  getMultiPDFDownload,
  getAdminExpenseExcel,
  sendExpenseToCBox,
  type ExpenseListItems,
} from '@/api/admin/nexpense';
import { AdminListFilter } from '@components/features/Expense/_components/AdminListFilter';
import { AdminListFilterMo } from '@components/features/Expense/_components/AdminListFilterMo';
import AdminExpenseCard from '@components/features/Expense/_responsive/AdminExpenseCard';
import AdminExpenseTable from '@components/features/Expense/_responsive/AdminExpenseTable';
import { AddInfoDialog } from '@/components/features/Project/_components/addInfoDialog';
import { CBoxDialog } from '@/components/features/Expense/_components/AdminCBox';

const parseCBoxMemo = (memo: string): string[] => {
  return memo
    .split(/\r?\n/) // 줄바꿈
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
};

export default function Nexpense() {
  const { user_id } = useUser();
  const isMobile = useIsMobileViewport();
  const [searchParams, setSearchParams] = useSearchParams(); // 파라미터 값 저장

  // ============================
  // Filter States
  // ============================
  const currentYear = String(new Date().getFullYear()); // 올해 구하기
  const yearOptions = getGrowingYears(); // yearOptions
  const [selectedYear, setSelectedYear] = useState(() => searchParams.get('year') || currentYear);
  const [selectedType, setSelectedType] = useState<string[]>(() => searchParams.get('type')?.split(',') ?? []);
  const [selectedStatus, setSelectedStatus] = useState<string[]>(() => searchParams.get('status')?.split(',') ?? ['Confirmed']);
  const [selectedProof, setSelectedProof] = useState<string[]>(() => searchParams.get('method')?.split(',') ?? []);
  const [selectedProofStatus, setSelectedProofStatus] = useState<string[]>(() => searchParams.get('attach')?.split(',') ?? []);
  const [selectedDdate, setSelectedDdate] = useState(() => searchParams.get('ddate') || '');
  const [datePickerKey, setDatePickerKey] = useState(0); // DateRange 마운트용 State
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | undefined>(undefined);
  const [searchInput, setSearchInput] = useState(() => searchParams.get('q') || ''); // 사용자가 입력중인 Input 저장값
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || ''); // 실제 검색 Input 저장값
  const [page, setPage] = useState<number>(() => Number(searchParams.get('page') || 1));

  // Add Info Modal State
  const [selectedAddInfos, setSelectedAddInfos] = useState<addInfoDTO[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);

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
  const loadList = useCallback(async () => {
    try {
      setLoading(true);

      const params: Record<string, any> = {
        year: selectedYear,
        page: page,
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
  }, [selectedYear, selectedType, selectedProof, selectedProofStatus, selectedStatus, selectedDdate, searchQuery, selectedDateRange, page]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  // ============================
  // Input 핸들러
  // ============================
  const handleSearchInputChange = (val: string) => {
    setSearchInput(val);
  };

  const handleSearchSubmit = (value?: string) => {
    setSearchQuery(value ?? searchInput);
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
    if (!checked) {
      setCheckedItems([]);
      return;
    }

    const selectableSeqs = expenseList.filter((item) => item.status !== 'Saved' && item.status !== 'Rejected').map((item) => item.seq);

    setCheckedItems(selectableSeqs);
  };

  // 개별 체크박스 핸들러
  const handleCheckItem = (seq: number, checked: boolean) => {
    setCheckedItems((prev) => (checked ? [...prev, seq] : prev.filter((id) => id !== seq)));
  };

  const resetAllFilters = () => {
    setSearchInput('');
    setSearchQuery('');

    setSelectedYear(currentYear);
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
            for (const row of selectedRows) {
              await notificationApi.registerNotification({
                user_id: row.user_id,
                user_name: row.user_nm,
                noti_target: user_id!,
                noti_title: `${row.exp_id} · ${row.el_title}`,
                noti_message: `청구한 비용을 지급 완료했습니다.`,
                noti_type: 'expense',
                noti_url: `/expense/${row.exp_id}`,
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
        return;
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

  const handlePDFDownload = async (seq: number, expId: string, userName: string) => {
    try {
      const res = await getPDFDownload(seq);

      const rawFilename = `${expId}_${userName}.pdf`;
      const filename = sanitizeFilename(rawFilename);

      const blob = await res.blob();
      triggerDownload(blob, filename);
    } catch (e) {
      console.error('❌ PDF 다운로드 실패:', e);
    }
  };

  const handleMultiPDFDownload = async (seqs: number[]) => {
    if (seqs.length === 0) {
      addAlert({
        title: '선택된 비용 항목 없음',
        message: 'PDF 다운로드할 비용 항목을 선택해주세요.',
        icon: <OctagonAlert />,
        duration: 1500,
      });
      return;
    }

    try {
      const blob = await getMultiPDFDownload(seqs);
      const date = formatYYMMDD();
      const filename = `프로젝트 비용_${date}.zip`;

      triggerDownload(blob, filename);
    } catch (e) {
      console.error('❌ 선택 PDF 다운로드 실패:', e);
    }
  };

  const handleExcelDownload = async () => {
    try {
      const params: Record<string, any> = {
        year: selectedYear,
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
      setSearchParams(params);

      const res = await getAdminExpenseExcel(params);

      downloadExpenseExcel(res.items, params);
    } catch (e) {
      console.error(e);
      alert('Excel 다운로드에 실패했습니다.');
    }
  };

  // ============================
  // C-Box
  // ============================
  const [isCBoxOpen, setIsCBoxOpen] = useState(false);

  const handleOpenCBox = () => {
    setIsCBoxOpen(true);
  };

  const handleSubmitCBox = async (value: string) => {
    const cBoxList = parseCBoxMemo(value);

    if (cBoxList.length === 0) {
      addAlert({
        title: '입력 내용 없음',
        message: '승인할 EXP#를 하나 이상 입력해 주세요.',
        icon: <OctagonAlert />,
        duration: 1500,
      });
      return;
    }

    try {
      const res = await sendExpenseToCBox({
        expIds: cBoxList,
      });

      console.log('payload:', cBoxList, 'Res', res);

      if (res.ok) {
        addAlert({
          title: '비용 지급 승인',
          message: `${cBoxList.length}개의 비용이 지급 승인되었습니다.`,
          icon: <OctagonAlert />,
          duration: 1500,
        });

        for (const row of res.items) {
          await notificationApi.registerNotification({
            user_id: row.user_id,
            user_name: row.user_nm,
            noti_target: user_id!,
            noti_title: `${row.exp_id} · ${row.el_title}`,
            noti_message: `청구한 비용을 지급 완료했습니다.`,
            noti_type: 'expense',
            noti_url: `/expense/${row.exp_id}`,
          });
        }
      } else {
        addAlert({
          title: '비용 승인 실패',
          message: `${cBoxList.length}개의 항목이 전달되었습니다.`,
          icon: <OctagonAlert />,
          duration: 1500,
        });
      }

      await loadList();
      setIsCBoxOpen(false);
    } catch (e) {
      addAlert({
        title: 'C-Box 전송 실패',
        message: '전송 중 오류가 발생했습니다.',
        icon: <OctagonAlert />,
        duration: 2000,
      });
    }

    return;
  };

  // 외주용역비 or 접대비 버튼 클릭 시
  const handleAddInfo = async (item: ExpenseListItems) => {
    setSelectedAddInfos(item.add_info ?? []);
    setDetailOpen(true);
  };

  // 필터 옵션 정의
  const statusOptions: MultiSelectOption[] = [
    { label: '임시저장', value: 'Saved' },
    { label: '승인대기', value: 'Claimed' },
    { label: '승인완료', value: 'Confirmed' },
    // { label: '지급대기', value: 'Waiting' },
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
    yearOptions,

    selectedYear,
    selectedType,
    selectedStatus,
    selectedProof,
    selectedProofStatus,
    selectedDdate,

    typeOptions,
    statusOptions,
    proofMethod,
    proofStatusOptions,

    typeRef,
    statusRef,
    proofRef,
    proofStatusRef,
    checkedItems,
    searchInput,
    datePickerKey,
    selectedDateRange,

    onYearChange: setSelectedYear,
    onTypeChange: setSelectedType,
    onStatusChange: setSelectedStatus,
    onProofChange: setSelectedProof,
    onProofStatusChange: setSelectedProofStatus,
    onDdateChange: setSelectedDdate,
    onSearchInputChange: handleSearchInputChange,
    onSearchSubmit: handleSearchSubmit,
    onClearSearch: handleClearSearch,
    onDateRangeChange: handleDateRange,

    onRefresh: () => resetAllFilters(),
    onConfirm: () => handleConfirm(),
    onReject: () => handleReject(),
  };

  return (
    <>
      {isMobile ? <AdminListFilterMo {...filterProps} /> : <AdminListFilter {...filterProps} />}

      {isMobile ? (
        <AdminExpenseCard
          loading={loading}
          expenseList={expenseList}
          checkAll={checkAll}
          checkedItems={checkedItems}
          handleCheckAll={handleCheckAll}
          handleCheckItem={handleCheckItem}
          handleSetDdate={handleSetDdate}
          handlePDFDownload={handlePDFDownload}
          handleMultiPDFDownload={handleMultiPDFDownload}
          handleExcelDownload={handleExcelDownload}
          onOpenCBox={handleOpenCBox}
          total={total}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onAInfo={handleAddInfo}
        />
      ) : (
        <AdminExpenseTable
          loading={loading}
          expenseList={expenseList}
          checkAll={checkAll}
          checkedItems={checkedItems}
          handleCheckAll={handleCheckAll}
          handleCheckItem={handleCheckItem}
          handleSetDdate={handleSetDdate}
          handlePDFDownload={handlePDFDownload}
          handleMultiPDFDownload={handleMultiPDFDownload}
          handleExcelDownload={handleExcelDownload}
          onOpenCBox={handleOpenCBox}
          total={total}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onAInfo={handleAddInfo}
        />
      )}

      <CBoxDialog
        open={isCBoxOpen}
        onClose={() => setIsCBoxOpen(false)}
        onSubmit={(value) => {
          handleSubmitCBox(value);
        }}
      />

      <AddInfoDialog open={detailOpen} onOpenChange={setDetailOpen} addInfos={selectedAddInfos} />
    </>
  );
}
