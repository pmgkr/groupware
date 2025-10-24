import { useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import * as XLSX from 'xlsx';
import { useUser } from '@/hooks/useUser';
import { formatKST, formatAmount } from '@/utils';

import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { AppPagination } from '@/components/ui/AppPagination';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectItem } from '@components/ui/select';
import { Dialog, DialogClose, DialogDescription, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { MultiSelect, type MultiSelectOption } from '@components/multiselect/multi-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Excel } from '@/assets/images/icons';

import { getExpenseLists, type ExpenseListItem, getExpenseType } from '@/api';

export default function ExpenseList() {
  const navigate = useNavigate();
  const { user_id, user_level } = useUser();

  // 상단 필터용 state
  const [selectedType, setSelectedType] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedProof, setSelectedProof] = useState<string[]>([]);
  const [selectedProofStatus, setSelectedProofStatus] = useState<string[]>([]);
  const [registerDialog, setRegisterDialog] = useState(false);

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

  // 리스트 페이지네이션
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 15; // 한 페이지에 보여줄 개수

  // 필터 옵션 정의
  const statusOptions: MultiSelectOption[] = [
    { label: '임시저장', value: '임시저장' },
    { label: '승인대기', value: '승인대기' },
    { label: '승인완료', value: '승인완료' },
    { label: '지급완료', value: '지급완료' },
    { label: '반려됨', value: '반려됨' },
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
    { label: '제출', value: '제출' },
    { label: '미제출', value: '미제출' },
  ];

  // 비용 유형 가져오기
  useEffect(() => {
    (async () => {
      try {
        // 유저레벨이 staff나 user인 경우 nexp_type2 : manager나 admin인 경우 nexp_type1 호출
        const expenseTypeParam = user_level === 'staff' || user_level === 'user' ? 'nexp_type2' : 'nexp_type1';

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

  // 비용 리스트 가져오기
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        const res = await getExpenseLists();
        console.log('✅ 비용 리스트:', res);

        setExpenseList(res.items);
        setTotal(res.total);
      } catch (err) {
        console.error('❌ 비용 리스트 불러오기 실패:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex items-center rounded-sm bg-gray-300 p-1 px-1.5">
            <Button className="bg-primary h-8 w-18 rounded-sm p-0 text-sm text-white hover:shadow-none">전체</Button>
            <Button className="text-muted-foreground h-8 w-18 rounded-sm bg-transparent p-0 text-sm hover:shadow-none active:bg-transparent">
              임시 저장
            </Button>
          </div>

          <div className="flex items-center gap-x-2 before:mx-5 before:inline-flex before:h-7 before:w-[1px] before:bg-gray-300 before:align-middle">
            {/* 연도 단일 선택 */}
            <Select defaultValue="2025">
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

            {/* 용도 다중 선택 */}
            <MultiSelect
              className="max-w-[80px] min-w-auto!"
              size="sm"
              placeholder="비용 용도"
              options={typeOptions}
              onValueChange={setSelectedType}
              maxCount={0}
              hideSelectAll={true}
              autoSize={true}
              closeOnSelect={false}
              searchable={false}
              simpleSelect={true}
            />

            {/* 증빙수단 다중 선택 */}
            <MultiSelect
              className="max-w-[80px] min-w-auto!"
              size="sm"
              placeholder="증빙 수단"
              options={proofMethod}
              onValueChange={setSelectedProof}
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
              onValueChange={setSelectedProofStatus}
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
              onValueChange={setSelectedStatus}
              maxCount={0}
              hideSelectAll={true}
              autoSize={true}
              closeOnSelect={false}
              searchable={false}
              simpleSelect={true}
            />
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

      <Table variant="primary" align="center">
        <TableHeader>
          <TableRow className="[&_th]:text-[13px] [&_th]:font-medium">
            <TableHead className="w-[6%]">EXP#</TableHead>
            <TableHead className="w-[6%]">증빙 수단</TableHead>
            <TableHead className="w-[8%]">비용 용도</TableHead>
            <TableHead>비용 제목</TableHead>
            <TableHead className="w-[8%]">증빙 상태</TableHead>
            <TableHead className="w-[10%]">금액</TableHead>
            <TableHead className="w-[6%]">세금</TableHead>
            <TableHead className="w-[10%]">합계</TableHead>
            <TableHead className="w-[6%]">상태</TableHead>
            <TableHead className="w-[14%]">작성 일시</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell className="h-100 text-gray-500" colSpan={10}>
                비용 리스트 불러오는 중 . . .
              </TableCell>
            </TableRow>
          ) : expenseList.length === 0 ? (
            <TableRow>
              <TableCell className="h-100 text-gray-500" colSpan={10}>
                리스트가 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            expenseList.map((item) => {
              // 비용 상태값 매핑
              const statusMap = {
                Saved: <Badge variant="grayish">임시저장</Badge>,
                Claimed: <Badge variant="secondary">승인대기</Badge>,
                Confirmed: <Badge>승인완료</Badge>,
                Completed: <Badge className="bg-primary-blue">지급완료</Badge>,
                Rejected: <Badge className="bg-destructive">반려됨</Badge>,
              };

              const status = statusMap[item.status as keyof typeof statusMap];

              return (
                <TableRow key={item.seq} className="[&_td]:text-[13px]">
                  <TableCell>
                    <Link to={`/expense/${item.exp_id}`} className="rounded-[4px] border-1 bg-white p-1 text-sm">
                      {item.exp_id}
                    </Link>
                  </TableCell>
                  <TableCell>{item.el_method}</TableCell>
                  <TableCell>{item.el_type}</TableCell>
                  <TableCell className="text-left">
                    <Link to={`/expense/${item.exp_id}`} className="hover:underline">
                      {item.el_title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {item.el_attach === 'Y' ? <Badge variant="secondary">제출</Badge> : <Badge variant="grayish">미제출</Badge>}
                  </TableCell>
                  <TableCell>{formatAmount(item.el_amount)}원</TableCell>
                  <TableCell>{item.el_tax === 0 ? 0 : `${formatAmount(item.el_tax)}원`}</TableCell>
                  <TableCell>{formatAmount(item.el_total)}원</TableCell>
                  <TableCell>{status}</TableCell>
                  <TableCell>{formatKST(item.wdate)}</TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

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
