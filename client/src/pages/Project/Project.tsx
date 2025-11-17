// src/pages/Project/Project.tsx
import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useNavigate, useParams } from 'react-router';
import {
  getProjectView,
  getBookmarkList,
  addBookmark,
  removeBookmark,
  getProjectMember,
  type ProjectViewDTO,
  type projectMemberDTO,
} from '@/api';

import Overview from '@components/features/Project/ProjectOverview';
import Expense from '@components/features/Project/ProjectExpense';

import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Settings, Star, ArrowLeft } from 'lucide-react';

const tabs = [
  { key: 'overview', label: '프로젝트 개요' },
  { key: 'expense', label: '프로젝트 비용' },
  { key: 'estimate', label: '견적서' },
  { key: 'invoice', label: '인보이스' },
] as const;

export default function Project() {
  const navigate = useNavigate();
  const { projectId } = useParams();

  const [activeTab, setActiveTab] = useState<'overview' | 'expense' | 'estimate' | 'invoice'>('overview');

  const [data, setData] = useState<ProjectViewDTO | null>(null);
  const [isFavorite, setIsFavorite] = useState(false); // 북마크 여부 (default = false)
  const [members, setMembers] = useState<projectMemberDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;

    (async () => {
      try {
        const [projectRes, memberRes, bookmarkRes] = await Promise.all([
          getProjectView(projectId),
          getProjectMember(projectId),
          getBookmarkList(),
        ]);

        const bookmarkIds = bookmarkRes.map((item) => String(item.project_id));

        setData(projectRes);
        setIsFavorite(bookmarkIds.includes(projectId)); // 접속한 계정의 북마크 배열에 현재 프로젝트가 포함되어있다면
        setMembers(memberRes);
      } catch (err) {
        console.error('프로젝트 상세 조회 실패:', err);

        navigate('/404', {
          state: { title: 'Project Not Found', message: '해당 프로젝트를 찾을 수 없습니다.' },
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId, isFavorite]);

  // 즐겨찾기 토글
  const toggleFavorite = useCallback(
    async (projectId: string) => {
      try {
        if (isFavorite) {
          await removeBookmark(projectId);
          setIsFavorite(false);
        } else {
          await addBookmark(projectId);
          setIsFavorite(true);
        }
      } catch (err) {
        console.error(`즐겨찾기 ${isFavorite ? '삭제' : '추가'} 실패:`, err);
      }
    },
    [isFavorite]
  );

  if (loading) return <div className="flex h-[50vh] items-center justify-center text-gray-500">데이터를 불러오는 중입니다...</div>;

  if (!data)
    return (
      <div className="p-6 text-center text-gray-500">
        프로젝트를 찾을 수 없습니다.
        <div className="mt-4">
          <Button onClick={() => navigate(-1)} variant="secondary">
            뒤로가기
          </Button>
        </div>
      </div>
    );

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

  const status = statusMap[data.project_status as keyof typeof statusMap];

  return (
    <>
      <section>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-bold text-gray-950">{data.project_title}</h2>
            {status}
            <Button
              type="button"
              variant="svgIcon"
              onClick={() => projectId && toggleFavorite(projectId)}
              className={cn(
                'text-gray-600 transition-colors has-[>svg]:p-0',
                isFavorite ? 'text-primary-yellow-500 [&_svg]:fill-current' : 'hover:text-primary-yellow-500 hover:[&_svg]:fill-current'
              )}>
              <Star fill={isFavorite ? 'currentColor' : 'none'} className="size-5" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="svgIcon" className="text-gray-600 has-[>svg]:px-1" onClick={() => navigate(-1)}>
              <ArrowLeft className="size-5" />
            </Button>
            <Button type="button" variant="svgIcon" className="text-gray-600 has-[>svg]:px-1">
              <Settings className="size-5" />
            </Button>
          </div>
        </div>
        <nav className="mt-2 flex gap-4">
          {tabs.map((tab) => (
            <Button
              key={tab.key}
              variant="ghost"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'relative h-8 px-1 hover:bg-transparent',
                activeTab === tab.key ? 'text-primary hover:text-primary font-bold' : 'hover:text-primary/80 text-gray-500'
              )}>
              {tab.label} {activeTab === tab.key && <span className="bg-primary absolute right-0 bottom-0 left-0 h-[2px]" />}
            </Button>
          ))}
        </nav>
        <div className="pt-4">{activeTab === 'overview' && <Overview data={data} members={members} />}</div>
        <div className="pt-4">{activeTab === 'expense' && <Expense />}</div>
      </section>
    </>
  );
}
