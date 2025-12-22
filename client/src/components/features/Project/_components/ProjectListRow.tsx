import { memo } from 'react';
import { Link } from 'react-router';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableRow, TableCell } from '@/components/ui/table';
import { Star, Ellipsis } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { type ProjectListItem } from '@/api';

// 상태 라벨/색상 매핑
const statusMap: Record<string, { label: string; variant?: 'secondary' | 'grayish' | 'default' }> = {
  'in-progress': { label: '진행중', variant: 'secondary' },
  completed: { label: '종료됨', variant: 'secondary' },
  closed: { label: '종료됨', variant: 'grayish' },
  cancelled: { label: '취소됨', variant: 'default' },
  done: { label: '정산완료', variant: 'grayish' },
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
  const categories = parseCategories(item.project_cate);
  const status = statusMap[item.project_status] ?? { label: item.project_status, variant: 'grayish' };

  return (
    <TableRow key={item.project_id} className="[&_td]:px-2 [&_td]:text-[13px] [&_td]:leading-[1.3]">
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
      <TableCell>
        <Badge variant={status.variant}>{status.label}</Badge>
      </TableCell>
      <TableCell>{format(new Date(item.project_sdate), 'yyyy-MM-dd')}</TableCell>
    </TableRow>
  );
});
