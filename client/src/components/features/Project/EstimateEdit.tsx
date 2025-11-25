import * as React from 'react';
import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Link, useOutletContext, useNavigate, useParams } from 'react-router';
import { useForm, useFieldArray } from 'react-hook-form';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import type { ProjectLayoutContext } from '@/pages/Project/ProjectLayout';
import { getEstimateView, type EstimateViewDTO, type EstimateEditForm } from '@/api';
import { formatKST, formatAmount, displayUnitPrice } from '@/utils';

import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';
import { useAppDialog } from '@/components/common/ui/AppDialog/AppDialog';

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@components/ui/form';
import { Input } from '@components/ui/input';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Textarea } from '@components/ui/textarea';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableColumn, TableColumnHeader, TableColumnHeaderCell, TableColumnBody, TableColumnCell } from '@/components/ui/tableColumn';

import { Info, Trash, OctagonAlert, Paperclip, MessageSquareMore, ArrowUpDown } from 'lucide-react';

export default function EstimateEdit() {
  const navigate = useNavigate();
  const { estId, projectId } = useParams();

  const { addAlert } = useAppAlert();
  const { addDialog } = useAppDialog();

  const [loading, setLoading] = useState(true);

  const form = useForm<EstimateEditForm>({
    defaultValues: {
      header: {
        est_title: '',
      },
      items: [],
    },
  });

  const { control, reset, watch, setValue } = form;

  const { fields, append, remove, insert, move } = useFieldArray({
    control,
    name: 'items',
  });

  useEffect(() => {
    const load = async () => {
      const data = await getEstimateView(estId);

      console.log('Data', data);

      reset({
        header: {
          est_title: data.header.est_title ?? '',
        },
        items: data.items.map((row) => ({
          ei_type: row.ei_type,
          ei_name: row.ei_name ?? '',
          unit_price: row.unit_price ?? '',
          qty: row.qty ?? '',
          amount: row.amount ?? '',
          ava_amount: row.ava_amount ?? '',
          exp_cost: row.exp_cost ?? '',
          remark: row.remark ?? '',
          ei_order: row.ei_order ?? '',
        })),
      });
    };

    load();
  }, [estId, reset]);

  // Row DragEnd Event
  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (!over) return;
    if (active.id === over.id) return; // 같은 곳이면 이동 X

    const oldIndex = fields.findIndex((f) => f.id === active.id);
    const newIndex = fields.findIndex((f) => f.id === over.id);

    move(oldIndex, newIndex);
  };

  return (
    <>
      <div className="flex items-stretch justify-between">
        <div className="h-fit w-[74%] tracking-tight">
          <h2 className="mb-2 text-lg font-bold text-gray-800">견적서 정보</h2>
          <TableColumn className="[&_div]:text-[13px]">
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

        <div className="flex w-[24%] flex-col overflow-hidden">
          <h2 className="mb-2 shrink-0 text-lg font-bold text-gray-800">견적서 증빙</h2>
          <div className="flex h-full flex-1 flex-col overflow-y-auto">
            <ul className="space-y-4 px-1 pb-3">
              {/* {estData.evidences.map((e) =>
                e.ee_sname ? (
                  <li key={e.seq} className="text-base leading-[1.3] text-gray-800">
                    <div className="flex items-center gap-4">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-gray-300">
                        <Paperclip className="text-primary-blue size-4.5" />
                      </span>
                      <div className="flex flex-1 flex-col items-stretch overflow-hidden">
                        <a
                          href={`${import.meta.env.VITE_API_ORIGIN}/uploads/est_evidence/${e.ee_sname}`}
                          target="_blank"
                          download={e.ee_fname}
                          className="block overflow-hidden text-ellipsis whitespace-nowrap hover:underline">
                          {e.ee_fname}
                        </a>
                        <span className="block text-[.88em] text-gray-500">
                          {e.user_nm} · {formatKST(e.uploaded_at)}
                        </span>
                      </div>
                    </div>
                  </li>
                ) : (
                  <li key={e.seq} className="text-base leading-[1.3] text-gray-800">
                    <div className="flex items-center gap-4">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-gray-300">
                        <MessageSquareMore className="text-primary-blue size-4.5" />
                      </span>
                      <div className="flex flex-1 flex-col items-stretch overflow-hidden">
                        <p>{e.remark}</p>
                        <span className="block text-[.88em] text-gray-500">
                          {e.user_nm} · {formatKST(e.uploaded_at)}
                        </span>
                      </div>
                    </div>
                  </li>
                )
              )} */}
            </ul>
          </div>
        </div>
      </div>

      {/* ------------------------------- */}
      {/*      견적서 항목 렌더링        */}
      {/* ------------------------------- */}
      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">견적서 항목</h2>
          <div className="flex gap-2">
            <Button type="button" size="sm">
              항목 추가
            </Button>
          </div>
        </div>
        <Table variant="primary" align="center" className="table-fixed">
          <TableHeader>
            <TableRow className="[&_th]:text-[13px] [&_th]:font-medium">
              <TableHead className="w-8 px-0"></TableHead>
              <TableHead className="pl-1 text-left">항목명</TableHead>
              <TableHead className="w-[10%]">단가</TableHead>
              <TableHead className="w-[8%]">수량</TableHead>
              <TableHead className="w-[10%]">금액</TableHead>
              <TableHead className="w-[10%]">가용 금액</TableHead>
              <TableHead className="w-[10%]">
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
              <TableHead className="w-[24%]">비고</TableHead>
              <TableHead className="w-8 px-0"></TableHead>
            </TableRow>
          </TableHeader>
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <TableBody>
              {fields.map((field, idx) => (
                <TableRow id={field.id} key={field.id}>
                  {/* ------------------------ */}
                  {/* 일반 Title Row */}
                  {/* ------------------------ */}
                  {field.ei_type === 'title' && (
                    <>
                      <TableCell className="px-0" data-drag-handle>
                        <Button variant="svgIcon" size="icon" className="size-5 align-middle">
                          <ArrowUpDown className="size-4" />
                        </Button>
                      </TableCell>
                      <TableCell className="pl-1">
                        <Input className="h-9 font-bold" {...form.register(`items.${idx}.ei_name`)} />
                      </TableCell>
                      <TableCell colSpan={6}></TableCell>
                      <TableCell className="px-0">
                        <Button variant="svgIcon" size="icon" className="size-5 align-middle" onClick={() => remove(idx)}>
                          <Trash className="size-4" />
                        </Button>
                      </TableCell>
                    </>
                  )}

                  {/* ------------------------ */}
                  {/* 일반 Title Row */}
                  {/* ------------------------ */}
                  {/* item row */}
                  {field.ei_type === 'item' && (
                    <>
                      {/* Drag Button */}
                      <TableCell className="px-0" data-drag-handle>
                        <Button variant="svgIcon" size="icon" className="size-5 align-middle">
                          <ArrowUpDown className="size-4" />
                        </Button>
                      </TableCell>

                      {/* 항목명 */}
                      <TableCell className="pl-1">
                        <FormField
                          control={control}
                          name={`items.${idx}.ei_name`}
                          render={({ field }) => <Input className="h-9" {...field} />}
                        />
                      </TableCell>

                      {/* 단가 */}
                      <TableCell>
                        <FormField
                          control={control}
                          name={`items.${idx}.unit_price`}
                          render={({ field }) => (
                            <Input
                              className="h-9 text-right"
                              value={field.value ? formatAmount(field.value) : ''}
                              onChange={(e) => {
                                const raw = e.target.value.replace(/[^\d]/g, '');
                                const num = Number(raw || 0);

                                field.onChange(num);

                                // qty 불러오기
                                const qty = form.getValues(`items.${idx}.qty`) || 0;
                                const amount = Number(num) * Number(qty);

                                form.setValue(`items.${idx}.amount`, amount, {
                                  shouldDirty: true,
                                  shouldValidate: false,
                                });
                              }}
                            />
                          )}
                        />
                      </TableCell>

                      {/* 수량 */}
                      <TableCell>
                        <FormField
                          control={control}
                          name={`items.${idx}.qty`}
                          render={({ field }) => (
                            <Input
                              className="h-9 text-right"
                              value={field.value ?? ''}
                              onChange={(e) => {
                                let raw = e.target.value.replace(/[^0-9.]/g, '');
                                raw = raw.replace(/(\..*)\./g, '$1'); // 소수점 1개 허용

                                const num = raw === '' ? 0 : Number(raw);
                                field.onChange(num);

                                // unit_price 불러오기
                                const price = form.getValues(`items.${idx}.unit_price`) || 0;
                                const amount = Number(price) * Number(num);

                                form.setValue(`items.${idx}.amount`, amount, {
                                  shouldDirty: true,
                                  shouldValidate: false,
                                });
                              }}
                            />
                          )}
                        />
                      </TableCell>

                      {/* 금액 */}
                      <TableCell>
                        <FormField
                          control={control}
                          name={`items.${idx}.amount`}
                          render={({ field }) => <Input className="h-9 text-right" readOnly value={formatAmount(field.value ?? 0)} />}
                        />
                      </TableCell>

                      {/* 가용 금액 */}
                      <TableCell className="text-right">{watch(`items.${idx}.ava_amount`)}</TableCell>

                      {/* 예상 지출 금액 */}
                      <TableCell>
                        <FormField
                          control={control}
                          name={`items.${idx}.exp_cost`}
                          render={({ field }) => <Input className="h-9 text-right" {...field} />}
                        />
                      </TableCell>

                      {/* 비고 */}
                      <TableCell>
                        <FormField
                          control={control}
                          name={`items.${idx}.remark`}
                          render={({ field }) => <Input className="h-9" {...field} />}
                        />
                      </TableCell>

                      {/* 삭제 버튼 */}
                      <TableCell className="px-0">
                        <Button variant="svgIcon" size="icon" className="size-5 align-middle" onClick={() => remove(idx)}>
                          <Trash className="size-4" />
                        </Button>
                      </TableCell>
                    </>
                  )}

                  {/* ------------------------ */}
                  {/* Sub Total Row */}
                  {/* ------------------------ */}
                  {field.ei_type === 'subtotal' && (
                    <>
                      <TableCell className="bg-gray-100 px-0" data-drag-handle>
                        <Button variant="svgIcon" size="icon" className="size-5 align-middle">
                          <ArrowUpDown className="size-4" />
                        </Button>
                      </TableCell>
                      <TableCell className="bg-gray-100 pl-1 font-semibold" colSpan={3}>
                        Sub Total
                      </TableCell>
                      <TableCell className="bg-gray-100 text-right font-semibold">{watch(`items.${idx}.amount`)}</TableCell>
                      <TableCell colSpan={3} className="bg-gray-100"></TableCell>
                      <TableCell className="bg-gray-100 px-0">
                        <Button variant="svgIcon" size="icon" className="size-5 align-middle" onClick={() => remove(idx)}>
                          <Trash className="size-4" />
                        </Button>
                      </TableCell>
                    </>
                  )}

                  {/* ------------------------ */}
                  {/* Agency Fee Row */}
                  {/* ------------------------ */}
                  {field.ei_type === 'agency_fee' && (
                    <>
                      <TableCell className="px-0">
                        <Button variant="svgIcon" size="icon" className="size-5 align-middle" onClick={() => remove(idx)}>
                          <ArrowUpDown className="size-4" />
                        </Button>
                      </TableCell>
                      <TableCell className="pl-1">
                        <Input className="h-9" {...form.register(`items.${idx}.ei_name`)} />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="text"
                          className="h-9 text-right"
                          {...form.register(`items.${idx}.unit_price`, {
                            valueAsNumber: true,
                          })}
                        />
                      </TableCell>
                      <TableCell></TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="text"
                          className="h-9 text-right"
                          {...form.register(`items.${idx}.amount`, {
                            valueAsNumber: true,
                          })}
                          readOnly
                        />
                      </TableCell>
                      <TableCell className="text-right">{watch(`items.${idx}.ava_amount`)}</TableCell>
                      <TableCell>
                        <Input className="h-9 text-right" {...form.register(`items.${idx}.exp_cost`)} />
                      </TableCell>
                      <TableCell>
                        <Input className="h-9" {...form.register(`items.${idx}.remark`)} />
                      </TableCell>
                      <TableCell className="px-0">
                        <Button variant="svgIcon" size="icon" className="size-5 align-middle" onClick={() => remove(idx)}>
                          <Trash className="size-4" />
                        </Button>
                      </TableCell>
                    </>
                  )}

                  {/* ------------------------ */}
                  {/* Discount Row */}
                  {/* ------------------------ */}
                  {field.ei_type === 'discount' && (
                    <>
                      <TableCell className="bg-gray-300 px-0" data-drag-handle>
                        <Button variant="svgIcon" size="icon" className="size-5 align-middle">
                          <ArrowUpDown className="size-4" />
                        </Button>
                      </TableCell>
                      <TableCell className="bg-gray-300 pl-1 font-semibold" colSpan={3}>
                        Discount
                      </TableCell>
                      <TableCell className="bg-gray-300 text-right">
                        <Input
                          type="text"
                          className="h-9 text-right"
                          {...form.register(`items.${idx}.amount`, {
                            valueAsNumber: true,
                          })}
                          readOnly
                        />
                      </TableCell>
                      <TableCell colSpan={2} className="bg-gray-300"></TableCell>
                      <TableCell className="bg-gray-300">
                        <Input className="h-9" {...form.register(`items.${idx}.remark`)} />
                      </TableCell>
                      <TableCell className="bg-gray-300 px-0">
                        <Button variant="svgIcon" size="icon" className="size-5 align-middle" onClick={() => remove(idx)}>
                          <Trash className="size-4" />
                        </Button>
                      </TableCell>
                    </>
                  )}

                  {/* ------------------------ */}
                  {/* Grand Total Row */}
                  {/* ------------------------ */}
                  {field.ei_type === 'grandtotal' && (
                    <>
                      <TableCell className="bg-primary-blue-150 px-0"></TableCell>
                      <TableCell className="bg-primary-blue-150 pl-1 font-semibold" colSpan={3}>
                        Grand Total
                      </TableCell>
                      <TableCell className="bg-primary-blue-150 text-right font-semibold">{watch(`items.${idx}.amount`)}</TableCell>
                      <TableCell className="bg-primary-blue-150"></TableCell>
                      <TableCell className="bg-primary-blue-150 text-right font-semibold">555,000</TableCell>
                      <TableCell className="bg-primary-blue-150" colSpan={2}></TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </DndContext>
        </Table>
        <div className="my-10 flex justify-center gap-2">
          <Button type="submit" className="min-w-[120px]">
            수정
          </Button>
          <Button type="button" variant="outline" className="min-w-[120px]" asChild>
            <Link to={`/project/${projectId}/estimate/${estId}`}>취소</Link>
          </Button>
        </div>
      </div>
    </>
  );
}
