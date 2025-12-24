import { useRef, useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useUser } from '@/hooks/useUser';
import { formatAmount, formatDate, getGrowingYears } from '@/utils';
import { getExpenseType } from '@/api';
import { getExpenseMine } from '@/api/mypage/expense';
import type { ExpenseListResponse, ExpenseListParams, PExpenseItem, NExpenseItem } from '@/api/mypage/expense';

import { Badge } from '@/components/ui/badge';
import { AppPagination } from '@/components/ui/AppPagination';
import { type MultiSelectOption, type MultiSelectRef } from '@components/multiselect/multi-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Popover, PopoverTrigger, PopoverContent } from '@components/ui/popover';

import { ExpenseMineFilter } from '@components/features/Expense/_components/ExpenseMineFilter';

function isPExpense(item: any): item is PExpenseItem {
  return 'alloc_status' in item && 'is_estimate' in item;
}

function isNExpense(item: any): item is NExpenseItem {
  return !('alloc_status' in item);
}

const renderEmptyRow = (colSpan: number, text: string) => (
  <TableRow>
    <TableCell colSpan={colSpan} className="h-100 text-center text-gray-500">
      {text}
    </TableCell>
  </TableRow>
);

export default function Expense() {
  const navigate = useNavigate();
  const { user_id, user_name, user_level } = useUser();
  const [searchParams, setSearchParams] = useSearchParams(); // 파라미터 값 저장

  // 상단 필터용 state
  const currentYear = String(new Date().getFullYear()); // 올해 구하기
  const yearOptions = getGrowingYears(); // yearOptions
  const [selectedYear, setSelectedYear] = useState(() => searchParams.get('year') || currentYear);
  const [activeTab, setActiveTab] = useState<'pexpense' | 'nexpense'>('pexpense');
  const [selectedType, setSelectedType] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedProof, setSelectedProof] = useState<string[]>([]);
  const [selectedProofStatus, setSelectedProofStatus] = useState<string[]>([]);
  const [page, setPage] = useState<number>(() => Number(searchParams.get('page') || 1));
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(15); // 한 페이지에 보여줄 개수

  const typeRef = useRef<MultiSelectRef>(null);
  const statusRef = useRef<MultiSelectRef>(null);
  const proofRef = useRef<MultiSelectRef>(null);
  const proofStatusRef = useRef<MultiSelectRef>(null);

  const [typeOptions, setTypeOptions] = useState<MultiSelectOption[]>([]);
  const [expenseData, setExpenseData] = useState<ExpenseListResponse | null>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (!user_id) return;

    (async () => {
      try {
        setLoading(true);
        const params: ExpenseListParams = {
          flag: activeTab === 'pexpense' ? 'P' : 'N',
          year: selectedYear,
          method: selectedProof.join(','),
          page,
          size: pageSize,
        };

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

  const rawList = expenseData?.list ?? [];

  const filteredList = useMemo(() => {
    return rawList.filter((item) => {
      // 1. 비용 용도
      if (selectedType.length > 0) {
        const types = item.el_type?.split('|') ?? [];
        if (!selectedType.some((t) => types.includes(t))) return false;
      }

      // 2. 상태
      if (selectedStatus.length > 0) {
        if (!selectedStatus.includes(item.status)) return false;
      }

      // 3. 증빙 수단
      if (selectedProof.length > 0) {
        if (!selectedProof.includes(item.el_method)) return false;
      }

      // 4. 증빙 상태
      if (selectedProofStatus.length > 0) {
        if (!selectedProofStatus.includes(item.el_attach)) return false;
      }

      return true;
    });
  }, [rawList, selectedType, selectedStatus, selectedProof, selectedProofStatus]);

  const filteredPList = useMemo(() => {
    if (activeTab !== 'pexpense') return [];
    return filteredList.filter(isPExpense);
  }, [filteredList, activeTab]);

  const filteredNList = useMemo(() => {
    if (activeTab !== 'nexpense') return [];
    return filteredList.filter(isNExpense);
  }, [filteredList, activeTab]);

  // 필터된 리스트의 Total / Page 수
  const totalFiltered = filteredList.length;
  const pagedList = filteredList.slice((page - 1) * pageSize, page * pageSize);

  // 필터 변경 시 page 초기화
  const handleFilterChange = (setter: any, value: any) => {
    setter(value);
    setPage(1);
  };

  // 탭 변경 시 필터 초기화
  const handleTabChange = (tab: 'pexpense' | 'nexpense') => {
    setActiveTab(tab);
    setPage(1);

    setSelectedYear('2025');
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

  return (
    <>
      <ExpenseMineFilter
        activeTab={activeTab}
        onTabChange={handleTabChange}
        selectedYear={selectedYear}
        yearOptions={yearOptions}
        typeRef={typeRef}
        statusRef={statusRef}
        proofRef={proofRef}
        proofStatusRef={proofStatusRef}
        selectedType={selectedType}
        selectedStatus={selectedStatus}
        selectedProof={selectedProof}
        selectedProofStatus={selectedProofStatus}
        typeOptions={typeOptions}
        onYearChange={(v) => handleFilterChange(setSelectedYear, v)}
        onTypeChange={(v) => handleFilterChange(setSelectedType, v)}
        onStatusChange={(v) => handleFilterChange(setSelectedStatus, v)}
        onProofChange={(v) => handleFilterChange(setSelectedProof, v)}
        onProofStatusChange={(v) => handleFilterChange(setSelectedProofStatus, v)}
        onRefresh={() => handleTabChange(activeTab)}
      />

      {activeTab === 'pexpense' && (
        <Table variant="primary" align="center" className="table-fixed">
          <TableHeader>
            <TableRow className="[&_th]:px-2 [&_th]:text-[13px] [&_th]:font-medium">
              <TableHead className="w-[8%]">EXP#</TableHead>
              <TableHead className="w-[6%]">증빙 수단</TableHead>
              <TableHead className="w-[8%]">비용 용도</TableHead>
              <TableHead>비용 제목</TableHead>
              <TableHead className="w-[6%]">증빙 상태</TableHead>
              <TableHead className="w-[6%]">비용 유형</TableHead>
              <TableHead className="w-[11%]">금액</TableHead>
              <TableHead className="w-[7%]">상태</TableHead>
              <TableHead className="w-[7%]">작성일</TableHead>
              <TableHead className="w-[7%]">지급예정일</TableHead>
              <TableHead className="w-[7%]">지급완료일</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {/* 1️⃣ 로딩 */}
            {loading && renderEmptyRow(11, '비용 리스트 불러오는 중 . . .')}

            {/* 2️⃣ 데이터 없음 */}
            {!loading && (!expenseData || filteredPList.length === 0) && renderEmptyRow(11, '리스트가 없습니다.')}

            {/* 3️⃣ 데이터 있음 (P) */}
            {!loading &&
              expenseData?.flag === 'P' &&
              filteredPList.map((item) => {
                // ✅ item: PExpenseItem
                const matchMissing = item.alloc_status === 'empty' && item.is_estimate === 'Y' && item.status !== 'Rejected' && (
                  <span className="absolute -top-1 -right-1 flex size-3">
                    {/* 애니메이션 */}
                    <span className={`absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-500 opacity-75`}></span>
                    {/* 도트 */}
                    <span className={`relative inline-flex size-3 rounded-full border border-white bg-orange-500`}></span>
                  </span>
                );
                const categories = Array.from(new Set(item.el_type.split('|').filter(Boolean)));

                return (
                  <TableRow key={item.seq} className="hover:bg-gray-50 [&_td]:px-2 [&_td]:text-[13px]">
                    <TableCell>
                      <Link
                        to={`/project/${item.project_id}/expense/${item.seq}`}
                        className="rounded-[4px] border-1 bg-white p-1 text-[11px] 2xl:text-sm">
                        {item.exp_id}
                      </Link>
                    </TableCell>
                    <TableCell>{item.el_method}</TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <div className="flex cursor-default items-center justify-center gap-1">
                            {categories.length === 1 ? (
                              <span>{categories[0]}</span>
                            ) : (
                              <>
                                <span>{categories[0]}</span>
                                <TooltipTrigger asChild>
                                  <Badge variant="grayish" className="px-1 py-0 text-xs">
                                    +{categories.length - 1}
                                  </Badge>
                                </TooltipTrigger>
                              </>
                            )}
                          </div>
                          {categories.length > 1 && <TooltipContent>{categories.join(', ')}</TooltipContent>}
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="text-left">
                      <Link to={`/project/${item.project_id}/expense/${item.seq}`} className="hover:underline">
                        {item.el_title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {item.el_attach === 'Y' ? <Badge variant="secondary">제출</Badge> : <Badge variant="grayish">미제출</Badge>}
                    </TableCell>
                    <TableCell>
                      <div className="relative inline-flex justify-center">
                        <Badge variant="grayish" className="border-gray-300 bg-white">
                          {item.is_estimate === 'Y' ? '견적서' : '견적서 외'}
                        </Badge>
                        {matchMissing}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatAmount(item.el_total)}원
                      {item.el_tax !== 0 && (
                        <div className="mt-0.5 text-[11px] leading-[1.2] text-gray-600">세금 {formatAmount(item.el_tax)}원</div>
                      )}
                    </TableCell>
                    <TableCell>{statusMap[item.status as keyof typeof statusMap]}</TableCell>
                    <TableCell>{formatDate(item.wdate)}</TableCell>
                    <TableCell>{(item.status !== 'Rejected' && formatDate(item.ddate)) || '-'}</TableCell>
                    <TableCell>{(item.status !== 'Rejected' && formatDate(item.edate)) || '-'}</TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      )}

      {activeTab === 'nexpense' && (
        <Table variant="primary" align="center" className="table-fixed">
          <TableHeader>
            <TableRow className="[&_th]:px-3 [&_th]:text-[13px] [&_th]:font-medium">
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
            {loading && renderEmptyRow(10, '비용 리스트 불러오는 중 . . .')}

            {!loading && (!expenseData || filteredNList.length === 0) && renderEmptyRow(10, '리스트가 없습니다.')}

            {!loading &&
              expenseData?.flag === 'N' &&
              filteredNList.map((item) => (
                <TableRow key={item.seq} className="hover:bg-gray-50 [&_td]:px-2 [&_td]:text-[13px]">
                  <TableCell>
                    <Link to={`/expense/nexpense//${item.exp_id}`} className="rounded-[4px] border-1 bg-white p-1 text-[11px] 2xl:text-sm">
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
                  <TableCell className="text-right">
                    {formatAmount(item.el_total)}원
                    {item.el_tax !== 0 && (
                      <div className="mt-0.5 text-[11px] leading-[1.2] text-gray-600">세금 {formatAmount(item.el_tax)}원</div>
                    )}
                  </TableCell>
                  <TableCell>{statusMap[item.status as keyof typeof statusMap]}</TableCell>
                  <TableCell>{formatDate(item.wdate)}</TableCell>
                  <TableCell>{(item.status !== 'Rejected' && formatDate(item.ddate)) || '-'}</TableCell>
                  <TableCell>{(item.status !== 'Rejected' && formatDate(item.edate)) || '-'}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
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
