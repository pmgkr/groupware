import { Link, NavLink, useLocation, useNavigate } from 'react-router';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/hooks/useUser';
import { cn } from '@/lib/utils';
import { getAvatarFallback } from '@/utils';

import Logo from '@/assets/images/common/logo.svg?react';
import { Dashboard, Project, Expense, Calendar, Profile, Logout, Pto, Office, Manager, Admin } from '@/assets/images/icons';

import { Button } from '@components/ui/button';
import { Notification } from '@components/features/Dashboard/notifications';
import { getMyProfile } from '@/api/mypage';
import { notificationApi } from '@/api/notification';
import { X, Menu, Home } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@components/ui/sheet';
import getWelcomeMessage from '@components/features/Dashboard/welcome';
import Weather from '@components/features/Dashboard/weather';

export default function HeaderMobile() {
  const location = useLocation();
  const navigate = useNavigate();
  const isManagerSection = location.pathname.startsWith('/manager');
  const isAdminSection = location.pathname.startsWith('/admin');

  const { user_id, user_name, job_role, profile_image, birth_date } = useUser();
  const { user, logout, setUserState } = useAuth();

  const subMenus: Record<string, { label: string; to: string }[]> = {
    project: [
      { label: '프로젝트 관리', to: '/project' },
      { label: '프로젝트 기안', to: '/project/proposal' },
    ],
    expense: [
      { label: '비용 내역', to: '/expense' },
      { label: '지출 기안', to: '/expense/proposal' },
    ],
    calendar: [
      { label: '전체', to: '/calendar' },
      { label: '내 일정', to: '/calendar/my' },
    ],
    office: [
      { label: '공지사항', to: '/notice' },
      { label: '미팅룸', to: '/meetingroom' },
      { label: 'IT디바이스', to: '/itdevice' },
      { label: '도서', to: '/book' },
      { label: '제보게시판', to: '/suggest' },
    ],
    manager: [
      { label: '근태 관리', to: '/manager/working' },
      { label: '추가근무 관리', to: '/manager/overtime' },
      { label: '프로젝트 비용 관리', to: '/manager/pexpense' },
      { label: '일반 비용 관리', to: '/manager/nexpense' },
      { label: '휴가 관리', to: '/manager/vacation' },
      { label: '기안서 관리', to: '/manager/proposal' },
      { label: '구성원 관리', to: '/manager/member' },
    ],
    admin: [
      { label: '파이낸스', to: '/admin/finance' },
      { label: '근태 관리', to: '/admin/working' },
      { label: '추가근무 관리', to: '/admin/overtime' },
      { label: '휴가 관리', to: '/admin/vacation' },
      { label: '기안서 관리', to: '/admin/proposal' },
      { label: '구성원 관리', to: '/admin/member' },
    ],
    cctask: [
      { label: '요청 목록', to: '/cctask' },
      { label: '작업 등록', to: '/cctask/register' },
    ],
  };
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  // 메뉴 클릭 시 서브메뉴 토글
  const handleMenuClick = (key: string | null) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (key && subMenus[key] && subMenus[key].length > 0) {
      setExpandedMenu(expandedMenu === key ? null : key);
    } else {
      // 서브메뉴가 없는 메뉴는 바로 이동
      const target = e.currentTarget as HTMLElement;
      const link = target.closest('a');
      if (link) {
        const href = link.getAttribute('href');
        if (href) {
          navigate(href);
          setIsSidebarOpen(false);
        }
      }
    }
  };

  // 라우트 이동 시 서브메뉴 닫기 및 사이드바 닫기
  useEffect(() => {
    setExpandedMenu(null);
    setIsSidebarOpen(false);
  }, [location.pathname]);

  /* 알림 도트  */
  useEffect(() => {
    if (!user_id) return;
    fetchUnreadNotification();
  }, [user_id]);

  const [hasUnreadNoti, setHasUnreadNoti] = useState(false);
  useEffect(() => {
    if (!user_id) return;

    const handleNotiUpdate = () => {
      fetchUnreadNotification();
    };

    window.addEventListener('notification:update', handleNotiUpdate);

    return () => {
      window.removeEventListener('notification:update', handleNotiUpdate);
    };
  }, [user_id]);

  const fetchUnreadNotification = async () => {
    if (!user_id) return;

    try {
      const [todayRes] = await Promise.all([
        notificationApi.getNotification({
          user_id,
          type: 'today',
          is_read: 'N',
        }),
      ]);

      const totalUnread = todayRes.length;
      // 디버깅
      /* console.group('[Unread Debug]');
      console.log('today unread:', todayRes.length);
      console.log('recent unread:', recentRes.length);
      console.log('total unread:', totalUnread);
      console.groupEnd(); */

      setHasUnreadNoti(totalUnread > 0);
    } catch (e) {
      console.error('알림 unread 조회 실패', e);
    }
  };

  // profile_image가 변경될 때만 타임스탬프를 업데이트하여 무한 로딩 방지
  // 프로필 이미지 로컬 상태 추가
  const [currentProfileImage, setCurrentProfileImage] = useState(profile_image);

  // 프로필 업데이트 이벤트 리스닝
  useEffect(() => {
    const handleProfileUpdate = async () => {
      //console.log('🔄 Header: 프로필 업데이트 감지');
      try {
        const updatedUser = await getMyProfile();
        setCurrentProfileImage(updatedUser.profile_image);
        if (user) {
          setUserState({ ...user, profile_image: updatedUser.profile_image });
        }
      } catch (error) {
        console.error('프로필 재조회 실패:', error);
      }
    };
    // 다른 탭에서의 업데이트 감지
    const handleStorageChange = async (e: StorageEvent) => {
      if (e.key === 'profile_update') {
        console.log('🔄 Header: 다른 탭에서 프로필 업데이트 감지');
        try {
          const updatedUser = await getMyProfile();
          setCurrentProfileImage(updatedUser.profile_image);
          if (user) {
            setUserState({ ...user, profile_image: updatedUser.profile_image });
          }
        } catch (error) {
          console.error('프로필 재조회 실패:', error);
        }
      }
    };

    window.addEventListener('profile_update', handleProfileUpdate);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('profile_update', handleProfileUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user, setUserState]);

  // profile_image가 변경되면 currentProfileImage도 업데이트
  useEffect(() => {
    setCurrentProfileImage(profile_image);
  }, [profile_image]);

  const profileImageUrl = useMemo(() => {
    if (!currentProfileImage) return null; // ⬅️ 빈 문자열 대신 null 반환

    if (currentProfileImage.startsWith('http')) {
      return currentProfileImage; // ⬅️ 타임스탬프 제거
    }
    return `${import.meta.env.VITE_API_ORIGIN}/uploads/mypage/${currentProfileImage}`; // ⬅️ 타임스탬프 제거
  }, [currentProfileImage]);

  const avatarFallback = useMemo(() => {
    return getAvatarFallback(user_id || '');
  }, [user_id]);

  const logoutClick = async () => {
    await logout(); // 서버 쿠키 삭제 + 토큰 초기화
    navigate('/', { replace: true });
  };

  // 오피스 하위 경로들 (오피스는 /office 라우트가 없음)
  const officePaths = ['/notice', '/meetingroom', '/seating', '/itdevice', '/book', '/suggest'];
  const isOfficeActive = officePaths.some((path) => location.pathname.startsWith(path));

  // getWelcomeMessage를 메모이제이션하여 리렌더링 시에도 같은 메시지 유지
  const welcomeMessage = useMemo(() => getWelcomeMessage(user_name, birth_date), [user_name, birth_date]);

  // 메뉴 항목 공통 스타일
  const getMenuLinkClassName = (isActive: boolean, isExpanded?: boolean) =>
    cn(
      'flex h-12 items-center justify-center rounded-lg px-3 text-lg',
      isActive
        ? 'text-primary bg-primary-blue-100/50 text-primary-blue-500 font-semibold'
        : isExpanded
          ? 'text-primary-blue-500 font-semibold'
          : 'hover:bg-primary-blue-50 hover:text-primary-blue-500 text-gray-900'
    );

  const getSubMenuLinkClassName = (isActive: boolean) =>
    cn(
      'flex h-9 items-center justify-center text-center rounded-sm text-base',
      isActive ? 'text-primary-blue-500 bg-white font-semibold' : 'text-gray-500 hover:bg-primary-blue-50'
    );

  return (
    <>
      {/* 모바일 헤더 */}
      <header className="fixed top-0 left-0 z-9 flex h-[50px] w-full items-center justify-between border-b-1 border-b-gray-300 bg-white px-4">
        <div className="flex items-center gap-4">
          <h1 className="w-33">
            <Link to="/dashboard">
              <Logo className="w-full" />
            </Link>
          </h1>
        </div>
        <ul className="text-primary-blue-300 flex items-center gap-x-1">
          <li className="relative">
            <Notification />
            {hasUnreadNoti && (
              <span className="absolute top-0.5 right-0 flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-500 opacity-75"></span>
                <span className="relative inline-flex size-2 rounded-full border border-white bg-orange-500"></span>
              </span>
            )}
          </li>
        </ul>
      </header>

      {/* 모바일 토글 사이드 메뉴 */}
      <Sheet
        open={isSidebarOpen}
        onOpenChange={(open) => {
          setIsSidebarOpen(open);
          if (!open) {
            setExpandedMenu(null);
          }
        }}>
        <SheetContent side="right" className="flex w-full! max-w-full! flex-col bg-white p-0">
          <SheetHeader className="border-b border-gray-300 p-5">
            <SheetTitle className="sr-only">메뉴</SheetTitle>
            <div className="flex items-center gap-2.5">
              <Link to="/mypage" onClick={() => setIsSidebarOpen(false)}>
                <div className="relative aspect-square w-10 flex-shrink-0 overflow-hidden rounded-[50%]">
                  {profileImageUrl ? (
                    <img src={profileImageUrl} alt="프로필 이미지" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-white text-base font-bold text-black">
                      {avatarFallback}
                    </div>
                  )}
                </div>
              </Link>
              <div className="align-left text-left">
                <Link to="/mypage" onClick={() => setIsSidebarOpen(false)}>
                  <strong className="text-base font-medium text-gray-950">
                    {user_name} <span className="text-sm text-gray-500">{job_role}</span>
                  </strong>
                </Link>
                <div className="text-sm">
                  <Weather />
                </div>
              </div>
            </div>
          </SheetHeader>
          {/* <div className="text-center">
            <p className="text-sm">{welcomeMessage}</p>
          </div> */}
          <ul className="fixed top-[50%] left-[50%] flex max-h-[70vh] w-full flex-1 translate-x-[-50%] translate-y-[-50%] flex-col justify-start gap-y-2.5 overflow-y-auto px-5">
            <li>
              <NavLink to="/dashboard" onClick={() => setIsSidebarOpen(false)} className={({ isActive }) => getMenuLinkClassName(isActive)}>
                <span>대시보드</span>
              </NavLink>
            </li>
            <li>
              <div>
                <NavLink
                  to="/project"
                  onClick={handleMenuClick('project')}
                  className={({ isActive }) => getMenuLinkClassName(isActive, expandedMenu === 'project')}>
                  <span>프로젝트</span>
                </NavLink>
                <div
                  className={cn(
                    'grid transition-[grid-template-rows] duration-300 ease-out',
                    expandedMenu === 'project' ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  )}>
                  <div className="min-h-0 overflow-hidden">
                    <ul className="mt-1 mb-2 flex flex-col gap-y-1">
                      {subMenus.project.map((item) => (
                        <li key={item.to}>
                          <NavLink
                            to={item.to}
                            onClick={() => {
                              setIsSidebarOpen(false);
                              setExpandedMenu(null);
                            }}
                            className={({ isActive }) => getSubMenuLinkClassName(isActive)}>
                            {item.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </li>
            <li>
              <div>
                <NavLink
                  to="/expense"
                  onClick={handleMenuClick('expense')}
                  className={({ isActive }) => getMenuLinkClassName(isActive, expandedMenu === 'expense')}>
                  <span>일반비용</span>
                </NavLink>
                <div
                  className={cn(
                    'grid transition-[grid-template-rows] duration-300 ease-out',
                    expandedMenu === 'expense' ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  )}>
                  <div className="min-h-0 overflow-hidden">
                    <ul className="mt-1 mb-2 flex flex-col gap-y-1">
                      {subMenus.expense.map((item) => (
                        <li key={item.to}>
                          <NavLink
                            to={item.to}
                            onClick={() => {
                              setIsSidebarOpen(false);
                              setExpandedMenu(null);
                            }}
                            className={({ isActive }) => getSubMenuLinkClassName(isActive)}>
                            {item.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </li>
            <li>
              <div>
                <NavLink
                  to="/calendar"
                  onClick={handleMenuClick('calendar')}
                  className={({ isActive }) => getMenuLinkClassName(isActive, expandedMenu === 'calendar')}>
                  <span>캘린더</span>
                </NavLink>
                <div
                  className={cn(
                    'grid transition-[grid-template-rows] duration-300 ease-out',
                    expandedMenu === 'calendar' ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  )}>
                  <div className="min-h-0 overflow-hidden">
                    <ul className="mt-1 mb-2 flex flex-col gap-y-1">
                      {subMenus.calendar.map((item) => (
                        <li key={item.to}>
                          <NavLink
                            to={item.to}
                            onClick={() => {
                              setIsSidebarOpen(false);
                              setExpandedMenu(null);
                            }}
                            className={({ isActive }) => getSubMenuLinkClassName(isActive)}>
                            {item.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </li>
            <li>
              <NavLink to="/working" onClick={() => setIsSidebarOpen(false)} className={({ isActive }) => getMenuLinkClassName(isActive)}>
                <span>출퇴근관리</span>
              </NavLink>
            </li>
            <li>
              <div>
                <NavLink
                  to="/notice"
                  onClick={handleMenuClick('office')}
                  className={({ isActive }) => getMenuLinkClassName(isActive || isOfficeActive, expandedMenu === 'office')}>
                  <span>오피스</span>
                </NavLink>
                <div
                  className={cn(
                    'grid transition-[grid-template-rows] duration-300 ease-out',
                    expandedMenu === 'office' ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  )}>
                  <div className="min-h-0 overflow-hidden">
                    <ul className="mt-1 mb-2 flex flex-col gap-y-1">
                      {subMenus.office.map((item) => (
                        <li key={item.to}>
                          <NavLink
                            to={item.to}
                            onClick={() => {
                              setIsSidebarOpen(false);
                              setExpandedMenu(null);
                            }}
                            className={({ isActive }) => getSubMenuLinkClassName(isActive)}>
                            {item.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </li>
            <li>
              <div>
                <NavLink
                  to="/cctask"
                  onClick={handleMenuClick('cctask')}
                  className={({ isActive }) => getMenuLinkClassName(isActive, expandedMenu === 'cctask')}>
                  <span>작업요청</span>
                </NavLink>
                <div
                  className={cn(
                    'grid transition-[grid-template-rows] duration-300 ease-out',
                    expandedMenu === 'cctask' ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  )}>
                  <div className="min-h-0 overflow-hidden">
                    <ul className="mt-1 mb-2 flex flex-col gap-y-1">
                      {subMenus.cctask.map((item) => (
                        <li key={item.to}>
                          <NavLink
                            to={item.to}
                            onClick={() => {
                              setIsSidebarOpen(false);
                              setExpandedMenu(null);
                            }}
                            className={({ isActive }) => getSubMenuLinkClassName(isActive)}>
                            {item.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </li>
            {(user?.user_level === 'manager' || user?.user_level === 'admin') && (
              <li>
                <NavLink
                  to="/manager/working"
                  onClick={() => setIsSidebarOpen(false)}
                  className={({ isActive }) => getMenuLinkClassName(isActive || isManagerSection)}>
                  <span>관리자</span>
                </NavLink>
              </li>
            )}
            {user?.user_level === 'admin' && (
              <li>
                <NavLink
                  to="/admin/finance"
                  onClick={() => setIsSidebarOpen(false)}
                  className={({ isActive }) => getMenuLinkClassName(isActive || isAdminSection)}>
                  <span>최고관리자</span>
                </NavLink>
              </li>
            )}
          </ul>
          <div className="mt-auto flex items-center justify-center gap-1 p-5">
            <Button variant="ghost" size="sm" className="text-gray-500" aria-label="마이페이지">
              <Link to="/mypage" onClick={() => setIsSidebarOpen(false)}>
                <span className="text-sm font-medium">마이페이지</span>
              </Link>
            </Button>
            <span className="h-3 w-px bg-gray-300" aria-hidden />
            <Button variant="ghost" size="sm" className="text-gray-500" aria-label="로그아웃" onClick={logoutClick}>
              <span className="text-sm font-medium">로그아웃</span>
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* 모바일 하단바 */}
      <nav className="safe-area-inset-bottom fixed bottom-0 left-0 z-9 flex h-[60px] w-full items-center justify-around border-t-1 border-t-gray-300 bg-white px-2">
        <NavLink
          to="/dashboard"
          end
          className={({ isActive }) =>
            cn(
              'flex h-full flex-1 flex-col items-center justify-center gap-1 transition-colors',
              isActive ? 'text-primary-blue-500' : 'text-gray-600'
            )
          }>
          <Dashboard className="size-5.5" />
          <span className="text-[11px] font-medium">대시보드</span>
        </NavLink>
        <NavLink
          to="/project"
          className={({ isActive }) =>
            cn(
              'flex h-full flex-1 flex-col items-center justify-center gap-1 transition-colors',
              isActive || location.pathname.startsWith('/project') ? 'text-primary-blue-500' : 'text-gray-600'
            )
          }>
          <Project className="size-5.5" />
          <span className="text-[11px] font-medium">프로젝트</span>
        </NavLink>
        <NavLink
          to="/expense"
          className={({ isActive }) =>
            cn(
              'flex h-full flex-1 flex-col items-center justify-center gap-1 transition-colors',
              isActive || location.pathname.startsWith('/expense') ? 'text-primary-blue-500' : 'text-gray-600'
            )
          }>
          <Expense className="size-5.5" />
          <span className="text-[11px] font-medium">일반비용</span>
        </NavLink>
        <NavLink
          to="/calendar"
          className={({ isActive }) =>
            cn(
              'flex h-full flex-1 flex-col items-center justify-center gap-1 transition-colors',
              isActive || location.pathname.startsWith('/calendar') ? 'text-primary-blue-500' : 'text-gray-600'
            )
          }>
          <Calendar className="size-5.5" />
          <span className="text-[11px] font-medium">캘린더</span>
        </NavLink>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className={cn(
            'flex h-full flex-1 flex-col items-center justify-center gap-1 transition-colors',
            'active:text-primary-blue-500 text-gray-600'
          )}
          aria-label="메뉴 열기">
          <Menu className="size-5.5" />
          <span className="text-[11px] font-medium">메뉴</span>
        </button>
      </nav>
    </>
  );
}
