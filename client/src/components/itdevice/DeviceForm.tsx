import { TableColumn, TableColumnHeader, TableColumnHeaderCell, TableColumnBody, TableColumnCell } from '@/components/ui/tableColumn';
import { Select, SelectGroup, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textbox } from '@/components/ui/textbox';

export type DeviceFormData = {
  device: string;
  brand: string;
  model: string;
  serial: string;
  os?: string;
  ram?: string;
  gpu?: string;
  ssdhdd?: string;
  p_date: string;
};

type DeviceFormProps = {
  form: DeviceFormData;
  onChange: (key: keyof DeviceFormData, value: string) => void;
  mode?: 'create' | 'edit' | 'view'; // 기본은 등록
};

export function DeviceForm({ form, onChange, mode = 'create' }: DeviceFormProps) {
  const readOnly = mode === 'view';

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
              {readOnly ? form.os : <input type="text" value={form.os} onChange={(e) => onChange('os', e.target.value)} />}
            </TableColumnCell>
            <TableColumnCell>
              {readOnly ? form.ram : <input type="text" value={form.ram} onChange={(e) => onChange('ram', e.target.value)} />}
            </TableColumnCell>
            <TableColumnCell>
              {readOnly ? form.gpu : <input type="text" value={form.gpu} onChange={(e) => onChange('gpu', e.target.value)} />}
            </TableColumnCell>
            <TableColumnCell>
              {readOnly ? form.ssdhdd : <input type="text" value={form.ssdhdd} onChange={(e) => onChange('ssdhdd', e.target.value)} />}
            </TableColumnCell>
          </>
        )}

        {/* 구매일자 */}
        <TableColumnCell className={readOnly ? 'px-4 py-2.5' : 'p-0'}>
          {readOnly ? (
            form.p_date
          ) : (
            <Textbox
              id="entryDate"
              type="date"
              className="w-full justify-start border-0"
              value={form.p_date}
              onChange={(e) => onChange('p_date', e.target.value)}
            />
          )}
        </TableColumnCell>
      </TableColumnBody>
    </TableColumn>
  );
}
