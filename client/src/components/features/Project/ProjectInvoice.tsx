import { useRef, useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useParams, useOutletContext } from 'react-router';
import type { ProjectLayoutContext } from '@/pages/Project/ProjectLayout';
import {
  getInvoiceList,
  getInvoiceDetail,
  type InvoiceListItem,
  type InvoiceListParams,
  type InvoiceDetailDTO,
  type InvoiceDetailAttachment,
} from '@/api';
import { useIsMobileViewport } from '@/hooks/useViewport';
import InvoiceCreateForm from './_components/InvoiceCreate';
import { InvoicePreviewDialog } from './_components/InvoiceDetail';
import { formatDate, formatAmount } from '@/utils';

import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@components/ui/button';
import { AppPagination } from '@/components/ui/AppPagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MultiSelect, type MultiSelectOption, type MultiSelectRef } from '@components/multiselect/multi-select';
import { Dialog, DialogClose, DialogDescription, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

import { X } from 'lucide-react';

export function mapInvoiceDetail(raw: any): InvoiceDetailDTO {
  const items = raw.items ?? [];

  const attachment: InvoiceDetailAttachment[] = Object.entries(raw.attachment ?? {})
    .filter(([key]) => /^\d+$/.test(key))
    .map(([_, value]) => value as InvoiceDetailAttachment);

  return {
    header: raw.header,
    items,
    attachment,
  };
}

export default function ProjectInvoice() {
  const { projectId } = useParams();
  const isMobile = useIsMobileViewport();
  const { data, refetch } = useOutletContext<ProjectLayoutContext>();

  // 상단 필터용 state
  const [registerDialog, setRegisterDialog] = useState(false); // Dialog용 State
  const [detailDialog, setDetailDialog] = useState(false); // 인보이스 상세 Dialog State
  const [searchInput, setSearchInput] = useState(''); // 사용자가 입력중인 Input 저장값
  const [searchQuery, setSearchQuery] = useState(''); // 실제 검색 Input 저장값
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const statusRef = useRef<MultiSelectRef>(null); // MultiSelect Refs
  const statusOptions: MultiSelectOption[] = [
    { label: '승인대기', value: 'Claimed' },
    { label: '승인완료', value: 'Confirmed' },
    { label: '반려됨', value: 'Rejected' },
  ];

  // API 데이터 state
  const [invoiceList, setInvoiceList] = useState<InvoiceListItem[]>([]);
  const [invoiceDetail, setInvoiceDetail] = useState<InvoiceDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);

  // 페이지네이션
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 15; // 한 페이지에 보여줄 개수

  // 견적서 리스트 가져오기
  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const params: InvoiceListParams = {
        page,
        size: pageSize,
        invoice_status: selectedStatus.join(','),
        q: searchQuery,
      };

      const res = await getInvoiceList(projectId!, params);

      console.log('✅ 인보이스 리스트 응답:', res);

      setInvoiceList(res.list);
      setTotal(res.total);
    } catch (err) {
      console.error('❌ 인보이스 리스트 불러오기 실패:', err);
    } finally {
      setLoading(false);
    }
  }, [page, selectedStatus, searchQuery]);

  // 마운트 시 호출
  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // 상태 라벨/색상 매핑
  const statusMap = {
    Claimed: <Badge variant="secondary">승인대기</Badge>,
    Confirmed: <Badge>승인완료</Badge>,
    Rejected: <Badge className="bg-destructive">반려됨</Badge>,
  } as const;

  // 필터 변경 시 page 초기화
  const handleFilterChange = (setter: any, value: any) => {
    setter(value);
    setPage(1);
  };

  // 파라미터 초기화
  const resetAllFilters = () => {
    setPage(1);
    setSearchInput('');
    setSearchQuery('');

    statusRef.current?.clear();
  };

  /** 인보이스 생성 후 새로고침 */
  const handleCreateSuccess = () => {
    fetchInvoices();
    refetch();
    setRegisterDialog(false);
  };

  const handleDetailOpen = async (seq: number) => {
    try {
      const res = await getInvoiceDetail(seq);

      if (res.success) {
        const detail = mapInvoiceDetail(res.data);
        setInvoiceDetail(detail);
        setDetailDialog(true);
      }
    } catch (err) {
      console.error('❌ 인보이스 상세 불러오기 실패:', err);
    }
  };

  return (
    <>
      {isMobile ? (
        <>
          <div className="mb-4 flex items-center gap-x-2">
            <MultiSelect
              size="sm"
              ref={statusRef}
              className="max-w-[84px]! transition-none"
              maxCount={0}
              autoSize={true}
              placeholder="상태 선택"
              options={statusOptions}
              onValueChange={(v) => handleFilterChange(setSelectedStatus, v)}
              searchable={false}
              simpleSelect={true}
              hideSelectAll={true}
            />

            <div className="relative">
              <Input
                size="sm"
                className="max-w-42 pr-6"
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

            {data.project_status === 'in-progress' && (
              <Button size="sm" onClick={() => setRegisterDialog(true)}>
                인보이스 작성
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {invoiceList.length ? (
              invoiceList.map((item, idx) => (
                <div className="rounded-md border border-gray-300 bg-white px-4 py-2">
                  <div className="mb-1 flex justify-between border-b border-gray-300 pb-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>#{item.invoice_id}</span>
                    </div>
                    {statusMap[item.invoice_status as keyof typeof statusMap]}
                  </div>
                  <div className="" onClick={() => handleDetailOpen(item.seq)}>
                    <div className="my-2 flex items-center gap-2 overflow-hidden text-lg tracking-tight">
                      <p className="flex-1 truncate">{item.invoice_title}</p>
                      <strong className="shrink-0 font-medium">{formatAmount(item.invoice_total)}원</strong>
                    </div>
                    <div className="flex flex-wrap items-center justify-between text-sm text-gray-500">
                      <div className="flex gap-2">
                        <span className="relative pr-2 after:absolute after:top-1/2 after:left-full after:h-3 after:w-px after:-translate-y-1/2 after:bg-gray-300 after:content-['']">
                          공급가액 {formatAmount(item.invoice_amount)}
                        </span>
                        <span>세금 {formatAmount(item.invoice_tax)}</span>
                      </div>
                      <p className="shrink-0">{item.user_nm}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-50 text-center text-base text-gray-500">등록된 인보이스가 없습니다.</p>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            {/* 상단 좌측 필터 */}
            <div className="flex items-center gap-x-2">
              <MultiSelect
                size="sm"
                ref={statusRef}
                className="max-w-[80px] min-w-auto!"
                maxCount={0}
                autoSize={true}
                placeholder="상태 선택"
                options={statusOptions}
                onValueChange={(v) => handleFilterChange(setSelectedStatus, v)}
                simpleSelect={true}
                hideSelectAll={true}
              />
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

              {data.project_status === 'in-progress' && data.is_locked === 'N' && (
                <Button size="sm" onClick={() => setRegisterDialog(true)}>
                  인보이스 작성
                </Button>
              )}
            </div>
          </div>
          <Table variant="primary" align="center" className="table-fixed">
            <TableHeader>
              <TableRow className="[&_th]:px-2 [&_th]:text-[13px] [&_th]:font-medium">
                <TableHead className="w-[8%] max-2xl:w-[10%]">인보이스 #</TableHead>
                <TableHead className="px-4!">인보이스 제목</TableHead>
                <TableHead className="w-[8%] max-2xl:w-[10%]">공급가액</TableHead>
                <TableHead className="w-[8%] max-2xl:w-[10%]">세금</TableHead>
                <TableHead className="w-[9%] max-2xl:w-[10%]">합계</TableHead>
                <TableHead className="w-[10%] px-4!">작성자</TableHead>
                <TableHead className="w-[6%]">상태</TableHead>
                <TableHead className="w-[12%]">작성일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoiceList.length ? (
                invoiceList.map((item, idx) => (
                  <TableRow className="[&_td]:px-2 [&_td]:text-[13px] [&_td]:leading-[1.3] max-2xl:[&_td]:text-sm" key={item.seq}>
                    <TableCell className="whitespace-nowrap">
                      <button
                        type="button"
                        className="cursor-pointer rounded-[4px] border-1 bg-white p-1 text-sm leading-[1.3] max-2xl:text-[11px]"
                        onClick={() => handleDetailOpen(item.seq)}>
                        {item.invoice_id}
                      </button>
                    </TableCell>
                    <TableCell className="cursor-pointer px-4! text-left hover:underline" onClick={() => handleDetailOpen(item.seq)}>
                      {item.invoice_title}
                    </TableCell>
                    <TableCell className="text-right">{formatAmount(item.invoice_amount)}</TableCell>
                    <TableCell className="text-right">{formatAmount(item.invoice_tax)}</TableCell>
                    <TableCell className="text-right">{formatAmount(item.invoice_total)}</TableCell>
                    <TableCell className="px-4!">{item.user_nm}</TableCell>
                    <TableCell>{statusMap[item.invoice_status as keyof typeof statusMap]}</TableCell>
                    <TableCell>{formatDate(item.wdate)}</TableCell>
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
        </>
      )}

      {/* ---------------- 페이지네이션 ---------------- */}
      {invoiceList.length !== 0 && (
        <div className="mt-5">
          <AppPagination totalPages={Math.ceil(total / pageSize)} initialPage={page} visibleCount={5} onPageChange={(p) => setPage(p)} />
        </div>
      )}

      {/* ---------------- 인보이스 작성 다이얼로그 ---------------- */}
      <Dialog open={registerDialog} onOpenChange={setRegisterDialog}>
        <DialogContent className="flex h-full max-h-full flex-col md:h-auto md:max-h-[90vh]" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>인보이스 작성하기</DialogTitle>
            <DialogDescription>인보이스 작성을 위한 정보를 입력해 주세요.</DialogDescription>
          </DialogHeader>
          <InvoiceCreateForm onClose={() => setRegisterDialog(false)} onSuccess={handleCreateSuccess} />
        </DialogContent>
      </Dialog>

      {/* ---------------- 인보이스 상세 다이얼로그 ----------------- */}
      <InvoicePreviewDialog open={detailDialog} onClose={() => setDetailDialog(false)} detail={invoiceDetail} />
    </>
  );
}
