import { ChevronUp, ChevronDown } from 'lucide-react';
import { SortArr } from '@/assets/images/icons';
import { cn } from '@/lib/utils';

type SortIconProps = {
  order?: 'asc' | 'desc';
};

export function SortIcon({ order }: SortIconProps) {
  return (
    <span className="flex flex-col justify-center leading-none">
      <ChevronUp
        className={cn(
          'size-2.5 stroke-3',
          order === 'asc' ? 'text-primary-blue-500' : order === 'desc' ? 'text-gray-500/70' : 'text-gray-500'
        )}
      />
      <ChevronDown
        className={cn(
          '-mt-1 size-2.5 stroke-3',
          order === 'desc' ? 'text-primary-blue-500' : order === 'asc' ? 'text-gray-500/70' : 'text-gray-500'
        )}
      />
    </span>
  );
}
