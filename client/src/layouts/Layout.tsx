// src/Layout.tsx
import { NavLink, Outlet, useMatches } from 'react-router';
import Header from './Header';
import HeaderMobile from './HeaderMobile';
import { cn } from '@/lib/utils'; // 선택: clsx+twMerge 헬퍼
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import { useIsMobileViewport } from '@/hooks/useViewport';
import { useAuth } from '@/contexts/AuthContext';

export default function Layout() {
  const matches = useMatches();
  const isMobile = useIsMobileViewport();
  const { user } = useAuth();

  console.log('유저데이터', user);
  const isCellManager = user?.user_level === 'manager' && user?.cmng_fg === 'Y';

  // 가장 깊은 매치(현재 페이지)
  const active = matches[matches.length - 1];

  // 가장 가까운 "섹션"(handle.nav가 있는 라우트)을 위로 올라가며 탐색
  const sectionWithNav = [...matches].reverse().find((m) => (m?.handle as { nav?: any })?.nav);

  const title: string | undefined = (active?.handle as any)?.title ?? (sectionWithNav?.handle as any)?.title;
  const rawChildNav: { to: string; label: string; end?: boolean; active?: (pathname: string) => boolean }[] | undefined = (
    sectionWithNav?.handle as any
  )?.nav;
  const childNav = isCellManager && title === '관리자' ? rawChildNav?.filter((item) => item.to === '/manager/working') : rawChildNav;

  const hideChildNav = (active?.handle as any)?.hideNav === true;
  const hideTitle = (active?.handle as any)?.hideTitle === true;

  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const location = useLocation();
  const pathname = location.pathname;

  const activeIndex = childNav?.findIndex((item) => {
    if (item.active) return item.active(pathname);
    if (item.end) return pathname === item.to;
    return pathname === item.to || pathname.startsWith(item.to + '/');
  });

  useEffect(() => {
    if (activeIndex == null || activeIndex < 0) return;

    const el = itemRefs.current[activeIndex];
    if (!el) return;

    el.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    });
  }, [activeIndex]);

  return (
    <>
      {isMobile ? <HeaderMobile /> : <Header />}
      <div className="min-h-screen max-w-[100vw] overflow-x-scroll bg-white p-4.5 pt-17.5 pb-20 md:mt-18 md:ml-50 md:min-h-200 md:max-w-none md:overflow-x-visible md:px-6 md:py-8 2xl:ml-60 2xl:px-16">
        {/* 페이지 타이틀 : router의 handle.title 값 노출 */}
        {!hideTitle && title && (
          <div className="mb-5 flex items-center has-[+nav]:mb-2">
            <h1 className="shrink-0 text-3xl font-bold after:mx-5 after:inline-flex after:h-8 after:w-[1px] after:bg-gray-300 after:align-middle max-md:text-xl max-md:after:mx-4 max-md:after:h-6">
              {title}
            </h1>
            {/* 2차 메뉴 노출 */}
            {!hideChildNav && childNav && childNav.length > 0 && (
              <nav className="scrollbar-hide relative flex flex-1 items-center overflow-x-auto overflow-y-hidden whitespace-nowrap max-md:-mr-[18px] max-md:h-[28px] max-md:[touch-action:pan-x] max-md:pr-[18px] md:overflow-visible">
                <ul className="inline-flex items-center gap-x-1">
                  {childNav.map((item, idx) => (
                    <li
                      key={item.to}
                      ref={(el) => {
                        itemRefs.current[idx] = el;
                      }}
                      className="shrink-0">
                      <NavLink
                        to={item.to}
                        end={item.end}
                        className={({ isActive: defaultActive }) => {
                          const isActive = item.active ? item.active(pathname) : defaultActive;
                          return cn(
                            'rounded-xs px-3 py-1 text-base transition-colors max-md:text-sm',
                            isActive ? 'bg-primary text-white' : 'text-gray-500 hover:text-gray-800'
                          );
                        }}>
                        {item.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </div>
        )}
        <Outlet />
      </div>
    </>
  );
}
