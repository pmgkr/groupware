import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Link, useLocation, useOutletContext, useNavigate, useParams } from 'react-router';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { useUser } from '@/hooks/useUser';
import { mapExcelToQuotationItems, formatAmount, displayUnitPrice } from '@/utils';
import { uploadFilesToServer, estimateRegister } from '@/api';
import type { ProjectLayoutContext } from '@/pages/Project/ProjectLayout';

import { type QuotationMappedItem } from '@/types/estimate';
import EstimateEvidence from './_components/EstimateEvidence';
import type { PreviewFile } from './_components/EstimateEvidence';
import { isAmountItem } from './utils/estimate';

import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';
import { useAppDialog } from '@/components/common/ui/AppDialog/AppDialog';

import { Input } from '@components/ui/input';
import { Button } from '@components/ui/button';
import { Textarea } from '@components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableColumn, TableColumnHeader, TableColumnHeaderCell, TableColumnBody, TableColumnCell } from '@/components/ui/tableColumn';

import { Info, OctagonAlert } from 'lucide-react';

type EstimateForm = {
  estimate_items: QuotationMappedItem[];
};

export default function EstimatePreview() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user_name } = useUser();
  const { projectId } = useParams();

  const { registerType, excelData, estName, excelFile } = location.state;
  const { data } = useOutletContext<ProjectLayoutContext>();

  // Alert & Dialog hooks
  const { addAlert } = useAppAlert();
  const { addDialog } = useAppDialog();

  const [estimateName, setEstimateName] = useState(estName ?? '');
  const [shouldFocusName, setShouldFocusName] = useState(false); // 견적서 제목 포커스 State
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false); // 증빙자료 없이 등록하는 경우, 증빙사유 작성을 위한 Dialog State
  const [evidenceFiles, setEvidenceFiles] = useState<PreviewFile[]>([]); // 증빙자료 파일에 대한 State
  const [evidenceReason, setEvidenceReason] = useState<string | null>(null); // 증빙자료 사유 저장용 State
  const reasonRef = useRef<HTMLTextAreaElement | null>(null); // 증빙자료 사유에 대한 ref

  // --------------------------
  // 1) react-hook-form 세팅
  // --------------------------

  const form = useForm<EstimateForm>({
    defaultValues: {
      estimate_items: [],
    },
  });

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: 'estimate_items',
  });

  // RHF 값 감지
  const watchedItems = useWatch({
    control: form.control,
    name: 'estimate_items',
  });

  // --------------------------
  // 2) Excel 매핑하여 row 생성
  // --------------------------
  useEffect(() => {
    if (excelData && Array.isArray(excelData)) {
      const mapped = mapExcelToQuotationItems(excelData);
      replace(mapped);

      // form 데이터에도 반영
      form.reset({
        estimate_items: mapped,
      });
    }
  }, [excelData]);

  useEffect(() => {
    if (shouldFocusName) {
      nameInputRef.current?.focus();
      setShouldFocusName(false); // 초기화
    }
  }, [shouldFocusName]);

  // --------------------------
  // Total 계산 (memoized)
  // --------------------------
  const totalAmount = useMemo(() => {
    return fields.filter(isAmountItem).reduce((sum, f) => sum + Number(f.amount || 0), 0);
  }, [fields]);

  const totalCost = useMemo(() => {
    return watchedItems?.filter((f) => f.type === 'item')?.reduce((sum, f) => sum + (Number(f.cost) || 0), 0) || 0;
  }, [watchedItems]);

  const hasGrandTotal = fields.some((f) => f.type === 'grandtotal');

  // --------------------------
  // 비용 입력 (format + validation)
  // --------------------------
  const handleCostInput = useCallback((e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    let raw = e.target.value;

    raw = raw.replace(/[.]/g, '');
    raw = raw.replace(/[^0-9]/g, '');

    if (raw === '') {
      form.setValue(`estimate_items.${index}.cost`, undefined);
      return;
    }

    if (/^0+$/.test(raw)) return;

    raw = raw.replace(/^0+/, '');
    const numeric = Number(raw);

    if (!isNaN(numeric)) {
      form.setValue(`estimate_items.${index}.cost`, numeric);
    }
  }, []);

  // --------------------------
  // Dialog content 템플릿
  // --------------------------
  const buildDialogContent = (reason?: string) => `
    <ul class="text-base text-gray-700
      [&>li]:flex [&>li]:leading-[1.4] space-y-1 [&>li]:gap-x-1.5 [&>li]:items-start [&_span::before]:content-[''] [&_span]:flex [&_span]:items-center [&_span]:gap-1.5
      [&_span]:shrink-0 [&_p]:flex-1 [&_span::before]:h-1 [&_span::before]:w-1
      [&_span::before]:rounded-full [&_span::before]:bg-gray-700 [&_p]:break-all [&_p]:leading-[1.3]
      ">
      <li><span>견적서 제목 :</span> <p>${estimateName}</p></li>
      <li><span>견적서 합계 :</span> <p>${formatAmount(totalAmount)}</p></li>
      <li><span>예상 지출 합계 :</span> <p>${formatAmount(totalCost)}</p></li>
      ${reason ? `<li><span>증빙 사유 :</span> <p>${reason}</p></li>` : ''}
    </ul>
  `;

  // --------------------------
  // 등록 처리
  // --------------------------
  const registerEstimate = async (v: EstimateForm, reason?: string) => {
    try {
      if (!estimateName.trim()) {
        setDialogOpen(false);
        // setShouldFocusName(true);
        nameInputRef.current?.focus();

        addAlert({
          title: '견적서 등록 실패',
          message: '견적서 제목을 입력해 주세요.',
          icon: <OctagonAlert />,
          duration: 1500,
        });
        return;
      } else {
        addDialog({
          title: '작성한 견적서를 등록합니다.',
          message: `등록 전 데이터를 다시 한 번 확인해 주세요.`,
          content: buildDialogContent(reason),
          confirmText: '확인',
          cancelText: '취소',
          onConfirm: async () => {
            // 등록된 증빙자료 항목 Array
            let evidenceItems: any[] = [];

            if (evidenceFiles.length > 0) {
              // File 객체만 추출
              const onlyFiles = evidenceFiles.map((f) => f.file ?? f);
              console.log(onlyFiles);
              const uploaded = await uploadFilesToServer(onlyFiles, 'est_evidence');

              console.log('✅ 업로드 완료:', uploaded);

              // 업로드 성공 후 evidenceItems 구성
              evidenceItems = uploaded.map((f: any, idx: number) => {
                const file = onlyFiles[idx];

                return {
                  ee_fname: f.fname,
                  ee_sname: f.sname,
                  ee_size: file.size,
                  ee_type: file.type,
                };
              });
            } else {
              // 증빙자료 없음으면 사유 저장
              evidenceItems = [{ remark: reason ?? '' }];
            }

            // 견적서 항목 Array
            const items = v.estimate_items.map((i: any, idx: number) => ({
              ei_type: i.type,
              ei_name: i.item,
              unit_price: i.unit_price ?? null,
              qty: i.qty ?? null,
              amount: i.amount ?? null,
              exp_cost: i.cost ?? null,
              ava_amount: i.amount ?? null,
              remark: i.remarks ?? null,
              ei_order: idx,
            }));

            const payload = {
              header: {
                project_id: projectId!,
                user_nm: user_name!,
                est_title: estimateName,
                est_valid: registerType, // 신규 견적서 Y, 추가 견적서 S
              },
              body: items,
              footer: evidenceItems,
            };

            console.log('📦 최종 payload:', payload);

            const result = await estimateRegister(payload);

            if (result.ok) {
              const item_count = result.counts.items;

              addAlert({
                title: '견적서 등록이 완료되었습니다.',
                message: `<p>총 <span class="text-primary-blue-500">${item_count}개</span> 견적서 항목이 등록 되었습니다.</p>`,
                icon: <OctagonAlert />,
                duration: 2000,
              });

              navigate(`/project/${projectId}/estimate`);
            }
          },
        });
      }
    } catch (err) {
      console.error('❌ 견적서 등록 실패:', err);

      addAlert({
        title: '견적서 등록 실패',
        message: `견적서 등록 중 오류가 발생했습니다. \n 다시 시도해주세요.`,
        icon: <OctagonAlert />,
        duration: 2000,
      });
      return;
    }
  };

  const handleFormSubmit = (v: EstimateForm) => {
    // 1) 증빙자료 없고, 사유도 없으면 → 다이얼로그 열기
    if (evidenceFiles.length === 0 && !evidenceReason) {
      setDialogOpen(true);
      return;
    }

    // 2) 증빙자료 있거나, 사유가 있다면 → 실제 등록
    registerEstimate(v, evidenceReason ?? undefined);
  };

  const handleReason = () => {
    const reason = reasonRef.current?.value.trim() ?? '';

    if (!reason) {
      addAlert({
        title: '사유 입력 필요',
        message: '증빙 없이 등록하려면 사유를 입력하세요.',
        icon: <OctagonAlert />,
        duration: 1500,
      });
      return;
    }

    // reason 저장
    setEvidenceReason(reason);
    setDialogOpen(false);

    const values = form.getValues();
    registerEstimate(values, reason);
  };

  return (
    <>
      <form onSubmit={form.handleSubmit(handleFormSubmit)}>
        <div className="flex flex-wrap justify-between">
          <div className="w-[74%] tracking-tight">
            <h2 className="mb-2 text-lg font-bold text-gray-800">견적서 정보</h2>
            <TableColumn className="[&_div]:text-[13px] [&_input]:text-[13px]">
              <TableColumnHeader className="w-[18%]">
                <TableColumnHeaderCell>프로젝트 #</TableColumnHeaderCell>
              </TableColumnHeader>
              <TableColumnBody>
                <TableColumnCell>{data.project_id}</TableColumnCell>
              </TableColumnBody>
              <TableColumnHeader className="w-[18%]">
                <TableColumnHeaderCell>클라이언트</TableColumnHeaderCell>
              </TableColumnHeader>
              <TableColumnBody>
                <TableColumnCell>{data.client_nm}</TableColumnCell>
              </TableColumnBody>
            </TableColumn>
            <TableColumn className="border-t-0 [&_div]:text-[13px] [&_input]:text-[13px]">
              <TableColumnHeader className="w-[18%]">
                <TableColumnHeaderCell className="h-full">견적서 제목</TableColumnHeaderCell>
              </TableColumnHeader>
              <TableColumnBody>
                <TableColumnCell className="h-full">
                  <Input
                    ref={nameInputRef}
                    value={estimateName}
                    onChange={(e) => setEstimateName(e.target.value)}
                    className="h-full border-0 p-0 shadow-none"
                  />
                </TableColumnCell>
              </TableColumnBody>
            </TableColumn>
          </div>

          <div className="flex w-[24%] flex-col">
            <EstimateEvidence onChangeFiles={(files) => setEvidenceFiles(files)} />
          </div>
        </div>

        {/* ------------------------------- */}
        {/*      견적서 항목 렌더링        */}
        {/* ------------------------------- */}
        <div className="mt-6">
          <h2 className="mb-2 text-lg font-bold text-gray-800">견적서 항목</h2>

          <Table variant="primary" align="center" className="table-fixed">
            <TableHeader>
              <TableRow className="[&_th]:text-[13px] [&_th]:font-medium">
                <TableHead className="text-left">항목명</TableHead>
                <TableHead className="w-[10%]">단가</TableHead>
                <TableHead className="w-[6%]">수량</TableHead>
                <TableHead className="w-[10%]">금액</TableHead>
                <TableHead className="w-[12%]">
                  <TooltipProvider>
                    <Tooltip>
                      <span className="flex items-center justify-center gap-1">
                        예상 지출 금액
                        <TooltipTrigger asChild>
                          <Info className="size-3 text-gray-500" />
                        </TooltipTrigger>
                      </span>
                      <TooltipContent>프로젝트의 비용·수익 관리에 활용됩니다.</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
                <TableHead className="w-[28%]">비고</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {fields.map((row, index) => (
                <TableRow key={row.id} className={`whitespace-nowrap [&_td]:text-[13px] ${row.type === 'item' && 'hover:bg-muted/15'}`}>
                  {/* ------------------------ */}
                  {/* 일반 Item Row */}
                  {/* ------------------------ */}
                  {row.type === 'title' && (
                    <>
                      <TableCell className="text-left font-bold" colSpan={6}>
                        {row.item}
                      </TableCell>
                    </>
                  )}

                  {/* ------------------------ */}
                  {/* 일반 Item Row */}
                  {/* ------------------------ */}
                  {row.type === 'item' && (
                    <>
                      <TableCell className="text-left">{row.item}</TableCell>
                      <TableCell className="text-right">{formatAmount(row.unit_price)}</TableCell>
                      <TableCell className="text-right">{row.qty}</TableCell>
                      <TableCell className="text-right">{formatAmount(row.amount)}</TableCell>

                      <TableCell>
                        {(() => {
                          const watchedCost = form.watch(`estimate_items.${index}.cost`);
                          return (
                            <Input
                              type="text"
                              size="sm"
                              inputMode="numeric"
                              className="h-7 rounded-sm text-right"
                              value={watchedCost ? formatAmount(watchedCost) : ''}
                              onChange={(e) => handleCostInput(e, index)}
                            />
                          );
                        })()}
                      </TableCell>
                      <TableCell className="text-left leading-[1.1] break-keep whitespace-break-spaces">{row.remarks}</TableCell>
                    </>
                  )}

                  {/* ------------------------ */}
                  {/* Sub Total Row */}
                  {/* ------------------------ */}
                  {row.type === 'subtotal' && (
                    <>
                      <TableCell colSpan={3} className="bg-gray-100 font-semibold">
                        {row.label}
                      </TableCell>
                      <TableCell className="bg-gray-100 text-right font-semibold">{formatAmount(row.amount)}</TableCell>
                      <TableCell colSpan={2} className="bg-gray-100"></TableCell>
                    </>
                  )}

                  {/* ------------------------ */}
                  {/* Agency Fee Row */}
                  {/* ------------------------ */}
                  {row.type === 'agency_fee' && (
                    <>
                      <TableCell className="text-left font-medium">{row.label}</TableCell>

                      <TableCell className="text-right">{displayUnitPrice(row.unit_price)}</TableCell>
                      <TableCell></TableCell>
                      <TableCell className="text-right font-semibold">{row.amount.toLocaleString()}</TableCell>
                      <TableCell></TableCell>
                      <TableCell className="text-left">{row.remarks}</TableCell>
                    </>
                  )}

                  {/* ------------------------ */}
                  {/* Discount Row */}
                  {/* ------------------------ */}
                  {row.type === 'discount' && (
                    <>
                      <TableCell colSpan={3} className="bg-gray-300 font-semibold">
                        {row.label}
                      </TableCell>
                      <TableCell className="bg-gray-300 text-right font-semibold">{formatAmount(row.amount)}</TableCell>
                      <TableCell className="bg-gray-300"></TableCell>
                      <TableCell className="bg-gray-300 text-left">{row.remarks}</TableCell>
                    </>
                  )}

                  {/* ------------------------ */}
                  {/* Grand Total Row */}
                  {/* ------------------------ */}
                  {row.type === 'grandtotal' && (
                    <>
                      <TableCell colSpan={3} className="bg-primary-blue-150 font-bold text-gray-900">
                        {row.label}
                      </TableCell>
                      <TableCell className="bg-primary-blue-150 text-right font-bold text-gray-900">{formatAmount(row.amount)}</TableCell>
                      <TableCell className="bg-primary-blue-150 text-right font-bold">{formatAmount(totalCost)}</TableCell>
                      <TableCell className="bg-primary-blue-150"></TableCell>
                    </>
                  )}
                </TableRow>
              ))}

              {/* Grand Total Type이 없다면 자동 생성 */}
              {!hasGrandTotal && (
                <TableRow className="whitespace-nowrap [&_td]:text-[13px]">
                  <TableCell colSpan={3} className="bg-primary-blue-150 font-bold text-gray-900">
                    Grand Total
                  </TableCell>

                  {/* 총 금액 */}
                  <TableCell className="bg-primary-blue-150 text-right font-bold text-gray-900">{formatAmount(totalAmount)}</TableCell>

                  {/* 총 예상 지출 */}
                  <TableCell className="bg-primary-blue-150 text-right font-bold text-gray-900">{formatAmount(totalCost)}</TableCell>

                  <TableCell className="bg-primary-blue-150"></TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="my-10 flex justify-center gap-2">
            <Button type="submit" className="min-w-[120px]">
              등록
            </Button>
            <Button type="button" variant="outline" className="min-w-[120px]" asChild>
              <Link to={`/project/${projectId}/estimate`}>취소</Link>
            </Button>
          </div>
        </div>

        {/* ---------------- 프로젝트 생성 다이얼로그 ---------------- */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>증빙 업로드 필요</DialogTitle>
              <DialogDescription>증빙 없이 견적서를 등록하려면 사유 작성해 주세요.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <Textarea ref={reasonRef} placeholder="증빙 누락 사유를 작성해 주세요" className="h-16 min-h-16" />
            </div>
            <DialogFooter className="justify-center">
              <Button type="button" onClick={handleReason}>
                작성
              </Button>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                취소
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </form>
    </>
  );
}
