// src/pages/Project/ProjectLayout.tsx
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Outlet, useNavigate, useLocation, useParams } from 'react-router';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/useUser';
import { notificationApi } from '@/api/notification';
import { projectLock, projectUnLock } from '@/api/admin/project';
import { useIsMobileViewport } from '@/hooks/useViewport';
import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';
import { useAppDialog } from '@/components/common/ui/AppDialog/AppDialog';

import { getProjectMember, getBookmarkList, addBookmark, removeBookmark, type ProjectMemberDTO } from '@/api';
import { getProjectView, type projectOverview, ProjectStatusChange, getProjectLogs, type ProjectLogs } from '@/api/project';

import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { RadioGroup, RadioButton } from '@components/ui/radioButton';
import { Dialog, DialogDescription, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Settings, Star, ArrowLeft, OctagonAlert, Lock, LockOpen } from 'lucide-react';

export type ProjectLayoutContext = {
  projectId?: string;
  data: projectOverview['info'];
  summary: projectOverview['summary'];
  expense_data: projectOverview['expense_data'];
  expense_type: projectOverview['expense_type'];
  members: ProjectMemberDTO[];
  logs: ProjectLogs[];
  refetch: () => Promise<void>;
};

const tabs = [
  { key: 'overview', label: '프로젝트 개요', path: '' },
  { key: 'expense', label: '프로젝트 비용', path: 'expense' },
  { key: 'estimate', label: '견적서', path: 'estimate' },
  { key: 'invoice', label: '인보이스', path: 'invoice' },
] as const;

const STATUS_META = {
  Closed: {
    dialogTitle: '프로젝트 종료',
    dialogMessage: '프로젝트를 종료처리 하시겠습니까?<br />프로젝트 종료 시 견적서, 비용, 인보이스 등록이 불가합니다.',
    confirmText: '변경',
    alertTitle: '프로젝트 종료',
    alertMessage: '프로젝트가 종료처리 되었습니다.',
    notiMessage: (actor: string) => `${actor}님이 프로젝트를 종료했습니다.`,
  },
  Cancelled: {
    dialogTitle: '프로젝트 취소',
    dialogMessage: '프로젝트를 취소처리 하시겠습니까?',
    confirmText: '변경',
    alertTitle: '프로젝트 취소',
    alertMessage: '프로젝트가 취소처리 되었습니다.',
    notiMessage: (actor: string) => `${actor}님이 프로젝트를 취소했습니다.`,
  },
  'in-progress': {
    dialogTitle: '프로젝트 재개',
    dialogMessage: '프로젝트를 진행중으로 변경 하시겠습니까?<br />종료된 프로젝트 재개 시 파이낸스에 문의해 주세요.',
    confirmText: '변경',
    alertTitle: '프로젝트 변경',
    alertMessage: '프로젝트가 진행처리 되었습니다.',
    notiMessage: (actor: string) => `${actor}님이 프로젝트를 진행중으로 변경했습니다.`,
  },
} as const;

type ProjectStatus = 'in-progress' | 'Closed' | 'Cancelled';

type ProjectEditForm = {
  project_title: string;
  project_brand: string;
  project_sdate: string;
  project_edate: string;
  client_id: number | null;
  project_cate: string[];
  project_status: ProjectStatus;
};

export default function ProjectLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId } = useParams();
  const { user_id, user_name } = useUser();
  const isMobile = useIsMobileViewport();

  const { addAlert } = useAppAlert();
  const { addDialog } = useAppDialog();

  const [editForm, setEditForm] = useState<ProjectEditForm | null>(null); // 프로젝트 수정 폼 타입
  const [listSearch] = useState<string>(() => (location.state as any)?.fromSearch ?? ''); // ProjectList에서 전달한 필터 파라미터값
  const [data, setData] = useState<projectOverview | null>(null);
  const [members, setMembers] = useState<ProjectMemberDTO[]>([]);
  const [logs, setLogs] = useState<ProjectLogs[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus | null>(null);

  const [isFavorite, setIsFavorite] = useState(false);
  const [isLocked, setIsLocked] = useState(false); // 프로젝트 잠금 상태
  const [projectDialog, setProjectDialog] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProject = useCallback(async () => {
    if (!projectId) return;

    const [projectRes, memberRes, logRes] = await Promise.all([
      getProjectView(projectId),
      getProjectMember(projectId),
      getProjectLogs(projectId),
    ]);

    setData(projectRes);
    setMembers(memberRes);
    setLogs(logRes.reverse());
    projectRes.info.is_locked === 'Y' ? setIsLocked(true) : setIsLocked(false);
  }, [projectId]);

  // 프로젝트 초기 로딩
  useEffect(() => {
    if (!projectId) return;

    (async () => {
      try {
        await fetchProject();

        const bookmarkRes = await getBookmarkList();
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
  }, [projectId, fetchProject, navigate, isLocked]);

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
      project_status: info.project_status as ProjectStatus,
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

  // 프로젝트 잠금 토글 기능
  const toggleLock = useCallback(async () => {
    if (!projectId) return;

    addDialog({
      title: isLocked ? '프로젝트 잠금 해제' : '프로젝트 잠금',
      message: isLocked ? '프로젝트의 잠금을 해제하시겠습니까?' : '프로젝트를 잠그시겠습니까?<br/>잠긴 프로젝트는 수정이 불가합니다.',
      confirmText: '확인',
      cancelText: '취소',
      onConfirm: async () => {
        try {
          isLocked ? await projectUnLock(projectId) : await projectLock(projectId);
          setIsLocked((prev) => !prev);
        } catch (err) {
          console.error('프로젝트 잠금 토글 실패:', err);
        }
      },
    });
  }, [isLocked, projectId]);

  const isProjectMember = useMemo(() => members.some((m) => m.user_id === user_id), [members, user_id]);

  if (loading) return <div className="flex h-[50vh] items-center justify-center text-gray-500">로딩 중...</div>;
  if (!data) return <div className="h-[50vh] text-center">프로젝트 데이터를 찾을 수 없습니다.</div>;

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

  const statusOptions = [
    { id: 'in-progress', label: '프로젝트 진행중', value: 'in-progress' },
    { id: 'Closed', label: '프로젝트 종료', value: 'Closed' },
    { id: 'Cancelled', label: '프로젝트 취소', value: 'Cancelled' },
  ];

  // 알림 생성 전용 API
  const notifyProjectMembers = async (status: 'in-progress' | 'Closed' | 'Cancelled') => {
    if (!user_id || !user_name || !projectId || !info) return;

    const meta = STATUS_META[status];

    // 프로젝트 상태 변경한 본인은 알림 제외
    const notifications = members
      .filter((m) => m.user_id !== user_id)
      .map((m) =>
        notificationApi.registerNotification({
          user_id: m.user_id, // 받는 사람 (프로젝트 멤버)
          user_name: m.user_nm, // 받는 사람 이름
          noti_target: user_id, // 상태 변경한 사람
          noti_title: info.project_title ?? '프로젝트',
          noti_message: meta.notiMessage(user_name),
          noti_type: 'project',
          noti_url: `/project/${projectId}`,
        })
      );

    // 보낼 대상이 없으면 API 호출 안 함
    if (notifications.length === 0) return;

    await Promise.all(notifications);
  };

  // 프로젝트 상태 변경 API
  const applyStatusChange = async (status: 'in-progress' | 'Closed' | 'Cancelled') => {
    if (!projectId) return;

    await ProjectStatusChange(projectId, status);

    setData((prev) =>
      prev
        ? {
            ...prev,
            info: {
              ...prev.info,
              project_status: status,
            },
          }
        : prev
    );

    setProjectDialog(false);

    try {
      await notifyProjectMembers(status);
    } catch (e) {
      console.error('프로젝트 상태 변경 알림 실패:', e);
    }

    const meta = STATUS_META[status];

    addAlert({
      title: meta.alertTitle,
      message: meta.alertMessage,
      icon: <OctagonAlert />,
      duration: 1500,
    });
  };

  // 프로젝트 상태 변경 다이얼로그 핸들러
  const handleStatusChange = async () => {
    if (!projectId || !selectedStatus) return;
    if (selectedStatus !== 'Closed' && selectedStatus !== 'Cancelled' && selectedStatus !== 'in-progress') return;

    const meta = STATUS_META[selectedStatus];

    addDialog({
      title: meta.dialogTitle,
      message: meta.dialogMessage,
      confirmText: meta.confirmText,
      cancelText: '취소',
      onConfirm: () => applyStatusChange(selectedStatus),
    });
  };

  return (
    <section className="max-md:min-h-[90vh]">
      {/* 상단 프로젝트 공통 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl leading-[1.2] font-bold text-gray-950 md:text-3xl md:leading-[1.3]">{info.project_title}</h2>
          {!isMobile && (
            <>
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
            </>
          )}

          {user_id === 'yeaji.kim@pmgasia.com' || user_id === 'sangmin.kang@pmgasia.com' ? ( // 지사장님 계정만 잠금 토글 가능
            <Button type="button" variant="svgIcon" onClick={toggleLock} className="text-gray-600 has-[>svg]:p-1">
              {isLocked ? <Lock className="size-5" /> : <LockOpen className="size-5" />}
            </Button>
          ) : isLocked ? (
            <div className="p-1">
              <Lock className="size-5 text-gray-600" />
            </div>
          ) : (
            <div className="p-1">
              <LockOpen className="size-5 text-gray-600" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button variant="svgIcon" onClick={() => navigate(fallbackListPath)} className="text-gray-500 max-md:hidden">
            <ArrowLeft className="size-5" />
          </Button>
          {info.project_status === 'in-progress' && isProjectMember && !isLocked && (
            <Button
              variant="svgIcon"
              className="text-gray-500 max-md:hidden"
              onClick={() => {
                setProjectDialog(true);
              }}>
              <Settings className="size-5" />
            </Button>
          )}
        </div>
      </div>

      {/* 탭 메뉴: URL 이동 기반 */}
      <nav className="flex gap-4 max-md:-mx-4.5 max-md:mt-1 max-md:w-[calc(100%+var(--spacing)*9)] max-md:border-b-2 max-md:border-gray-300 max-md:px-4.5">
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
              className={`${cn(
                'hover:text-primary relative h-8 px-1 hover:bg-transparent',
                isActive ? 'text-primary font-bold' : 'hover:text-primary/80 text-gray-500'
              )} max-md:-mb-[2px]`}>
              {tab.label}
              {isActive && <span className="bg-primary absolute right-0 bottom-0 left-0 h-[2px]" />}
            </Button>
          );
        })}
      </nav>

      {/* 하위 페이지 Outlet + context 전달 */}
      <div className="py-6">
        <Outlet
          context={
            {
              projectId,
              data: info,
              summary,
              expense_data,
              expense_type,
              members,
              logs,
              refetch: fetchProject,
            } satisfies ProjectLayoutContext
          }
        />
      </div>

      <Dialog open={projectDialog} onOpenChange={setProjectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>프로젝트 상태 변경</DialogTitle>
            <DialogDescription className="leading-[1.3] break-keep">
              진행중인 프로젝트에 한해서 수정할 수 있습니다.
              <br />
              프로젝트가 종료되면 견적서, 비용, 인보이스 등록이 불가합니다.
            </DialogDescription>
          </DialogHeader>
          <RadioGroup value={selectedStatus ?? undefined} onValueChange={(value) => setSelectedStatus(value as ProjectStatus)}>
            <div className="grid grid-cols-2 items-start gap-2">
              {statusOptions
                .filter((option) => option.value !== info.project_status)
                .map((option) => (
                  <RadioButton
                    key={option.id}
                    id={option.id}
                    variant="dynamic"
                    label={option.label}
                    value={option.value}
                    size="md"
                    iconHide={true}
                  />
                ))}
            </div>
          </RadioGroup>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">취소</Button>
            </DialogClose>
            <Button type="button" onClick={handleStatusChange}>
              변경사항 저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
