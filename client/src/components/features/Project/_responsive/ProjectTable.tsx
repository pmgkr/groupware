import { Table, TableHeader, TableHead, TableRow, TableCell, TableBody } from '@/components/ui/table';
import { ProjectTableRow } from '../_components/ProjectTableRow';

type Props = {
  projects: any[];
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  search: string;
};

export function ProjectTable({ projects, favorites, onToggleFavorite, search }: Props) {
  const isEmpty = projects.length === 0;

  return (
    <Table variant="primary" className="table-fixed">
      <TableHeader>
        <TableRow className="[&_th]:px-2 [&_th]:text-[13px] [&_th]:leading-[1.3] [&_th]:font-medium">
          <TableHead className="w-12 px-0!"></TableHead>
          <TableHead className="w-24 px-0!">프로젝트#</TableHead>
          <TableHead className="w-[6%] max-xl:hidden">프로젝트 법인</TableHead>
          <TableHead className="w-[10%]">카테고리</TableHead>
          <TableHead>프로젝트 이름</TableHead>
          <TableHead className="w-[14%]">클라이언트</TableHead>
          <TableHead className="w-[8%]">오너</TableHead>
          <TableHead className="w-[6%] max-2xl:w-[8%]">팀</TableHead>
          <TableHead className="w-[8%] xl:w-[6%]">상태</TableHead>
          <TableHead className="w-[10%] max-xl:hidden">시작일</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isEmpty ? (
          <TableRow>
            <TableCell colSpan={10} className="py-50 text-center text-gray-500">
              등록된 프로젝트가 없습니다.
            </TableCell>
          </TableRow>
        ) : (
          projects.map((p) => (
            <ProjectTableRow
              key={p.project_id}
              item={p}
              isFavorite={favorites.includes(p.project_id)}
              onToggleFavorite={onToggleFavorite}
              search={search}
            />
          ))
        )}
      </TableBody>
    </Table>
  );
}
