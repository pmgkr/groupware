// src/Layout.tsx
import { NavLink, Outlet, useMatches } from 'react-router';
import Header from './Header';
import { cn } from '@/lib/utils'; // 선택: clsx+twMerge 헬퍼

export default function Layout() {
  const matches = useMatches();

  // 가장 깊은 매치(현재 페이지)
  const active = matches[matches.length - 1];

  // 가장 가까운 "섹션"(handle.nav가 있는 라우트)을 위로 올라가며 탐색
  const sectionWithNav = [...matches].reverse().find((m) => (m?.handle as { nav?: any })?.nav);

  const title: string | undefined = (active?.handle as any)?.title ?? (sectionWithNav?.handle as any)?.title;
  const childNav: { to: string; label: string; end?: boolean }[] | undefined = (sectionWithNav?.handle as any)?.nav;

  const hideChildNav = (active?.handle as any)?.hideNav === true;
  const hideTitle = (active?.handle as any)?.hideTitle === true;

  return (
    <>
      <Header />
      <div className="mt-18 ml-60 max-[1440px]:ml-50 min-h-200 bg-white px-5 py-8 2xl:px-25">
        {/* 페이지 타이틀 : router의 handle.title 값 노출 */}
        {!hideTitle && title && (
          <div className="mb-5 flex items-center has-[+nav]:mb-2">
            <h1 className="text-3xl font-bold">{title}</h1>
            {/* 2차 메뉴 노출 */}
            {!hideChildNav && childNav && childNav.length > 0 && (
              <nav className="before:mx-5 before:inline-flex before:h-8 before:w-[1px] before:bg-gray-300 before:align-middle">
                <ul className="inline-flex items-center gap-x-1">
                  {childNav.map((item) => (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.end} // 목록 탭 등에서 정확히 일치해야 활성 처리할 때
                        className={({ isActive }) =>
                          cn(
                            'rounded-xs px-3 py-1 text-base transition-colors',
                            isActive ? 'bg-primary text-white' : 'text-gray-500 hover:text-gray-800'
                          )
                        }>
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
