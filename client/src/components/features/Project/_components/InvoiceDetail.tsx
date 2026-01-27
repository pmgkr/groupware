import { cn } from '@/lib/utils';
import { type InvoiceDetailDTO } from '@/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatAmount } from '@/utils';

export function InvoicePreviewDialog({ open, onClose, detail }: { open: boolean; onClose: () => void; detail: InvoiceDetailDTO | null }) {
  if (!detail) return null;

  const { header, items, attachment } = detail;

  const subtotal = items.reduce((s, i) => s + i.ii_amount * i.ii_qty, 0);
  const taxAmount = header.invoice_tax;
  const total = header.invoice_total;

  const userAttachments = attachment.filter((a) => a.ia_role === 'user');
  const financeAttachments = attachment.filter((a) => a.ia_role === 'finance');

  const statusMap = {
    Claimed: <Badge variant="secondary">승인대기</Badge>,
    Confirmed: <Badge>승인완료</Badge>,
    Rejected: <Badge className="bg-destructive">반려됨</Badge>,
  } as const;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="flex h-full max-h-full flex-col overflow-hidden md:h-auto md:max-h-[90vh] md:max-w-xl">
        <DialogHeader className="shrink-0">
          <DialogTitle>인보이스 상세</DialogTitle>
        </DialogHeader>
        <div className="flex-1 space-y-4 overflow-y-auto pb-1">
          {/* ---- INFO ---- */}
          <div className="grid grid-cols-2 gap-3">
            <Row label="프로젝트 #" value={header.project_id} />
            <Row label="인보이스 #" value={header.invoice_id} />
            <Row label="인보이스 제목" value={header.invoice_title} />
            <Row label="인보이스 수신" value={header.client_nm} />
            <Row label="인보이스 작성자" value={header.user_nm} />
            <Row label="인보이스 상태" value={statusMap[header.invoice_status as keyof typeof statusMap]} />
            <Row label="담당자 이름" value={header.contact_nm} />
            <Row label="담당자 이메일" value={header.contact_email} />
            <Row label="담당자 연락처" value={header.contact_tel || '-'} />
            <Row label="발행 요청 일자" value={header.idate || '-'} />
            <Row label="PO 번호" value={header.po_no || '-'} />
            <Row label="비고" value={header.remark || '-'} />

            {/* ---- 사용자 첨부(user) ---- */}
            {userAttachments.length > 0 && (
              <div className="flex flex-col">
                <div className="text-base text-gray-950">작성자 첨부파일</div>
                <div className="text-[13px] text-gray-600">
                  {userAttachments.map((a) => (
                    <div key={a.ia_seq}>
                      <a href={a.ia_url} target="_blank">
                        {a.ia_fname}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ---- 회계팀 첨부(finance) ---- */}
            {financeAttachments.length > 0 && (
              <div className="flex flex-col">
                <div className="text-base text-gray-950">파이낸스 첨부파일</div>
                <div className="text-[13px] text-gray-600">
                  {financeAttachments.map((a) => (
                    <div key={a.ia_seq}>
                      <a href={a.ia_url} target="_blank">
                        {a.ia_fname}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {header.rej_reason && (
              <div className="col-span-2 flex flex-col">
                <div className="text-base text-gray-950">반려 사유</div>
                <div className="text-destructive text-[13px]">{header.rej_reason}</div>
              </div>
            )}
          </div>

          {/* ---- ITEMS ---- */}
          <div>
            <Table variant="primary" align="center" className="table-fixed">
              <TableHeader>
                <TableRow className="[&_th]:h-auto [&_th]:px-2.5 [&_th]:py-2 [&_th]:text-sm [&_th]:font-medium">
                  <TableHead className="text-left">인보이스 항목명</TableHead>
                  <TableHead className="w-[30%]">단가</TableHead>
                  <TableHead className="w-[20%]">수량</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((it) => (
                  <TableRow key={it.ii_seq} className="hover:bg-muted/15 [&_td]:px-2 [&_td]:text-sm">
                    <TableCell className="text-left">{it.ii_title}</TableCell>
                    <TableCell className="text-right">{formatAmount(it.ii_amount)}</TableCell>
                    <TableCell className="text-right">{formatAmount(it.ii_qty)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* ---- TOTAL ---- */}
            <Summary label="Sub Total" value={`${formatAmount(subtotal)} 원`} />
            <Summary label={`TAX`} value={`${formatAmount(taxAmount)} 원`} bg="white" />
            <Summary label="Grand Total" value={`${formatAmount(total)} 원`} bg="blue" />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" className="max-md:flex-1" onClick={onClose}>
              닫기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex flex-col">
      <span className="text-base text-gray-950">{label}</span>
      <span className="text-[13px] text-gray-600">{value}</span>
    </div>
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
