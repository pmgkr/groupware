import { Link } from 'react-router';
import { cn } from '@/lib/utils';
import { formatAmount, formatDate, normalizeAttachmentUrl } from '@/utils';
import { SquareArrowOutUpRight, Paperclip } from 'lucide-react';
import type { ExpenseItemDTO } from '@/api/expense';
import type { addInfoDTO } from '@/api/project';

interface ExpenseMobileViewRowProps {
  el_type: string;
  item: ExpenseItemDTO;
  onAddInfo: (addInfos?: addInfoDTO[]) => void;
}

export default function ExpenseMobileViewRow({ el_type, item, onAddInfo }: ExpenseMobileViewRowProps) {
  return (
    <div className="mb-3 border-b-1 border-dashed pb-3 last:border-b-0">
      <dl className="flex justify-between gap-2 py-1">
        <dt className="w-[20%] shrink-0 text-[13px] text-gray-700">비용 용도</dt>
        <dd className="text-right text-[13px] font-medium break-keep whitespace-pre">
          {(el_type === '외주용역비' || el_type === '접대비') && (item.expense_add_info ?? []).length > 0 ? (
            <span className="text-primary underline" onClick={() => onAddInfo(item.expense_add_info)}>
              {el_type}
            </span>
          ) : (
            el_type
          )}
        </dd>
      </dl>

      <ExpRow title="가맹점명" value={item.ei_title} />
      <ExpRow title="매입일자" value={formatDate(item.ei_pdate, true)} />

      <dl className="flex justify-between py-1">
        <dt className="text-[13px] text-gray-700">금액</dt>
        <dd className="text-right text-[13px] font-medium">
          {formatAmount(item.ei_amount)}원
          <span className="block text-[.8em] font-normal text-gray-500">{`세금 ${formatAmount(item.ei_tax)}원`}</span>
        </dd>
      </dl>

      <dl className="flex justify-between py-1">
        <dt className="text-[13px] text-gray-700">합계</dt>
        <dd className="text-right text-base font-semibold">{formatAmount(item.ei_total)}원</dd>
      </dl>

      <dl className="flex justify-between py-1">
        <dt className="text-[13px] text-gray-700">기안서</dt>
        <dd className="text-right text-sm font-medium text-gray-700">
          {item.pro_id ? (
            <Link to={`/expense/proposal/view/${item.pro_id}`} className="text-primary flex items-center gap-0.5">
              기안서보기 <SquareArrowOutUpRight className="size-3" />
            </Link>
          ) : (
            <span>-</span>
          )}
        </dd>
      </dl>

      {item.remark && <ExpRow title="비고" value={item.remark} />}

      <dl className="flex justify-between py-1">
        <dt className="text-[13px] text-gray-700">증빙자료</dt>
        <dd className="text-right text-[13px] font-medium">
          {item.attachments && item.attachments.length > 0 ? (
            <ul>
              {item.attachments.map((att, idx) => (
                <li key={idx} className="overflow-hidden text-sm text-gray-800">
                  <a
                    href={normalizeAttachmentUrl(att.ea_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-gray-600">
                    <Paperclip className="size-3.5 shrink-0 text-gray-600" />
                    <span className="truncate hover:underline">{att.ea_fname}</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <span>-</span>
          )}
        </dd>
      </dl>
    </div>
  );
}

function ExpRow({ title, value, bold }: { title: string; value: any; bold?: boolean }) {
  return (
    <dl className="flex justify-between gap-2 py-1">
      <dt className="w-[20%] shrink-0 text-[13px] text-gray-700">{title}</dt>
      <dd className={cn('text-right text-[13px] font-medium break-keep whitespace-pre-wrap', bold && 'font-semibold')}>{value}</dd>
    </dl>
  );
}
