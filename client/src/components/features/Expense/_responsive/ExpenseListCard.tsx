import { Checkbox } from '@components/ui/checkbox';
import { AppPagination } from '@/components/ui/AppPagination';
import { ExpenseCard } from '../_components/ExpenseCard';

type Role = 'admin' | 'manager' | 'user';
type ActiveTab = 'all' | 'claimed' | 'saved';

interface Props {
  role: Role;
  activeTab?: ActiveTab;
  loading: boolean;
  items: any[];
  checkAll: boolean;
  checkedItems: number[];
  onCheckAll: (checked: boolean) => void;
  onCheck: (seq: number, checked: boolean) => void;
  onAInfo: (item: any) => void;
  // pagination (optional — user role handles pagination in parent)
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
}

function showCheckAll(role: Role, activeTab?: ActiveTab) {
  if (role === 'admin') return true;
  if (role === 'manager') return activeTab === 'claimed';
  return activeTab === 'saved';
}

export function ExpenseListCard({
  role,
  activeTab,
  loading,
  items,
  checkAll,
  checkedItems,
  onCheckAll,
  onCheck,
  onAInfo,
  total,
  page,
  pageSize,
  onPageChange,
}: Props) {
  const isEmpty = items.length === 0;

  return (
    <div>
      {showCheckAll(role, activeTab) && (
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
            <ExpenseCard
              key={item.seq}
              role={role}
              item={item}
              activeTab={activeTab}
              checked={checkedItems.includes(item.seq)}
              onCheck={onCheck}
              onAInfo={onAInfo}
            />
          ))}
        </div>
      )}

      {onPageChange && !isEmpty && (
        <div className="mt-5">
          <AppPagination
            totalPages={Math.ceil((total ?? 0) / (pageSize ?? 15))}
            initialPage={page ?? 1}
            visibleCount={5}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}
