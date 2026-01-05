import { useRef, useState, useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router';
import { useUser } from '@/hooks/useUser';
import { formatDate, formatAmount } from '@/utils';

import { notificationApi } from '@/api/notification';
import { uploadFilesToServer } from '@/api';
import {
  getInvoiceList,
  confirmInvoice,
  setInvoiceFile,
  delInvoiceFile,
  type InvoiceListItem,
  type InvoiceAttachment,
} from '@/api/admin/invoice';
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

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [draggingSeq, setDraggingSeq] = useState<number | null>(null);
  const [uploadStateMap, setUploadStateMap] = useState<Record<number, UploadState>>({});

  // ============================
  // 리스트 조회 (팀 선택 완료 후 실행)
  // ============================
  const loadList = async () => {
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

      setInvoiceList(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error('❌ 리스트 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadList();
  }, [activeTab, searchQuery, page, pageSize]);

  // 탭 변경 시 필터 초기화
  const handleTabChange = (tab: 'rejected' | 'claimed' | 'confirmed') => {
    setActiveTab(tab);
    setPage(1);
    resetAllFilters();
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

    setCheckedItems(checked ? invoiceList.map((item) => item.seq) : []);
  };

  // 개별 체크박스 핸들러
  const handleCheckItem = (seq: number, checked: boolean) => {
    setCheckedItems((prev) => (checked ? [...prev, seq] : prev.filter((id) => id !== seq)));
  };

  // 전체 선택 상태 반영
  useEffect(() => {
    if (invoiceList.length === 0) return;
    const selectable = invoiceList.map((i) => i.seq);

    setCheckAll(selectable.length > 0 && selectable.every((id) => checkedItems.includes(id)));
  }, [checkedItems, invoiceList]);

  // 승인하기 핸들러
  const handleConfirm = async () => {
    if (checkedItems.length === 0) {
      addAlert({
        title: '선택된 인보이스 항목이 없습니다.',
        message: '승인할 인보이스 항목을 선택해주세요.',
        icon: <OctagonAlert />,
        duration: 2000,
      });
      return;
    }

    addDialog({
      title: '인보이스 승인',
      message: `<span class="text-primary-blue-500 font-semibold">${checkedItems.length}</span>건의 인보이스를 승인하시겠습니까?`,
      confirmText: '승인',
      cancelText: '취소',
      onConfirm: async () => {
        const payload = { seqs: checkedItems };
        const res = await confirmInvoice(payload);

        if (res.ok) {
          const selectedRows = invoiceList.filter((item) => checkedItems.includes(item.seq));
          for (const row of selectedRows) {
            await notificationApi.registerNotification({
              user_id: row.user_id,
              user_name: row.user_nm,
              noti_target: user_id!,
              noti_title: `${row.invoice_title}`,
              noti_message: `요청한 인보이스를 승인했습니다.`,
              noti_type: 'invoice',
              noti_url: `/project/${row.project_id}/invoice`,
            });
          }

          addAlert({
            title: '인보이스 승인 완료',
            message: `<p><span class="text-primary-blue-500 font-semibold">${res.confirmed_count}</span>건의 인보이스가 승인 완료되었습니다.</p>`,
            icon: <OctagonAlert />,
            duration: 2000,
          });

          await loadList();
        }
      },
    });
  };

  // 파일 업로드 핸들러
  const handleUploadFile = async (seq: number, file: File) => {
    const fileArr: File[] = [file];
    setUploadStateMap((prev) => ({ ...prev, [seq]: 'uploading' }));

    try {
      // 성공 시, Invoice DB에 파일 세팅하는 API 호출
      const res = await uploadFilesToServer(fileArr, 'invoice_finance');

      const payload: InvoiceAttachment = {
        il_seq: seq,
        ia_role: 'finance',
        ia_fname: res[0].fname,
        ia_sname: res[0].sname,
        ia_url: res[0].url,
      };

      const fileRes = await setInvoiceFile(payload);

      if (fileRes.ok) {
        setUploadStateMap((prev) => ({ ...prev, [seq]: 'success' }));
        addAlert({ title: '파일 업로드', message: '인보이스 증빙자료 업로드가 완료되었습니다.', icon: <OctagonAlert />, duration: 1500 });

        await loadList();
      }
    } catch (err) {
      console.error(err);
      setUploadStateMap((prev) => ({ ...prev, [seq]: 'error' }));
      addAlert({
        title: '파일 업로드 실패',
        message: '인보이스 증빙자료 업로드를 실패했습니다. 다시 한 번 시도해 주세요.',
        icon: <OctagonAlert />,
        duration: 1500,
      });
    }
  };

  const handleDelFile = async (seq: number) => {
    try {
      addDialog({
        title: '증빙자료 삭제',
        message: '등록된 증빙자료를 삭제하시겠습니까?',
        confirmText: '확인',
        cancelText: '취소',
        onConfirm: async () => {
          const res = await delInvoiceFile(seq);

          if (res.ok) {
            addAlert({
              title: '증빙자료 삭제',
              message: '인보이스 증빙자료가 삭제되었습니다.',
              icon: <OctagonAlert />,
              duration: 1500,
            });

            await loadList();
          }
        },
      });
    } catch (err) {
      console.error('첨부파일 삭제 실패', err);

      addAlert({
        title: '증빙자료 삭제 실패',
        message: '인보이스 증빙자료 삭제에 실패했습니다. 다시 한 번 시도해 주세요.',
        icon: <OctagonAlert />,
        duration: 1500,
      });
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
          </div>
        </div>

        <div className="flex gap-x-2">
          <div className="relative">
            <Input
              className="max-w-42 pr-6"
              size="sm"
              placeholder="제목 또는 작성자명 검색"
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

          {activeTab === 'claimed' && (
            <>
              {/* <Button size="sm" variant="destructive" onClick={() => {}} disabled={checkedItems.length === 0}>
                반려하기
              </Button> */}
              <Button size="sm" onClick={handleConfirm} disabled={checkedItems.length === 0}>
                승인하기
              </Button>
            </>
          )}
        </div>
      </div>
      <Table variant="primary" align="center" className="table-fixed">
        <TableHeader>
          <TableRow className="[&_th]:px-2 [&_th]:text-[13px] [&_th]:font-medium">
            <TableHead className="w-[8%]">인보이스 #</TableHead>
            <TableHead>인보이스 제목</TableHead>
            <TableHead className="w-[10%]">인보이스 수신</TableHead>
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
                <TableCell className="cursor-pointer px-4! text-left hover:underline">
                  <Link to={`/admin/finance/invoice/${item.seq}${search}`}>{item.invoice_title}</Link>
                </TableCell>
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
                {activeTab === 'confirmed' &&
                  (item.attachments.length === 0 ? (
                    <TableCell>
                      <input
                        ref={fileInputRef}
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
                        onClick={() => {
                          if (uploadStateMap[item.seq] !== 'uploading') {
                            fileInputRef.current?.click();
                          }
                        }}
                        onDragEnter={() => setDraggingSeq(item.seq)}
                        onDragLeave={() => setDraggingSeq((prev) => (prev === item.seq ? null : prev))}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDraggingSeq(null);

                          if (uploadStateMap[item.seq] === 'uploading') return;

                          const file = e.dataTransfer.files?.[0];
                          if (file) handleUploadFile(item.seq, file);
                        }}
                        className={`cursor-pointer rounded border border-dashed p-2 text-center text-xs transition-colors ${
                          draggingSeq === item.seq ? 'bg-primary-blue-100 border-primary text-primary' : 'text-muted-foreground'
                        } `}>
                        {uploadStateMap[item.seq] === 'uploading' ? '업로드 중...' : 'PDF 드래그 또는 클릭'}
                      </div>
                    </TableCell>
                  ) : (
                    <TableCell>
                      {item.attachments.map((att) => (
                        <div className="flex items-center gap-1 overflow-hidden text-sm" key={att.ia_sname}>
                          <Link to={att.ia_url} className="truncate">
                            {att.ia_fname}
                          </Link>
                          <Button type="button" variant="svgIcon" size="icon" className="size-4" onClick={() => handleDelFile(item.seq)}>
                            <X className="size-3" />
                          </Button>
                        </div>
                      ))}
                    </TableCell>
                  ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={activeTab === 'claimed' || activeTab === 'confirmed' ? 10 : 9}
                className="py-50 text-center text-gray-500">
                등록된 인보이스가 없습니다.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="mt-5">
        {invoiceList.length !== 0 && (
          <AppPagination totalPages={Math.ceil(total / pageSize)} initialPage={page} visibleCount={5} onPageChange={setPage} />
        )}
      </div>
    </>
  );
}
