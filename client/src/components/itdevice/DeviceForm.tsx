import { TableColumn, TableColumnHeader, TableColumnHeaderCell, TableColumnBody, TableColumnCell } from '@/components/ui/tableColumn';
import { Select, SelectGroup, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/assets/images/icons';
import { DayPicker } from '../daypicker';
import { useState } from 'react';
import { formatKST } from '@/utils';
import { Button } from '../ui/button';

export type DeviceFormData = {
  device: string;
  brand: string;
  model: string;
  serial: string;
  os?: string;
  ram?: string;
  gpu?: string;
  storage?: string;
  p_date: string;
};

type DeviceFormProps = {
  form: DeviceFormData;
  onChange: (key: keyof DeviceFormData, value: string) => void;
  mode?: 'create' | 'edit' | 'view'; // 기본은 등록
};

export function DeviceForm({ form, onChange, mode = 'create' }: DeviceFormProps) {
  const readOnly = mode === 'view';

  const [open, setOpen] = useState(false);
  const [selectDate, setSelectDate] = useState(form.p_date || formatKST(new Date(), true));
  const date = new Date(selectDate);

  return (
    <TableColumn>
      <TableColumnHeader className="text-base">
        <TableColumnHeaderCell>디바이스</TableColumnHeaderCell>
        <TableColumnHeaderCell>브랜드</TableColumnHeaderCell>
        <TableColumnHeaderCell>모델</TableColumnHeaderCell>
        <TableColumnHeaderCell>시리얼넘버</TableColumnHeaderCell>
        {form.device === 'Laptop' && (
          <>
            <TableColumnHeaderCell>OS</TableColumnHeaderCell>
            <TableColumnHeaderCell>RAM</TableColumnHeaderCell>
            <TableColumnHeaderCell>GPU</TableColumnHeaderCell>
            <TableColumnHeaderCell>SSD-HDD</TableColumnHeaderCell>
          </>
        )}
        <TableColumnHeaderCell>구매일자</TableColumnHeaderCell>
      </TableColumnHeader>

      <TableColumnBody className="text-base">
        {/* 디바이스 */}
        <TableColumnCell className={readOnly ? 'px-4 py-2.5' : 'p-0'}>
          {readOnly ? (
            form.device
          ) : (
            <Select value={form.device} onValueChange={(value) => onChange('device', value)}>
              <SelectTrigger className="w-full border-0 bg-transparent pl-4 [&]:hover:bg-transparent">
                <SelectValue placeholder="선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="Monitor">Monitor</SelectItem>
                  <SelectItem value="Laptop">Laptop</SelectItem>
                  <SelectItem value="Desktop">Desktop</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
        </TableColumnCell>

        {/* 브랜드 */}
        <TableColumnCell>
          {readOnly ? form.brand : <input type="text" value={form.brand} onChange={(e) => onChange('brand', e.target.value)} />}
        </TableColumnCell>

        {/* 모델 */}
        <TableColumnCell>
          {readOnly ? form.model : <input type="text" value={form.model} onChange={(e) => onChange('model', e.target.value)} />}
        </TableColumnCell>

        {/* 시리얼 */}
        <TableColumnCell>
          {readOnly ? form.serial : <input type="text" value={form.serial} onChange={(e) => onChange('serial', e.target.value)} />}
        </TableColumnCell>

        {/* Laptop 전용 필드 */}
        {form.device === 'Laptop' && (
          <>
            <TableColumnCell>
              {readOnly ? form.os || '-' : <input type="text" value={form.os} onChange={(e) => onChange('os', e.target.value)} />}
            </TableColumnCell>
            <TableColumnCell>
              {readOnly ? form.ram || '-' : <input type="text" value={form.ram} onChange={(e) => onChange('ram', e.target.value)} />}
            </TableColumnCell>
            <TableColumnCell>
              {readOnly ? form.gpu || '-' : <input type="text" value={form.gpu} onChange={(e) => onChange('gpu', e.target.value)} />}
            </TableColumnCell>
            <TableColumnCell>
              {readOnly ? (
                form.storage || '-'
              ) : (
                <input type="text" value={form.storage} onChange={(e) => onChange('storage', e.target.value)} />
              )}
            </TableColumnCell>
          </>
        )}

        {/* 구매일자 */}
        <TableColumnCell className={readOnly ? 'px-4 py-2.5' : 'p-0'}>
          {readOnly ? (
            form.p_date
          ) : (
            <Popover open={open} onOpenChange={setOpen}>
              <div className="relative">
                <PopoverTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-[45px] w-full rounded-none border-0 px-5 text-left font-normal text-gray-900 shadow-none">
                    <Calendar className="ml-auto size-4.5 opacity-50" />
                    {selectDate}
                  </Button>
                </PopoverTrigger>
              </div>
              <PopoverContent className="w-auto p-0" align="start">
                <DayPicker
                  key={selectDate}
                  captionLayout="dropdown"
                  mode="single"
                  selected={date}
                  month={date}
                  onSelect={(d) => {
                    if (!d) return;
                    setSelectDate(formatKST(d, true));
                    onChange('p_date', formatKST(d, true));
                    setOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          )}
        </TableColumnCell>
      </TableColumnBody>
    </TableColumn>
  );
}
