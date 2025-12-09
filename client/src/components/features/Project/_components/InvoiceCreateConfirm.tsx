// InvoiceCreateConfirm.tsx
import { useState, useRef, useCallback } from 'react';
import { useOutletContext } from 'react-router';
import type { ProjectLayoutContext } from '@/pages/Project/ProjectLayout';
import type { Control, UseFormWatch } from 'react-hook-form';
import type { InvoiceFormValues } from '@/types/invoice';

import { formatAmount } from '@/utils';
import { FormItem, FormLabel } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface Props {
  control: Control<InvoiceFormValues>;
  watch: UseFormWatch<InvoiceFormValues>;
}

export type PreviewFile = {
  file: File;
  name: string;
  type: string;
  size: number;
};

export default function InvoiceCreateConfirm({ watch }: Props) {
  const { data } = useOutletContext<ProjectLayoutContext>();

  /* ------------------------------- FILE UPLOAD ------------------------------- */
  const [attachments, setAttachments] = useState<PreviewFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 파일 업로드 버튼 클릭 → input 활성화
  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  // 파일 업로드 처리
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const mapped = files.map((file) => ({
      file,
      name: file.name,
      type: file.type,
      size: file.size,
    })) as PreviewFile[];

    setAttachments((prev) => [...prev, ...mapped]);
  }, []);

  // 개별 파일 삭제
  const handleRemove = useCallback((name: string) => {
    setAttachments((prev) => prev.filter((f) => f.name !== name));
  }, []);

  /* ------------------------------- WATCH FORM DATA ------------------------------- */
  const info = watch();
  const items = info.items || [];
  const tax = Number(info.tax || 0);

  const parseNum = (v?: string | number) => {
    if (!v) return 0;
    const n = Number(String(v).replace(/,/g, ''));
    return isNaN(n) ? 0 : n;
  };

  // 항목명 + 단가 + 수량 입력된 row만 가져오기
  const validItems = items.filter((row) => {
    const title = row.il_title?.trim();
    const amountFilled = row.il_amount !== '' && row.il_amount !== undefined;
    const qtyFilled = row.il_qty !== '' && row.il_qty !== undefined;
    return title && amountFilled && qtyFilled;
  });

  const subtotal = validItems.reduce((sum, row) => sum + parseNum(row.il_amount) * parseNum(row.il_qty), 0);

  const grandTotal = Math.round(subtotal + subtotal * tax);

  return (
    <div className="col-span-2 space-y-4">
      {/* ====================== INFO SUMMARY ====================== */}
      <div>
        <div className="grid grid-cols-2 items-start gap-4">
          <Row label="프로젝트 #" value={data.project_id} />
          <Row label="프로젝트 제목" value={data.project_title} />
          <Row label="인보이스 제목" value={info.invoice_title} />
          <Row label="인보이스 수신" value={info.client_nm} />
          <Row label="담당자 이름" value={info.contact_nm} />
          <Row label="담당자 이메일" value={info.contact_email} />
          <Row label="담당자 연락처" value={info.contact_tel} />
          <Row label="발행 요청 일자" value={info.idate || '-'} />
          <Row label="PO 번호" value={info.po_no || '-'} />
          {/* ---------------------- Attachments ---------------------- */}
          <FormItem>
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileUpload} />

            <FormLabel className="flex justify-between text-gray-950">
              <span>증빙자료</span>
              <button
                type="button"
                className="text-primary-blue-500 hover:[&_svg]:fill-primary flex cursor-pointer items-center gap-1 text-sm"
                onClick={openFileDialog}>
                파일 업로드
              </button>
            </FormLabel>

            {attachments.length === 0 ? (
              <span className="text-[13px] text-gray-600">-</span>
            ) : (
              <div>
                {attachments.map((file) => (
                  <div key={file.name} className="flex items-center justify-between text-[13px]">
                    <span className="truncate">{file.name}</span>
                    <button type="button" onClick={() => handleRemove(file.name)} className="text-gray-400 hover:text-gray-700">
                      <X className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </FormItem>
        </div>
      </div>

      {/* ====================== ITEMS SUMMARY ====================== */}
      <div>
        <h3 className="mb-1 text-lg font-semibold text-gray-900">인보이스 항목</h3>

        <Table variant="primary" align="center" className="table-fixed">
          <TableHeader>
            <TableRow className="[&_th]:px-2 [&_th]:text-[13px] [&_th]:font-medium">
              <TableHead className="text-left">인보이스 항목명</TableHead>
              <TableHead className="w-[30%]">단가</TableHead>
              <TableHead className="w-[20%]">수량</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {validItems.map((row, idx) => (
              <TableRow key={idx} className="[&_td]:px-2 [&_td]:text-sm">
                <TableCell className="text-left">{row.il_title}</TableCell>
                <TableCell className="text-right">{formatAmount(parseNum(row.il_amount))}</TableCell>
                <TableCell className="text-right">{formatAmount(parseNum(row.il_qty))}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Sub Total */}
        <div className="flex justify-between bg-gray-100 px-4 py-2 text-sm font-medium">
          <span className="w-3/5 text-right">Sub Total</span>
          <span className="w-2/5 text-right">{formatAmount(subtotal)} 원</span>
        </div>

        {/* TAX */}
        <div className="flex justify-between px-4 py-2 text-sm font-medium">
          <span className="w-3/5 text-right">TAX ({tax * 100}%)</span>
          <span className="w-2/5 text-right">{formatAmount(Math.round(subtotal * tax))} 원</span>
        </div>

        {/* Grand Total */}
        <div className="bg-primary-blue-100 flex justify-between px-4 py-3 text-[13px] font-semibold">
          <span className="w-3/5 text-right">Grand Total</span>
          <span className="w-2/5 text-right">{formatAmount(grandTotal)} 원</span>
        </div>
      </div>
    </div>
  );
}

/* 재사용 가능한 Row Component */
function Row({ label, value }: { label: string; value: any }) {
  return (
    <FormItem>
      <FormLabel className="text-gray-950">{label}</FormLabel>
      <span className="text-[13px] text-gray-600">{value || '-'}</span>
    </FormItem>
  );
}
