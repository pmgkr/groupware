import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { formatDate } from '@/utils';
import type { addInfoDTO } from '@/api';

interface ExpenseDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  addInfos: addInfoDTO[] | null;
}

export function AddInfoDialog({ open, onOpenChange, addInfos }: ExpenseDetailDialogProps) {
  if (!addInfos || addInfos.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>비용 추가 정보</DialogTitle>
            <DialogDescription>외주용역비 또는 접대비의 정보를 확인할 수 있습니다.</DialogDescription>
          </DialogHeader>
          <div className="py-20 pb-24 text-center text-sm">등록된 추가 정보가 없습니다.</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-md:max-w-[calc(100%-var(--spacing)*8)] max-md:rounded-md">
        <DialogHeader>
          <DialogTitle>비용 추가 정보</DialogTitle>
          <DialogDescription>외주용역비 또는 접대비의 정보를 확인할 수 있습니다.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {addInfos.map((info) => (
            <div key={info.seq} className="grid grid-cols-2 gap-3 border-b border-dashed pb-3 last:border-0 max-md:grid-cols-1">
              {info.ent_member && <Row label="비용 유형" value="접대비" />}
              {info.tax_type && <Row label="비용 유형" value="외주용역비" />}
              {info.tax_type && <Row label="원천징수 유형" value={info.tax_type} />}
              {info.work_term && <Row label="용역 기간" value={info.work_term} />}
              {info.h_name && <Row label="성명" value={info.h_name} />}
              {info.h_ssn && <Row label="주민등록번호" value={info.h_ssn} />}
              {info.h_tel && <Row label="연락처" value={info.h_tel} />}
              {info.h_addr && <Row label="주소" value={info.h_addr} />}
              {info.ent_member && <Row label="접대 대상" value={info.ent_member} />}
              {info.ent_reason && <Row label="접대 사유" value={info.ent_reason} />}
              <Row label="작성일" value={formatDate(info.wdate)} />
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex flex-col">
      <span className="text-base text-gray-950 max-md:text-[13px]">{label}</span>
      <span className="text-[13px] text-gray-600 max-md:text-sm">{value}</span>
    </div>
  );
}
