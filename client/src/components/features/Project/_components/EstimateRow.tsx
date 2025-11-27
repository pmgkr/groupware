import { memo, useRef, useEffect } from 'react';
import { type UseFormSetValue, type Control, useWatch } from 'react-hook-form';
import type { EstimateEditForm } from '@/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuGroup, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { TableCell } from '@/components/ui/table';
import { GripVertical, Ellipsis, ArrowUp, ArrowDown, X } from 'lucide-react';
import { SortableItemHandle } from '@/components/ui/sortable';
import { FormField } from '@/components/ui/form';
import { formatAmount } from '@/utils';

interface EstimateRowProps {
  field: any;
  idx: number;

  control: Control<EstimateEditForm>;
  watch: (path: string) => any;
  setValue: UseFormSetValue<EstimateEditForm>;

  updateRow: (idx: number) => void;
  updateRowAll: () => void;
  onAddRow: (dir: 'up' | 'down', idx: number) => void;
  onRemoveRow: (idx: number) => void;
}

function RowComponent({ field, idx, control, watch, setValue, updateRow, updateRowAll, onAddRow, onRemoveRow }: EstimateRowProps) {
  const t = field.ei_type;

  const amount = useWatch({
    control,
    name: `items.${idx}.amount`,
  });

  useEffect(() => {
    if (t === 'item' || t === 'agency_fee' || t === 'discount') {
      updateRowAll();
    }
  }, [amount]);

  const expCost = useWatch({
    control,
    name: `items.${idx}.exp_cost`,
  });

  useEffect(() => {
    if (t === 'item' || t === 'agency_fee') {
      updateRowAll();
    }
  }, [expCost]);

  /** 🔍 Optimized row value subscribe */
  const row = useWatch({
    control,
    name: `items.${idx}`,
  });

  /** 공통 Drag Handle */
  const bg = {
    subtotal: 'bg-gray-100',
    discount: 'bg-gray-300',
    grandtotal: 'bg-primary-blue-150',
  };

  const Drag = (
    <TableCell className={`px-0 ${bg[t as keyof typeof bg]}`} data-drag-handle>
      <SortableItemHandle asChild>
        <Button variant="svgIcon" size="icon" className="size-5">
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
          <Button variant="svgIcon" size="icon" className="size-5">
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
            render={({ field }) => <Input {...field} className="h-9 font-bold" />}
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
          <Input className="h-9" {...control.register(`items.${idx}.remark`)} />
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
          <FormField control={control} name={`items.${idx}.ei_name`} render={({ field }) => <Input {...field} className="h-9" />} />
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
                  className="h-9 text-right"
                  value={displayValue}
                  onChange={(e) => {
                    const raw = Number(e.target.value.replace(/[^\d]/g, '') || 0);
                    field.onChange(raw);

                    // amount 즉시 계산
                    const qty = Number(row?.qty) ?? 0;
                    setValue(`items.${idx}.amount`, raw * qty, {
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
        {/* qty */}
        <TableCell>
          <FormField
            control={control}
            name={`items.${idx}.qty`}
            render={({ field }) => {
              const rawValue = field.value ?? '';

              return (
                <Input
                  className="h-9 text-right"
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
                    setValue(`items.${idx}.amount`, qty * price, {
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
          <Input className="h-9 text-right" readOnly value={formatAmount(row?.amount || 0)} />
        </TableCell>

        {/* ava_amount */}
        <TableCell className="text-right">{formatAmount(row?.ava_amount || 0)}</TableCell>

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
                  className="h-9 text-right"
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
          <Input className="h-9" {...control.register(`items.${idx}.remark`)} />
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
          <FormField control={control} name={`items.${idx}.ei_name`} render={({ field }) => <Input {...field} className="h-9" />} />
        </TableCell>

        {/* unit_price */}
        <TableCell>
          <FormField
            control={control}
            name={`items.${idx}.unit_price`}
            render={({ field }) => {
              const displayValue = formatAmount(field.value || 0);

              return (
                <Input
                  className="h-9 text-right"
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
                  className="h-9 text-right"
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
                  className="h-9 text-right"
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
          <Input className="h-9" {...control.register(`items.${idx}.remark`)} />
        </TableCell>

        {Menu}
      </>
    );
  }
}

export const EstimateRow = memo(RowComponent);
