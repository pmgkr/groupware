import { Link, NavLink, useLocation, useNavigate } from 'react-router';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/hooks/useUser';
import { cn } from '@/lib/utils';
import { getImageUrl } from '@/utils';

import Logo from '@/assets/images/common/logo.svg?react';
import { Dashboard, Project, Expense, Calendar, Profile, Logout, Pto, Office, Manager, Admin } from '@/assets/images/icons';

import { Button } from '@components/ui/button';
import { Notification } from '@components/features/Dashboard/notifications';
import { getMyProfile } from '@/api/mypage';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const isManagerSection = location.pathname.startsWith('/manager');
  const isAdminSection = location.pathname.startsWith('/admin');

  const { user_name, job_role, profile_image } = useUser();
  const { logout } = useAuth();

  // profile_image가 변경될 때만 타임스탬프를 업데이트하여 무한 로딩 방지
  // 프로필 이미지 로컬 상태 추가
  const [currentProfileImage, setCurrentProfileImage] = useState(profile_image);

  // 프로필 업데이트 이벤트 리스닝
  useEffect(() => {
    const handleProfileUpdate = async () => {
      console.log('🔄 Header: 프로필 업데이트 감지');
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
        return `${currentProfileImage}?t=${Date.now()}`;
      }
      return `${import.meta.env.VITE_API_ORIGIN}/uploads/mypage/${currentProfileImage}?t=${Date.now()}`;
    }
    return getImageUrl('dummy/profile');
  }, [currentProfileImage]);

  const logoutClick = async () => {
    await logout(); // 서버 쿠키 삭제 + 토큰 초기화
    navigate('/', { replace: true });
  };

  // 오피스 하위 경로들 (오피스는 /office 라우트가 없음)
  const officePaths = ['/notice', '/meetingroom', '/seating', '/itdevice', '/book', '/report'];
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
          <li>
            <Notification />
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
      <div className="bg-primary-blue-100 fixed top-18 left-0 h-full w-60">
        <div className="my-8.5 px-8">
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
              className={({ isActive }) =>
                cn(
                  'flex h-10 items-center gap-2.5 rounded-sm px-3 text-base',
                  isActive ? 'text-primary bg-white font-semibold' : 'text-gray-900'
                )
              }>
              <Dashboard className="size-6" />
              <span>대시보드</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/project"
              className={({ isActive }) =>
                cn(
                  'flex h-10 items-center gap-2.5 rounded-sm px-3 text-base',
                  isActive ? 'text-primary bg-white font-semibold' : 'text-gray-900'
                )
              }>
              <Project />
              <span>프로젝트</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/expense"
              className={({ isActive }) =>
                cn(
                  'flex h-10 items-center gap-2.5 rounded-sm px-3 text-base',
                  isActive ? 'text-primary bg-white font-semibold' : 'text-gray-900'
                )
              }>
              <Expense />
              <span>일반비용</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/calendar"
              className={({ isActive }) =>
                cn(
                  'flex h-10 items-center gap-2.5 rounded-sm px-3 text-base',
                  isActive ? 'text-primary bg-white font-semibold' : 'text-gray-900'
                )
              }>
              <Calendar />
              <span>캘린더</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/working"
              className={({ isActive }) =>
                cn(
                  'flex h-10 items-center gap-2.5 rounded-sm px-3 text-base',
                  isActive ? 'text-primary bg-white font-semibold' : 'text-gray-900'
                )
              }>
              <Pto />
              <span>출퇴근관리</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/notice"
              className={cn(
                'flex h-10 items-center gap-2.5 rounded-sm px-3 text-base',
                isOfficeActive ? 'text-primary bg-white font-semibold' : 'text-gray-900'
              )}>
              <Office />
              <span>오피스</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/manager/working"
              className={({ isActive }) =>
                cn(
                  'flex h-10 items-center gap-2.5 rounded-sm px-3 text-base',
                  isActive || isManagerSection ? 'text-primary bg-white font-semibold' : 'text-gray-900'
                )
              }>
              <Manager />
              <span>관리자</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/finance"
              className={({ isActive }) =>
                cn(
                  'flex h-10 items-center gap-2.5 rounded-sm px-3 text-base',
                  isActive || isAdminSection ? 'text-primary bg-white font-semibold' : 'text-gray-900'
                )
              }>
              <Admin />
              <span>최고관리자</span>
            </NavLink>
          </li>
        </ul>
      </div>
    </>
  );
}
