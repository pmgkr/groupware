import { memo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuGroup } from '@/components/ui/dropdown-menu';
import { TableCell } from '@/components/ui/table';
import { GripVertical, Ellipsis, ArrowUp, ArrowDown, X } from 'lucide-react';
import { formatAmount } from '@/utils';
import { SortableItemHandle } from '@/components/ui/sortable';
import { FormField } from '@/components/ui/form';
import type { Control, UseFormSetValue } from 'react-hook-form';

interface EstimateRowProps {
  field: any;
  idx: number;

  control: Control<any>;
  watch: (name: string) => any;
  setValue: UseFormSetValue<any>;

  onAddRow: (dir: 'up' | 'down', idx: number) => void;
  onRemoveRow: (idx: number) => void;
}

function EstimateRowComponent({ field, idx, control, watch, setValue, onAddRow, onRemoveRow }: EstimateRowProps) {
  const type = field.ei_type;

  // -----------------------------------------
  // 공통 Drag Handle (첫 번째 TD)
  // -----------------------------------------
  const DragHandle = (bg?: string) => (
    <TableCell className={`${bg} px-0`} data-drag-handle>
      <SortableItemHandle asChild>
        <Button variant="svgIcon" size="icon" className="size-5 align-middle">
          <GripVertical className="size-4 text-gray-600" />
        </Button>
      </SortableItemHandle>
    </TableCell>
  );

  // -----------------------------------------
  // 공통 Menu (마지막 TD)
  // -----------------------------------------
  const Menu = (bg?: string) => (
    <TableCell className={`${bg} px-0`}>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="svgIcon" size="icon" className="size-5 align-middle">
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

  // ==========================================================================
  // 🔵 TYPE: TITLE  (9개 TD)
  // ==========================================================================
  if (type === 'title') {
    return (
      <>
        {DragHandle()}
        <TableCell className="pl-1">
          <FormField
            control={control}
            name={`items.${idx}.ei_name`}
            render={({ field }) => <Input className="h-9 font-bold" {...field} />}
          />
        </TableCell>
        <TableCell colSpan={6}></TableCell>
        {Menu()}
      </>
    );
  }

  // ==========================================================================
  // 🔵 TYPE: SUBTOTAL  (9개 TD)
  // bg-gray-100 적용
  // ==========================================================================
  if (type === 'subtotal') {
    return (
      <>
        {DragHandle('bg-gray-100')}

        <TableCell className="bg-gray-100 pl-1 font-semibold" colSpan={3}>
          Sub Total
        </TableCell>

        <TableCell className="bg-gray-100 text-right font-semibold">{formatAmount(watch(`items.${idx}.amount`))}</TableCell>

        <TableCell className="bg-gray-100" colSpan={3}></TableCell>

        {Menu('bg-gray-100')}
      </>
    );
  }

  // ==========================================================================
  // 🔵 TYPE: GRANDTOTAL (9개 TD)
  // bg-primary-blue-150 적용
  // ==========================================================================
  if (type === 'grandtotal') {
    return (
      <>
        {DragHandle('bg-primary-blue-150')}

        <TableCell className="bg-primary-blue-150 pl-1 font-semibold" colSpan={3}>
          Grand Total
        </TableCell>

        <TableCell className="bg-primary-blue-150 text-right font-semibold">{formatAmount(watch(`items.${idx}.amount`))}</TableCell>

        <TableCell className="bg-primary-blue-150"></TableCell>

        <TableCell className="bg-primary-blue-150 text-right font-semibold">{formatAmount(watch(`items.${idx}.exp_cost`))}</TableCell>

        <TableCell className="bg-primary-blue-150"></TableCell>

        {Menu('bg-primary-blue-150')}
      </>
    );
  }

  // ==========================================================================
  // 🔵 TYPE: DISCOUNT (9개 TD)
  // bg-gray-300 적용 + '-' 단독 입력 허용
  // ==========================================================================
  if (type === 'discount') {
    return (
      <>
        {DragHandle('bg-gray-300')}

        <TableCell className="bg-gray-300 pl-1 font-semibold" colSpan={3}>
          Discount
        </TableCell>

        <TableCell className="bg-gray-300 text-right">
          <FormField
            control={control}
            name={`items.${idx}.amount`}
            render={({ field }) => {
              const rawValue = field.value;
              const displayValue = rawValue === '-' ? '-' : rawValue ? formatAmount(Number(rawValue)) : '';

              return (
                <Input
                  className="h-9 text-right"
                  value={displayValue}
                  onChange={(e) => {
                    let raw = e.target.value;

                    raw = raw.replace(/[^0-9-]/g, '');
                    raw = raw.replace(/(?!^)-/g, '');

                    if (raw === '-') return field.onChange('-');
                    if (raw === '') return field.onChange('');

                    field.onChange(Number(raw));
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

        {Menu('bg-gray-300')}
      </>
    );
  }

  // ==========================================================================
  // 🔵 TYPE: AGENCY FEE (9개 TD)
  // ==========================================================================
  if (type === 'agency_fee') {
    return (
      <>
        {DragHandle()}

        <TableCell className="pl-1">
          <Input className="h-9" {...control.register(`items.${idx}.ei_name`)} />
        </TableCell>

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
                  field.onChange(Number(raw || 0));
                }}
              />
            )}
          />
        </TableCell>

        <TableCell></TableCell>

        <TableCell className="text-right">
          <FormField
            control={control}
            name={`items.${idx}.amount`}
            render={({ field }) => <Input className="h-9 text-right" value={field.value ? formatAmount(field.value) : ''} readOnly />}
          />
        </TableCell>

        <TableCell className="text-right">{formatAmount(watch(`items.${idx}.ava_amount`))}</TableCell>

        <TableCell>
          <FormField
            control={control}
            name={`items.${idx}.exp_cost`}
            render={({ field }) => (
              <Input
                className="h-9 text-right"
                value={field.value ? formatAmount(field.value) : ''}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^\d]/g, '');
                  field.onChange(Number(raw || 0));
                }}
              />
            )}
          />
        </TableCell>

        <TableCell>
          <Input className="h-9" {...control.register(`items.${idx}.remark`)} />
        </TableCell>

        {Menu()}
      </>
    );
  }

  // ==========================================================================
  // 🔵 TYPE: ITEM (기본 9개 TD)
  // ==========================================================================
  return (
    <>
      {DragHandle()}

      <TableCell className="pl-1">
        <FormField control={control} name={`items.${idx}.ei_name`} render={({ field }) => <Input className="h-9" {...field} />} />
      </TableCell>

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

                const qty = watch(`items.${idx}.qty`) || 0;
                setValue(`items.${idx}.amount`, num * qty);
              }}
            />
          )}
        />
      </TableCell>

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
                raw = raw.replace(/(\..*)\./g, '$1');

                const num = raw === '' ? 0 : Number(raw);
                field.onChange(num);

                const price = watch(`items.${idx}.unit_price`) || 0;
                setValue(`items.${idx}.amount`, price * num);
              }}
            />
          )}
        />
      </TableCell>

      <TableCell>
        <FormField
          control={control}
          name={`items.${idx}.amount`}
          render={({ field }) => <Input className="h-9 text-right" readOnly value={formatAmount(field.value ?? 0)} />}
        />
      </TableCell>

      <TableCell className="text-right">{formatAmount(watch(`items.${idx}.ava_amount`))}</TableCell>

      <TableCell>
        <FormField
          control={control}
          name={`items.${idx}.exp_cost`}
          render={({ field }) => (
            <Input
              className="h-9 text-right"
              value={field.value ? formatAmount(field.value) : ''}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^\d]/g, '');
                field.onChange(Number(raw || 0));
              }}
            />
          )}
        />
      </TableCell>

      <TableCell>
        <Input className="h-9" {...control.register(`items.${idx}.remark`)} />
      </TableCell>

      {Menu()}
    </>
  );
}

export const EstimateRow = memo(EstimateRowComponent);
