// InvoiceCreateItems.tsx
import { useCallback } from 'react';
import { useFieldArray } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Control, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import type { InvoiceFormValues } from '@/types/invoice';
import { formatAmount } from '@/utils';

interface Props {
  control: Control<InvoiceFormValues>;
  watch: UseFormWatch<InvoiceFormValues>;
  setValue: UseFormSetValue<InvoiceFormValues>;
}

export default function InvoiceItemsForm({ control, watch, setValue }: Props) {
  const { fields, append } = useFieldArray({
    control,
    name: 'items',
  });

  const items = watch('items') || [];
  const tax = Number(watch('tax') || 0);

  // 금액 변경 처리
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const raw = e.target.value.replace(/,/g, '').replace(/(?!^)-/g, ''); // '-'는 맨 앞만 허용

    if (!/^-?\d*$/.test(raw)) return;

    setValue(`items.${idx}.ii_amount`, raw);
  };

  // 수량 변경 처리
  const handleQtyChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const raw = e.target.value.replace(/,/g, '');
    if (!/^\d*$/.test(raw)) return;

    setValue(`items.${idx}.ii_qty`, raw);
  };

  // 계산 안전 처리 (공백 → 0)
  const parseNum = (v?: string | number) => {
    if (!v) return 0;
    const n = Number(String(v).replace(/,/g, ''));
    return isNaN(n) ? 0 : n;
  };

  const subtotal = items.reduce((sum, row) => {
    return sum + parseNum(row.ii_amount) * parseNum(row.ii_qty);
  }, 0);

  const grandTotal = Math.round(subtotal + subtotal * tax);

  // 항목 추가 버튼 클릭 시
  const handleAddRow = useCallback(() => {
    append({ ii_title: '', ii_amount: '', ii_qty: '' });
  }, [append]);

  return (
    <div className="col-span-2">
      {/* 헤더 */}
      <Table variant="primary" align="center" className="table-fixed">
        <TableHeader>
          <TableRow className="[&_th]:px-2 [&_th]:text-[13px] [&_th]:font-medium">
            <TableHead className="text-left">인보이스 항목명</TableHead>
            <TableHead className="w-[30%]">단가</TableHead>
            <TableHead className="w-[20%]">수량</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fields.map((field, idx) => (
            <TableRow
              key={field.id}
              className="hover:bg-muted/15 [&_input]:text-[13px] [&_input]:placeholder:text-[13px] [&_td]:px-2 [&_td]:text-[13px]">
              <TableCell>
                <Input {...control.register(`items.${idx}.ii_title`)} placeholder="항목명" className="h-9" />
              </TableCell>
              <TableCell>
                <Input
                  inputMode="numeric"
                  value={items[idx]?.ii_amount === '' ? '' : formatAmount(parseNum(items[idx]?.ii_amount))}
                  onChange={(e) => handleAmountChange(e, idx)}
                  className="h-9 text-right"
                  placeholder="단가"
                />
              </TableCell>
              <TableCell>
                <Input
                  inputMode="numeric"
                  value={items[idx]?.ii_qty === '' ? '' : formatAmount(parseNum(items[idx]?.ii_qty))}
                  onChange={(e) => handleQtyChange(e, idx)}
                  className="h-9 text-right"
                  placeholder="수량"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {/* Total */}
      <div className="flex justify-between bg-gray-100 px-4 py-3 text-[13px] leading-[1.3] font-medium">
        <span className="w-[60%] text-right">Sub Total</span>
        <span className="w-[40%] text-right">{formatAmount(subtotal)} 원</span>
      </div>

      {/* TAX */}
      <div className="flex items-center justify-between border-t-1 border-t-gray-300 py-2 text-[13px] leading-[1.3]">
        <span className="w-[60%] text-right font-medium">TAX</span>
        <div className="w-[20%] px-2">
          <Select value={watch('tax')} onValueChange={(v) => setValue('tax', v)} defaultValue="0.1">
            <SelectTrigger className="h-8! w-full text-sm!">
              <SelectValue placeholder="선택" />
            </SelectTrigger>
            <SelectContent className="min-w-auto!">
              <SelectItem size="sm" value="0">
                0%
              </SelectItem>
              <SelectItem size="sm" value="0.1">
                10%
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 총 금액 */}
      <div className="bg-primary-blue-100 flex justify-between border-t-1 border-t-gray-300 px-4 py-3 text-[13px] leading-[1.3] font-medium">
        <span className="w-[60%] text-right">Grand Total</span>
        <span className="w-[40%] text-right">{formatAmount(grandTotal)} 원</span>
      </div>

      <div className="mt-2 flex justify-end">
        <Button type="button" size="xs" className="text-xs" onClick={handleAddRow}>
          항목 추가
        </Button>
      </div>
    </div>
  );
}
