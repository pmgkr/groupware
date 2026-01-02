import { Link, NavLink, useLocation, useNavigate } from 'react-router';
import { useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/hooks/useUser';
import { cn } from '@/lib/utils';
import { getImageUrl } from '@/utils';

import Logo from '@/assets/images/common/logo.svg?react';
import { Dashboard, Project, Expense, Calendar, Profile, Logout, Pto, Office, Manager, Admin } from '@/assets/images/icons';

import { Button } from '@components/ui/button';
import { Notification } from '@components/features/Dashboard/notifications';
import { getMyProfile } from '@/api/mypage';
import { notificationApi } from '@/api/notification';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const isManagerSection = location.pathname.startsWith('/manager');
  const isAdminSection = location.pathname.startsWith('/admin');

  const { user_id, user_name, job_role, profile_image } = useUser();
  const { user, logout } = useAuth();

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
  };
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);
  const [submenuTop, setSubmenuTop] = useState<number | null>(null);
  const [submenuMaxHeight, setSubmenuMaxHeight] = useState<number | null>(null);
  const submenuRef = useRef<HTMLDivElement | null>(null);
  const handleMenuEnter = (key: string | null) => (e: React.MouseEvent) => {
    setHoveredMenu(key);
    if (key && e.currentTarget) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setSubmenuTop(rect.top + window.scrollY);
      const available = window.innerHeight - rect.top - 12; // 하단 여백 확보
      setSubmenuMaxHeight(Math.max(available, 160));
    } else {
      setSubmenuTop(null);
      setSubmenuMaxHeight(null);
    }
  };

  // 서브메뉴 영역에서 X축을 벗어나면 닫기
  const handleSubmenuMouseMove = (e: React.MouseEvent) => {
    if (!submenuRef.current) return;
    const rect = submenuRef.current.getBoundingClientRect();
    const margin = 8; // 약간의 여유
    if (e.clientX < rect.left - margin || e.clientX > rect.right + margin) {
      setHoveredMenu(null);
    }
  };

  useLayoutEffect(() => {
    if (!hoveredMenu || !submenuRef.current) return;
    const rect = submenuRef.current.getBoundingClientRect();
    const bottomLimit = window.innerHeight - 10;
    const overflow = rect.bottom - bottomLimit;
    if (overflow > 0) {
      setSubmenuTop((prev) => {
        const baseTop = prev ?? rect.top + window.scrollY;
        const adjusted = Math.max(0, baseTop - overflow);
        return adjusted;
      });
    }
  }, [hoveredMenu, submenuTop]);

  // 라우트 이동 시 서브메뉴 닫기
  useEffect(() => {
    setHoveredMenu(null);
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
  }, []);

  // profile_image가 변경되면 currentProfileImage도 업데이트
  useEffect(() => {
    setCurrentProfileImage(profile_image);
  }, [profile_image]);

  const profileImageUrl = useMemo(() => {
    if (currentProfileImage) {
      if (currentProfileImage.startsWith('http')) {
        return currentProfileImage;
      }
      return `${import.meta.env.VITE_API_ORIGIN}/uploads/mypage/${currentProfileImage}`;
    }
    return getImageUrl('dummy/profile');
  }, [currentProfileImage]);

  const logoutClick = async () => {
    await logout(); // 서버 쿠키 삭제 + 토큰 초기화
    navigate('/', { replace: true });
  };

  // 오피스 하위 경로들 (오피스는 /office 라우트가 없음)
  const officePaths = ['/notice', '/meetingroom', '/seating', '/itdevice', '/book', '/suggest'];
  const isOfficeActive = officePaths.some((path) => location.pathname.startsWith(path));

  return (
    <>
      <header className="fixed top-0 left-0 z-9 flex h-18 w-full items-center justify-between border-b-1 border-b-gray-300 bg-white px-7">
        <h1 className="w-42">
          <Link to="/dashboard">
            <Logo className="w-full" />
          </Link>
        </h1>
        <ul className="text-primary-blue-300 flex items-center gap-x-4">
          <li className="relative">
            <Notification />
            {hasUnreadNoti && (
              <span className="absolute top-0.5 right-0 flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-500 opacity-75"></span>
                <span className="relative inline-flex size-2 rounded-full border border-white bg-orange-500"></span>
              </span>
            )}
          </li>
          <li>
            <Button asChild variant="svgIcon" size="icon" className="hover:text-primary-blue-500" aria-label="마이페이지">
              <Link to="/mypage">
                <Profile className="size-6" />
              </Link>
            </Button>
          </li>
          <li>
            <Button variant="svgIcon" size="icon" className="hover:text-primary-blue-500" aria-label="로그아웃" onClick={logoutClick}>
              <Logout className="size-6" />
            </Button>
          </li>
        </ul>
      </header>
      <div className="bg-primary-blue-100 fixed top-18 left-0 h-full w-60 max-[1441px]:w-50">
        <div className="my-8.5 px-8" onMouseLeave={() => setHoveredMenu(null)}>
          <Link to="/mypage">
            <div className="relative mx-auto mb-2.5 aspect-square w-25 overflow-hidden rounded-[50%]">
              <img src={profileImageUrl} alt="프로필 이미지" className="h-full w-full object-cover" />
            </div>
          </Link>
          <div className="my-2.5 text-center text-sm text-gray-700">
            <Link to="/mypage">
              <strong className="block text-xl font-medium text-gray-950">{user_name}</strong>
              {job_role}
            </Link>
          </div>
        </div>
        <ul className="mx-4 flex flex-col gap-y-2.5">
          <li>
            <NavLink
              to="/dashboard"
              onMouseEnter={handleMenuEnter(null)}
              className={({ isActive }) =>
                cn(
                  'flex h-10 items-center gap-2.5 rounded-sm px-3 text-base',
                  isActive ? 'text-primary bg-white font-semibold' : 'hover:bg-primary-blue-50 hover:text-primary-blue-500 text-gray-900'
                )
              }>
              <Dashboard className="size-6" />
              <span>대시보드</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/project"
              onMouseEnter={handleMenuEnter('project')}
              className={({ isActive }) =>
                cn(
                  'flex h-10 items-center gap-2.5 rounded-sm px-3 text-base',
                  isActive ? 'text-primary bg-white font-semibold' : 'hover:bg-primary-blue-50 hover:text-primary-blue-500 text-gray-900'
                )
              }>
              <Project />
              <span>프로젝트</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/expense"
              onMouseEnter={handleMenuEnter('expense')}
              className={({ isActive }) =>
                cn(
                  'flex h-10 items-center gap-2.5 rounded-sm px-3 text-base',
                  isActive ? 'text-primary bg-white font-semibold' : 'hover:bg-primary-blue-50 hover:text-primary-blue-500 text-gray-900'
                )
              }>
              <Expense />
              <span>일반비용</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/calendar"
              onMouseEnter={handleMenuEnter('calendar')}
              className={({ isActive }) =>
                cn(
                  'flex h-10 items-center gap-2.5 rounded-sm px-3 text-base',
                  isActive ? 'text-primary bg-white font-semibold' : 'hover:bg-primary-blue-50 hover:text-primary-blue-500 text-gray-900'
                )
              }>
              <Calendar />
              <span>캘린더</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/working"
              onMouseEnter={handleMenuEnter('null')}
              className={({ isActive }) =>
                cn(
                  'flex h-10 items-center gap-2.5 rounded-sm px-3 text-base',
                  isActive ? 'text-primary bg-white font-semibold' : 'hover:bg-primary-blue-50 hover:text-primary-blue-500 text-gray-900'
                )
              }>
              <Pto />
              <span>출퇴근관리</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/notice"
              onMouseEnter={handleMenuEnter('office')}
              className={cn(
                'flex h-10 items-center gap-2.5 rounded-sm px-3 text-base',
                isOfficeActive
                  ? 'text-primary bg-white font-semibold'
                  : 'hover:bg-primary-blue-50 hover:text-primary-blue-500 text-gray-900'
              )}>
              <Office />
              <span>오피스</span>
            </NavLink>
          </li>
          {(user?.user_level === 'manager' || user?.user_level === 'admin') && (
            <li>
              <NavLink
                to="/manager/working"
                onMouseEnter={handleMenuEnter('manager')}
                className={({ isActive }) =>
                  cn(
                    'flex h-10 items-center gap-2.5 rounded-sm px-3 text-base',
                    isActive || isManagerSection
                      ? 'text-primary bg-white font-semibold'
                      : 'hover:bg-primary-blue-50 hover:text-primary-blue-500 text-gray-900'
                  )
                }>
                <Manager />
                <span>관리자</span>
              </NavLink>
            </li>
          )}
          {user?.user_level === 'admin' && (
            <li>
              <NavLink
                to="/admin/finance"
                onMouseEnter={handleMenuEnter('admin')}
                className={({ isActive }) =>
                  cn(
                    'flex h-10 items-center gap-2.5 rounded-sm px-3 text-base',
                    isActive || isAdminSection
                      ? 'text-primary bg-white font-semibold'
                      : 'hover:bg-primary-blue-50 hover:text-primary-blue-500 text-gray-900'
                  )
                }>
                <Admin />
                <span>최고관리자</span>
              </NavLink>
            </li>
          )}
        </ul>
      </div>
      {hoveredMenu && subMenus[hoveredMenu] && subMenus[hoveredMenu].length > 0 && (
        <div
          ref={submenuRef}
          className="border-primary-blue-150 bg-primary-blue-100 fixed left-64 z-8 w-auto rounded-sm border max-[1441px]:left-54"
          style={{ top: submenuTop ?? 0 }}
        onMouseEnter={() => setHoveredMenu(hoveredMenu)}
        onMouseLeave={() => setHoveredMenu(null)}
        onMouseMove={handleSubmenuMouseMove}>
          <ul className="flex flex-col gap-y-1 p-1.5">
            {subMenus[hoveredMenu].map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/calendar' || item.to === '/project' || item.to === '/expense'}
                  onClick={() => {
                    setHoveredMenu(null);
                    // 포커스가 NavLink에 남아있는 상태에서도 메뉴가 닫히도록 blur
                    requestAnimationFrame(() => {
                      try {
                        (document.activeElement as HTMLElement | null)?.blur?.();
                      } catch {}
                    });
                  }}
                  className={({ isActive }) =>
                    cn(
                      'hover:bg-primary-blue-50 hover:text-primary-blue-500 flex h-10 items-center rounded-sm px-3 text-base text-gray-900 max-[1441px]:h-9 max-[1441px]:px-2.5',
                      isActive && 'text-primary-blue-500 bg-white font-semibold'
                    )
                  }>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
