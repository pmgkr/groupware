import { Link, NavLink, useLocation, useNavigate } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/hooks/useUser';
import { cn } from '@/lib/utils';
import { getImageUrl } from '@/utils';

import Logo from '@/assets/images/common/logo.svg?react';
import { Dashboard, Project, Expense, Calendar, Profile, Logout, Pto, Office, Manager, Admin } from '@/assets/images/icons';

import { Button } from '@components/ui/button';
import { Notification } from '@components/features/Dashboard/notifications';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();

  const { user_name, job_role, profile_image } = useUser();
  const { logout } = useAuth();

  const logoutClick = async () => {
    await logout(); // 서버 쿠키 삭제 + 토큰 초기화
    navigate('/', { replace: true });
  };

  // 오피스 하위 경로들 (오피스는 /office 라우트가 없음)
  const officePaths = ['/notice', '/meetingroom', '/seating', '/itdevice', '/book', '/report'];
  const isOfficeActive = officePaths.some((path) => location.pathname.startsWith(path));

  return (
    <>
      <header className="fixed top-0 left-0 z-49 flex h-18 w-full items-center justify-between border-b-1 border-b-gray-300 bg-white px-7">
        <h1 className="w-42">
          <Link to="/">
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
              <img src={getImageUrl('dummy/profile')} alt="프로필 이미지" className="h-full w-full object-cover" />
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
              <span>비용관리</span>
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
              to="/manager"
              className={({ isActive }) =>
                cn(
                  'flex h-10 items-center gap-2.5 rounded-sm px-3 text-base',
                  isActive ? 'text-primary bg-white font-semibold' : 'text-gray-900'
                )
              }>
              <Manager />
              <span>관리자</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                cn(
                  'flex h-10 items-center gap-2.5 rounded-sm px-3 text-base',
                  isActive ? 'text-primary bg-white font-semibold' : 'text-gray-900'
                )
              }>
              <Admin />
              <span>어드민</span>
            </NavLink>
          </li>
        </ul>
      </div>
    </>
  );
}
