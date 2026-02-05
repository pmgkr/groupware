import type { JSX } from 'react';
import type { PExpenseItem, NExpenseItem } from '@/api/mypage/expense';
import { ExpenseCardRow } from '@components/features/Expense/_components/ExpenseMineCard';

type Props = {
  type: 'P' | 'N';
  list: (PExpenseItem | NExpenseItem)[];
  loading: boolean;
  search: string;
  statusMap: Record<string, JSX.Element>;
};

function isPExpense(item: any): item is PExpenseItem {
  return 'alloc_status' in item && 'is_estimate' in item;
}

function isNExpense(item: any): item is NExpenseItem {
  return !('alloc_status' in item);
}

export function ExpenseMineCard({ type, list, loading, search }: Props) {
  const isEmpty = list.length === 0;
  const colSpan = type === 'P' ? 11 : 10;

  return (
    <div>
      {loading ? (
        <p className="py-50 text-center text-base text-gray-500">비용 리스트 불러오는 중 . . .</p>
      ) : isEmpty ? (
        <p className="py-50 text-center text-base text-gray-500">등록된 비용이 없습니다.</p>
      ) : (
        <div className="space-y-4">
          {list.map((item) => (
            <ExpenseCardRow key={item.seq} type={type} item={item} search={search} />
          ))}
        </div>
      )}
    </div>
  );
}
