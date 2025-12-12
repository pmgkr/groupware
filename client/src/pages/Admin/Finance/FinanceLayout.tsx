import { useNavigate, useLocation } from 'react-router';
import { cn } from '@/lib/utils';

import { Button } from '@components/ui/button';

const tabs = [
  { key: 'pexpense', label: '프로젝트 비용', path: '' },
  { key: 'expense', label: '일반 비용', path: 'expense' },
  { key: 'invoice', label: '인보이스', path: 'invoice' },
  { key: 'report', label: '프로젝트 리포트', path: 'report' },
] as const;

export default function FinanceLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const basePath = '/admin/finance';
  const currentPath = location.pathname;

  return (
    <>
      {/* 탭 메뉴: URL 이동 기반 */}
      <nav className="flex gap-4">
        {tabs.map((tab) => {
          let isActive = false;

          if (tab.path === '') {
            // 기본 탭: /admin/finance 정확히 일치
            isActive = currentPath === basePath;
          } else {
            // 하위 탭: /admin/finance/${tab.path} 로 시작
            isActive = currentPath.startsWith(`${basePath}/${tab.path}`);
          }

          return (
            <Button
              key={tab.key}
              variant="ghost"
              onClick={() => navigate(tab.path)}
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
    </>
  );
}
