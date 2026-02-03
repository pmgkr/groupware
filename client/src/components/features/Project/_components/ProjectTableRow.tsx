import { memo } from 'react';
import { Link } from 'react-router';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableRow, TableCell } from '@/components/ui/table';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Star } from 'lucide-react';
import { type ProjectListItem } from '@/api';
import { statusMap, parseCategories } from '../utils/projectUtil';

type Props = {
  item: ProjectListItem;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  search: string;
};

export const ProjectTableRow = memo(({ item, isFavorite = false, onToggleFavorite, search }: Props) => {
  const categories = parseCategories(item.project_cate);
  const status = statusMap[item.project_status as keyof typeof statusMap];

  return (
    <TableRow className="[&_td]:px-2 [&_td]:text-[13px] [&_td]:leading-[1.3] max-2xl:[&_td]:text-sm">
      {/* 즐겨찾기 */}
      <TableCell className="px-0!">
        <Button
          type="button"
          variant="svgIcon"
          className={`h-8 p-2 ${isFavorite ? 'text-primary-yellow-500' : 'hover:text-primary-yellow-500 text-gray-600'}`}
          onClick={() => onToggleFavorite?.(item.project_id)}>
          <Star fill={isFavorite ? 'currentColor' : 'none'} />
        </Button>
      </TableCell>

      {/* 프로젝트 ID */}
      <TableCell className="px-0!">
        <Link to={`/project/${item.project_id}`} state={{ fromSearch: search }} className="rounded-[4px] border bg-white px-2 py-1 text-sm">
          {item.project_id}
        </Link>
      </TableCell>

      <TableCell className="max-xl:hidden">{item.project_brand}</TableCell>

      {/* 카테고리 */}
      <TableCell>
        <TooltipProvider>
          <Tooltip>
            <div className="flex items-center justify-center gap-1">
              {categories.length === 1 ? (
                <span>{categories[0]}</span>
              ) : (
                <>
                  <span>{categories[0]}</span>
                  <TooltipTrigger asChild>
                    <Badge variant="grayish" className="px-1 py-0 text-xs">
                      +{categories.length - 1}
                    </Badge>
                  </TooltipTrigger>
                </>
              )}
            </div>
            {categories.length > 1 && <TooltipContent>{categories.join(', ')}</TooltipContent>}
          </Tooltip>
        </TooltipProvider>
      </TableCell>

      <TableCell className="text-left">
        <Link to={`/project/${item.project_id}`} state={{ fromSearch: search }} className="hover:underline">
          {item.project_title}
        </Link>
      </TableCell>

      <TableCell>{item.client_nm}</TableCell>
      <TableCell>{item.owner_nm}</TableCell>
      <TableCell>{item.team_name}</TableCell>
      <TableCell>{status}</TableCell>
      <TableCell className="max-xl:hidden">{format(new Date(item.project_sdate), 'yyyy-MM-dd')}</TableCell>
    </TableRow>
  );
});
