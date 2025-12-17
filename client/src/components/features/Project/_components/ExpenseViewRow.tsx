// components/ExpenseViewRow.tsx
import { Link } from 'react-router';

import { formatAmount } from '@/utils';
import { Button } from '@/components/ui/button';
import { TableRow, TableCell } from '@/components/ui/table';
import type { pExpenseItemDTO } from '@/api';

interface ExpenseViewRowProps {
  item: pExpenseItemDTO;
  onProposal?: () => void;
}

export default function ExpenseViewRow({ item, onProposal }: ExpenseViewRowProps) {
  const formatDate = (d?: string | Date | null) => {
    if (!d) return '';
    const date = typeof d === 'string' ? new Date(d) : d;
    return new Intl.DateTimeFormat('ko-KR').format(date);
  };

  return (
    <TableRow className="[&_td]:text-[13px]">
      <TableCell>{item.ei_type}</TableCell>
      <TableCell>{item.ei_title}</TableCell>

      {/* 매입일자 */}
      <TableCell className="px-4">{formatDate(item.ei_pdate)}</TableCell>

      {/* 금액 */}
      <TableCell className="text-right">{formatAmount(item.ei_amount)}원</TableCell>

      {/* 세금 */}
      <TableCell className="text-right">{item.ei_tax === 0 ? 0 : `${formatAmount(item.ei_tax)}원`}</TableCell>

      {/* 합계 */}
      <TableCell className="text-right">{formatAmount(item.ei_total)}원</TableCell>

      {/* 증빙자료 */}
      {item.attachments && item.attachments.length > 0 ? (
        <TableCell>
          <ul>
            {item.attachments.map((att, idx) => (
              <li key={idx} className="overflow-hidden text-sm text-gray-800">
                <a
                  href={`${import.meta.env.VITE_API_ORIGIN}/uploads/pexpense/${att.ea_sname}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1">
                  {/* 파일명 */}
                  <span className="overflow-hidden text-left text-ellipsis whitespace-nowrap hover:underline">{att.ea_fname}</span>
                </a>
              </li>
            ))}
          </ul>
        </TableCell>
      ) : (
        <TableCell>-</TableCell>
      )}
      <TableCell className="px-1 text-center [&_button]:rounded-xl [&_button]:border [&_button]:text-xs [&_button]:transition-none">
        {item.pro_id ? (
          <Link to={`/project/proposal/view/${item.pro_id}`} target="_blank" rel="noopener noreferrer">
            {/* <LinkIcon className="mx-auto size-4" /> */}
            <Button size="xs" variant="outline" onClick={onProposal}>
              기안서보기
            </Button>
          </Link>
        ) : (
          <span>-</span>
        )}
      </TableCell>
    </TableRow>
  );
}
