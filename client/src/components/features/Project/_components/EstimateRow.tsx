import { memo, useRef, useEffect, useState } from 'react';
import { type UseFormSetValue, type Control, useWatch, useFormState } from 'react-hook-form';
import type { EstimateEditForm } from '@/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuGroup, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { TableCell } from '@/components/ui/table';
import { GripVertical, Ellipsis, ArrowUp, ArrowDown, X, Link } from 'lucide-react';
import { SortableItemHandle } from '@/components/ui/sortable';
import { FormField } from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { formatAmount } from '@/utils';

type DirtyCheckField = 'ei_name' | 'unit_price' | 'qty' | 'amount' | 'ava_amount' | 'exp_cost' | 'remark';

interface EstimateRowProps {
  field: any;
  idx: number;
  watch: (path: string) => any;

  control: Control<EstimateEditForm>;
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

  const [focusedField, setFocusedField] = useState<string | null>(null);

  const amount = useWatch({ control, name: `items.${idx}.amount` });
  const expCost = useWatch({ control, name: `items.${idx}.exp_cost` });
  const row = useWatch({ control, name: `items.${idx}` });

  const initialRow = (initialItems ?? []).find((r) => r.seq === row.seq);

  console.log(initialRow, row);

  const normalizeValue = (v: any) => {
    if (v === null || v === undefined) return '';
    return v.toString().trim();
  };

  const normalizeNumber = (v: any) => (v === '' || v === null || v === undefined ? 0 : Number(v));

  const isDirty = (key: DirtyCheckField) => {
    if (!initialRow) return false;

    // 숫자 필드 (unit_price, qty, amount, exp_cost)
    if (['unit_price', 'qty', 'amount', 'exp_cost'].includes(key)) {
      return normalizeNumber(initialRow[key]) !== normalizeNumber(row[key]);
    }

    // 가용 금액(ava_amount)은 계산 기반, 초기 null 인 경우도 dirty 처리
    if (key === 'ava_amount') {
      const initial = normalizeNumber(initialRow[key]);
      const current = normalizeNumber(row[key]);

      // 초기값이 null/undefined/'' → 계산되어 0이라도 dirty
      if (initialRow[key] == null) {
        return current !== 0;
      }

      return initial !== current;
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
    <TableCell className={`!px-0 ${bg[t as keyof typeof bg]}`} data-drag-handle>
      <SortableItemHandle asChild>
        <Button variant="svgIcon" size="icon" className="size-5" tabIndex={-1}>
          <GripVertical className="size-4 text-gray-600" />
        </Button>
      </SortableItemHandle>
    </TableCell>
  );

  /** 공통 Menu */
  const Menu = (
    <TableCell className={`!px-0 ${bg[t as keyof typeof bg]}`}>
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
        <TableCell className="!pl-1">
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

        <TableCell className="bg-gray-100 !pl-1 !text-base leading-7 font-semibold" colSpan={3}>
          Sub total
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
        <TableCell className="bg-primary-blue-150 !px-0"></TableCell>

        <TableCell className="bg-primary-blue-150 !pl-1 !text-base leading-8.5 font-semibold" colSpan={3}>
          Grand Total
        </TableCell>

        <TableCell className="bg-primary-blue-150 text-right !text-base font-semibold">{formatAmount(row?.amount || 0)}</TableCell>

        <TableCell className="bg-primary-blue-150"></TableCell>

        <TableCell className="bg-primary-blue-150 text-right !text-base font-semibold">{formatAmount(row?.exp_cost || 0)}</TableCell>

        <TableCell className="bg-primary-blue-150" colSpan={2}></TableCell>
      </>
    );
  }

  /** DISCOUNT */
  if (t === 'discount') {
    return (
      <>
        {Drag}
        <TableCell className="bg-gray-300 !pl-1 !text-base font-semibold" colSpan={3}>
          Discount
        </TableCell>
        <TableCell className="bg-gray-300 text-right">
          <FormField
            control={control}
            name={`items.${idx}.amount`}
            render={({ field }) => {
              const inputRef = useRef<HTMLInputElement>(null);

              // 🔥 저장(raw)은 항상 음수 → display는 절댓값
              const numeric = Number(field.value);
              const displayValue = !numeric ? '' : formatAmount(Math.abs(numeric));

              /** 🔥 커서 유지 + raw 음수 저장 핸들러 */
              const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                const input = e.target;
                const rawPrev = input.value;
                const cursorPrev = input.selectionStart ?? rawPrev.length;

                const isDelete = (e.nativeEvent as InputEvent)?.inputType === 'deleteContentForward';
                const isBackspace = (e.nativeEvent as InputEvent)?.inputType === 'deleteContentBackward';

                const prevDigitsBeforeCursor = rawPrev.slice(0, cursorPrev).replace(/[^\d]/g, '').length;
                const prevDigitsAfterCursor = rawPrev.slice(cursorPrev).replace(/[^\d]/g, '').length;

                // 숫자만 추출 → 음수로 변환
                let rawDigits = rawPrev.replace(/[^\d]/g, '');

                if (rawDigits === '') {
                  field.onChange('');
                  requestAnimationFrame(() => input.setSelectionRange(0, 0));
                  return;
                }

                const formatted = formatAmount(Number(rawDigits));

                // 커서 이동 계산
                let cursorNew = 0;

                if (isBackspace) {
                  let seen = 0;
                  for (let i = 0; i < formatted.length; i++) {
                    if (/\d/.test(formatted[i])) seen++;
                    if (seen === prevDigitsBeforeCursor) {
                      cursorNew = i + 1;
                      break;
                    }
                  }
                } else if (isDelete) {
                  let seen = 0;
                  for (let i = formatted.length - 1; i >= 0; i--) {
                    if (/\d/.test(formatted[i])) seen++;
                    if (seen === prevDigitsAfterCursor) {
                      cursorNew = i;
                      break;
                    }
                  }
                } else {
                  let seen = 0;
                  for (let i = 0; i < formatted.length; i++) {
                    if (/\d/.test(formatted[i])) seen++;
                    if (seen === prevDigitsBeforeCursor) {
                      cursorNew = i + 1;
                      break;
                    }
                  }
                }

                // 🔥 raw 값을 항상 음수로 저장
                const negativeRaw = -Number(rawDigits);
                field.onChange(negativeRaw);

                requestAnimationFrame(() => {
                  input.setSelectionRange(cursorNew, cursorNew);
                });
              };

              return (
                <div className="relative before:absolute before:top-1/2 before:left-2 before:-translate-y-1/2 before:content-['-']">
                  <Input
                    ref={inputRef}
                    value={displayValue}
                    onChange={handleChange}
                    className={cn('h-9 pl-5 text-right', isDirty('amount') && dirtyClass)}
                  />
                </div>
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

        <TableCell className="!pl-1">
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
              const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                const input = e.target;
                const rawPrev = input.value;

                const cursorPrev = input.selectionStart ?? rawPrev.length;

                // 🔍 입력 키 확인 (Backspace or Delete)
                const isDelete = (e.nativeEvent as InputEvent)?.inputType === 'deleteContentForward';
                const isBackspace = (e.nativeEvent as InputEvent)?.inputType === 'deleteContentBackward';

                // 숫자만 추출 (format 초기 remove)
                const prevDigitsText = rawPrev.replace(/[^\d]/g, '');
                const totalDigits = prevDigitsText.length;

                // ✔ Backspace: 커서 앞의 숫자 개수
                const prevDigitsBeforeCursor = rawPrev.slice(0, cursorPrev).replace(/[^\d]/g, '').length;

                // ✔ Delete: 커서 뒤 숫자 개수
                const prevDigitsAfterCursor = rawPrev.slice(cursorPrev).replace(/[^\d]/g, '').length;

                // ===============================
                //   RAW 숫자 파싱 + 정리
                // ===============================
                let raw = rawPrev.replace(/[^\d]/g, '');

                if (raw === '') {
                  field.onChange('');
                  requestAnimationFrame(() => input.setSelectionRange(0, 0));
                  return;
                }

                const formatted = formatAmount(Number(raw));

                // ===============================
                //   커서 재배치
                // ===============================

                let cursorNew = 0;

                if (isBackspace) {
                  // 🔥 Backspace → 커서 앞의 숫자 개수(prevDigitsBeforeCursor)를 기준으로 위치 계산
                  let seen = 0;
                  for (let i = 0; i < formatted.length; i++) {
                    if (/\d/.test(formatted[i])) seen++;
                    if (seen === prevDigitsBeforeCursor) {
                      cursorNew = i + 1;
                      break;
                    }
                  }
                } else if (isDelete) {
                  // 🔥 Delete → 커서 뒤의 숫자(prevDigitsAfterCursor) 개수를 기준으로 커서 계산
                  let seen = 0;
                  for (let i = formatted.length - 1; i >= 0; i--) {
                    if (/\d/.test(formatted[i])) seen++;
                    if (seen === prevDigitsAfterCursor) {
                      cursorNew = i;
                      break;
                    }
                  }
                } else {
                  // 기본 입력 → prevDigitsBeforeCursor 유지
                  let seen = 0;
                  for (let i = 0; i < formatted.length; i++) {
                    if (/\d/.test(formatted[i])) seen++;
                    if (seen === prevDigitsBeforeCursor) {
                      cursorNew = i + 1;
                      break;
                    }
                  }
                }

                // RHF raw 저장
                const price = Number(raw);
                field.onChange(raw);

                requestAnimationFrame(() => {
                  input.setSelectionRange(cursorNew, cursorNew);
                });

                // 즉시 amount 업데이트
                const qty = Number(row?.qty || 0);
                const amt = Math.round(qty * price); // 반올림 적용

                setValue(`items.${idx}.amount`, amt, {
                  shouldDirty: true,
                  shouldTouch: false,
                });
              };

              return (
                <Input
                  className={cn('h-9 text-right', isDirty('unit_price') && dirtyClass)}
                  value={formatAmount(field.value || 0)}
                  onChange={handlePriceChange}
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
          <Input
            className={cn('h-9 bg-gray-100 text-right text-gray-600', isDirty('amount') && dirtyClass)}
            readOnly
            value={formatAmount(row?.amount || 0)}
          />
        </TableCell>
        {/* ava_amount */}
        <TableCell className={cn('text-right', isDirty('ava_amount') && dirtyClass)}>
          <div className="flex items-center justify-end gap-1">
            {formatAmount(row?.ava_amount || 0)}{' '}
            <span
              className="flex cursor-pointer items-center gap-0.5 text-xs font-normal text-gray-500 hover:text-gray-700"
              title="매칭된 비용 갯수">
              <Link className="size-3" />
              {/* {row.match_count} */}
            </span>
          </div>
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
        <TableCell className="!pl-1">
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
              const prevRef = useRef(field.value ?? '');
              const items = watch('items');
              const upperSum = getUpperAmountSum(idx, items);

              // ============================
              // 화면 표시용 value (DB 소수 → % 변환)
              // ============================
              const displayValue = (() => {
                const v = field.value;

                if (v === '' || v == null) return '';

                if (typeof v === 'string' && v.includes('%')) return v;

                const num = Number(v);

                if (num >= 1) return formatAmount(num);

                if (num > 0 && num < 1) {
                  const percent = Math.round(num * 100);
                  return `${percent}%`;
                }

                return v;
              })();

              // ============================
              // 입력 처리
              // ============================
              const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                let raw = e.target.value;

                // %와 숫자만 허용
                raw = raw.replace(/[^\d%]/g, '');

                // %가 여러 개 → 하나만 유지
                const pCount = (raw.match(/%/g) || []).length;
                if (pCount > 1) {
                  raw = raw.replace(/%/g, '');
                  raw = raw + '%';
                }

                // 숫자 + % 형식만 허용 (1%1 → 1%)
                if (raw.includes('%')) {
                  const left = raw.split('%')[0].replace(/\D/g, '');
                  raw = left + '%';

                  field.onChange(raw);
                  prevRef.current = raw;

                  const num = Number(left) || 0;
                  const rate = num / 100;
                  const amt = Math.round(upperSum * rate);
                  setValue(`items.${idx}.amount`, amt);
                  return;
                }

                // 빈값 처리
                if (raw === '') {
                  field.onChange('');
                  setValue(`items.${idx}.amount`, 0);
                  prevRef.current = '';
                  return;
                }

                // 정수 입력
                const intOnly = raw.replace(/\D/g, '');
                if (intOnly === '') {
                  field.onChange('');
                  setValue(`items.${idx}.amount`, 0);
                  prevRef.current = '';
                  return;
                }

                field.onChange(intOnly);
                prevRef.current = intOnly;

                setValue(`items.${idx}.amount`, Number(intOnly));
              };

              return (
                <Input className={cn('h-9 text-right', isDirty('unit_price') && dirtyClass)} value={displayValue} onChange={handleChange} />
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
        <TableCell className={cn('text-right', isDirty('ava_amount') && dirtyClass)}>
          <div className="flex items-center justify-end gap-1">
            {formatAmount(row?.ava_amount || 0)}{' '}
            <span
              className="flex cursor-pointer items-center gap-0.5 text-xs font-normal text-gray-500 hover:text-gray-700"
              title="매칭된 비용 갯수">
              <Link className="size-3" />
              12
            </span>
          </div>
        </TableCell>

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
