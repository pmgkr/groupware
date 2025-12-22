// src/pages/Project/ProjectLayout.tsx
import { useEffect, useState, useCallback } from 'react';
import { Outlet, useNavigate, useLocation, useParams } from 'react-router';
import { cn } from '@/lib/utils';

import { getProjectMember, getBookmarkList, addBookmark, removeBookmark, type ProjectMemberDTO } from '@/api';
import { getProjectView, type projectOverview } from '@/api/project';

import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Settings, Star, ArrowLeft } from 'lucide-react';

export type ProjectLayoutContext = {
  projectId?: string;
  data: projectOverview['info'];
  logs: projectOverview['logs'];
  summary: projectOverview['summary'];
  expense_data: projectOverview['expense_data'];
  expense_type: projectOverview['expense_type'];
  members: ProjectMemberDTO[];
};

const tabs = [
  { key: 'overview', label: '프로젝트 개요', path: '' },
  { key: 'expense', label: '프로젝트 비용', path: 'expense' },
  { key: 'estimate', label: '견적서', path: 'estimate' },
  { key: 'invoice', label: '인보이스', path: 'invoice' },
] as const;

export default function ProjectLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId } = useParams();

  const [listSearch] = useState<string>(() => (location.state as any)?.fromSearch ?? ''); // ProjectList에서 전달한 필터 파라미터값
  const [data, setData] = useState<projectOverview | null>(null);
  const [members, setMembers] = useState<ProjectMemberDTO[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);

  // 프로젝트 전체 데이터 호출
  useEffect(() => {
    if (!projectId) return;

    (async () => {
      try {
        const [projectRes, memberRes, bookmarkRes] = await Promise.all([
          getProjectView(projectId),
          getProjectMember(projectId),
          getBookmarkList(),
        ]);

        console.log('리스폰 데이터', projectRes);

        const bookmarkIds = bookmarkRes.map((b) => String(b.project_id));

        setData(projectRes);
        setMembers(memberRes);
        setIsFavorite(bookmarkIds.includes(projectId));
      } catch (err) {
        console.error(err);
        navigate('/404', {
          state: {
            title: 'Project Not Found',
            message: '해당 프로젝트를 찾을 수 없습니다.',
          },
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId]);

  // 즐겨찾기 토글 기능
  const toggleFavorite = useCallback(async () => {
    if (!projectId) return;

    try {
      if (isFavorite) {
        await removeBookmark(projectId);
        setIsFavorite(false);
      } else {
        await addBookmark(projectId);
        setIsFavorite(true);
      }
    } catch (err) {
      console.error('즐겨찾기 토글 실패:', err);
    }
  }, [isFavorite, projectId]);

  if (loading) return <div className="flex h-[50vh] items-center justify-center text-gray-500">로딩 중...</div>;

  if (!data) return <div className="p-6 text-center">데이터 없음</div>;

  // 비용 상태별 Badge 맵핑
  const statusMap = {
    'in-progress': (
      <Badge variant="secondary" size="md">
        진행중
      </Badge>
    ),
    closed: (
      <Badge className="bg-primary-blue" size="md">
        종료됨
      </Badge>
    ),
    completed: (
      <Badge variant="grayish" size="md">
        정산완료
      </Badge>
    ),
    cancelled: (
      <Badge className="bg-destructive" size="md">
        취소됨
      </Badge>
    ),
  };

  const { info, logs, summary, expense_data, expense_type } = data;

  const status = statusMap[info.project_status as keyof typeof statusMap];
  const fallbackListPath = listSearch ? `/project${listSearch}` : '/project';

  return (
    <section>
      {/* 상단 프로젝트 공통 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-3xl font-bold text-gray-950">{info.project_title}</h2>
          {status}
          <Button
            type="button"
            variant="svgIcon"
            onClick={toggleFavorite}
            className={cn(
              'text-gray-600 transition-colors has-[>svg]:p-0',
              isFavorite ? 'text-primary-yellow-500 [&_svg]:fill-current' : 'hover:text-primary-yellow-500 hover:[&_svg]:fill-current'
            )}>
            <Star fill={isFavorite ? 'currentColor' : 'none'} className="size-5" />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="svgIcon" onClick={() => navigate(fallbackListPath)} className="text-gray-500">
            <ArrowLeft className="size-5" />
          </Button>
          <Button variant="svgIcon" className="text-gray-500">
            <Settings className="size-5" />
          </Button>
        </div>
      </div>

      {/* 탭 메뉴: URL 이동 기반 */}
      <nav className="flex gap-4">
        {tabs.map((tab) => {
          const basePath = tab.path === '' ? `/project/${projectId}` : `/project/${projectId}/${tab.path}`;

          const isActive =
            tab.path === ''
              ? location.pathname === basePath // overview는 정확히 일치할 때만
              : location.pathname.startsWith(basePath); // expense, estimate, invoice는 하위 경로까지 포함

          return (
            <Button
              key={tab.key}
              variant="ghost"
              onClick={() => navigate(basePath)}
              className={cn(
                'hover:text-primary relative h-8 px-1 hover:bg-transparent',
                isActive ? 'text-primary font-bold' : 'hover:text-primary/80 text-gray-500'
              )}>
              {tab.label}
              {isActive && <span className="bg-primary absolute right-0 bottom-0 left-0 h-[2px]" />}
            </Button>
          );
        })}
      </nav>

      {/* 하위 페이지 Outlet + context 전달 */}
      <div className="pt-6">
        <Outlet
          context={
            {
              projectId,
              data: info,
              logs,
              summary,
              expense_data,
              expense_type,
              members,
            } satisfies ProjectLayoutContext
          }
        />
      </div>
    </section>
  );
}
