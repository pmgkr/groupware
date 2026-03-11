import { type pExpenseListItem } from '@/api';

import { Checkbox } from '@components/ui/checkbox';
import { ExpenseCardRow } from '../_components/ExpenseCardRow';
import { AppPagination } from '@/components/ui/AppPagination';

type Props = {
  activeTab: 'all' | 'claimed';
  loading: boolean;
  expenseList: pExpenseListItem[];
  checkAll: boolean;
  checkedItems: number[];

  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;

  handleCheckAll: (val: boolean) => void;
  handleCheckItem: (seq: number, checked: boolean) => void;
  onAInfo: (item: pExpenseListItem) => void;
};

export function ManagerCardList({
  activeTab,
  loading,
  expenseList,
  checkAll,
  checkedItems,

  total,
  page,
  pageSize,
  onPageChange,

  handleCheckAll,
  handleCheckItem,
  onAInfo,
}: Props) {
  const isEmpty = expenseList.length === 0;

  return (
    <div>
      {activeTab === 'claimed' && (
        <div className="mb-2 flex items-center">
          <Checkbox
            id="chk_all"
            label="전체 선택"
            className="flex size-4 items-center justify-center bg-white leading-none"
            checked={checkAll}
            onCheckedChange={(v) => handleCheckAll(!!v)}
          />
        </div>
      )}

      {loading ? (
        <p className="py-50 text-center text-base text-gray-500">비용 리스트 불러오는 중 . . .</p>
      ) : isEmpty ? (
        <p className="py-50 text-center text-base text-gray-500">등록된 비용이 없습니다.</p>
      ) : (
        <div className="space-y-4">
          {expenseList.map((item) => (
            <ExpenseCardRow
              key={item.seq}
              item={item}
              activeTab={activeTab}
              checked={checkedItems.includes(item.seq)}
              onCheck={handleCheckItem}
              onAInfo={onAInfo}
              role="manager"
            />
          ))}
        </div>
      )}

      <div className="mt-5">
        {expenseList.length !== 0 && (
          <AppPagination
            totalPages={Math.ceil(total / pageSize)}
            initialPage={page}
            visibleCount={5}
            onPageChange={onPageChange} //부모 state 업데이트
          />
        )}
      </div>
    </div>
  );
}
