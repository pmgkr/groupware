import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Link, useOutletContext, useNavigate, useParams } from 'react-router';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import isEqual from 'lodash.isequal';
import { useUser } from '@/hooks/useUser';
import { calcAll } from './utils/calc';
import { formatAmount } from '@/utils';
import EstimateEvidence from './_components/EstimateEvidence';
import type { PreviewFile } from './_components/EstimateEvidence';
import { EstimateRow } from './_components/EstimateRow';

import type { ProjectLayoutContext } from '@/pages/Project/ProjectLayout';
import { getEstimateView, type EstimateEditForm, uploadFilesToServer, estimateEdit } from '@/api';
import { Sortable, SortableContent, SortableItem, SortableItemHandle, SortableOverlay } from '@/components/ui/sortable';

import { buildResultMessage } from './utils/message';

import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';
import { useAppDialog } from '@/components/common/ui/AppDialog/AppDialog';

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@components/ui/form';
import { Input } from '@components/ui/input';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Textarea } from '@components/ui/textarea';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { TableColumn, TableColumnHeader, TableColumnHeaderCell, TableColumnBody, TableColumnCell } from '@/components/ui/tableColumn';

import { Info, Trash, OctagonAlert, GripVertical, Ellipsis, ArrowUp, ArrowDown, X } from 'lucide-react';

export default function EstimateEdit() {
  const navigate = useNavigate();
  const { user_id, user_name } = useUser();
  const { estId, projectId } = useParams();
  const { data } = useOutletContext<ProjectLayoutContext>();
  const { addAlert } = useAppAlert();
  const { addDialog } = useAppDialog();

  // File State
  const [dialogOpen, setDialogOpen] = useState(false); // 증빙자료 없이 등록하는 경우, 증빙사유 작성을 위한 Dialog State
  const [evidenceFiles, setEvidenceFiles] = useState<PreviewFile[]>([]); // 증빙자료 파일에 대한 State
  const [evidenceReason, setEvidenceReason] = useState<string | null>(null); // 증빙자료 사유 저장용 State
  const reasonRef = useRef<HTMLTextAreaElement | null>(null); // 증빙자료 사유에 대한 ref

  const [rowAddDialogOpen, setRowAddDialogOpen] = useState(false); // Row 생성 시 Dialog State
  const [rowAddTarget, setRowAddTarget] = useState<{ dir: 'up' | 'down'; idx: number } | null>(null);

  const [removedItems, setRemovedItems] = useState<number[]>([]); // 삭제된 항목 배열 State
  const [reordered, setReordered] = useState(false);

  // ----------------------------------------
  // RHF 초기화
  // ----------------------------------------
  const form = useForm<EstimateEditForm>({
    defaultValues: {
      header: {
        est_title: '',
      },
      items: [],
      removed_seq: [],
      evidences: [],
    },
  });

  const { control, reset, watch, setValue } = form;
  const { fields, append, remove, insert, move } = useFieldArray({
    control,
    name: 'items',
  });

  // 초기 reset 시 RawData 저장
  const initialItemsRef = useRef<EstimateEditForm['items']>([]);

  // ----------------------------------------
  // 데이터 로드
  // ----------------------------------------
  useEffect(() => {
    const load = async () => {
      const res = await getEstimateView(estId);

      reset({
        header: {
          est_title: res.header.est_title ?? '',
        },
        items: res.items.map((row) => ({
          seq: row.seq,
          ei_type: row.ei_type,
          ei_name: row.ei_type === 'agency_fee' ? row.ei_name || 'Agency Fee' : row.ei_name || '',
          unit_price: row.unit_price ?? '',
          qty: row.qty ?? '',
          amount: row.amount ?? '',
          ava_amount: row.ava_amount ?? '',
          exp_cost: row.exp_cost ?? '',
          remark: row.remark ?? '',
          ei_order: row.ei_order ?? '',
        })),
      });

      const init = res.items.map((row) => ({
        seq: row.seq,
        ei_type: row.ei_type,
        ei_name: row.ei_name,
        unit_price: row.unit_price ?? '',
        qty: row.qty ?? '',
        amount: row.amount ?? '',
        ava_amount: row.ava_amount,
        exp_cost: row.exp_cost,
        remark: row.remark,
        ei_order: row.ei_order,
      }));

      initialItemsRef.current = structuredClone(init);
    };

    load();
  }, [estId, reset]);

  // ----------------------------------------
  // Row 추가/삭제
  // ----------------------------------------
  const handleRowAdd = (dir: 'up' | 'down', idx: number) => {
    setRowAddTarget({ dir, idx });
    setRowAddDialogOpen(true);
  };

  const createRow = (type: string, insertIndex: number) => {
    const base = {
      ei_type: type,
      ei_name: type === 'agency_fee' ? 'Agency Fee' : '',
      unit_price: '',
      qty: '',
      amount: '',
      ava_amount: '',
      exp_cost: '',
      remark: '',
      ei_order: insertIndex,
    };

    insert(insertIndex, base);
    setValue(`items.${insertIndex}`, base, { shouldDirty: false });

    updateRowAll();
  };

  const handleRemoveRow = (idx: number) => {
    addDialog({
      title: '견적서 항목 삭제',
      message: '선택한 견적서 항목을 삭제하시겠습니까?',
      confirmText: '삭제',
      cancelText: '취소',
      onConfirm: () => {
        const row = form.getValues(`items.${idx}`);
        if (typeof row.seq === 'number') {
          setRemovedItems((prev) => [...prev, row.seq as number]);
        }
        remove(idx);

        updateRowAll();
      },
    });
  };

  const updateRowAll = () => {
    const items = form.getValues('items');
    const updated = calcAll(structuredClone(items));

    updated.forEach((row, i) => {
      const needUpdate = reordered || !isEqual(items[i], row); // 값이 달라졌으면 업데이트

      if (needUpdate) {
        setValue(`items.${i}.amount`, row.amount, {
          shouldDirty: false,
          shouldValidate: false,
        });
        setValue(`items.${i}.exp_cost`, row.exp_cost, {
          shouldDirty: false,
          shouldValidate: false,
        });
      }
    });
  };

  // --------------------------
  // Dialog content 템플릿
  // --------------------------
  const buildDialogContent = (v: EstimateEditForm, reason?: string) => {
    const grand = v.items.find((item) => item.ei_type === 'grandtotal');

    const totalAmount = grand ? formatAmount(grand.amount ?? 0) : '-';
    const totalExpCost = grand ? formatAmount(grand.exp_cost ?? 0) : '-';

    return `<ul class="text-base text-gray-700
      [&>li]:flex [&>li]:leading-[1.4] space-y-1 [&>li]:gap-x-1.5 [&>li]:items-start [&_span::before]:content-[''] [&_span]:flex [&_span]:items-center [&_span]:gap-1.5
      [&_span]:shrink-0 [&_p]:flex-1 [&_span::before]:h-1 [&_span::before]:w-1
      [&_span::before]:rounded-full [&_span::before]:bg-gray-700 [&_p]:break-all [&_p]:leading-[1.3]
      ">
      <li><span>견적서 제목 :</span> <p>${v.header.est_title}</p></li>
      <li><span>견적서 합계 :</span> <p>${totalAmount}</p></li>
      <li><span>예상 지출 합계 :</span> <p>${totalExpCost}</p></li>
      ${reason ? `<li><span>증빙 사유 :</span> <p>${reason}</p></li>` : ''}
    </ul>
  `;
  };

  const buildEstimatePayload = async (v: EstimateEditForm, reason?: string) => {
    // 1) Header
    const header = {
      project_id: projectId,
      est_title: v.header.est_title,
      user_id: user_id,
      user_nm: user_name,
    };

    // 2) Items (edit / insert 통합)
    const items = v.items.map((item, idx) => ({
      seq: item.seq ?? null, // 기존 데이터는 seq 존재, 신규는 null로 전달
      ei_type: item.ei_type,
      ei_name: item.ei_name,
      unit_price: Number(item.unit_price) || 0,
      qty: Number(item.qty) || 0,
      amount: Number(item.amount) || 0,
      exp_cost: Number(item.exp_cost) || 0,
      ava_amount: Number(item.ava_amount) || 0,
      remark: item.remark || '',
      ei_order: idx, // 현재 화면상의 순서가 그대로 order
    }));

    // 3) evidences 증빙자료
    let evidences: any[] = [];

    if (evidenceFiles.length > 0) {
      // File 객체만 추출
      const onlyFiles = evidenceFiles.map((f) => f.file ?? f);
      const uploaded = await uploadFilesToServer(onlyFiles, 'est_evidence');

      console.log('✅ 업로드 완료:', uploaded);

      // 업로드 성공 후 evidenceItems 구성
      evidences = uploaded.map((f: any, idx: number) => {
        const file = onlyFiles[idx];

        return {
          ee_fname: f.fname,
          ee_sname: f.url,
          ee_size: file.size,
          ee_type: file.type,
        };
      });
    } else {
      // 증빙자료 없음으면 사유 저장
      evidences = [{ remark: reason ?? '' }];
    }

    // 4) removed_seq — useFieldArray remove 시 기록한 배열
    const removed_seq = removedItems; // 너가 관리하던 removedItems 배열

    return {
      header,
      items,
      removed_seq,
      evidences,
    };
  };

  const handleUpdate = async (v: EstimateEditForm, reason?: string) => {
    if (!v.header.est_title || v.header.est_title.trim() === '') {
      return addAlert({
        title: '견적서 수정 실패',
        message: '견적서 제목을 입력해 주세요.',
        icon: <OctagonAlert />,
        duration: 1500,
      });
    }

    addDialog({
      title: '견적서 수정',
      message: `수정한 견적서를 등록합니다.`,
      content: buildDialogContent(v, reason),
      confirmText: '등록',
      cancelText: '취소',
      onConfirm: async () => {
        const payload = await buildEstimatePayload(v, reason);

        console.log('최종 payload:', payload);
        const result = await estimateEdit(estId, payload);

        if (result && typeof result.est_id === 'number') {
          console.log('✅ 견적서 수정 완료 리턴값 :', result);

          const insertData = result.inserted_items.length;
          const deleteData = result.deleted_items.length;
          const updateData = result.updated_items.length;

          const parts = [];
          const message = buildResultMessage(insertData, deleteData, updateData);

          if (message[0]) parts.push(message[0]);
          if (message[1]) parts.push(message[1]);
          if (message[2]) parts.push(message[2]);

          if (parts.length > 0) {
            addAlert({
              title: '견적서 수정이 완료되었습니다.',
              message: `<p className="break-keep">총 ${parts.join(',')} 되었습니다.</p>`,
              icon: <OctagonAlert />,
              duration: 2000,
            });
          }

          navigate(`/project/${projectId}/estimate/${estId}`);
        } else {
          addAlert({
            title: '견적서 수정 실패',
            message: `<p>서버 응답이 올바르지 않습니다.</p>`,
            icon: <OctagonAlert />,
            duration: 2000,
          });

          return;
        }
      },
    });
  };

  const handleFormSubmit = (v: EstimateEditForm) => {
    // 1) 증빙 없는 경우 → 사유 입력 dialog 열기
    if (evidenceFiles.length === 0 && !evidenceReason) {
      setDialogOpen(true);
      return;
    }

    // 2) 증빙이 있으면 submit 진행
    handleUpdate(v);
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
    handleUpdate(values, reason);
  };

  return (
    <>
      <form onSubmit={form.handleSubmit(handleFormSubmit)}>
        <div className="flex items-stretch justify-between">
          <div className="h-fit w-[74%] tracking-tight">
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
                <TableColumnHeaderCell>견적서 제목</TableColumnHeaderCell>
              </TableColumnHeader>
              <TableColumnBody>
                <TableColumnCell className="leading-[1.3]">
                  <Input {...form.register('header.est_title')} className="h-full border-0 p-0 shadow-none" />
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
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">견적서 항목</h2>
          </div>
          <Sortable
            value={fields.map((f) => f.id)}
            getItemValue={(id) => id}
            onMove={({ activeIndex, overIndex }) => {
              if (activeIndex !== overIndex) {
                move(activeIndex, overIndex);
                setReordered(true);
              }
              updateRowAll();
            }}>
            <Table variant="primary" align="center" className="table-fixed">
              <TableHeader>
                <TableRow className="[&_th]:text-[13px] [&_th]:font-medium">
                  <TableHead className="w-8 px-0"></TableHead>
                  <TableHead className="pr-4 pl-1 text-left">항목명</TableHead>
                  <TableHead className="w-[12%] px-4">단가</TableHead>
                  <TableHead className="w-[8%] px-4">수량</TableHead>
                  <TableHead className="w-[12%] px-4">금액</TableHead>
                  <TableHead className="w-[10%] px-4">가용 금액</TableHead>
                  <TableHead className="w-[10%] px-4">
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
                  <TableHead className="w-[22%]">비고</TableHead>
                  <TableHead className="w-8 px-0"></TableHead>
                </TableRow>
              </TableHeader>
              <SortableContent asChild>
                <TableBody>
                  {fields.map((field, idx) => (
                    <SortableItem key={field.id} value={field.id} asChild>
                      <TableRow className="[&_input]:h-8.5 [&_input]:text-[13px] [&_td]:px-4 [&_td]:text-[13px]">
                        <EstimateRow
                          field={field}
                          idx={idx}
                          control={control}
                          watch={watch}
                          setValue={setValue}
                          onAddRow={handleRowAdd}
                          onRemoveRow={handleRemoveRow}
                          updateRowAll={updateRowAll}
                          initialItems={initialItemsRef.current}
                        />
                      </TableRow>
                    </SortableItem>
                  ))}
                </TableBody>
              </SortableContent>
            </Table>
            <SortableOverlay>
              <div className="bg-primary/10 size-full rounded-none" />
            </SortableOverlay>
          </Sortable>

          <div className="my-10 flex justify-center gap-2">
            <Button type="submit" className="min-w-[120px]">
              수정
            </Button>
            <Button type="button" variant="outline" className="min-w-[120px]" asChild>
              <Link to={`/project/${projectId}/estimate/${estId}`}>취소</Link>
            </Button>
          </div>
        </div>

        {/* ---------------- 항목 생성 다이얼로그 ---------------- */}
        <Dialog open={rowAddDialogOpen} onOpenChange={setRowAddDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>견적서 항목 추가</DialogTitle>
              <DialogDescription>추가할 항목 타입을 선택해주세요.</DialogDescription>
            </DialogHeader>

            <div className="mb-2 flex flex-wrap gap-2">
              {[
                { value: 'title', label: '제목 (Title)' },
                { value: 'item', label: '일반 항목 (Item)' },
                { value: 'subtotal', label: '소계 (Subtotal)' },
                { value: 'discount', label: '할인 (Discount)' },
                { value: 'agency_fee', label: '수수료 (Agency Fee)' },
              ].map((t) => (
                <Button
                  key={t.value}
                  variant="outline"
                  className="focus-visible:border-input flex-1"
                  onClick={() => {
                    if (!rowAddTarget) return;
                    const insertIndex = rowAddTarget.dir === 'up' ? rowAddTarget.idx : rowAddTarget.idx + 1;
                    createRow(t.value, insertIndex);

                    setRowAddDialogOpen(false);
                  }}>
                  {t.label}
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* ---------------- 증빙 사유 다이얼로그 ---------------- */}
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
