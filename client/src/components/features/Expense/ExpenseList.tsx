import { useRef, useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/useUser';
import { findManager, getGrowingYears } from '@/utils';
import { notificationApi } from '@/api/notification';

import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';
import { useAppDialog } from '@/components/common/ui/AppDialog/AppDialog';

import { Button } from '@components/ui/button';
import { Checkbox } from '@components/ui/checkbox';
import { AppPagination } from '@/components/ui/AppPagination';
import { Dialog, DialogDescription, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { MultiSelectOption, MultiSelectRef } from '@components/multiselect/multi-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Excel } from '@/assets/images/icons';
import { OctagonAlert } from 'lucide-react';

import { getExpenseLists, type ExpenseListItem, getExpenseType, deleteTempExpense, claimTempExpense } from '@/api';
import { ExpenseListFilter } from './_components/ExpenseListFilter';
import { ExpenseRow } from './_components/ExpenseListRow';

export default function ExpenseList() {
  const navigate = useNavigate();
  const { user_id, user_name, team_id, user_level } = useUser();
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
  const [registerDialog, setRegisterDialog] = useState(false);

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
  const [expenseList, setExpenseList] = useState<ExpenseListItem[]>([]);
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
    navigate('/expense/register', { state: { excelData: jsonData } });
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
  const handleFilterChange = (setter: any, value: any) => {
    setter(value);
    setPage(1);
  };

  // 탭 변경 시 필터 초기화
  const handleTabChange = (tab: 'all' | 'saved') => {
    setActiveTab(tab);
    setPage(1);

    setSelectedYear(currentYear);
    setSelectedType([]);
    setSelectedStatus([]);
    setSelectedProof([]);
    setSelectedProofStatus([]);
    setCheckedItems([]);
  };

  // 전체 선택 체크박스 핸들러
  const handleCheckAll = (checked: boolean) => {
    setCheckAll(checked);
    setCheckedItems(checked ? expenseList.map((item) => item.seq) : []);
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
          const res = await claimTempExpense(payload);

          if (res.ok) {
            const manager = await findManager(team_id);
            if (manager.id) {
              if (user_id === manager.id) {
                // 접속한 계정이 매니저 아이디와 동일한 경우,
                await notificationApi.registerNotification({
                  user_id: user_id,
                  user_name: user_name!,
                  noti_target: user_id!,
                  noti_title: `일반 비용 청구`,
                  noti_message: `${checkedItems.length}건의 일반 비용을 청구했습니다.`,
                  noti_type: 'nexpense',
                  noti_url: `/expense`,
                });
              } else {
                // 팀원이 매니저에게 승인 요청한 경우,
                await notificationApi.registerNotification({
                  user_id: manager.id!,
                  user_name: manager.name,
                  noti_target: user_id!,
                  noti_title: `일반 비용 승인 요청`,
                  noti_message: `${user_name}님이 ${checkedItems.length}건의 일반 비용을 청구했습니다.`,
                  noti_type: 'pexpense',
                  noti_url: `/manager/nexpense`,
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
          const res = await deleteTempExpense(payload);

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

  // 비용 유형 가져오기
  useEffect(() => {
    (async () => {
      try {
        // 유저레벨이 user인 경우 nexp_type2 : manager나 admin인 경우 nexp_type1 호출
        const expenseTypeParam = user_level === 'user' ? 'nexp_type2' : 'nexp_type1';

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
  }, []);

  // 비용 리스트 가져오기 (상단 필터 변경 시마다 자동 실행)
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const params: Record<string, any> = {
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

        setSearchParams(params);
        const res = await getExpenseLists(params);
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
    if (expenseList.length === 0) return;
    const allSeq = expenseList.map((item) => item.seq);
    setCheckAll(allSeq.length > 0 && allSeq.every((seq) => checkedItems.includes(seq)));
  }, [checkedItems, expenseList]);

  return (
    <>
      <ExpenseListFilter
        activeTab={activeTab}
        onTabChange={handleTabChange}
        selectedYear={selectedYear}
        yearOptions={yearOptions}
        selectedType={selectedType}
        selectedStatus={selectedStatus}
        selectedProof={selectedProof}
        selectedProofStatus={selectedProofStatus}
        typeRef={typeRef}
        statusRef={statusRef}
        proofRef={proofRef}
        proofStatusRef={proofStatusRef}
        typeOptions={typeOptions}
        onYearChange={(v) => handleFilterChange(setSelectedYear, v)}
        onTypeChange={(v) => handleFilterChange(setSelectedType, v)}
        onStatusChange={(v) => handleFilterChange(setSelectedStatus, v)}
        onProofChange={(v) => handleFilterChange(setSelectedProof, v)}
        onProofStatusChange={(v) => handleFilterChange(setSelectedProofStatus, v)}
        onRefresh={() => handleTabChange(activeTab)}
        onOpenRegisterDialog={() => setRegisterDialog(true)}
      />

      <Table variant="primary" align="center" className="table-fixed">
        <TableHeader>
          <TableRow className="[&_th]:px-2 [&_th]:text-[13px] [&_th]:font-medium">
            <TableHead className={cn('w-[3%] px-0 transition-all duration-150', activeTab !== 'saved' && 'hidden')}>
              <Checkbox
                id="chk_all"
                className="mx-auto flex size-4 items-center justify-center bg-white leading-none"
                checked={checkAll}
                onCheckedChange={(v) => handleCheckAll(!!v)}
              />
            </TableHead>
            <TableHead className="w-[8%]">EXP#</TableHead>
            <TableHead className="w-[6%]">증빙 수단</TableHead>
            <TableHead className="w-[8%]">비용 용도</TableHead>
            <TableHead>비용 제목</TableHead>
            <TableHead className="w-[6%]">증빙 상태</TableHead>
            <TableHead className="w-[11%]">금액</TableHead>
            <TableHead className="w-[7%]">상태</TableHead>
            <TableHead className="w-[7%]">작성일</TableHead>
            <TableHead className="w-[7%]">지급예정일</TableHead>
            <TableHead className="w-[7%]">지급완료일</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell className="h-100 text-gray-500" colSpan={activeTab === 'saved' ? 11 : 10}>
                비용 리스트 불러오는 중 . . .
              </TableCell>
            </TableRow>
          ) : expenseList.length === 0 ? (
            <TableRow>
              <TableCell className="h-100 text-gray-500" colSpan={activeTab === 'saved' ? 11 : 10}>
                리스트가 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            expenseList.map((item) => (
              <ExpenseRow
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>신규 비용 등록</DialogTitle>
            <DialogDescription>매입 내역 Excel 파일을 업로드해 데이터를 불러오거나 수기로 입력할 수 있습니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <p className="text-base">등록하실 비용 유형을 선택해주세요.</p>
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" onClick={openFileDialog}>
                <Excel className="size-4.5" /> Excel 업로드
              </Button>
              <Button variant="outline" asChild>
                <Link to="/expense/register">수기 입력</Link>
              </Button>
            </div>
            <input ref={fileInputRef} type="file" accept=".xlsx, .xls" className="h-0 w-0 text-[0]" onChange={handleExcelUpload} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
