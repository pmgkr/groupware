// src/pages/Project/ProjectLayout.tsx
import { useEffect, useState, useCallback } from 'react';
import { Outlet, useNavigate, useLocation, useParams } from 'react-router';
import { cn } from '@/lib/utils';

import { getProjectMember, getBookmarkList, addBookmark, removeBookmark, type ProjectMemberDTO } from '@/api';
import { getProjectView, type projectOverview } from '@/api/project';

import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogDescription, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Settings, Star, ArrowLeft } from 'lucide-react';

export type ProjectLayoutContext = {
  projectId?: string;
  data: projectOverview['info'];
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

type ProjectEditForm = {
  project_title: string;
  project_brand: string;
  project_sdate: string;
  project_edate: string;
  client_id: number | null;
  project_cate: string[];
  project_status: 'in-progress' | 'closed' | 'cancelled' | 'completed' | string;
};

export default function ProjectLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId } = useParams();

  const [editForm, setEditForm] = useState<ProjectEditForm | null>(null); // 프로젝트 수정 폼 타입
  const [listSearch] = useState<string>(() => (location.state as any)?.fromSearch ?? ''); // ProjectList에서 전달한 필터 파라미터값
  const [data, setData] = useState<projectOverview | null>(null);
  const [members, setMembers] = useState<ProjectMemberDTO[]>([]);

  const [isFavorite, setIsFavorite] = useState(false);
  const [projectDialog, setProjectDialog] = useState(false);
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

        setData(projectRes);
        setMembers(memberRes);

        const bookmarkIds = bookmarkRes.map((b) => String(b.project_id));
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

  // 프로젝트 상태 수정 다이얼로그 오픈 시 세팅
  useEffect(() => {
    if (!projectDialog || !data) return;

    const { info } = data;

    setEditForm({
      project_title: info.project_title,
      project_brand: info.project_brand,
      project_sdate: info.project_sdate,
      project_edate: info.project_edate,
      client_id: info.client_id,
      project_cate: info.project_cate ?? [],
      project_status: info.project_status,
    });
  }, [projectDialog, data]);

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
    Closed: (
      <Badge className="bg-primary-blue" size="md">
        종료됨
      </Badge>
    ),
    Completed: (
      <Badge variant="grayish" size="md">
        정산완료
      </Badge>
    ),
    Cancelled: (
      <Badge className="bg-destructive" size="md">
        취소됨
      </Badge>
    ),
  };

  const { info, summary, expense_data, expense_type } = data;

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
          <Button
            variant="svgIcon"
            className="text-gray-500"
            onClick={() => {
              setProjectDialog(true);
            }}>
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
              summary,
              expense_data,
              expense_type,
              members,
            } satisfies ProjectLayoutContext
          }
        />
      </div>

      <Dialog open={projectDialog} onOpenChange={setProjectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>프로젝트 수정</DialogTitle>
            <DialogDescription className="leading-[1.3] break-keep">진행중인 프로젝트에 한해서 수정할 수 있습니다.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 items-start gap-4">UI 준비중</div>
          <DialogFooter>
            <Button type="submit" onClick={() => {}}>
              변경사항 저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
