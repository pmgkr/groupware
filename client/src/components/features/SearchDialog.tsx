import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Search, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@components/ui/dialog';
import { searchApi, type SearchResultItem, type SearchCategory } from '@/api/search';

/** 카테고리 한글 매핑 */
const CATEGORY_LABEL: Record<SearchCategory, string> = {
  notice: '공지사항',
  project: '프로젝트',
  expense: '비용',
  calendar: '캘린더',
  book: '도서',
  meetingroom: '미팅룸',
  itdevice: 'IT디바이스',
  suggest: '제보게시판',
};

/** 빠른 메뉴 바로가기 */
type QuickMenuItem = { label: string; to: string; group: string };
const quickMenuItems: QuickMenuItem[] = [
  { label: '대시보드', to: '/dashboard', group: '메뉴' },
  { label: '프로젝트 관리', to: '/project', group: '프로젝트' },
  { label: '프로젝트 기안', to: '/project/proposal', group: '프로젝트' },
  { label: '비용 내역', to: '/expense', group: '일반비용' },
  { label: '지출 기안', to: '/expense/proposal', group: '일반비용' },
  { label: '전체 캘린더', to: '/calendar', group: '캘린더' },
  { label: '내 일정', to: '/calendar/my', group: '캘린더' },
  { label: '출퇴근관리', to: '/working', group: '메뉴' },
  { label: '공지사항', to: '/notice', group: '오피스' },
  { label: '미팅룸', to: '/meetingroom', group: '오피스' },
  { label: 'IT디바이스', to: '/itdevice', group: '오피스' },
  { label: '도서', to: '/book', group: '오피스' },
  { label: '제보게시판', to: '/suggest', group: '오피스' },
  { label: '마이페이지', to: '/mypage', group: '메뉴' },
];

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  /* 다이얼로그 열릴 때 초기화 */
  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setHasSearched(false);
      setSelectedIndex(0);
      // 포커스
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  /* Ctrl+K / Cmd+K 단축키 */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  /* 검색어 디바운스 + API 호출 */
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      setSelectedIndex(0);
      return;
    }

    /* 최소 글자 수 체크: 한글 포함 시 2자, 그 외 4자 */
    const trimmed = query.trim();
    const hasKorean = /[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(trimmed);
    const minLength = hasKorean ? 2 : 4;

    if (trimmed.length < minLength) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      setHasSearched(true);
      try {
        const res = await searchApi.search({ q: trimmed });
        setResults(res.results);
        setSelectedIndex(0);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  /* 메뉴 필터 (검색어가 있을 때 빠른 메뉴도 필터링) */
  const filteredMenus = query.trim()
    ? quickMenuItems.filter((item) => item.label.toLowerCase().includes(query.trim().toLowerCase()))
    : quickMenuItems;

  /* 전체 아이템 목록 (메뉴 + 검색 결과) */
  const allItems = [
    ...filteredMenus.map((m) => ({ type: 'menu' as const, ...m })),
    ...results.map((r) => ({ type: 'result' as const, ...r })),
  ];

  /* 선택 항목 이동 */
  const handleNavigate = useCallback(
    (to: string) => {
      onOpenChange(false);
      navigate(to);
    },
    [navigate, onOpenChange]
  );

  /* 키보드 탐색 */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, allItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && allItems[selectedIndex]) {
      e.preventDefault();
      const item = allItems[selectedIndex];
      handleNavigate(item.type === 'menu' ? item.to : item.url);
    }
  };

  /* 그룹별 분류 (메뉴) */
  const menuGroups = filteredMenus.reduce<Record<string, QuickMenuItem[]>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  /* 검색 결과를 카테고리별로 그룹핑 */
  const resultGroups = results.reduce<Record<string, SearchResultItem[]>>((acc, item) => {
    const key = CATEGORY_LABEL[item.category] || item.category;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[35%] max-w-xl gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">통합검색</DialogTitle>
        <div className="flex flex-col" onKeyDown={handleKeyDown}>
          {/* 검색 입력 */}
          <div className="flex items-center gap-2.5 border-b px-4">
            <Search className="size-5 shrink-0 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="메뉴 또는 게시물을 검색하세요..."
              className="h-13 flex-1 bg-transparent text-base outline-none placeholder:text-gray-400"
            />
            {isLoading && <Loader2 className="size-4 animate-spin text-gray-400" />}
          </div>

          {/* 결과 목록 */}
          <div className="max-h-80 overflow-y-auto p-2">
            {/* 검색어가 없을 때: 빠른 메뉴 바로가기 */}
            {!query.trim() && (
              <>
                <p className="px-3 py-2 text-xs font-semibold text-gray-400">빠른 메뉴 이동</p>
                {Object.entries(menuGroups).map(([group, items]) => (
                  <div key={group}>
                    <p className="px-3 pt-3 pb-1 text-xs font-semibold text-gray-400">{group}</p>
                    {items.map((item) => {
                      const idx = allItems.findIndex((a) => a.type === 'menu' && a.to === item.to);
                      return (
                        <button
                          key={item.to}
                          onClick={() => handleNavigate(item.to)}
                          className={`flex w-full cursor-pointer items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-sm transition-colors ${
                            idx === selectedIndex ? 'bg-primary-blue-50 text-primary-blue-500' : 'hover:bg-gray-50'
                          }`}
                        >
                          <span className="flex-1">{item.label}</span>
                          <span className="text-xs text-gray-400">{item.to}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </>
            )}

            {/* 검색어가 있을 때 */}
            {query.trim() && (
              <>
                {/* 매칭되는 메뉴 */}
                {filteredMenus.length > 0 && (
                  <div>
                    <p className="px-3 py-2 text-xs font-semibold text-gray-400">메뉴</p>
                    {filteredMenus.map((item) => {
                      const idx = allItems.findIndex((a) => a.type === 'menu' && a.to === item.to);
                      return (
                        <button
                          key={item.to}
                          onClick={() => handleNavigate(item.to)}
                          className={`flex w-full cursor-pointer items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-sm transition-colors ${
                            idx === selectedIndex ? 'bg-primary-blue-50 text-primary-blue-500' : 'hover:bg-gray-50'
                          }`}
                        >
                          <span className="flex-1">{item.label}</span>
                          <span className="text-xs text-gray-400">{item.group}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 통합검색 결과 */}
                {isLoading && (
                  <div className="flex items-center justify-center py-10 text-sm text-gray-400">
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    검색 중...
                  </div>
                )}

                {!isLoading && hasSearched && results.length === 0 && filteredMenus.length === 0 && (
                  <div className="py-10 text-center text-sm text-gray-400">
                    검색 결과가 없습니다.
                  </div>
                )}

                {!isLoading && Object.entries(resultGroups).map(([group, items]) => (
                  <div key={group}>
                    <p className="px-3 pt-3 pb-1 text-xs font-semibold text-gray-400">{group}</p>
                    {items.map((item) => {
                      const idx = allItems.findIndex((a) => a.type === 'result' && a.id === item.id);
                      return (
                        <button
                          key={`${item.category}-${item.id}`}
                          onClick={() => handleNavigate(item.url)}
                          className={`flex w-full cursor-pointer items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-sm transition-colors ${
                            idx === selectedIndex ? 'bg-primary-blue-50 text-primary-blue-500' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex-1 overflow-hidden">
                            <p className="truncate font-medium">{item.title}</p>
                            {item.description && (
                              <p className="mt-0.5 truncate text-xs text-gray-400">{item.description}</p>
                            )}
                          </div>
                          {item.created_at && (
                            <span className="shrink-0 text-xs text-gray-400">
                              {new Date(item.created_at).toLocaleDateString('ko-KR')}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </>
            )}
          </div>

          {/* 하단 단축키 안내 */}
          <div className="flex items-center gap-3 border-t px-4 py-2.5 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-gray-100 px-1.5 py-0.5 font-mono text-[10px]">↑↓</kbd>
              이동
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-gray-100 px-1.5 py-0.5 font-mono text-[10px]">Enter</kbd>
              선택
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-gray-100 px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
              검색
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
