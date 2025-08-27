import * as React from 'react';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { CheckIcon } from 'lucide-react';

export interface UserOption {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
}

interface UserMultiSelectProps {
  users: UserOption[];
  selected: UserOption[];
  onChange: (selected: UserOption[]) => void;
  placeholder?: string;
}

export function UserMultiSelect({ users, selected, onChange, placeholder = '검색어를 입력해주세요' }: UserMultiSelectProps) {
  const [query, setQuery] = React.useState('');

  // 검색어에 따라 유저 필터링
  const filtered = React.useMemo(() => {
    return users.filter((user) => user.name.toLowerCase().includes(query.toLowerCase()));
  }, [query, users]);

  const isSelected = (id: string) => selected.some((u) => u.id === id);

  const handleSelect = (user: UserOption) => {
    if (!isSelected(user.id)) {
      onChange([...selected, user]);
    }
  };

  const handleRemove = (userId: string) => {
    onChange(selected.filter((u) => u.id !== userId));
  };

  return (
    <div className="relative flex flex-col gap-2">
      {/* 검색창 */}
      <Input placeholder={placeholder} value={query} onChange={(e) => setQuery(e.target.value)} className="h-9" />

      {/* 필터링된 옵션 리스트 absolute top-10 */}
      <ul className="max-h-40 w-full overflow-y-auto rounded-md border bg-white p-1 shadow-sm">
        {filtered.map((user) => (
          <li
            key={user.id}
            onClick={() => handleSelect(user)}
            className={cn(
              'hover:bg-primary-blue-100 relative flex cursor-pointer items-center justify-between rounded-sm px-3 py-2 text-sm',
              isSelected(user.id) && 'bg-primary-blue-100 pointer-events-none'
            )}>
            {user.name}
            {isSelected(user.id) && (
              <span className="absolute right-2 flex size-3.5 items-center justify-center">
                <CheckIcon className="size-4" />
              </span>
            )}
          </li>
        ))}
        {filtered.length === 0 && <li className="text-muted-foreground px-3 py-2 text-sm">결과 없음</li>}
      </ul>

      {/* 선택된 유저 리스트 */}
      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selected.map((user) => (
            <div key={user.id} className="bg-muted flex items-center gap-1 rounded-full px-3 py-1 text-sm">
              {user.name}
              <button onClick={() => handleRemove(user.id)} className="hover:text-destructive">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
