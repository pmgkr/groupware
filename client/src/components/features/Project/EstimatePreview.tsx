import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate, useOutletContext, useParams } from 'react-router';
import { useForm, useFieldArray } from 'react-hook-form';
import { useUser } from '@/hooks/useUser';
import { mapExcelToQuotationItems } from '@/utils';
import { formatAmount, displayUnitPrice } from '@/utils';
import type { ProjectLayoutContext } from '@/pages/Project/ProjectLayout';

import { type QuotationMappedItem } from '@/types/estimate';
import EstimateEvidence from './_components/EstimateEvidence';
import type { PreviewFile } from './_components/EstimateEvidence';

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
  const { projectId } = useParams();
  const { user_name } = useUser();
  const { registerType, excelData, estName, excelFile } = location.state;
  const { data } = useOutletContext<ProjectLayoutContext>();

  console.log('excelData', excelData);

  // Alert & Dialog hooks
  const { addAlert } = useAppAlert();
  const { addDialog } = useAppDialog();

  const [estimateName, setEstimateName] = useState(estName ?? '');
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false); // 증빙자료 없이 등록하는 경우, 증빙사유 작성을 위한 Dialog State
  const [evidenceFiles, setEvidenceFiles] = useState<PreviewFile[]>([]); // 증빙자료 파일에 대한 State
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

  console.log('fields', fields);

  // --------------------------
  // 2) Excel 매핑하여 row 생성
  // --------------------------
  useEffect(() => {
    if (excelData && Array.isArray(excelData)) {
      const mapped = mapExcelToQuotationItems(excelData);

      if (mapped.length > 0) {
        replace(mapped);

        // form 데이터에도 반영
        form.reset({
          estimate_items: mapped,
        });
      }
    }
  }, [excelData]);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  const registerEstimate = async (v: any, reason?: string) => {
    try {
      console.log(v.estimate_items);

      if (evidenceFiles.length === 0) {
        setDialogOpen(true);
        return;
      }

      // 증빙자료가 있다면 form 데이터 빈 게 있는 지 체크 est_title 빈 값이 아닌 지

      const enrichedItems = v.estimate_items.map((item: any) => ({
        ...item,
      }));

      const payload = {
        header: {
          project_id: projectId,
          est_title: estimateName,
          user_nm: user_name,
          est_valid: registerType, // 신규 견적서 Y, 추가 견적서 S
        },
        body: enrichedItems.map((i: any, idx: number) => ({
          ei_type: i.type,
          ei_name: i.item,
          unit_price: i.unit_price ?? null,
          qty: i.qty ?? null,
          amount: i.amount ?? null,
          exp_cost: i.cost ?? null,
          remarks: i.remarks ?? null,
          ei_order: idx,
        })),
      };

      console.log(payload);
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
    if (evidenceFiles.length === 0) {
      setDialogOpen(true);
      return;
    }

    // 2) 증빙자료 있거나, 사유가 있다면 → 실제 등록
    registerEstimate(v);
  };

  return (
    <>
      <form onSubmit={form.handleSubmit(handleFormSubmit)}>
        <div className="flex flex-wrap justify-between">
          <div className="w-[74%] tracking-tight">
            <h2 className="mb-2 text-lg font-bold text-gray-800">견적서 정보</h2>
            <TableColumn>
              <TableColumnHeader className="w-[15%]">
                <TableColumnHeaderCell>프로젝트 #</TableColumnHeaderCell>
              </TableColumnHeader>
              <TableColumnBody>
                <TableColumnCell>{data.project_id}</TableColumnCell>
              </TableColumnBody>
              <TableColumnHeader className="w-[15%]">
                <TableColumnHeaderCell>클라이언트</TableColumnHeaderCell>
              </TableColumnHeader>
              <TableColumnBody>
                <TableColumnCell>{data.client_nm}</TableColumnCell>
              </TableColumnBody>
            </TableColumn>

            <TableColumn className="border-t-0">
              <TableColumnHeader className="w-[15%]">
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
            <h2 className="mb-2 text-lg font-bold text-gray-800">견적서 증빙</h2>
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
                <TableRow key={row.id} className="whitespace-nowrap [&_td]:text-[13px]">
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
                        <Input
                          type="text"
                          size="sm"
                          className="h-7 rounded-sm text-right"
                          {...form.register(`estimate_items.${index}.cost`, {
                            valueAsNumber: true,
                          })}
                        />
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
                  {/* Grand Total Row */}
                  {/* ------------------------ */}
                  {row.type === 'grandtotal' && (
                    <>
                      <TableCell colSpan={3} className="bg-primary-blue-150 font-bold text-gray-900">
                        {row.label}
                      </TableCell>
                      <TableCell className="bg-primary-blue-150 text-right font-bold text-gray-900">{formatAmount(row.amount)}</TableCell>
                      <TableCell colSpan={2} className="bg-primary-blue-150"></TableCell>
                    </>
                  )}
                </TableRow>
              ))}
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
              <Button
                type="button"
                onClick={() => {
                  const reason = reasonRef.current?.value.trim() ?? '';

                  if (!reason) {
                    addAlert({
                      title: '사유 입력 필요',
                      message: '증빙 없이 등록하려면 사유를 입력하세요.',
                      duration: 1500,
                    });
                    return;
                  }

                  console.log(reason);

                  setDialogOpen(false);
                  // RHF에 저장된 현재 values 불러오기
                  const values = form.getValues();

                  // 사유 전달
                  registerEstimate(values, reason);
                }}>
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
