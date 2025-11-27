import { memo, useRef, useEffect } from 'react';
import { type UseFormSetValue, type Control, useWatch, useFormState } from 'react-hook-form';
import type { EstimateEditForm } from '@/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuGroup, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { TableCell } from '@/components/ui/table';
import { GripVertical, Ellipsis, ArrowUp, ArrowDown, X } from 'lucide-react';
import { SortableItemHandle } from '@/components/ui/sortable';
import { FormField } from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { formatAmount } from '@/utils';

type DirtyCheckField = 'ei_name' | 'unit_price' | 'qty' | 'amount' | 'exp_cost' | 'remark';

interface EstimateRowProps {
  field: any;
  idx: number;

  control: Control<EstimateEditForm>;
  watch: (path: string) => any;
  setValue: UseFormSetValue<EstimateEditForm>;

  initialItems: EstimateEditForm['items'];

  updateRowAll: () => void;
  onAddRow: (dir: 'up' | 'down', idx: number) => void;
  onRemoveRow: (idx: number) => void;
}

const getUpperAmountSum = (idx: number, items: any[]) => {
  let sum = 0;
  for (let i = 0; i < idx; i++) {
    const row = items[i];

    // item, discount, amount가 숫자인 row만 합산
    if (row.ei_type !== 'title' && row.ei_type !== 'subtotal') {
      if (typeof row.amount === 'number') {
        sum += row.amount;
      }
    }
  }
  return sum;
};

function RowComponent({ field, idx, control, watch, setValue, updateRowAll, onAddRow, onRemoveRow, initialItems }: EstimateRowProps) {
  const t = field.ei_type;

  const amount = useWatch({ control, name: `items.${idx}.amount` });
  const expCost = useWatch({ control, name: `items.${idx}.exp_cost` });
  const row = useWatch({ control, name: `items.${idx}` });

  const initialRow = (initialItems ?? []).find((r) => r.seq === row.seq);

  const normalizeValue = (v: any) => {
    if (v === null || v === undefined) return '';
    return v.toString().trim();
  };

  const normalizeNumber = (v: any) => (v === '' || v === null || v === undefined ? 0 : Number(v));

  const isDirty = (key: DirtyCheckField) => {
    if (!initialRow) return false;

    // 숫자 필드
    if (['unit_price', 'qty', 'amount', 'exp_cost'].includes(key)) {
      return normalizeNumber(initialRow[key]) !== normalizeNumber(row[key]);
    }

    // 문자열 필드
    return normalizeValue(initialRow[key]) !== normalizeValue(row[key]);
  };

  useEffect(() => {
    if (t === 'item' || t === 'agency_fee' || t === 'discount') updateRowAll();
  }, [amount]);

  useEffect(() => {
    if (t === 'item' || t === 'agency_fee') updateRowAll();
  }, [expCost]);

  // Amount가 변경 시 rawData와 비교해서 가용금액 업데이트
  useEffect(() => {
    if (!initialRow) return; // 신규 row 제외
    if (t !== 'item' && t !== 'agency_fee') return;

    // 사용자가 입력한 변경이 아니면 diff 반영 X
    const userChanged = isDirty('unit_price') || isDirty('qty') || isDirty('exp_cost') || isDirty('remark') || isDirty('ei_name');

    if (!userChanged) return;

    const initialAmount = Number(initialRow.amount) || 0;
    const currentAmount = Number(row?.amount) || 0;

    const diff = currentAmount - initialAmount;

    if (diff === 0) return;

    const baseAva = Number(initialRow.ava_amount) || 0;
    const newAva = baseAva + diff;

    setValue(`items.${idx}.ava_amount`, newAva, {
      shouldDirty: true,
      shouldTouch: false,
    });
  }, [row?.amount]);

  /** 공통 Drag Handle */
  const bg = {
    subtotal: 'bg-gray-100',
    discount: 'bg-gray-300',
    grandtotal: 'bg-primary-blue-150',
  };

  const dirtyClass = 'text-primary-blue-500 font-bold border-primary-500';

  const Drag = (
    <TableCell className={`px-0 ${bg[t as keyof typeof bg]}`} data-drag-handle>
      <SortableItemHandle asChild>
        <Button variant="svgIcon" size="icon" className="size-5" tabIndex={-1}>
          <GripVertical className="size-4 text-gray-600" />
        </Button>
      </SortableItemHandle>
    </TableCell>
  );

  /** 공통 Menu */
  const Menu = (
    <TableCell className={`px-0 ${bg[t as keyof typeof bg]}`}>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="svgIcon" size="icon" className="size-5" tabIndex={-1}>
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-auto" align="start">
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => onAddRow('up', idx)}>
              <ArrowUp className="size-3" /> 항목 추가
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onAddRow('down', idx)}>
              <ArrowDown className="size-3" /> 항목 추가
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onRemoveRow(idx)}>
              <X className="size-3" /> 항목 삭제
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </TableCell>
  );

  /** TITLE */
  if (t === 'title') {
    return (
      <>
        {Drag}
        <TableCell className="pl-1">
          <FormField
            control={control}
            name={`items.${idx}.ei_name`}
            render={({ field }) => <Input {...field} className={cn('h-9 font-bold', isDirty('ei_name') && dirtyClass)} />}
          />
        </TableCell>
        <TableCell colSpan={6}></TableCell>
        {Menu}
      </>
    );
  }

  /** SUBTOTAL */
  if (t === 'subtotal') {
    return (
      <>
        {Drag}

        <TableCell className="bg-gray-100 pl-1 font-semibold" colSpan={3}>
          Subtotal
        </TableCell>
        <TableCell className="bg-gray-100 text-right font-semibold">{formatAmount(row?.amount || 0)}</TableCell>
        <TableCell className="bg-gray-100" colSpan={3}></TableCell>

        {Menu}
      </>
    );
  }

  /** GRANDTOTAL */
  if (t === 'grandtotal') {
    return (
      <>
        <TableCell className="bg-primary-blue-150 px-0"></TableCell>

        <TableCell className="bg-primary-blue-150 pl-1 font-semibold" colSpan={3}>
          Grand Total
        </TableCell>

        <TableCell className="bg-primary-blue-150 text-right font-semibold">{formatAmount(row?.amount || 0)}</TableCell>

        <TableCell className="bg-primary-blue-150"></TableCell>

        <TableCell className="bg-primary-blue-150 text-right font-semibold">{formatAmount(row?.exp_cost || 0)}</TableCell>

        <TableCell className="bg-primary-blue-150" colSpan={2}></TableCell>
      </>
    );
  }

  /** DISCOUNT */
  if (t === 'discount') {
    return (
      <>
        {Drag}
        <TableCell className="bg-gray-300 pl-1 font-semibold" colSpan={3}>
          Discount
        </TableCell>
        <TableCell className="bg-gray-300 text-right">
          <FormField
            control={control}
            name={`items.${idx}.amount`}
            render={({ field }) => {
              return (
                <Input
                  className="h-9 text-right"
                  value={field.value ?? ''}
                  onChange={(e) => {
                    let v = e.target.value.replace(/[^0-9-]/g, '').replace(/(?!^)-/g, '');
                    field.onChange(v);
                  }}
                />
              );
            }}
          />
        </TableCell>
        <TableCell className="bg-gray-300" colSpan={2}></TableCell>
        <TableCell className="bg-gray-300">
          <Input className={cn('h-9', isDirty('remark') && dirtyClass)} {...control.register(`items.${idx}.remark`)} />
        </TableCell>
        {Menu}
      </>
    );
  }

  /** ITEM */
  if (t === 'item') {
    return (
      <>
        {Drag}

        <TableCell className="pl-1">
          <FormField
            control={control}
            name={`items.${idx}.ei_name`}
            render={({ field }) => <Input {...field} className={cn('h-9', isDirty('ei_name') && dirtyClass)} />}
          />
        </TableCell>

        {/* unit_price */}
        <TableCell>
          <FormField
            control={control}
            name={`items.${idx}.unit_price`}
            render={({ field }) => {
              const rawValue = field.value || 0;
              const displayValue = formatAmount(rawValue);

              return (
                <Input
                  className={cn('h-9 text-right', isDirty('unit_price') && dirtyClass)}
                  value={displayValue}
                  onChange={(e) => {
                    const raw = Number(e.target.value.replace(/[^\d]/g, '') || 0);
                    field.onChange(raw);

                    // amount 즉시 계산
                    const qty = Number(row?.qty || 0);
                    const amt = Math.round(raw * qty); // 반올림 적용

                    setValue(`items.${idx}.amount`, amt, {
                      shouldDirty: true,
                      shouldTouch: false,
                    });
                  }}
                />
              );
            }}
          />
        </TableCell>
        {/* qty */}
        <TableCell>
          <FormField
            control={control}
            name={`items.${idx}.qty`}
            render={({ field }) => {
              const rawValue = field.value ?? '';

              return (
                <Input
                  className={cn('h-9 text-right', isDirty('qty') && dirtyClass)}
                  value={rawValue}
                  onChange={(e) => {
                    let v = e.target.value;

                    // 허용: 숫자 + 점 1개
                    v = v.replace(/[^0-9.]/g, '');

                    // 점이 2개 이상 들어오면 제거
                    const parts = v.split('.');
                    if (parts.length > 2) {
                      v = parts[0] + '.' + parts[1];
                    }

                    // 소수점 둘째자리까지만 허용
                    if (parts[1]?.length > 2) {
                      v = parts[0] + '.' + parts[1].slice(0, 2);
                    }

                    // 빈 값 처리
                    if (v === '') {
                      field.onChange('');
                      setValue(`items.${idx}.amount`, 0);
                      return;
                    }

                    const qty = Number(v);
                    field.onChange(v); // 문자열로 저장 (React Hook Form에게 formatting 맡김)

                    // 즉시 amount 업데이트
                    const price = Number(row?.unit_price || 0);
                    const amt = Math.round(qty * price); // 반올림 적용

                    setValue(`items.${idx}.amount`, amt, {
                      shouldDirty: true,
                      shouldTouch: false,
                    });
                  }}
                />
              );
            }}
          />
        </TableCell>

        {/* amount */}
        <TableCell>
          <Input className={cn('h-9 text-right', isDirty('amount') && dirtyClass)} readOnly value={formatAmount(row?.amount || 0)} />
        </TableCell>
        {/* ava_amount */}
        <TableCell className="text-right">
          {formatAmount(row?.ava_amount || 0)} <span className="text-primary-blue-500 text-sm">(12)</span>
        </TableCell>
        {/* exp_cost */}
        <TableCell>
          <FormField
            control={control}
            name={`items.${idx}.exp_cost`}
            render={({ field }) => {
              const rawValue = field.value || 0;
              const displayValue = formatAmount(rawValue);

              return (
                <Input
                  className={cn('h-9 text-right', isDirty('exp_cost') && dirtyClass)}
                  value={displayValue}
                  onChange={(e) => {
                    const raw = Number(e.target.value.replace(/[^\d]/g, '') || 0);
                    field.onChange(raw);
                  }}
                />
              );
            }}
          />
        </TableCell>

        {/* remark */}
        <TableCell>
          <Input className={cn('h-9', isDirty('remark') && dirtyClass)} {...control.register(`items.${idx}.remark`)} />
        </TableCell>

        {Menu}
      </>
    );
  }

  if (t === 'agency_fee') {
    return (
      <>
        {Drag}

        {/* name */}
        <TableCell className="pl-1">
          <FormField
            control={control}
            name={`items.${idx}.ei_name`}
            render={({ field }) => <Input {...field} className={cn('h-9', isDirty('ei_name') && dirtyClass)} />}
          />
        </TableCell>

        {/* unit_price */}
        <TableCell>
          <FormField
            control={control}
            name={`items.${idx}.unit_price`}
            render={({ field }) => {
              const prevValueRef = useRef(field.value ?? '');

              const value = field.value ?? '';

              const displayValue =
                value !== '' && Number(value) >= 1
                  ? formatAmount(Number(value)) // 정수
                  : value; // 소수

              return (
                <Input
                  className={cn('h-9 text-right', isDirty('unit_price') && dirtyClass)}
                  value={displayValue}
                  onChange={(e) => {
                    let raw = e.target.value.replace(/[^\d.]/g, '');

                    const items = watch('items');
                    const upperSum = getUpperAmountSum(idx, items);

                    // --- Backspace 로 지우기 문제 해결 ---
                    if (prevValueRef.current === '0.' && (raw === '0' || raw === '')) {
                      field.onChange('');
                      setValue(`items.${idx}.amount`, 0);
                      prevValueRef.current = '';
                      return;
                    }

                    // 점 여러 개 방지
                    const parts = raw.split('.');
                    if (parts.length > 2) {
                      raw = parts[0] + '.' + parts[1];
                    }

                    // "." 시작 → "0.xx"
                    if (raw.startsWith('.')) {
                      raw = '0' + raw;
                    }

                    // "0" 시작 → 소수 모드
                    if (raw.startsWith('0')) {
                      if (!raw.includes('.')) {
                        raw = '0.';
                      }
                      const p = raw.split('.');
                      if (p[1]?.length > 2) {
                        raw = p[0] + '.' + p[1].slice(0, 2);
                      }

                      field.onChange(raw);
                      prevValueRef.current = raw;

                      // amount 계산 (0.xx)
                      const rate = Number(raw);
                      const amt = Math.round(upperSum * rate);
                      setValue(`items.${idx}.amount`, amt);
                      return;
                    }

                    // 1~9 시작 → 정수 모드
                    if (/^[1-9]/.test(raw)) {
                      raw = raw.replace(/\./g, ''); // 소수점 제거

                      field.onChange(raw);
                      prevValueRef.current = raw;

                      // amount = 정수 그대로
                      setValue(`items.${idx}.amount`, Number(raw));
                      return;
                    }

                    // 빈 값
                    if (raw === '') {
                      field.onChange('');
                      setValue(`items.${idx}.amount`, 0);
                      prevValueRef.current = '';
                      return;
                    }

                    prevValueRef.current = raw;
                    field.onChange(raw);
                  }}
                />
              );
            }}
          />
        </TableCell>

        {/* qty 없음 → 빈 칸 */}
        <TableCell></TableCell>

        {/* amount */}
        <TableCell>
          <FormField
            control={control}
            name={`items.${idx}.amount`}
            render={({ field }) => {
              const displayValue = formatAmount(field.value || 0);

              return (
                <Input
                  className={cn('h-9 text-right', isDirty('amount') && dirtyClass)}
                  value={displayValue}
                  onChange={(e) => {
                    const raw = Number(e.target.value.replace(/[^\d]/g, '') || 0);
                    field.onChange(raw);
                  }}
                />
              );
            }}
          />
        </TableCell>

        {/* ava_amount */}
        <TableCell className="text-right">{formatAmount(row?.ava_amount || 0)}</TableCell>

        {/* exp_cost */}
        <TableCell>
          <FormField
            control={control}
            name={`items.${idx}.exp_cost`}
            render={({ field }) => {
              return (
                <Input
                  className={cn('h-9 text-right', isDirty('exp_cost') && dirtyClass)}
                  value={formatAmount(field.value || 0)}
                  onChange={(e) => {
                    const raw = Number(e.target.value.replace(/[^\d]/g, '') || 0);
                    field.onChange(raw);
                  }}
                />
              );
            }}
          />
        </TableCell>

        {/* remark */}
        <TableCell>
          <Input className={cn('h-9', isDirty('remark') && dirtyClass)} {...control.register(`items.${idx}.remark`)} />
        </TableCell>
        {Menu}
      </>
    );
  }
}

export const EstimateRow = memo(RowComponent);
