// src/components/features/Expense/_components/ExpenseRegisterRow.tsx
import { useEffect, useState, useCallback, memo } from 'react';
import type { Control, UseFormGetValues, UseFormSetValue } from 'react-hook-form';
import { useToggleState } from '@/hooks/useToggleState';
import { cn } from '@/lib/utils';
import { formatAmount, formatKST } from '@/utils';
import { format } from 'date-fns';

import { getProposalList, type ProposalItem } from '@/api/expense/proposal';
import { AttachmentField } from './AttachmentField';
import type { PreviewFile } from './UploadArea';

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@components/ui/form';
import { Input } from '@components/ui/input';
import { Button } from '@components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@components/ui/popover';
import { SearchableSelect, type SingleSelectOption } from '@components/ui/SearchableSelect';
import { DayPicker } from '@components/daypicker';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Close } from '@/assets/images/icons';
import { FileText } from 'lucide-react';

type ExpenseRowProps = {
  index: number;
  control: Control<any>;
  getValues: UseFormGetValues<any>;
  setValue: UseFormSetValue<any>;
  expenseTypes: SingleSelectOption[];
  onRemove: (index: number) => void;
  handleDropFiles: (files: PreviewFile[], fieldName: string, rowIndex: number | null) => void;
  handleAttachUpload: (files: PreviewFile[], rowIndex: number | null) => void;
  files: PreviewFile[];
  activeFile: string | null;
  setActiveFile: (id: string | null) => void;
  onSelectProposal?: (selectedProposalId: Number) => void;
  onTotalChange: () => void;
};

function ExpenseRowComponent({
  index,
  control,
  getValues,
  setValue,
  expenseTypes,
  onRemove,
  handleDropFiles,
  handleAttachUpload,
  files,
  activeFile,
  setActiveFile,
  onSelectProposal,
  onTotalChange,
}: ExpenseRowProps) {
  const formatDate = (d?: Date) => (d ? format(d, 'yyyy-MM-dd') : '');

  // 로컬 상태 (핵심)
  const [price, setPrice] = useState('');
  const [tax, setTax] = useState('');

  // 초기값 동기화 (excel / reset 대응)
  useEffect(() => {
    setPrice(getValues(`expense_items.${index}.price`) || '');
    setTax(getValues(`expense_items.${index}.tax`) || '');
  }, [index]);

  const syncTotal = (nextPrice: string, nextTax: string) => {
    const total = Number(nextPrice || 0) + Number(nextTax || 0);
    setValue(`expense_items.${index}.total`, total.toString(), {
      shouldDirty: true,
      shouldValidate: false,
    });
  };

  const [isDialogOpen, setDialogOpen] = useState(false);
  const [proposalList, setProposalList] = useState<ProposalItem[]>([]);
  const [selectedProposalId, setSelectedProposalId] = useState<number | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<ProposalItem | null>(null);

  const handleOpenMatchingDialog = async () => {
    setDialogOpen(true);

    const flag = 'N';

    try {
      // 응답 구조: { success: boolean, items: ProposalItem[] }
      const res = await getProposalList(flag);

      const proposals = res.items ?? [];

      const filtered = proposals.filter((p) => ['일반비용', '교육비'].includes(p.rp_category) && !p.rp_expense_no);

      setProposalList(filtered);
    } catch (err) {
      console.error('기안서 리스트 불러오기 실패:', err);
    }
  };

  const hasProposalList = proposalList.length === 0;

  return (
    <article className="relative border-b border-gray-300 px-2 pt-10 pb-8 last-of-type:border-b-0">
      {/* 상단 영역 */}
      <div className="absolute top-1 left-0 flex w-full items-center justify-between gap-2 pl-[68%]">
        <button
          type="button"
          className="text-primary-blue-500 flex cursor-pointer items-center gap-1 text-sm hover:underline"
          onClick={() => {
            setActiveFile(String(index));
            handleOpenMatchingDialog();
          }}>
          <FileText className="size-3.5" />
          {selectedProposal ? `${selectedProposal.rp_title}` : '기안서 매칭'}
        </button>
        <Button type="button" variant="svgIcon" size="icon" onClick={() => onRemove(index)}>
          <Close className="size-4" />
        </Button>
      </div>

      <div className="flex justify-between">
        {/* 왼쪽 입력필드 그룹 */}
        <div className="grid w-[66%] grid-cols-3 gap-4 tracking-tight">
          {/* 비용 유형 */}
          <FormField
            control={control}
            name={`expense_items.${index}.type`}
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="font-bold text-gray-950">비용 유형</FormLabel>
                <FormControl>
                  <SearchableSelect
                    placeholder="비용 유형 선택"
                    options={expenseTypes}
                    value={field.value}
                    onChange={field.onChange}
                    invalid={fieldState.invalid}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 가맹점명 */}
          <FormField
            control={control}
            name={`expense_items.${index}.title`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold text-gray-950">가맹점명</FormLabel>
                <FormControl>
                  <Input placeholder="가맹점명" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 매입일자 */}
          <FormField
            control={control}
            name={`expense_items.${index}.date`}
            render={({ field }) => {
              const { isOpen, setIsOpen, close } = useToggleState();
              return (
                <FormItem>
                  <FormLabel className="font-bold text-gray-950">매입 일자</FormLabel>
                  <Popover open={isOpen} onOpenChange={setIsOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'border-input focus-visible:border-primary-blue-300 h-11 w-full px-3 text-left text-base font-normal text-gray-700 hover:bg-[none]',
                            !field.value && 'text-muted-foreground hover:text-muted-foreground'
                          )}>
                          {field.value || 'YYYY-MM-DD'}
                          <Calendar className="ml-auto size-4.5 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <DayPicker
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => {
                          const formatted = date ? formatDate(date) : '';
                          field.onChange(formatted);
                          if (date) close();
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          {/* 금액 */}
          <FormField
            control={control}
            name={`expense_items.${index}.price`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold text-gray-950">금액</FormLabel>
                <FormControl>
                  <Input
                    inputMode="numeric"
                    placeholder="금액"
                    value={price ? formatAmount(price) : ''}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9-]/g, '');
                      setPrice(raw);
                    }}
                    onBlur={() => {
                      setValue(`expense_items.${index}.price`, price, {
                        shouldDirty: true,
                        shouldValidate: false,
                      });
                      syncTotal(price, tax);
                      onTotalChange?.();
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 세금 */}
          <FormField
            control={control}
            name={`expense_items.${index}.tax`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold text-gray-950">세금</FormLabel>
                <FormControl>
                  <Input
                    inputMode="numeric"
                    placeholder="세금"
                    value={tax ? formatAmount(tax) : ''}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, '');
                      setTax(raw);
                    }}
                    onBlur={() => {
                      setValue(`expense_items.${index}.tax`, tax, {
                        shouldDirty: true,
                        shouldValidate: false,
                      });
                      syncTotal(price, tax);
                      onTotalChange?.();
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 합계 */}
          <FormField
            control={control}
            name={`expense_items.${index}.total`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold text-gray-950">합계</FormLabel>
                <FormControl>
                  <Input
                    readOnly
                    inputMode="numeric"
                    placeholder="합계"
                    value={field.value ? formatAmount(field.value) : ''}
                    className="focus-visible:border-input cursor-default bg-gray-100 text-gray-600"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 오른쪽 첨부 */}
        <div className="w-[32%] pl-2">
          <AttachmentField
            name={`expense_attachment${index}`}
            rowIndex={index + 1}
            onDropFiles={handleDropFiles}
            onUploadFiles={handleAttachUpload}
            activeFile={activeFile}
            setActiveFile={setActiveFile}
            files={files}
          />
        </div>
      </div>
      {/* 기안서 매칭 다이얼로그 */}
      <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>기안서 매칭</DialogTitle>
          </DialogHeader>
          <Table variant="primary">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">구분</TableHead>
                <TableHead>제목</TableHead>
                <TableHead className="w-[120px]">금액</TableHead>
                <TableHead className="w-[240px]">작성일</TableHead>
                <TableHead className="w-[40px]"></TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {hasProposalList ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-[13px] text-gray-500">
                    등록된 기안서가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                proposalList.map((p) => {
                  const isSelected = selectedProposalId === p.rp_seq;
                  const isDisabled = selectedProposalId !== null && !isSelected;

                  return (
                    <TableRow key={p.rp_seq} className="hover:bg-gray-100">
                      <TableCell>{p.rp_category}</TableCell>
                      <TableCell className="text-left">{p.rp_title}</TableCell>
                      <TableCell className="text-right">{formatAmount(p.rp_cost)}원</TableCell>
                      <TableCell>{formatKST(p.rp_date)}</TableCell>
                      <TableCell className="px-2.5 [&]:pr-3!">
                        <Checkbox
                          size="sm"
                          id={`proposal-${p.rp_seq}`}
                          checked={isSelected}
                          disabled={isDisabled}
                          onCheckedChange={(checked) => {
                            setSelectedProposalId(checked ? p.rp_seq : null);
                            setSelectedProposal(checked ? p : null);
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          <div className="mt-6 flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setDialogOpen(false)}>
              취소
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (!selectedProposalId) return;
                console.log('선택된 기안서:', selectedProposalId);

                setValue(`expense_items.${index}.pro_id`, selectedProposalId, {
                  shouldDirty: true,
                  shouldValidate: false,
                });

                // 부모 컴포넌트로 선택된 기안서 전달
                onSelectProposal?.(selectedProposalId);
                setDialogOpen(false);
              }}>
              선택하기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </article>
  );
}

/** 메모이제이션 적용 */
export const ExpenseRow = memo(ExpenseRowComponent);
