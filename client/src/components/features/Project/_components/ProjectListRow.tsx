import { memo } from 'react';
import { Link } from 'react-router';
import { useIsMobileViewport } from '@/hooks/useViewport';

import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableRow, TableCell } from '@/components/ui/table';
import { Star, Ellipsis } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { type ProjectListItem } from '@/api';

// 상태 라벨/색상 매핑
const statusMap = {
  'in-progress': <Badge variant="secondary">진행중</Badge>,
  Closed: <Badge className="bg-primary-blue">종료됨</Badge>,
  Completed: <Badge variant="grayish">정산완료</Badge>,
  Cancelled: <Badge className="bg-destructive">취소됨</Badge>,
};

// 카테고리 분리 유틸
const parseCategories = (cate: string) => cate?.split('|').filter(Boolean) ?? [];

type Props = {
  item: ProjectListItem;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  search: string;
};

export const ProjectRow = memo(({ item, isFavorite = false, onToggleFavorite, search }: Props) => {
  const isMobile = useIsMobileViewport();
  const categories = parseCategories(item.project_cate);
  const status = statusMap[item.project_status as keyof typeof statusMap];

  return isMobile ? (
    <div className="rounded-md bg-white p-2.5">
      <div className="mb-2 flex justify-between border-b-1 border-b-gray-300">
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
        <p className="truncate text-lg leading-[1.3] font-bold">{item.project_title}</p>
        <div className="flex items-center justify-between overflow-hidden text-sm text-gray-500">
          <p className="flex-1 truncate">{item.client_nm}</p>
          <p className="shrink-0">
            {item.team_name} · {item.owner_nm}
          </p>
        </div>
      </Link>
    </div>
  ) : (
    <TableRow className="[&_td]:px-2 [&_td]:text-[13px] [&_td]:leading-[1.3]">
      {/* 즐겨찾기 */}
      <TableCell className="px-0!">
        <Button
          type="button"
          variant="svgIcon"
          className={`inline-block h-8 p-2 ${isFavorite ? 'text-primary-yellow-500' : 'hover:text-primary-yellow-500 text-gray-600'}`}
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

      {/* 브랜드 / 카테고리 / 제목 등 */}
      <TableCell>{item.project_brand}</TableCell>

      <TableCell>
        <TooltipProvider>
          <Tooltip>
            <div className="flex cursor-default items-center justify-center gap-1">
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
      <TableCell className="text-left leading-[1.2]">
        <Link to={`/project/${item.project_id}`} state={{ fromSearch: search }} className="hover:underline">
          {item.project_title}
        </Link>
      </TableCell>
      <TableCell className="leading-[1.2]">{item.client_nm}</TableCell>
      <TableCell>{item.owner_nm}</TableCell>
      <TableCell>{item.team_name}</TableCell>
      <TableCell>{status}</TableCell>
      <TableCell>{format(new Date(item.project_sdate), 'yyyy-MM-dd')}</TableCell>
    </TableRow>
  );
});
