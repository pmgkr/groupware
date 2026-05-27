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

type SubMenuItem = { label: string; to: string };

const endPaths = new Set(['/calendar', '/project', '/expense']);

function GnbItem({
  to,
  label,
  icon,
  subMenu,
  isActive: forceActive,
}: {
  to: string;
  label: string;
  icon: React.ReactNode;
  subMenu?: SubMenuItem[];
  isActive?: boolean;
}) {
  return (
    <li className="group relative z-9 px-4">
      <NavLink
        to={to}
        className={({ isActive }) =>
          cn(
            'flex h-10 items-center gap-2.5 rounded-sm px-3 text-base',
            isActive || forceActive
              ? 'text-primary bg-white font-semibold'
              : 'hover:bg-primary-blue-50 hover:text-primary-blue-500 group-hover:bg-primary-blue-50 group-hover:text-primary-blue-500 text-gray-900'
          )
        }>
        {icon}
        <span>{label}</span>
      </NavLink>
      {subMenu && subMenu.length > 0 && (
        <div className="absolute top-0 left-full z-8 hidden pl-4 group-hover:block">
          <ul className="border-primary-blue-150 bg-primary-blue-100 flex flex-col gap-y-1 rounded-sm border p-1.5">
            {subMenu.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={endPaths.has(item.to)}
                  onClick={() => {
                    requestAnimationFrame(() => {
                      try {
                        (document.activeElement as HTMLElement | null)?.blur?.();
                      } catch {}
                    });
                  }}
                  className={({ isActive }) =>
                    cn(
                      'hover:bg-primary-blue-50 hover:text-primary-blue-500 flex h-10 items-center rounded-sm px-3 text-base whitespace-nowrap text-gray-900 max-[1441px]:h-9 max-[1441px]:px-2.5',
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
    </li>
  );
}

const subMenus: Record<string, SubMenuItem[]> = {
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

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const isManagerSection = location.pathname.startsWith('/manager');
  const isAdminSection = location.pathname.startsWith('/admin');

  const { user_id, user_name, job_role, profile_image } = useUser();
  const { user, logout, setUserState } = useAuth();

  const isCellManager = user?.user_level === 'manager' && user?.cmng_fg === 'Y';
  const managerSubMenu = isCellManager ? [{ label: '근태 관리', to: '/manager/working' }] : subMenus.manager;

  /* 알림 도트 */
  const [hasUnreadNoti, setHasUnreadNoti] = useState(false);

  const fetchUnreadNotification = async () => {
    if (!user_id) return;
    try {
      const [todayRes] = await Promise.all([notificationApi.getNotification({ user_id, type: 'today', is_read: 'N' })]);
      setHasUnreadNoti(todayRes.length > 0);
    } catch (e) {
      console.error('알림 unread 조회 실패', e);
    }
  };

  useEffect(() => {
    if (!user_id) return;
    fetchUnreadNotification();
  }, [user_id]);

  useEffect(() => {
    if (!user_id) return;
    const handleNotiUpdate = () => fetchUnreadNotification();
    window.addEventListener('notification:update', handleNotiUpdate);
    return () => window.removeEventListener('notification:update', handleNotiUpdate);
  }, [user_id]);

  /* 프로필 이미지 */
  const [currentProfileImage, setCurrentProfileImage] = useState(profile_image);

  useEffect(() => {
    setCurrentProfileImage(profile_image);
  }, [profile_image]);

  useEffect(() => {
    const handleProfileUpdate = async () => {
      try {
        const updatedUser = await getMyProfile();
        setCurrentProfileImage(updatedUser.profile_image);
        if (user) setUserState({ ...user, profile_image: updatedUser.profile_image });
      } catch (error) {
        console.error('프로필 재조회 실패:', error);
      }
    };
    const handleStorageChange = async (e: StorageEvent) => {
      if (e.key !== 'profile_update') return;
      console.log('🔄 Header: 다른 탭에서 프로필 업데이트 감지');
      try {
        const updatedUser = await getMyProfile();
        setCurrentProfileImage(updatedUser.profile_image);
        if (user) setUserState({ ...user, profile_image: updatedUser.profile_image });
      } catch (error) {
        console.error('프로필 재조회 실패:', error);
      }
    };
    window.addEventListener('profile_update', handleProfileUpdate);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('profile_update', handleProfileUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user, setUserState]);

  const profileImageUrl = useMemo(() => {
    if (!currentProfileImage) return null;
    if (currentProfileImage.startsWith('http')) return currentProfileImage;
    return `${import.meta.env.VITE_API_ORIGIN}/uploads/mypage/${currentProfileImage}`;
  }, [currentProfileImage]);

  const avatarFallback = useMemo(() => getAvatarFallback(user_id || ''), [user_id]);

  const logoutClick = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const officePaths = ['/notice', '/meetingroom', '/seating', '/itdevice', '/book', '/suggest'];
  const isOfficeActive = officePaths.some((path) => location.pathname.startsWith(path));

  return (
    <>
      <header className="fixed top-0 left-0 z-9 flex h-18 w-full items-center justify-between border-b-1 border-b-gray-300 bg-white px-7">
        <h1 className="w-33">
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
      <div className="bg-primary-blue-100 fixed top-18 left-0 z-10 h-full w-50 2xl:w-60">
        <div className="my-8.5 px-8">
          <Link to="/mypage">
            <div className="relative mx-auto mb-2.5 aspect-square w-25 overflow-hidden rounded-[50%]">
              {profileImageUrl ? (
                <img src={profileImageUrl} alt="프로필 이미지" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-white text-2xl font-bold text-black">
                  {avatarFallback}
                </div>
              )}
            </div>
          </Link>
          <div className="my-2.5 text-center text-sm text-gray-700">
            <Link to="/mypage">
              <strong className="block text-xl font-medium text-gray-950">{user_name}</strong>
              {job_role}
            </Link>
          </div>
        </div>
        <ul className="flex flex-col gap-y-2.5">
          <GnbItem to="/dashboard" label="대시보드" icon={<Dashboard className="size-6" />} />
          <GnbItem to="/project" label="프로젝트" icon={<Project />} subMenu={subMenus.project} />
          <GnbItem to="/expense" label="일반비용" icon={<Expense />} subMenu={subMenus.expense} />
          <GnbItem to="/calendar" label="캘린더" icon={<Calendar />} subMenu={subMenus.calendar} />
          <GnbItem to="/working" label="출퇴근관리" icon={<Pto />} />
          <GnbItem to="/notice" label="오피스" icon={<Office />} subMenu={subMenus.office} isActive={isOfficeActive} />
          {(user?.user_level === 'manager' || user?.user_level === 'admin') && (
            <GnbItem to="/manager/working" label="관리자" icon={<Manager />} subMenu={managerSubMenu} isActive={isManagerSection} />
          )}
          {user?.user_level === 'admin' && (
            <GnbItem to="/admin/finance" label="최고관리자" icon={<Admin />} subMenu={subMenus.admin} isActive={isAdminSection} />
          )}
        </ul>
      </div>
    </>
  );
}
