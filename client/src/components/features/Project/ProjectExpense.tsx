import { useRef, useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/useUser';

import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';
import { useAppDialog } from '@/components/common/ui/AppDialog/AppDialog';
import { Button } from '@components/ui/button';
import { Checkbox } from '@components/ui/checkbox';
import { AppPagination } from '@/components/ui/AppPagination';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectItem } from '@components/ui/select';
import { Dialog, DialogClose, DialogDescription, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { MultiSelect, type MultiSelectOption } from '@components/multiselect/multi-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Excel } from '@/assets/images/icons';
import { RefreshCw, OctagonAlert } from 'lucide-react';

import { getProjectExpense, type pExpenseListItem, getProjectExpenseType, deleteProjectTempExpense, claimProjectTempExpense } from '@/api';
import { ExpenseRow } from './_components/ExpenseListRow';

export default function Expense() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { user_level } = useUser();

  // 상단 필터용 state
  const [activeTab, setActiveTab] = useState<'all' | 'saved'>('all');
  const [selectedYear, setSelectedYear] = useState('2025');
  const [selectedType, setSelectedType] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedProof, setSelectedProof] = useState<string[]>([]);
  const [selectedProofStatus, setSelectedProofStatus] = useState<string[]>([]);
  const [registerDialog, setRegisterDialog] = useState(false); // Dialog용 State
  const [registerType, setRegisterType] = useState<'est' | 'pro' | null>(null); // Dialog Type용 State

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
  const handleFilterChange = (setter: any, value: any) => {
    setter(value);
    setPage(1);
  };

  // 탭 변경 시 필터 초기화
  const handleTabChange = (tab: 'all' | 'saved') => {
    setActiveTab(tab);
    setPage(1);

    setSelectedYear('2025');
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

          console.log('임시저장 비용 청구', payload);
          const res = await claimProjectTempExpense(payload);

          if (res.ok) {
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
          type: selectedType.join(',') || undefined,
          method: selectedProof.join(',') || undefined,
          attach: selectedProofStatus.join(',') || undefined,
          status: activeTab === 'all' ? selectedStatus.join(',') || undefined : activeTab, // 탭 선택 시 강제 상태
          page,
          size: pageSize,
        };

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
    if (expenseList.length === 0) return;
    const allSeq = expenseList.map((item) => item.seq);
    setCheckAll(allSeq.length > 0 && allSeq.every((seq) => checkedItems.includes(seq)));
  }, [checkedItems, expenseList]);

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex items-center rounded-sm bg-gray-300 p-1 px-1.5">
            <Button
              onClick={() => handleTabChange('all')}
              className={`h-8 w-18 rounded-sm p-0 text-sm ${
                activeTab === 'all'
                  ? 'bg-primary hover:bg-primary active:bg-primary text-white'
                  : 'text-muted-foreground bg-transparent hover:bg-transparent active:bg-transparent'
              }`}>
              전체
            </Button>
            <Button
              onClick={() => handleTabChange('saved')}
              className={`h-8 w-18 rounded-sm p-0 text-sm ${
                activeTab === 'saved'
                  ? 'bg-primary hover:bg-primary active:bg-primary text-white'
                  : 'text-muted-foreground bg-transparent hover:bg-transparent active:bg-transparent'
              }`}>
              임시 저장
            </Button>
          </div>

          <div className="flex items-center gap-x-2 before:mr-3 before:ml-5 before:inline-flex before:h-7 before:w-[1px] before:bg-gray-300 before:align-middle">
            {/* 연도 단일 선택 */}
            <Select value={selectedYear} onValueChange={(v) => handleFilterChange(setSelectedYear, v)}>
              <SelectTrigger size="sm">
                <SelectValue placeholder="연도 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem size="sm" value="2025">
                    2025
                  </SelectItem>
                  <SelectItem size="sm" value="2024">
                    2024
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            {/* 증빙수단 다중 선택 */}
            <MultiSelect
              className="max-w-[80px] min-w-auto!"
              size="sm"
              placeholder="증빙 수단"
              options={proofMethod}
              onValueChange={(v) => handleFilterChange(setSelectedProof, v)}
              maxCount={0}
              hideSelectAll={true}
              autoSize={true}
              closeOnSelect={false}
              searchable={false}
              simpleSelect={true}
            />

            {/* 용도 다중 선택 */}
            <MultiSelect
              className="max-w-[80px] min-w-auto!"
              size="sm"
              placeholder="비용 용도"
              options={typeOptions}
              onValueChange={(v) => handleFilterChange(setSelectedType, v)}
              maxCount={0}
              hideSelectAll={true}
              autoSize={true}
              closeOnSelect={false}
              searchable={false}
              simpleSelect={true}
            />

            {/* 증빙상태 다중 선택 */}
            <MultiSelect
              className="max-w-[80px] min-w-auto!"
              size="sm"
              placeholder="증빙 상태"
              options={proofStatusOptions}
              onValueChange={(v) => handleFilterChange(setSelectedProofStatus, v)}
              maxCount={0}
              hideSelectAll={true}
              autoSize={true}
              closeOnSelect={false}
              searchable={false}
              simpleSelect={true}
            />

            {/* 상태 다중 선택 */}
            <MultiSelect
              className="max-w-[80px] min-w-auto!"
              size="sm"
              placeholder="비용 상태"
              options={statusOptions}
              onValueChange={(v) => handleFilterChange(setSelectedStatus, v)}
              maxCount={0}
              hideSelectAll={true}
              autoSize={true}
              closeOnSelect={false}
              searchable={false}
              simpleSelect={true}
            />

            <Button
              type="button"
              variant="svgIcon"
              size="icon"
              className="hover:text-primary-blue-500 size-6 text-gray-600 transition-transform hover:rotate-45"
              onClick={() => handleTabChange(activeTab)}>
              <RefreshCw />
            </Button>
          </div>
        </div>

        <Button
          size="sm"
          onClick={() => {
            setRegisterDialog(true);
          }}>
          비용 작성하기
        </Button>
      </div>

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
            <TableHead className="w-[6%]">증빙 수단</TableHead>
            <TableHead className="w-[8%]">비용 용도</TableHead>
            <TableHead>비용 제목</TableHead>
            <TableHead className="w-[6%]">증빙 상태</TableHead>
            <TableHead className="w-[7%]">비용 유형</TableHead>
            <TableHead className="w-[9%]">금액</TableHead>
            <TableHead className="w-[6%]">세금</TableHead>
            <TableHead className="w-[9%]">합계</TableHead>
            <TableHead className="w-[7%]">작성자</TableHead>
            <TableHead className="w-[7%]">상태</TableHead>
            <TableHead className="w-[12%]">작성 일시</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell className="h-100 text-gray-500" colSpan={activeTab === 'saved' ? 12 : 11}>
                비용 리스트 불러오는 중 . . .
              </TableCell>
            </TableRow>
          ) : expenseList.length === 0 ? (
            <TableRow>
              <TableCell className="h-100 text-gray-500" colSpan={activeTab === 'saved' ? 12 : 11}>
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
            <DialogDescription>견적서 비용 혹은 견적서 외 비용을 등록할 수 있습니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <p className="text-base">등록하실 비용의 유형을 선택해주세요.</p>
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" onClick={() => setRegisterType('est')}>
                견적서 비용
              </Button>
              <Button variant="outline" onClick={() => setRegisterType('pro')}>
                견적서 외 비용
              </Button>
            </div>
            {registerType && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" onClick={openFileDialog}>
                    <Excel className="size-4.5" /> Excel 업로드
                  </Button>
                  <Button variant="outline" onClick={() => navigate('register', { state: { registerType } })}>
                    수기 입력
                  </Button>
                </div>
                <input ref={fileInputRef} type="file" accept=".xlsx, .xls" className="h-0 w-0 text-[0]" onChange={handleExcelUpload} />
              </>
            )}
            <input ref={fileInputRef} type="file" accept=".xlsx, .xls" className="h-0 w-0 text-[0]" onChange={handleExcelUpload} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
