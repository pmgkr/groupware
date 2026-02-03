// src/components/proposal/ExpenseProposalCard.tsx
import { Checkbox } from '@/components/ui/checkbox';
import { formatAmount, formatKST } from '@/utils';

interface ExpenseProposalCardProps {
  proposalList: any[];
  selectedProposalId: number | null;
  onSelect: (proposal: any | null) => void;
}

export default function ExpenseProposalCard({ proposalList, selectedProposalId, onSelect }: ExpenseProposalCardProps) {
  // 목록 없음
  if (proposalList.length === 0) {
    return <div className="py-10 text-center text-sm text-gray-500">등록된 기안서가 없습니다.</div>;
  }

  return (
    <div className="mt-4 space-y-3">
      {proposalList.map((p) => {
        const isSelected = selectedProposalId === p.rp_seq;
        const isDisabled = selectedProposalId !== null && !isSelected;

        return (
          <button
            key={p.rp_seq}
            type="button"
            disabled={isDisabled}
            onClick={() => onSelect(isSelected ? null : p)}
            className={[
              'w-full rounded-xl border px-4 py-3 text-left transition',
              isSelected ? 'border-primary-blue bg-primary-blue-50' : 'border-gray-300',
              isDisabled ? 'opacity-40' : 'active:bg-gray-100',
            ].join(' ')}>
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm text-gray-500">{p.rp_category}</span>
              <Checkbox checked={isSelected} />
            </div>

            <div className="mt-1 line-clamp-2 text-base font-semibold text-gray-900">{p.rp_title}</div>

            <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
              <span className="text-base font-medium text-gray-900">{formatAmount(p.rp_cost)}원</span>
              <span>{formatKST(p.rp_date, true)}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
