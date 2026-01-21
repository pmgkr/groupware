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
    <div className="rounded-md border border-gray-300 bg-white p-3 shadow-md">
      <div className="mb-1 flex justify-between">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="xs"
            variant="svgIcon"
            className={`${isFavorite ? 'text-primary-yellow-500' : 'hover:text-primary-yellow-500 text-gray-600'}`}
            onClick={() => onToggleFavorite?.(item.project_id)}>
            <Star className="size-3" fill={isFavorite ? 'currentColor' : 'none'} />
          </Button>
          <span className="text-sm text-gray-500">{item.project_id}</span>
        </div>
        {status}
      </div>

      <Link to={`/project/${item.project_id}`} state={{ fromSearch: search }}>
        <p className="truncate pt-2 text-lg leading-[1.3] font-bold">{item.project_title}</p>

        <div className="mt-2 flex items-center justify-between border-t pt-2 text-sm text-gray-500">
          <p className="flex-1 truncate">{item.client_nm}</p>
          <p className="shrink-0">
            {item.team_name}·{item.owner_nm}
          </p>
        </div>
      </Link>
    </div>
  );
});
