import { memo } from 'react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';

import { type ProjectListItem } from '@/api';
import { statusMap } from '../utils/projectUtil';

type Props = {
  item: ProjectListItem;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  search: string;
};

export const ProjectCardRow = memo(({ item, isFavorite = false, onToggleFavorite, search }: Props) => {
  const status = statusMap[item.project_status as keyof typeof statusMap];

  return (
    <div className="rounded-md border border-gray-300 bg-white px-4 py-2">
      <div className="mb-1 flex items-center justify-between border-b border-gray-300 pb-1">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant="svgIcon"
            className={`h-6 has-[>svg]:px-1 ${isFavorite ? 'text-primary-yellow-500' : 'hover:text-primary-yellow-500 text-gray-600'}`}
            onClick={() => onToggleFavorite?.(item.project_id)}>
            <Star className="size-3.5" fill={isFavorite ? 'currentColor' : 'none'} />
          </Button>
          <span className="text-sm text-gray-500">{item.project_id}</span>
        </div>
        {status}
      </div>

      <Link to={`/project/${item.project_id}`} state={{ fromSearch: search }}>
        <p className="truncate pt-2 text-lg leading-[1.3] font-bold">{item.project_title}</p>

        <div className="mt-1 flex items-center justify-between text-sm text-gray-500">
          <p className="flex flex-1 gap-2 overflow-hidden">
            <span className="relative pr-2 after:absolute after:top-1/2 after:left-full after:h-3 after:w-px after:-translate-y-1/2 after:bg-gray-300 after:content-['']">
              {item.project_brand}{' '}
            </span>
            <span className="truncate">{item.client_nm}</span>
          </p>
          <p className="shrink-0">
            {item.team_name} {item.owner_nm}
          </p>
        </div>
      </Link>
    </div>
  );
});
