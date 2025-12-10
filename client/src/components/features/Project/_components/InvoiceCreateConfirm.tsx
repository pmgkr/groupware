// InvoiceCreateConfirm.tsx
import { useRef, useCallback } from 'react';
import { useOutletContext } from 'react-router';
import { cn } from '@/lib/utils';
import type { ProjectLayoutContext } from '@/pages/Project/ProjectLayout';
import type { Control, UseFormWatch } from 'react-hook-form';
import type { InvoiceFormValues } from '@/types/invoice';
import { FILE_ACCEPT_ALL } from '@/constants/fileAccept';
import { validateFiles } from '@/utils/fileValidator';

import { type PreviewFile } from './InvoiceCreate';
import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';

import { formatAmount } from '@/utils';
import { FormItem, FormLabel } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { OctagonAlert, X } from 'lucide-react';

interface Props {
  control: Control<InvoiceFormValues>;
  watch: UseFormWatch<InvoiceFormValues>;

  attachments: PreviewFile[];
  setAttachments: React.Dispatch<React.SetStateAction<PreviewFile[]>>;
}

export default function InvoiceCreateConfirm({ watch, attachments, setAttachments }: Props) {
  const { addAlert } = useAppAlert();
  const { data } = useOutletContext<ProjectLayoutContext>();

  /* ------------------------------- FILE UPLOAD ------------------------------- */
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 파일 업로드 버튼 클릭 → input 활성화
  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  // 파일 업로드 처리
  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;

      const { valid, message } = validateFiles(files, { allow: FILE_ACCEPT_ALL });

      if (!valid) {
        addAlert({
          title: '업로드 실패',
          message: `<p>${message?.replace(/\n/g, '<br/>')}</p>`,
          icon: <OctagonAlert />,
          duration: 2000,
        });
        return;
      }

      const mapped = files.map((file) => ({ file, name: file.name, type: file.type, size: file.size })) as PreviewFile[];
      setAttachments((prev) => [...prev, ...mapped]);
    },
    [attachments, setAttachments]
  );

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
    const title = row.ii_title?.trim();
    const amountFilled = row.ii_amount !== '' && row.ii_amount !== undefined;
    const qtyFilled = row.ii_qty !== '' && row.ii_qty !== undefined;
    return title && amountFilled && qtyFilled;
  });

  const subtotal = validItems.reduce((sum, row) => sum + parseNum(row.ii_amount) * parseNum(row.ii_qty), 0);

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
          <Row label="비고" value={info.remark || '-'} />
          {/* ---------------------- Attachments ---------------------- */}
          <FormItem className="col-span-2">
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
              attachments.map((file) => (
                <div key={file.name} className="flex items-center justify-between gap-2 overflow-hidden text-[13px] text-gray-600">
                  <span className="flex-1 truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemove(file.name)}
                    className="shrink-0 cursor-pointer text-gray-400 hover:text-gray-700">
                    <X className="size-4" />
                  </button>
                </div>
              ))
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
              <TableHead className="w-[26%]">단가</TableHead>
              <TableHead className="w-[16%]">수량</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {validItems.map((row, idx) => (
              <TableRow key={idx} className="[&_td]:px-2 [&_td]:text-sm">
                <TableCell className="text-left">{row.ii_title}</TableCell>
                <TableCell className="text-right">{formatAmount(parseNum(row.ii_amount))}</TableCell>
                <TableCell className="text-right">{formatAmount(parseNum(row.ii_qty))}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Sub Total */}
        <Summary label="Sub Total" value={`${formatAmount(subtotal)} 원`} />
        <Summary label={`TAX (${tax * 100}%)`} value={`${formatAmount(Math.round(subtotal * tax))} 원`} bg="white" />
        <Summary label="Grand Total" value={`${formatAmount(grandTotal)} 원`} bg="blue" />
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

function Summary({ label, value, bg }: { label: string; value: string; bg?: string }) {
  return (
    <div
      className={cn(
        'flex justify-between px-4 py-2 text-sm font-medium',
        bg === 'blue' ? 'bg-primary-blue-100' : bg === 'white' ? 'bg-wthie' : 'bg-gray-100'
      )}>
      <span className="w-3/5 text-right">{label}</span>
      <span className="w-2/5 text-right">{value}</span>
    </div>
  );
}
