// src/components/features/Expense/_components/ExpenseRegisterRow.tsx
import { useState, useEffect, useCallback, memo } from 'react';
import { useForm } from 'react-hook-form';
import { useUser } from '@/hooks/useUser';
import { getExpenseType } from '@/api';

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@components/ui/form';
import { Input } from '@components/ui/input';
import { Button } from '@components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@components/ui/popover';
import { SearchableSelect, type SingleSelectOption } from '@components/ui/SearchableSelect';
import { DayPicker } from '@components/daypicker';
import { cn } from '@/lib/utils';
import { Calendar, Close } from '@/assets/images/icons';
import { FileText } from 'lucide-react';
import { useToggleState } from '@/hooks/useToggleState';
import { format } from 'date-fns';
import { formatAmount } from '@/utils';
import { AttachmentField } from '../../Expense/_components/AttachmentField';
import type { PreviewFile } from '../../Expense/_components/UploadArea';

type ExpenseRowProps = {
  index: number;
  projectType: string;
  control: any;
  form: any;
  onRemove: (index: number) => void;
  handleDropFiles: (files: PreviewFile[], fieldName: string, rowIndex: number | null) => void;
  handleAttachUpload: (files: PreviewFile[], rowIndex: number | null) => void;
  files: PreviewFile[];
  activeFile: string | null;
  setActiveFile: (id: string | null) => void;
};

function ExpenseRowComponent({
  index,
  control,
  projectType,
  form,
  onRemove,
  handleDropFiles,
  handleAttachUpload,
  files,
  activeFile,
  setActiveFile,
}: ExpenseRowProps) {
  const { user_level } = useUser();
  const [expenseTypes, setExpenseTypes] = useState<SingleSelectOption[]>([]);
  const formatDate = (d?: Date) => (d ? format(d, 'yyyy-MM-dd') : '');

  const fetchClients = useCallback(async () => {
    try {
      const expenseTypeParam = user_level === 'user' ? 'exp_type1' : 'exp_type2';

      const res = await getExpenseType(expenseTypeParam);
      const mapped = res.map((t: any) => ({
        label: t.code,
        value: t.code,
      }));
      setExpenseTypes(mapped);
    } catch (err) {
      console.error('❌ 클라이언트 불러오기 오류 :', err);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return (
    <article className="relative border-b border-gray-300 px-2 pt-10 pb-8 last-of-type:border-b-0">
      {/* 상단 영역 */}
      <div className="absolute top-1 left-0 flex w-full items-center justify-between gap-2 pl-[68%]">
        {projectType === 'pro' && ( // 견적서 외 비용 선택 시에만 기안서 매칭 노출
          <button
            type="button"
            className="text-primary-blue-500 flex cursor-pointer items-center gap-1 text-sm hover:underline"
            onClick={() => setActiveFile(String(index))}>
            <FileText className="size-3.5" /> 기안서 매칭
          </button>
        )}
        <Button type="button" variant="svgIcon" size="icon" className="ml-auto" onClick={() => onRemove(index)}>
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
                    onChange={(v) => field.onChange(v)}
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
                    value={field.value ? formatAmount(field.value) : ''}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, '');
                      field.onChange(raw);
                      const taxValue = Number(String(form.getValues(`expense_items.${index}.tax`) || '').replace(/,/g, '')) || 0;
                      const total = Number(raw || 0) + taxValue;
                      form.setValue(`expense_items.${index}.total`, total.toString(), {
                        shouldValidate: false,
                        shouldDirty: true,
                      });
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
                    value={field.value ? formatAmount(field.value) : ''}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, '');
                      field.onChange(raw);
                      const priceValue = Number(String(form.getValues(`expense_items.${index}.price`) || '').replace(/,/g, '')) || 0;
                      const total = priceValue + Number(raw || 0);
                      form.setValue(`expense_items.${index}.total`, total.toString(), {
                        shouldValidate: false,
                        shouldDirty: true,
                      });
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
    </article>
  );
}

/** 메모이제이션 적용 */
export const ExpenseRow = memo(ExpenseRowComponent);
