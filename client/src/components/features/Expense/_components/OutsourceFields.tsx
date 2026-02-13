import { useEffect } from 'react';
import { useWatch, type Control, type UseFormSetValue } from 'react-hook-form';
import { format, differenceInCalendarDays } from 'date-fns';

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@components/ui/form';
import { Input } from '@components/ui/input';
import { DatePickerWithRange } from '@/components/date-n-time/date-picker-range';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@components/ui/select';

type OutsourceProps = {
  control: Control<any>;
  index: number;
  setValue: UseFormSetValue<any>;
};

export function OutsourceFields({ control, index, setValue }: OutsourceProps) {
  const workTerm = useWatch({
    control,
    name: `expense_items.${index}.work_term`,
  });

  const workDay = useWatch({
    control,
    name: `expense_items.${index}.work_day`,
  });

  useEffect(() => {
    if (!workTerm) {
      setValue(`expense_items.${index}.work_day`, '');
      return;
    }

    const [startStr, endStr] = workTerm.split(' ~ ');
    if (!startStr || !endStr) return;

    const start = new Date(startStr);
    const end = new Date(endStr);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

    const diff = differenceInCalendarDays(end, start) + 1;

    setValue(`expense_items.${index}.work_day`, String(diff), { shouldDirty: true });
  }, [workTerm, index, setValue]);

  return (
    <div className="mt-6 grid w-full grid-cols-2 gap-4 border-t-1 border-dashed border-gray-300 pt-6 tracking-tight md:grid-cols-4">
      {/* 원천징수 유형 */}
      <FormField
        control={control}
        name={`expense_items.${index}.tax_type`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="gap-.5 font-bold text-gray-950">원천징수 유형</FormLabel>
            <FormControl>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="원천징수 유형 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="사업소득자">사업소득자</SelectItem>
                  <SelectItem value="기타소득자">기타소득자</SelectItem>
                  <SelectItem value="내부직원">내부직원</SelectItem>
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* 이름 */}
      <FormField
        control={control}
        name={`expense_items.${index}.h_name`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="gap-.5 font-bold text-gray-950">이름</FormLabel>
            <FormControl>
              <Input placeholder="이름 입력" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* 주민번호 */}
      <FormField
        control={control}
        name={`expense_items.${index}.h_ssn`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="gap-.5 font-bold text-gray-950">주민번호</FormLabel>
            <FormControl>
              <Input placeholder="000000-0000000" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* 연락처 */}
      <FormField
        control={control}
        name={`expense_items.${index}.h_tel`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="gap-.5 font-bold text-gray-950">연락처</FormLabel>
            <FormControl>
              <Input placeholder="010-0000-0000" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* 근무기간 */}
      <FormField
        control={control}
        name={`expense_items.${index}.work_term`}
        render={({ field }) => {
          const parseRange = () => {
            if (!field.value) return undefined;
            const [start, end] = field.value.split(' ~ ');
            return {
              from: start ? new Date(start) : undefined,
              to: end ? new Date(end) : undefined,
            };
          };

          return (
            <FormItem className="col-span-2">
              <FormLabel className="gap-.5 font-bold text-gray-950">
                근무기간
                {workDay && <p className="text-primary-blue-500 ml-1 text-sm font-medium">총 {workDay}일</p>}
              </FormLabel>
              <FormControl>
                <DatePickerWithRange
                  selected={parseRange()}
                  onSelect={(range) => {
                    if (!range?.from || !range?.to) {
                      field.onChange('');
                      setValue(`expense_items.${index}.work_day`, '');
                      return;
                    }

                    const diff = differenceInCalendarDays(range.to, range.from) + 1;

                    setValue(`expense_items.${index}.work_day`, String(diff), { shouldDirty: true });

                    const formatted = `${format(range.from, 'yyyy-MM-dd')} ~ ${format(range.to, 'yyyy-MM-dd')}`;

                    field.onChange(formatted);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          );
        }}
      />

      {/* 주소 */}
      <FormField
        control={control}
        name={`expense_items.${index}.h_addr`}
        render={({ field }) => (
          <FormItem className="col-span-2">
            <FormLabel className="gap-.5 font-bold text-gray-950">주소</FormLabel>
            <FormControl>
              <Input placeholder="주소 입력" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
