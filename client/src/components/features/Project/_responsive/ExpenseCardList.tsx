import { type pExpenseListItem } from '@/api';

import { Checkbox } from '@components/ui/checkbox';
import { ExpenseCardRow } from '../_components/ExpenseCardRow';

type Props = {
  items: pExpenseListItem[];
  loading: boolean;
  activeTab: 'all' | 'saved';
  checkAll: boolean;
  checkedItems: number[];
  onCheckAll: (checked: boolean) => void;
  onCheck: (seq: number, checked: boolean) => void;
};

export function ExpenseCardList({ items, loading, activeTab, checkAll, checkedItems, onCheckAll, onCheck }: Props) {
  const isEmpty = items.length === 0;

  return (
    <div>
      {activeTab === 'saved' && (
        <div className="mb-2 flex items-center">
          <Checkbox
            id="chk_all"
            label="전체 선택"
            className="flex size-4 items-center justify-center bg-white leading-none"
            checked={checkAll}
            onCheckedChange={(v) => onCheckAll(!!v)}
          />
        </div>
      )}

      {loading ? (
        <p className="py-50 text-center text-base text-gray-500">비용 리스트 불러오는 중 . . .</p>
      ) : isEmpty ? (
        <p className="py-50 text-center text-base text-gray-500">등록된 비용이 없습니다.</p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <ExpenseCardRow key={item.seq} item={item} activeTab={activeTab} checked={checkedItems.includes(item.seq)} onCheck={onCheck} />
          ))}
        </div>
      )}
    </div>
  );
}
