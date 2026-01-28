// InvoiceCreateInfo.tsx
import { useOutletContext } from 'react-router';
import type { ProjectLayoutContext } from '@/pages/Project/ProjectLayout';

import { FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { DayPicker } from '@/components/daypicker';
import { CalendarIcon, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToggleState } from '@/hooks/useToggleState';
import type { Control, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import type { InvoiceFormValues } from '@/types/invoice';

interface Props {
  control: Control<InvoiceFormValues>;
  watch: UseFormWatch<InvoiceFormValues>;
  setValue: UseFormSetValue<InvoiceFormValues>;
  formatDate: (d?: Date) => string;
}

export default function InvoiceInfoForm({ control, watch, setValue, formatDate }: Props) {
  const { data } = useOutletContext<ProjectLayoutContext>();

  return (
    <>
      {/* 프로젝트 정보 */}
      <FormItem>
        <FormLabel className="text-gray-950">프로젝트 #</FormLabel>
        <span className="text-base leading-[1.3] text-gray-600">{data.project_id}</span>
      </FormItem>

      <FormItem>
        <FormLabel className="text-gray-950">프로젝트 제목</FormLabel>
        <span className="text-base leading-[1.3] break-keep text-gray-600">{data.project_title}</span>
      </FormItem>

      {/* 인보이스 제목 */}
      <FormField
        control={control}
        name="invoice_title"
        render={({ field }) => (
          <FormItem className="col-span-2 mt-2">
            <FormLabel className="gap-0.5">
              인보이스 제목<span className="text-primary-blue-500">*</span>
            </FormLabel>
            <FormControl>
              <Input placeholder="인보이스 제목 입력" {...field} value={field.value ?? ''} />
            </FormControl>
          </FormItem>
        )}
      />

      {/* 인보이스 수신 */}
      <FormField
        control={control}
        name="client_nm"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="gap-.5">
              인보이스 수신<span className="text-primary-blue-500">*</span>
            </FormLabel>
            <FormControl>
              <Input {...field} value={field.value ?? ''} />
            </FormControl>
          </FormItem>
        )}
      />

      {/* 담당자 이름 */}
      <FormField
        control={control}
        name="contact_nm"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="gap-.5 flex justify-between">
              <span>
                담당자 이름<span className="text-primary-blue-500">*</span>
              </span>
              {/* <button
                type="button"
                className="text-primary-blue-500 hover:[&_svg]:fill-primary flex cursor-pointer items-center gap-1 text-sm"
                tabIndex={-1}>
                <Bookmark className="size-3.5" /> 북마크
              </button> */}
            </FormLabel>
            <FormControl>
              <Input placeholder="담당자 입력" {...field} value={field.value ?? ''} />
            </FormControl>
          </FormItem>
        )}
      />

      {/* 담당자 이메일 */}
      <FormField
        control={control}
        name="contact_email"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="gap-.5">
              담당자 이메일<span className="text-primary-blue-500">*</span>
            </FormLabel>
            <FormControl>
              <Input placeholder="email@example.com" {...field} value={field.value ?? ''} />
            </FormControl>
          </FormItem>
        )}
      />

      {/* 담당자 연락처 */}
      <FormField
        control={control}
        name="contact_tel"
        render={({ field }) => (
          <FormItem>
            <FormLabel>담당자 연락처</FormLabel>
            <FormControl>
              <Input
                placeholder="010-0000-0000"
                {...field}
                value={field.value ?? ''}
                onChange={(e) => {
                  const value = e.target.value;

                  // 허용되는 문자만 입력 (+, -, 숫자)
                  if (!/^[0-9+\-]*$/.test(value)) return;

                  field.onChange(value);
                }}
              />
            </FormControl>
          </FormItem>
        )}
      />

      {/* 발행 요청 일자 */}
      <FormField
        control={control}
        name="idate"
        render={({ field }) => {
          const { isOpen, setIsOpen, close } = useToggleState();

          return (
            <FormItem>
              <FormLabel>발행 요청 일자</FormLabel>
              <Popover open={isOpen} onOpenChange={setIsOpen} modal={true}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button variant="outline" className={cn('h-11 w-full text-left', !field.value && 'text-muted-foreground')}>
                      {field.value || '날짜 선택'}
                      <CalendarIcon className="ml-auto size-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>

                <PopoverContent className="w-auto p-0" align="start">
                  <DayPicker
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={(date) => {
                      field.onChange(date ? formatDate(date) : null);
                      date && close();
                    }}
                  />
                </PopoverContent>
              </Popover>
            </FormItem>
          );
        }}
      />

      {/* PO 번호 */}
      <FormField
        control={control}
        name="po_no"
        render={({ field }) => (
          <FormItem>
            <FormLabel>PO 번호</FormLabel>
            <FormControl>
              <Input placeholder="PO 번호" {...field} value={field.value ?? ''} />
            </FormControl>
          </FormItem>
        )}
      />

      {/* 비고 */}
      <FormField
        control={control}
        name="remark"
        render={({ field }) => (
          <FormItem className="col-span-2">
            <FormLabel>비고</FormLabel>
            <FormControl>
              <Textarea placeholder="추가 기입할 정보가 있으면 입력해 주세요." className="h-20 min-h-20 md:h-16 md:min-h-16" {...field} />
            </FormControl>
          </FormItem>
        )}
      />
    </>
  );
}
