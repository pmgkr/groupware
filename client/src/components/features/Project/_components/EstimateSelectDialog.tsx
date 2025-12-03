import { useEffect, useState } from 'react';
import { getEstimateInfo, type EstimateHeaderView, getEstimateItemsInfo, type EstimateItemsView } from '@/api';
import { type expenseInfo } from '@/types/estimate';

import { Button } from '@components/ui/button';
import { Spinner } from '@components/ui/spinner';
import { Checkbox } from '@components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectTriggerFull, SelectValue, SelectContent, SelectItem, SelectTrigger } from '@components/ui/select';
import { TableColumn, TableColumnHeader, TableColumnHeaderCell, TableColumnBody, TableColumnCell } from '@/components/ui/tableColumn';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@components/ui/dialog';

import { formatAmount, displayUnitPrice } from '@/utils';

interface EstimateSelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string | undefined;
  expenseInfo: expenseInfo | null;
  onConfirm: (selected: EstimateItemsView[]) => void;
  selectingItems?: EstimateItemsView[]; // 선택된 항목들 (기본값 : 빈 배열);
}

export interface estViewMatchDTO {
  header: EstimateHeaderView;
  items: EstimateItemsView[];
}

export default function EstimateSelectDialog({
  open,
  onOpenChange,
  projectId,
  expenseInfo,
  onConfirm,
  selectingItems,
}: EstimateSelectDialogProps) {
  const [loading, setLoading] = useState(false);
  const [estData, setEstData] = useState<estViewMatchDTO | null>(null);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  // 멀티 견적서 대응 State
  const [estimateList, setEstimateList] = useState<EstimateHeaderView[]>([]);
  const [selectedEstId, setSelectedEstId] = useState<number | null>(null);

  /** ---------------------------
   *  견적서 로딩
   --------------------------- */
  useEffect(() => {
    if (!open) return;

    (async () => {
      try {
        setLoading(true);

        const raw = await getEstimateInfo(projectId);
        const list = raw.result ?? [];

        console.log('가져온 견적서', list);
        setEstimateList(list);

        // 리스트가 1개일 때만 자동 선택
        if (list.length === 1) {
          setSelectedEstId(list[0].est_id);
        } else {
          // 여러개의 견적서라면 선택 전까지 UI 비활성화
          setSelectedEstId(null);
          setEstData(null);
        }
      } catch (err) {
        console.error('❌ 견적서 불러오기 오류:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, projectId]);

  /** ---------------------------
   *  특정 견적서 선택 후 항목 로딩
   --------------------------- */
  useEffect(() => {
    if (!selectedEstId) return; // 선택 전에는 아무 것도 하지 않음

    (async () => {
      try {
        setLoading(true);

        const header = estimateList.find((e) => e.est_id === selectedEstId);
        if (!header) return;

        const itemRes = await getEstimateItemsInfo(selectedEstId);
        const items = (itemRes.result ?? []).map((i) => ({
          ...i,
          unit_price: i.unit,
          ei_name: i.item_name,
        }));

        setEstData({ header, items });
      } catch (err) {
        console.error('❌ 항목 로딩 오류:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedEstId, estimateList]);

  /** ---------------------------
   *  selectingItems 초기 적용
   --------------------------- */
  useEffect(() => {
    if (open && selectingItems) {
      setSelectedItems(selectingItems?.map((item) => item.seq) ?? []);
    }
  }, [open]);

  /** ---------------------------
   *  체크박스 토글
   --------------------------- */
  const toggleItem = (seq: number) => {
    setSelectedItems((prev) => (prev.includes(seq) ? prev.filter((id) => id !== seq) : [...prev, seq]));
  };

  /** ---------------------------
   *  등록 버튼 → 선택된 item 전달
   --------------------------- */
  const handleConfirm = () => {
    const matched = estData?.items.filter((item) => selectedItems.includes(item.seq)) ?? [];

    onConfirm(matched);
    onOpenChange(false);
    setSelectedItems([]);
  };

  /** ---------------------------
   *  선택된 가용금액 합산
   --------------------------- */
  const selectedAvaAmount =
    estData?.items?.filter((item) => selectedItems.includes(item.seq))?.reduce((sum, item) => sum + Number(item.ava_amount ?? 0), 0) || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>견적서 불러오기</DialogTitle>
          <DialogDescription>비용을 매칭할 견적서 항목을 선택해 주세요.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 flex-col">
          {loading && (
            <div className="flex h-[40vh] flex-col items-center justify-center gap-4 text-gray-500">
              <Spinner className="size-10" />
              데이터를 불러오는 중입니다...
            </div>
          )}

          {!loading && selectedEstId !== null && (
            <TableColumn className="[&_div]:text-[13px]">
              <TableColumnHeader className="w-[18%]">
                <TableColumnHeaderCell>견적서 제목</TableColumnHeaderCell>
              </TableColumnHeader>

              <TableColumnBody>
                {estData ? (
                  <TableColumnCell className="leading-[1.3]">{estData.header.est_title}</TableColumnCell>
                ) : (
                  <TableColumnCell className="p-0! leading-[1.3]">
                    <Select
                      value={selectedEstId ? String(selectedEstId) : undefined}
                      onValueChange={(value) => setSelectedEstId(Number(value))}>
                      <SelectTrigger size="sm" className="h-full! w-full border-0 text-[13px]! shadow-none">
                        <SelectValue placeholder="견적서를 선택하세요" />
                      </SelectTrigger>
                      <SelectContent className="border-gray-300">
                        {estimateList.map((est) => (
                          <SelectItem key={est.est_id} value={String(est.est_id)} size="sm">
                            {est.est_title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableColumnCell>
                )}
              </TableColumnBody>
              {estData && (
                <>
                  <TableColumnHeader className="w-[18%]">
                    <TableColumnHeaderCell>가용 예산 / 견적서 총액</TableColumnHeaderCell>
                  </TableColumnHeader>
                  <TableColumnBody>
                    <TableColumnCell>
                      {formatAmount(estData.header.est_budget)} / {formatAmount(estData.header.est_amount)}{' '}
                      <span className="ml-1 font-bold">
                        ({((estData.header.est_budget / estData.header.est_amount) * 100).toFixed(2)}
                        %)
                      </span>
                    </TableColumnCell>
                  </TableColumnBody>
                </>
              )}
            </TableColumn>
          )}

          {!loading && estData && (
            <>
              {/* 선택 및 합계 */}
              <div className="mt-4">
                <div className="mb-1 flex items-center justify-between text-[13px]">
                  <span>
                    비용 금액 : <span className="text-primary-blue-500">{formatAmount(expenseInfo?.ei_amount ?? 0)}</span> 원
                  </span>
                  <div className="text-gray-700">
                    선택 <span className="text-primary-blue-500">{selectedItems.length}</span>건 | 가용 금액{' '}
                    <span className="text-primary-blue-500">{formatAmount(selectedAvaAmount)}</span>원
                  </div>
                </div>

                {/* 테이블 */}
                <Table variant="primary" align="center" className="table-fixed">
                  <TableHeader>
                    <TableRow className="[&_th]:text-[13px] [&_th]:font-medium">
                      <TableHead className="text-left">항목명</TableHead>
                      <TableHead className="w-[12%]">단가</TableHead>
                      <TableHead className="w-[10%]">수량</TableHead>
                      <TableHead className="w-[12%]">금액</TableHead>
                      <TableHead className="w-[12%]">가용 금액</TableHead>
                      <TableHead className="w-[24%]">비고</TableHead>
                      <TableHead className="w-8 px-0"></TableHead>
                    </TableRow>
                  </TableHeader>
                </Table>

                <div className="max-h-[50vh] overflow-y-auto">
                  <Table variant="primary" align="center" className="table-fixed">
                    <colgroup>
                      <col style={{ width: 'auto' }} />
                      <col style={{ width: '12%' }} />
                      <col style={{ width: '10%' }} />
                      <col style={{ width: '12%' }} />
                      <col style={{ width: '12%' }} />
                      <col style={{ width: '24%' }} />
                      <col style={{ width: '5%' }} />
                    </colgroup>
                    <TableBody>
                      {estData.items.map((item) => (
                        <TableRow key={item.seq} className="[&_td]:px-2 [&_td]:text-[13px]">
                          {/* Title */}
                          {item.ei_type === 'title' && (
                            <TableCell className="text-left font-bold" colSpan={7}>
                              {item.ei_name}
                            </TableCell>
                          )}

                          {/* Normal Item */}
                          {item.ei_type === 'item' && (
                            <>
                              <TableCell className="text-left">{item.ei_name}</TableCell>
                              <TableCell className="text-right">{formatAmount(item.unit_price)}</TableCell>
                              <TableCell className="text-right">{item.qty}</TableCell>
                              <TableCell className="text-right">{formatAmount(item.amount)}</TableCell>
                              <TableCell className="text-right">{formatAmount(item.ava_amount)}</TableCell>
                              <TableCell className="text-left leading-[1.3]">{item.remark}</TableCell>
                              <TableCell className="w-8 !px-0">
                                <Checkbox
                                  id={item.seq.toString()}
                                  checked={selectedItems.includes(item.seq)}
                                  onCheckedChange={() => toggleItem(item.seq)}
                                  className="mx-auto flex size-4 items-center justify-center bg-white leading-none"
                                />
                              </TableCell>
                            </>
                          )}

                          {/* subtotal / agency_fee / discount / grandtotal */}
                          {item.ei_type === 'subtotal' && (
                            <>
                              <TableCell colSpan={3} className="bg-gray-100 font-semibold">
                                Sub Total
                              </TableCell>
                              <TableCell className="bg-gray-100 text-right font-semibold">{formatAmount(item.amount)}</TableCell>
                              <TableCell colSpan={3} className="bg-gray-100" />
                            </>
                          )}

                          {item.ei_type === 'agency_fee' && (
                            <>
                              <TableCell className="text-left font-medium">{item.ei_name || 'Agency Fee'}</TableCell>
                              <TableCell className="text-right">{displayUnitPrice(item.unit_price ?? 0)}</TableCell>
                              <TableCell />
                              <TableCell className="text-right font-semibold">{formatAmount(item.amount)}</TableCell>
                              <TableCell className="text-right">{formatAmount(item.ava_amount)}</TableCell>
                              <TableCell className="text-left leading-[1.3]">{item.remark}</TableCell>
                              <TableCell className="w-8 !px-0">
                                <Checkbox
                                  id={item.seq.toString()}
                                  checked={selectedItems.includes(item.seq)}
                                  onCheckedChange={() => toggleItem(item.seq)}
                                  className="mx-auto flex size-4 items-center justify-center bg-white leading-none"
                                />
                              </TableCell>
                            </>
                          )}

                          {item.ei_type === 'discount' && (
                            <>
                              <TableCell colSpan={3} className="bg-gray-300 font-semibold">
                                Discount
                              </TableCell>
                              <TableCell className="bg-gray-300 text-right font-semibold">{formatAmount(item.amount)}</TableCell>
                              <TableCell className="bg-gray-300" />
                              <TableCell className="bg-gray-300 text-left leading-[1.3]">{item.remark}</TableCell>
                              <TableCell className="bg-gray-300" />
                            </>
                          )}

                          {item.ei_type === 'grandtotal' && (
                            <>
                              <TableCell colSpan={3} className="bg-primary-blue-150 font-bold text-gray-900">
                                Grand Total
                              </TableCell>
                              <TableCell className="bg-primary-blue-150 text-right font-bold text-gray-900">
                                {formatAmount(item.amount)}
                              </TableCell>
                              <TableCell className="bg-primary-blue-150 text-right font-bold">{formatAmount(item.ava_amount)}</TableCell>
                              <TableCell colSpan={2} className="bg-primary-blue-150" />
                            </>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="justify-center">
          <DialogClose asChild>
            <Button variant="outline">취소</Button>
          </DialogClose>
          <Button type="button" onClick={handleConfirm}>
            등록
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
