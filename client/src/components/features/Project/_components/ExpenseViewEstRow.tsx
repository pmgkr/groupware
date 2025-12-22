import { formatAmount, normalizeAttachmentUrl } from '@/utils';
import { format } from 'date-fns';
import { File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableRow, TableCell } from '@/components/ui/table';
import type { pExpenseItemWithMatch } from '../hooks/useProjectExpenseMatching';

export interface EstimateViewEstRowProps {
  item: pExpenseItemWithMatch;
  idx: number;
  onMatched: () => void;
  onMatching: () => void;
  onSetMatching: () => void;

  // 상태 flags
  alreadyMatched: boolean;
  isMatched: boolean;
  isMatching: boolean;
  isWaiting: boolean;
}

const formatDate = (d?: string | Date | null) => {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  return format(date, 'yyyy-MM-dd');
};

export default function ExpenseViewEstRow({
  item,
  idx,
  onMatched,
  onMatching,
  onSetMatching,
  alreadyMatched,
  isMatched,
  isMatching,
  isWaiting,
}: EstimateViewEstRowProps) {
  return (
    <TableRow key={item.seq} className="[&_td]:text-[13px]">
      <TableCell>{item.ei_type}</TableCell>
      <TableCell>{item.ei_title}</TableCell>
      <TableCell className="px-4">{formatDate(item.ei_pdate)}</TableCell>
      <TableCell className="text-right">{formatAmount(item.ei_amount)}원</TableCell>
      <TableCell className="text-right">{item.ei_tax === 0 ? 0 : `${formatAmount(item.ei_tax)}원`}</TableCell>
      <TableCell className="text-right">{formatAmount(item.ei_total)}원</TableCell>

      {/* 첨부파일 */}
      {item.attachments && item.attachments.length > 0 ? (
        <TableCell>
          <ul>
            {item.attachments.map((att, idx) => (
              <li key={idx} className="overflow-hidden text-sm text-gray-800">
                <a
                  href={normalizeAttachmentUrl(att.ea_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1">
                  <File className="size-3.5 shrink-0" />
                  <span className="overflow-hidden text-left text-ellipsis whitespace-nowrap hover:underline">{att.ea_fname}</span>
                </a>
              </li>
            ))}
          </ul>
        </TableCell>
      ) : (
        <TableCell>-</TableCell>
      )}

      {/* 견적 매칭 버튼 영역 */}
      <TableCell className="px-1 text-center [&_button]:rounded-xl [&_button]:border [&_button]:text-xs [&_button]:transition-none">
        {(() => {
          // DB 매칭이 이미 존재 → 매칭완료 버튼
          if (alreadyMatched) {
            return (
              <Button size="xs" variant="outline" onClick={onMatched}>
                매칭완료
              </Button>
            );
          }

          // 현재 이 row가 매칭중
          if (isMatching) {
            return (
              <Button size="xs" className="border-primary-blue/10" onClick={onMatching}>
                매칭중
              </Button>
            );
          }

          // 클라이언트에서 방금 매칭완료
          if (isMatched) {
            return (
              <Button size="xs" variant="outline" onClick={onMatched}>
                매칭완료
              </Button>
            );
          }

          // 다른 row가 매칭중 → 대기 상태
          if (isWaiting) {
            return (
              <Button size="xs" variant="secondary" disabled>
                매칭대기
              </Button>
            );
          }

          // 기본: 매칭하기
          return (
            <Button
              size="xs"
              className="bg-primary-blue-100 text-primary-blue border-primary-blue-300/10 hover:bg-primary-blue-150 hover:text-primary-blue active:bg-primary-blue-100"
              onClick={onSetMatching}>
              매칭하기
            </Button>
          );
        })()}
      </TableCell>
    </TableRow>
  );
}
