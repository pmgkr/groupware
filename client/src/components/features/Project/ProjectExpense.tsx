import { useRef, useState, useEffect, useCallback } from 'react';
import { useOutletContext, useNavigate, useParams, useSearchParams } from 'react-router';
import type { ProjectLayoutContext } from '@/pages/Project/ProjectLayout';
import * as XLSX from 'xlsx';
import { useUser } from '@/hooks/useUser';
import { findManager, getGrowingYears } from '@/utils';
import { notificationApi } from '@/api/notification';

import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';
import { useAppDialog } from '@/components/common/ui/AppDialog/AppDialog';
import { Button } from '@components/ui/button';
import { RadioButton, RadioGroup } from '@components/ui/radioButton';
import { AppPagination } from '@/components/ui/AppPagination';
import { Dialog, DialogDescription, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { type MultiSelectOption, type MultiSelectRef } from '@components/multiselect/multi-select';
import { Excel } from '@/assets/images/icons';
import { OctagonAlert } from 'lucide-react';

import { useViewport } from '@/hooks/useViewport';
import { ExpenseFilterPC } from './_responsive/ExpenseFilterPC';
import { ExpenseFilterMo } from './_responsive/ExpenseFilterMo';
import { ExpenseTable } from './_responsive/ExpenseTable';
import { ExpenseCardList } from './_responsive/ExpenseCardList';

import { getProjectExpense, type pExpenseListItem, getProjectExpenseType, deleteProjectTempExpense, claimProjectTempExpense } from '@/api';

export default function Expense() {
  const navigate = useNavigate();
  const viewport = useViewport();
  const isMobile = viewport === 'mobile';

  const { projectId } = useParams();
  const { user_id, user_name, team_id, user_level } = useUser();

  const { data } = useOutletContext<ProjectLayoutContext>();
  const [searchParams, setSearchParams] = useSearchParams(); // 파라미터 값 저장

  // 상단 필터용 state
  const [activeTab, setActiveTab] = useState<'all' | 'saved'>('all');
  const currentYear = String(new Date().getFullYear()); // 올해 구하기
  const yearOptions = getGrowingYears(); // yearOptions
  const [selectedYear, setSelectedYear] = useState(() => searchParams.get('year') || currentYear);
  const [selectedType, setSelectedType] = useState<string[]>(() => searchParams.get('type')?.split(',') ?? []);
  const [selectedStatus, setSelectedStatus] = useState<string[]>(() => searchParams.get('status')?.split(',') ?? []);
  const [selectedProof, setSelectedProof] = useState<string[]>(() => searchParams.get('method')?.split(',') ?? []);
  const [selectedProofStatus, setSelectedProofStatus] = useState<string[]>(() => searchParams.get('attach')?.split(',') ?? []);
  const [registerDialog, setRegisterDialog] = useState(false); // Dialog용 State
  const [registerType, setRegisterType] = useState<'est' | 'pro' | null>(null); // Dialog Type용 State

  const typeRef = useRef<MultiSelectRef>(null);
  const statusRef = useRef<MultiSelectRef>(null);
  const proofRef = useRef<MultiSelectRef>(null);
  const proofStatusRef = useRef<MultiSelectRef>(null);

  // 리스트 내 체크박스 state
  const [checkedItems, setCheckedItems] = useState<number[]>([]); // 선택된 seq 목록
  const [checkAll, setCheckAll] = useState(false); // 전체 선택 상태

  // Alert & Dialog hooks
  const { addAlert } = useAppAlert();
  const { addDialog } = useAppDialog();

  const [pendingDelete, setPendingDelete] = useState<number[]>([]); // 삭제 대상 seq Array

  // API 데이터 state
  const [typeOptions, setTypeOptions] = useState<MultiSelectOption[]>([]);
  const [expenseList, setExpenseList] = useState<pExpenseListItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Excel 데이터 업로드용 Input
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Excel 파일 업로드 핸들러
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    console.log('✅ 업로드된 Excel 데이터:', jsonData);

    // 업로드 완료 후 register 페이지로 이동
    navigate('register', { state: { registerType, excelData: jsonData } });
  };

  // 엑셀 업로드 버튼 클릭 시 input 트리거
  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  // 페이지네이션
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 15; // 한 페이지에 보여줄 개수

  // 필터 변경 시 page 초기화
  const handleFilterChange = (key: string, value: any) => {
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

    updateSearchParams({
      page: 1,
      [key]: value,
    });
  };

  // 탭 변경 시 필터 초기화
  const handleTabChange = (tab: 'saved' | 'all') => {
    setActiveTab(tab);
    setPage(1);
    resetAllFilters();

    setSearchParams({ tab: tab, page: '1' });
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

    updateSearchParams({ page: 1 });
  };

  // 체크박스 활성화 여부
  const isCheckable = (item: pExpenseListItem) => {
    return item.status === 'Saved' && item.user_id === user_id;
  };

  // 전체 선택 체크박스 핸들러
  const handleCheckAll = (checked: boolean) => {
    setCheckAll(checked);

    if (!checked) {
      setCheckedItems([]);
      return;
    }

    const selectableSeqs = expenseList.filter(isCheckable).map((item) => item.seq);

    setCheckedItems(selectableSeqs);
  };

  // 개별 체크박스 핸들러
  const handleCheckItem = (seq: number, checked: boolean) => {
    setCheckedItems((prev) => (checked ? [...prev, seq] : prev.filter((id) => id !== seq)));
  };

  // 선택 청구 이벤트 핸들러
  const handleClaimSelected = () => {
    if (checkedItems.length === 0) {
      addAlert({
        title: '선택된 비용 항목이 없습니다.',
        message: '청구할 비용 항목을 선택해주세요.',
        icon: <OctagonAlert />,
        duration: 2000,
      });
      return;
    }

    const selectedRows = expenseList.filter((item) => checkedItems.includes(item.seq));
    const nonSaved = selectedRows.filter((item) => item.status !== 'Saved');

    if (nonSaved.length > 0) {
      const invalidIds = nonSaved.map((i) => i.exp_id).join(', ');

      addAlert({
        title: '청구 불가한 비용 항목이 포함되어 있습니다.',
        message: `임시저장 상태가 아닌 항목(${invalidIds})은 청구할 수 없습니다.`,
        icon: <OctagonAlert />,
        duration: 2000,
      });
      return;
    }

    addDialog({
      title: '선택한 비용 항목을 청구합니다.',
      message: `<span class="text-primary-blue-500 font-semibold">${checkedItems.length}</span>건의 임시저장 비용을 청구하시겠습니까?`,
      confirmText: '청구',
      cancelText: '취소',
      onConfirm: async () => {
        try {
          const payload = { seqs: checkedItems };

          console.log('임시저장 비용 청구', payload);
          const res = await claimProjectTempExpense(payload);

          if (res.ok) {
            const manager = await findManager(team_id);
            if (manager.id) {
              if (user_id === manager.id) {
                // 접속한 계정이 매니저 아이디와 동일한 경우,
                await notificationApi.registerNotification({
                  user_id: user_id,
                  user_name: user_name!,
                  noti_target: user_id!,
                  noti_title: `${projectId} · ${data.project_title}`,
                  noti_message: `${checkedItems.length}건의 비용을 청구했습니다.`,
                  noti_type: 'pexpense',
                  noti_url: `/project/${projectId}/expense`,
                });
              } else {
                // 팀원이 매니저에게 승인 요청한 경우,
                await notificationApi.registerNotification({
                  user_id: manager.id!,
                  user_name: manager.name,
                  noti_target: user_id!,
                  noti_title: `${projectId} · ${data.project_title}`,
                  noti_message: `${user_name}님이 ${checkedItems.length}건의 비용을 청구했습니다.`,
                  noti_type: 'pexpense',
                  noti_url: `/manager/pexpense`,
                });
              }
            }

            addAlert({
              title: '비용 청구가 완료되었습니다.',
              message: `<p><span class="text-primary-blue-500 font-semibold">${checkedItems.length}</span>건의 임시저장 비용이 청구되었습니다.</p>`,
              icon: <OctagonAlert />,
              duration: 2000,
            });
          }

          // UI 갱신
          setExpenseList((prev) => prev.filter((item) => !checkedItems.includes(item.seq)));
          setCheckedItems([]);
        } catch (err) {
          console.error('❌ 청구 실패:', err);

          addAlert({
            title: '비용 청구 실패',
            message: `청구 중 오류가 발생했습니다. \n잠시 후 다시 시도해주세요.`,
            icon: <OctagonAlert />,
            duration: 2000,
          });
        } finally {
          setCheckAll(false);
          setPendingDelete([]);
        }
      },
    });
  };

  // 선택 삭제 이벤트 핸들러
  const handleDeleteSelected = () => {
    if (checkedItems.length === 0) {
      addAlert({
        title: '선택된 비용 항목이 없습니다.',
        message: '삭제할 비용 항목을 선택해주세요.',
        icon: <OctagonAlert />,
        duration: 2000,
      });
      return;
    }

    // 선택된 항목들의 실제 데이터 조회
    const selectedRows = expenseList.filter((item) => checkedItems.includes(item.seq));
    const nonSaved = selectedRows.filter((item) => item.status !== 'Saved');

    console.log(checkedItems);
    setPendingDelete(checkedItems);

    if (nonSaved.length > 0) {
      const invalidIds = nonSaved.map((i) => i.exp_id).join(', ');

      addAlert({
        title: '삭제 불가한 비용 항목이 포함되어 있습니다.',
        message: `임시저장 상태가 아닌 항목(${invalidIds})은 삭제할 수 없습니다.`,
        icon: <OctagonAlert />,
        duration: 2000,
      });
      return;
    }

    addDialog({
      title: '선택한 비용 항목을 삭제합니다.',
      message: `<span class="text-primary-blue-500 font-semibold">${checkedItems.length}</span>건의 임시저장 비용을 삭제하시겠습니까?`,
      confirmText: '삭제',
      cancelText: '취소',
      onConfirm: async () => {
        try {
          const payload = { seqs: checkedItems };
          const res = await deleteProjectTempExpense(payload);

          if (res.ok) {
            addAlert({
              title: '삭제 완료되었습니다.',
              message: `<p><span class="text-primary-blue-500 font-semibold">${checkedItems.length}</span>건의 임시저장 비용이 삭제되었습니다.</p>`,
              icon: <OctagonAlert />,
              duration: 2000,
            });
          }

          // UI 갱신
          setExpenseList((prev) => prev.filter((item) => !checkedItems.includes(item.seq)));
          setCheckedItems([]);
        } catch (err) {
          console.error('❌ 삭제 실패:', err);

          addAlert({
            title: '삭제 실패',
            message: `삭제 중 오류가 발생했습니다. \n잠시 후 다시 시도해주세요.`,
            icon: <OctagonAlert />,
            duration: 2000,
          });
        } finally {
          setCheckAll(false);
          setPendingDelete([]);
        }
      },
    });
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

  // 비용 유형 가져오기
  useEffect(() => {
    (async () => {
      try {
        // 유저레벨이 user인 경우 nexp_type2 : manager나 admin인 경우 nexp_type1 호출
        const expenseTypeParam = user_level === 'user' ? 'exp_type1' : 'exp_type2';

        const data = await getProjectExpenseType(expenseTypeParam);
        const mapped = data.map((t: any) => ({
          label: t.code,
          value: t.code,
        }));

        setTypeOptions(mapped);
      } catch (err) {
        console.error('❌ 비용유형 불러오기 실패:', err);
      }
    })();
  }, []);

  // 비용 리스트 가져오기 (상단 필터 변경 시마다 자동 실행)
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const params: Record<string, any> = {
          project_id: projectId,
          year: selectedYear,
          page,
        };

        if (!selectedStatus.length) {
          if (activeTab === 'saved') {
            params.status = 'Saved';
          }
        } else {
          params.status = selectedStatus.join(',');
        }

        if (selectedType.length) params.type = selectedType.join(',');
        if (selectedProof.length) params.method = selectedProof.join(',');
        if (selectedProofStatus.length) params.attach = selectedProofStatus.join(',');

        // setSearchParams(params);
        const res = await getProjectExpense(params);

        console.log('📦 비용 리스트 요청 파라미터:', params);
        console.log('✅ 비용 리스트 응답:', res);

        setExpenseList(res.items);
        setTotal(res.total);
      } catch (err) {
        console.error('❌ 비용 리스트 불러오기 실패:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [activeTab, selectedYear, selectedType, selectedProof, selectedProofStatus, selectedStatus, page]);

  // 전체 선택 상태 반영
  useEffect(() => {
    const selectableSeqs = expenseList.filter(isCheckable).map((item) => item.seq);

    if (selectableSeqs.length === 0) {
      setCheckAll(false);
      return;
    }

    setCheckAll(selectableSeqs.every((seq) => checkedItems.includes(seq)));
  }, [checkedItems, expenseList]);

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
      console.log(searchParams);
    },
    [searchParams, setSearchParams]
  );

  const filterProps = {
    activeTab,
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

    onTabChange: handleTabChange,
    onFilterChange: handleFilterChange,
    onReset: handleTabChange,
    onCreate: () => setRegisterDialog(true),
  };

  return (
    <>
      {/* -------- 상단 필터 -------- */}
      {isMobile ? <ExpenseFilterMo {...filterProps} /> : <ExpenseFilterPC {...filterProps} />}

      {/* -------- 리스트 -------- */}
      {isMobile ? (
        <ExpenseCardList
          items={expenseList}
          activeTab={activeTab}
          checkedItems={checkedItems}
          checkAll={checkAll}
          onCheckAll={handleCheckAll}
          onCheck={handleCheckItem}
          loading={loading}
        />
      ) : (
        <ExpenseTable
          items={expenseList}
          activeTab={activeTab}
          checkedItems={checkedItems}
          checkAll={checkAll}
          onCheckAll={handleCheckAll}
          onCheck={handleCheckItem}
          loading={loading}
        />
      )}

      {activeTab === 'saved' && (
        <div className="mt-4 flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={handleDeleteSelected}>
            선택 삭제
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={handleClaimSelected}>
            선택 청구
          </Button>
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

      <Dialog open={registerDialog} onOpenChange={setRegisterDialog}>
        <DialogContent className="max-md:max-w-[calc(100%-var(--spacing)*8)] max-md:rounded-md">
          <DialogHeader>
            <DialogTitle>신규 비용 등록</DialogTitle>
            <DialogDescription>견적서 비용 혹은 견적서 외 비용을 등록할 수 있습니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4 max-md:py-2">
            <p className="text-base max-md:text-[13px]">등록하실 비용의 유형을 선택해주세요.</p>
            <RadioGroup
              value={registerType}
              onValueChange={(value) => setRegisterType(value as 'est' | 'pro')}
              className="grid grid-cols-2 gap-4">
              <RadioButton value="est" label="견적서 비용" variant="dynamic" size="md" className="mb-0" />
              <RadioButton value="pro" label="견적서 외 비용" variant="dynamic" size="md" className="mb-0" />
            </RadioGroup>
            {registerType && (
              <>
                <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                  {!isMobile && (
                    <Button variant="outline" onClick={openFileDialog}>
                      <Excel className="size-4.5" /> Excel 업로드
                    </Button>
                  )}

                  <Button variant="outline" onClick={() => navigate('register', { state: { registerType } })}>
                    수기 입력
                  </Button>
                </div>
                {!isMobile && (
                  <input ref={fileInputRef} type="file" accept=".xlsx, .xls" className="h-0 w-0 text-[0]" onChange={handleExcelUpload} />
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
