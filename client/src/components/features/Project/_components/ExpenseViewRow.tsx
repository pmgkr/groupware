import type { addInfoDTO } from '@/api/project';
import { formatAmount, normalizeAttachmentUrl } from '@/utils';
import { format } from 'date-fns';
import { File } from 'lucide-react';
import { TableRow, TableCell } from '@/components/ui/table';
import type { pExpenseItemDTO } from '@/api';

const formatDate = (d?: string | Date | null) => {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  return format(date, 'yyyy-MM-dd');
};

interface ExpenseViewRowProps {
  item: pExpenseItemDTO;
  onAddInfo: (addInfos?: addInfoDTO[]) => void;
  actionCell: React.ReactNode;
}

export default function ExpenseViewRow({ item, onAddInfo, actionCell }: ExpenseViewRowProps) {
  return (
    <TableRow className="[&_td]:text-[13px]">
      <TableCell>
        {(item.ei_type === '외주용역비' || item.ei_type === '접대비') && (item.expense_add_info ?? []).length > 0 ? (
          <span className="text-primary cursor-pointer underline" onClick={() => onAddInfo(item.expense_add_info)}>
            {item.ei_type}
          </span>
        ) : (
          item.ei_type
        )}
      </TableCell>
      <TableCell>{item.ei_title}</TableCell>
      <TableCell className="px-4">{formatDate(item.ei_pdate)}</TableCell>
      <TableCell className="text-right">{formatAmount(item.ei_amount)}원</TableCell>
      <TableCell className="text-right">{item.ei_tax === 0 ? 0 : `${formatAmount(item.ei_tax)}원`}</TableCell>
      <TableCell className="text-right">{formatAmount(item.ei_total)}원</TableCell>
      {item.attachments && item.attachments.length > 0 ? (
        <TableCell>
          <ul>
            {item.attachments.map((att, idx) => (
              <li key={idx} className="overflow-hidden text-sm text-gray-800">
                <a href={normalizeAttachmentUrl(att.ea_url)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1">
                  <File className="size-3.5 shrink-0" />
                  <span className="truncate text-left hover:underline">{att.ea_fname}</span>
                </a>
              </li>
            ))}
          </ul>
        </TableCell>
      ) : (
        <TableCell>-</TableCell>
      )}
      <TableCell className="px-1 text-center [&_button]:rounded-xl [&_button]:border [&_button]:text-xs [&_button]:transition-none">
        {actionCell}
      </TableCell>
    </TableRow>
  );
}
