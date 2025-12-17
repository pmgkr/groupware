import { useRef, useState, useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router';
import { useUser } from '@/hooks/useUser';
import { formatDate, formatAmount, formatKST } from '@/utils';

import { notificationApi } from '@/api/notification';
import { uploadFilesToServer } from '@/api';
import { getInvoiceList, type InvoiceListItem } from '@/api/admin/invoice';
import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';
import { useAppDialog } from '@/components/common/ui/AppDialog/AppDialog';

import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@components/ui/button';
import { Checkbox } from '@components/ui/checkbox';
import { AppPagination } from '@/components/ui/AppPagination';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MultiSelect, type MultiSelectOption, type MultiSelectRef } from '@components/multiselect/multi-select';
import { OctagonAlert, X } from 'lucide-react';

export default function Invoice() {
  const { user_id } = useUser();
  const { search } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams(); // 파라미터 값 저장

  const [invoiceList, setInvoiceList] = useState<InvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);

  // ============================
  // Filter States
  // ============================
  const [activeTab, setActiveTab] = useState<'claimed' | 'confirmed' | 'rejected'>(() => {
    return (searchParams.get('invoice_status') as 'rejected' | 'claimed' | 'confirmed') || 'claimed';
  });
  const [selectedStatus, setSelectedStatus] = useState<string[]>(() => searchParams.get('invoice_status')?.split(',') ?? ['Claimed']);
  const [selectedClient, setSelectedClient] = useState<number | null>(() => Number(searchParams.get('client_id') || null));
  const [searchInput, setSearchInput] = useState(''); // 사용자가 입력중인 Input 저장값
  const [searchQuery, setSearchQuery] = useState(''); // 실제 검색 Input 저장값
  const [page, setPage] = useState<number>(() => Number(searchParams.get('page') || 1));

  const statusRef = useRef<MultiSelectRef>(null);
  const statusOptions: MultiSelectOption[] = [
    { label: '발행요청', value: 'Claimed' },
    { label: '발행완료', value: 'Confirmed' },
    { label: '반려됨', value: 'Rejected' },
  ];

  const { addAlert } = useAppAlert();
  const { addDialog } = useAppDialog();

  // ============================
  // 체크박스 / 리스트 / 페이지네이션
  // ============================
  const [checkedItems, setCheckedItems] = useState<number[]>([]); // 선택된 seq 목록
  const [checkAll, setCheckAll] = useState(false); // 전체 선택 상태

  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(15); // 한 페이지에 보여줄 개수

  const statusMap = {
    Claimed: (
      <Badge variant="secondary" size="table">
        발행요청
      </Badge>
    ),
    Confirmed: <Badge size="table">발행완료</Badge>,
    Rejected: (
      <Badge className="bg-destructive" size="table">
        반려됨
      </Badge>
    ),
  } as const;

  // ============================
  // 첨부파일 업로드 관련
  // ============================
  type UploadState = 'idle' | 'uploading' | 'success' | 'error';

  const [uploadStateMap, setUploadStateMap] = useState<Record<number, UploadState>>({});

  // ============================
  // 리스트 조회 (팀 선택 완료 후 실행)
  // ============================
  useEffect(() => {
    async function loadList() {
      try {
        setLoading(true);

        const params: Record<string, any> = {
          invoice_status: activeTab,
          page: page,
          size: pageSize,
        };
        if (searchQuery) params.q = searchQuery;

        setSearchParams(params);
        const res = await getInvoiceList(params);

        console.log('📦 인보이스 요청 파라미터:', params);
        console.log('✅ 인보이스 리스트 응답:', res);

        setInvoiceList(res.items);
        setTotal(res.total);
      } catch (err) {
        console.error('❌ 리스트 조회 실패:', err);
      } finally {
        setLoading(false);
      }
    }

    loadList();
  }, [selectedStatus, searchQuery, page, pageSize]);

  // 탭 변경 시 필터 초기화
  const handleTabChange = (tab: 'rejected' | 'claimed' | 'confirmed') => {
    setActiveTab(tab);
    setPage(1);
    resetAllFilters();
  };

  // 필터 변경 시 page 초기화
  const handleFilterChange = (setter: any, value: any) => {
    setter(value);
    setPage(1);
  };

  // 파라미터 초기화
  const resetAllFilters = () => {
    setPage(1);
    setSelectedStatus([]);
    setSelectedClient(null);
    setSearchInput('');
    setSearchQuery('');

    statusRef.current?.clear();
  };

  // ============================
  // 체크박스 전체선택
  // ============================
  const handleCheckAll = (checked: boolean) => {
    setCheckAll(checked);

    setCheckedItems(
      checked
        ? invoiceList
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
    if (invoiceList.length === 0) return;
    const selectable = invoiceList.filter((i) => i.user_id !== user_id).map((i) => i.seq);

    setCheckAll(selectable.length > 0 && selectable.every((id) => checkedItems.includes(id)));
  }, [checkedItems, invoiceList]);

  // 파일 업로드 핸들러
  const handleUploadFile = async (seq: number, file: File) => {
    const fileArr: File[] = [file];
    setUploadStateMap((prev) => ({ ...prev, [seq]: 'uploading' }));

    try {
      const res = await uploadFilesToServer(fileArr, 'invoice_finance');

      // 성공 시, Invoice DB에 파일 세팅하는 API 호출
      console.log(res);

      setUploadStateMap((prev) => ({ ...prev, [seq]: 'success' }));
      addAlert({ title: '파일 업로드 성공', message: '메세지' });
    } catch (err) {
      console.error(err);
      setUploadStateMap((prev) => ({ ...prev, [seq]: 'error' }));
      addAlert({ title: '파일 업로드 실패', message: '파일 업로드 실패 1234' });
    }
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        {/* 상단 좌측 필터 */}
        <div className="flex items-center gap-x-2">
          {/* Tabs */}
          <div className="flex items-center rounded-sm bg-gray-300 p-1 px-1.5">
            <Button
              onClick={() => handleTabChange('claimed')}
              className={`h-8 w-18 rounded-sm p-0 text-sm ${
                activeTab === 'claimed'
                  ? 'bg-primary hover:bg-primary active:bg-primary text-white'
                  : 'text-muted-foreground bg-transparent hover:bg-transparent active:bg-transparent'
              }`}>
              발행요청
            </Button>

            <Button
              onClick={() => handleTabChange('confirmed')}
              className={`h-8 w-18 rounded-sm p-0 text-sm ${
                activeTab === 'confirmed'
                  ? 'bg-primary hover:bg-primary active:bg-primary text-white'
                  : 'text-muted-foreground bg-transparent hover:bg-transparent active:bg-transparent'
              }`}>
              발행완료
            </Button>

            <Button
              onClick={() => handleTabChange('rejected')}
              className={`h-8 w-18 rounded-sm p-0 text-sm ${
                activeTab === 'rejected'
                  ? 'bg-primary hover:bg-primary active:bg-primary text-white'
                  : 'text-muted-foreground bg-transparent hover:bg-transparent active:bg-transparent'
              }`}>
              반려됨
            </Button>
          </div>
          <div className="flex items-center gap-x-2 before:mr-3 before:ml-5 before:inline-flex before:h-7 before:w-[1px] before:bg-gray-300 before:align-middle">
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setPage(1); // 페이지 초기화 (필터 변경과 동일한 개념)
              }}>
              <SelectTrigger size="sm">
                <SelectValue placeholder="Row 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15" size="sm">
                  15 Rows
                </SelectItem>
                <SelectItem value="30" size="sm">
                  30 Rows
                </SelectItem>
                <SelectItem value="50" size="sm">
                  50 Rows
                </SelectItem>
                <SelectItem value="100" size="sm">
                  100 Rows
                </SelectItem>
              </SelectContent>
            </Select>

            <MultiSelect
              size="sm"
              className="max-w-[80px] min-w-auto!"
              maxCount={0}
              autoSize={true}
              placeholder="인보이스 상태"
              ref={statusRef}
              options={statusOptions}
              onValueChange={(v) => {
                handleFilterChange(setSelectedStatus, v);
              }}
              simpleSelect={true}
              hideSelectAll={true}
              closeOnSelect={false}
              searchable={false}
            />
          </div>
        </div>

        <div className="flex gap-x-2">
          <div className="relative">
            <Input
              className="max-w-42 pr-6"
              size="sm"
              placeholder="검색어 입력"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setSearchQuery(searchInput);
                }
              }}
            />
            {searchInput && (
              <Button
                type="button"
                variant="svgIcon"
                className="absolute top-0 right-0 h-full w-6 px-0 text-gray-500"
                onClick={resetAllFilters}>
                <X className="size-3.5" />
              </Button>
            )}
          </div>

          <Button size="sm" variant="destructive" onClick={() => {}} disabled={checkedItems.length === 0}>
            반려하기
          </Button>
          <Button size="sm" onClick={() => {}} disabled={checkedItems.length === 0}>
            승인하기
          </Button>
        </div>
      </div>
      <Table variant="primary" align="center" className="table-fixed">
        <TableHeader>
          <TableRow className="[&_th]:px-2 [&_th]:text-[13px] [&_th]:font-medium">
            <TableHead className="w-[8%]">인보이스 #</TableHead>
            <TableHead>인보이스 제목</TableHead>
            <TableHead className="w-[10%]">클라이언트</TableHead>
            <TableHead className="w-[8%]">공급가액</TableHead>
            <TableHead className="w-[8%]">세금</TableHead>
            <TableHead className="w-[9%]">합계</TableHead>
            <TableHead className="w-[7%]">작성자</TableHead>
            <TableHead className="w-[6%]">상태</TableHead>
            <TableHead className="w-[8%]">작성일</TableHead>
            {activeTab === 'claimed' && (
              <TableHead className="w-[3%] px-0! transition-all duration-150">
                <Checkbox
                  id="chk_all"
                  className="mx-auto flex size-4 items-center justify-center bg-white leading-none"
                  checked={checkAll}
                  onCheckedChange={(v) => handleCheckAll(!!v)}
                />
              </TableHead>
            )}
            {activeTab === 'confirmed' && <TableHead className="w-[10%]">파일</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoiceList.length ? (
            invoiceList.map((item, idx) => (
              <TableRow className="[&_td]:px-2 [&_td]:text-[13px] [&_td]:leading-[1.3]" key={item.seq}>
                <TableCell className="whitespace-nowrap">
                  <Link to={`/admin/finance/invoice/${item.seq}${search}`} className="rounded-[4px] border-1 bg-white p-1 text-sm">
                    {item.invoice_id}
                  </Link>
                </TableCell>
                <TableCell className="cursor-pointer px-4! text-left hover:underline">{item.invoice_title}</TableCell>
                <TableCell>{item.client_nm}</TableCell>
                <TableCell className="text-right">{formatAmount(item.invoice_amount)}</TableCell>
                <TableCell className="text-right">{formatAmount(item.invoice_tax)}</TableCell>
                <TableCell className="text-right">{formatAmount(item.invoice_total)}</TableCell>
                <TableCell className="px-4!">{item.user_nm}</TableCell>
                <TableCell>{statusMap[item.invoice_status as keyof typeof statusMap]}</TableCell>
                <TableCell>{formatDate(item.wdate)}</TableCell>
                {activeTab === 'claimed' && (
                  <TableCell className="px-0!">
                    <Checkbox
                      id={`chk_${item.seq}`}
                      className="mx-auto flex size-4 items-center justify-center bg-white leading-none"
                      checked={checkedItems.includes(item.seq)}
                      onCheckedChange={(v) => handleCheckItem(item.seq, !!v)}
                      disabled={item.invoice_status !== 'Claimed'}
                    />
                  </TableCell>
                )}
                {activeTab === 'confirmed' && (
                  <TableCell className="">
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        handleUploadFile(item.seq, file);
                        e.currentTarget.value = ''; // 동일 파일 재업로드 허용
                      }}
                    />
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleUploadFile(item.seq, file);
                      }}
                      className="text-muted-foreground rounded border border-dashed p-2 text-center text-xs">
                      PDF 드래그 또는 클릭
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="py-50 text-center text-gray-500">
                등록된 인보이스가 없습니다.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="mt-5">
        {invoiceList.length !== 0 && (
          <AppPagination
            totalPages={Math.ceil(total / pageSize)}
            initialPage={page}
            visibleCount={5}
            onPageChange={setPage} //부모 state 업데이트
          />
        )}
      </div>
    </>
  );
}
