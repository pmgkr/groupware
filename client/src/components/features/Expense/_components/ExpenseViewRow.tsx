import type { addInfoDTO } from '@/api/project';
import type { ExpenseItemDTO } from '@/api/expense';
import { formatAmount, normalizeAttachmentUrl } from '@/utils';
import { format } from 'date-fns';
import { Paperclip } from 'lucide-react';

const formatDate = (d?: string | Date | null) => {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  return format(date, 'yyyy-MM-dd');
};

interface ExpenseViewRowProps {
  item: ExpenseItemDTO;
  onAddInfo: (addInfos?: addInfoDTO[]) => void;
  actionCell: React.ReactNode;
}

export default function ExpenseViewRow({ item, onAddInfo, actionCell }: ExpenseViewRowProps) {
  return (
    <div className="overflow-hidden rounded-lg border-1 border-gray-300">
      <div className="flex border-b-1 border-gray-300 px-2 py-2.5">
        <ExpRow className="w-[10%]">
          <ExpTitle label="비용 용도" />
          <ExpContent>
            {(item.ei_type === '외주용역비' || item.ei_type === '접대비') && (item.expense_add_info ?? []).length > 0 ? (
              <span className="text-primary cursor-pointer underline" onClick={() => onAddInfo(item.expense_add_info)}>
                {item.ei_type}
              </span>
            ) : (
              item.ei_type
            )}
          </ExpContent>
        </ExpRow>

        <ExpRow className="flex-1">
          <ExpTitle label="가맹점명" />
          <ExpContent>{item.ei_title}</ExpContent>
        </ExpRow>

        <ExpRow className="w-[14%]">
          <ExpTitle label="매입일자" />
          <ExpContent>{item.ei_pdate ? formatDate(item.ei_pdate) : '-'}</ExpContent>
        </ExpRow>

        <ExpRow className="w-[14%]">
          <ExpTitle label="금액 (A)" />
          <ExpContent>
            <strong>{formatAmount(item.ei_amount)}</strong>원
          </ExpContent>
        </ExpRow>

        <ExpRow className="w-[14%]">
          <ExpTitle label="세금" />
          <ExpContent>
            <strong>{item.ei_tax === 0 ? 0 : formatAmount(item.ei_tax)}</strong>
            {item.ei_tax !== 0 && '원'}
          </ExpContent>
        </ExpRow>

        <ExpRow className="w-[14%]">
          <ExpTitle label="합계" />
          <ExpContent className="text-primary-blue">
            <strong>{formatAmount(item.ei_total)}</strong>원
          </ExpContent>
        </ExpRow>

        <ExpRow className="w-[10%] [&_button]:rounded-xl [&_button]:border [&_button]:text-xs [&_button]:transition-none">
          <ExpTitle label="기안서" />
          <ExpContent>{actionCell ?? '-'}</ExpContent>
        </ExpRow>
      </div>

      {item.remark && (
        <div className="flex items-start border-b-1 border-dashed border-gray-300 bg-[#faf9f9] px-4 py-3 text-[13px] leading-[1.4]">
          <strong className="w-[10%] shrink-0 text-gray-700">비고</strong>
          <p className="break-keep text-gray-900">{item.remark}</p>
        </div>
      )}

      <div className="flex items-center bg-[#faf9f9] px-4 py-2 text-[13px] leading-[1.4]">
        <strong className="w-[10%] shrink-0 text-gray-700">
          증빙자료 {item.attachments.length > 0 && <span className="text-primary-blue-500">{item.attachments.length}</span>}
        </strong>

        {item.attachments && item.attachments.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {item.attachments.map((att, idx) => (
              <li key={idx} className="overflow-hidden">
                <a
                  href={normalizeAttachmentUrl(att.ea_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex max-w-45 items-center gap-1 rounded-[6px] border-1 border-gray-300 bg-white px-2 py-1 text-sm text-gray-600 hover:bg-gray-50">
                  <Paperclip className="size-3.5 shrink-0 text-gray-600" />
                  <span className="truncate hover:underline">{att.ea_fname}</span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-muted-foreground py-1.5">등록된 증빙자료가 없습니다.</span>
        )}
      </div>
    </div>
  );
}

function ExpRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`shrink-0 px-2 ${className ?? ''}`}>{children}</div>;
}

function ExpTitle({ label }: { label: string }) {
  return <div className="text-sm text-gray-500">{label}</div>;
}

function ExpContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`text-base leading-[1.3] text-gray-900 ${className ?? ''}`}>{children}</div>;
}
