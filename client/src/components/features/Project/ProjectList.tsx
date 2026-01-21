import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router';
import { cn } from '@/lib/utils';
import { getGrowingYears } from '@/utils';
import { useViewport, useIsMobileViewport } from '@/hooks/useViewport';

import { ProjectCreateForm } from './_components/ProjectCreate';
import { getProjectList, type ProjectListItem, getClientList, getTeamList, getBookmarkList, addBookmark, removeBookmark } from '@/api';
import { ProjectCardList } from './_responsive/ProjectCardList';
import { ProjectTable } from './_responsive/ProjectTable';

import { Input } from '@/components/ui/input';
import { Button } from '@components/ui/button';
import { AppPagination } from '@/components/ui/AppPagination';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectItem } from '@components/ui/select';
import { MultiSelect, type MultiSelectOption, type MultiSelectRef } from '@components/multiselect/multi-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

import { Star, RefreshCw, ListFilter } from 'lucide-react';

export default function ProjectList() {
  const { search } = useLocation();
  const viewport = useViewport();
  const isMobile = viewport === 'mobile';
  const [searchParams, setSearchParams] = useSearchParams(); // 파라미터 값 저장

  const [registerDialog, setRegisterDialog] = useState(false);

  // 프로젝트 리스트 API 조회용 State
  const [favorites, setFavorites] = useState<string[]>([]);
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<number>(() => Number(searchParams.get('page') || 1));
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(15);

  // 상단 필터용 state
  const getParam = (key: string) => searchParams.get(key) ?? '';
  const getArrayParam = (key: string) => searchParams.get(key)?.split(',') ?? [];

  const currentYear = String(new Date().getFullYear()); // 올해 구하기
  const yearOptions = getGrowingYears(); // yearOptions
  const [activeTab, setActiveTab] = useState<'mine' | 'others'>(() => {
    return (searchParams.get('tab') as 'mine' | 'others') || 'mine';
  });
  const [selectedYear, setSelectedYear] = useState(() => searchParams.get('project_year') || currentYear);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string[]>([]);
  const [selectedClient, setSelectedClient] = useState<string[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState(''); // 사용자가 입력중인 Input 저장값
  const [searchQuery, setSearchQuery] = useState(''); // 실제 검색 Input 저장값
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // ✅ MultiSelect refs
  const categoryRef = useRef<MultiSelectRef>(null);
  const clientRef = useRef<MultiSelectRef>(null);
  const teamRef = useRef<MultiSelectRef>(null);
  const statusRef = useRef<MultiSelectRef>(null);

  /** ✅ 프로젝트 생성 후 새로고침 */
  const handleCreateSuccess = () => {
    fetchProjects();
    setRegisterDialog(false);
  };

  /** ✅ 상단 필터용 옵션 */
  const [clientOptions, setClientOptions] = useState<MultiSelectOption[]>([]);
  const [teamOptions, setTeamOptions] = useState<MultiSelectOption[]>([]);

  const categoryOptions: MultiSelectOption[] = [
    { label: 'Web', value: 'Web' },
    { label: 'Campaign', value: 'Campaign' },
    { label: 'Event Promotion', value: 'Event  Promotion' },
    { label: 'Performance', value: 'Performance' },
    { label: 'Digital Media', value: 'Digital Media' },
    { label: 'Production', value: 'Production' },
    { label: 'Others', value: 'Others' },
  ];

  const statusOptions: MultiSelectOption[] = [
    { label: '진행중', value: 'in-progress' },
    { label: '종료됨', value: 'completed' },
    { label: '정산완료', value: 'done' },
    { label: '취소됨', value: 'cancelled' },
  ];

  // MultiSelect Select 옵션 복구
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [clients, teams] = await Promise.all([getClientList(), getTeamList()]);
        setClientOptions(clients.map((c) => ({ label: c.cl_name, value: String(c.cl_seq) })));
        setTeamOptions(teams.map((t) => ({ label: t.team_name, value: String(t.team_id) })));
      } catch (err) {
        console.error('❌ 필터 옵션 불러오기 실패:', err);
      }
    };
    fetchFilterOptions();
  }, []);

  // params에 따라 상단 필터 복구
  useEffect(() => {
    if (!search) return;

    // 1. 탭
    const tab = (getParam('tab') as 'mine' | 'others') || 'mine';
    setActiveTab(tab);

    // 2. year (others만)
    if (tab === 'others') {
      setSelectedYear(getParam('project_year') || currentYear);
    }

    // 3. 단일 Select
    setSelectedBrand(getParam('brand'));

    // 4. MultiSelect state
    const categories = getArrayParam('category');
    const clients = getArrayParam('client_id');
    const teams = getArrayParam('team_id');
    const statuses = getArrayParam('status');

    setSelectedCategory(categories);
    setSelectedClient(clients);
    setSelectedTeam(teams);
    setSelectedStatus(statuses);

    // 6. 페이지
    setPage(Number(getParam('page') || 1));
  }, []); // 🔥 반드시 1회

  // 필터 변경 시 page 초기화
  const handleFilterChange = (setter: any, key: string, value: any) => {
    setter(value);
    setPage(1);

    updateSearchParams({
      page: 1,
      [key]: value,
    });
  };

  // 탭 변경 시 필터 초기화
  const resetAllFilters = () => {
    setSelectedBrand('');
    setSelectedCategory([]);
    setSelectedClient([]);
    setSelectedTeam([]);
    setSelectedStatus([]);
    setSearchQuery('');
    setShowFavoritesOnly(false);

    // MultiSelect 내부 상태 초기화
    categoryRef.current?.clear();
    clientRef.current?.clear();
    teamRef.current?.clear();
    statusRef.current?.clear();
  };

  const handleTabChange = (tab: 'mine' | 'others') => {
    setActiveTab(tab);
    setPage(1);
    resetAllFilters();

    setSearchParams({ tab: tab, page: '1' });
  };

  // 즐겨찾기 리스트 불러오기
  const fetchFavorites = useCallback(async () => {
    try {
      const res = await getBookmarkList();
      setFavorites(res.map((item) => String(item.project_id)));
    } catch (err) {
      console.error('❌ 즐겨찾기 목록 불러오기 실패:', err);
    }
  }, []);

  // 즐겨찾기 토글
  const toggleFavorite = useCallback(
    async (projectId: string) => {
      const isFav = favorites.includes(projectId);
      try {
        if (isFav) {
          await removeBookmark(projectId);
          setFavorites((prev) => prev.filter((id) => id !== projectId));
        } else {
          await addBookmark(projectId);
          setFavorites((prev) => [...prev, projectId]);
        }
      } catch (err) {
        console.error(`❌ 즐겨찾기 ${isFav ? '삭제' : '추가'} 실패:`, err);
      }
    },
    [favorites]
  );

  // 파라미터 업데이트 유틸 함수
  const updateSearchParams = useCallback(
    (next: Record<string, any>) => {
      const params = new URLSearchParams(searchParams);

      Object.entries(next).forEach(([key, value]) => {
        if (!value || (Array.isArray(value) && value.length === 0)) {
          params.delete(key);
        } else {
          params.set(key, Array.isArray(value) ? value.join(',') : String(value));
        }
      });

      setSearchParams(params);
      console.log(searchParams);
    },
    [searchParams, setSearchParams]
  );

  useEffect(() => {
    const brand = searchParams.get('brand') ?? '';
    if (brand !== selectedBrand) {
      setSelectedBrand(brand);
    }

    if (activeTab === 'others') {
      const year = searchParams.get('project_year') ?? currentYear;
      if (year !== selectedYear) {
        setSelectedYear(year);
      }
    }
  }, [searchParams, activeTab]);

  // 프로젝트 리스트 가져오기
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);

      const params: Record<string, any> = {
        page,
        size: pageSize,
        type: activeTab,
        team_id: selectedTeam.join(','),
        client_id: selectedClient.join(','),
        project_brand: selectedBrand,
        project_category: selectedCategory.join(','),
        project_status: selectedStatus.join(','),
        s: searchQuery,
      };

      if (activeTab === 'others') params.project_year = selectedYear;

      // 북마크를 클릭한 경우 추가 파라미터 전달
      if (showFavoritesOnly) {
        params.tagged = 'Y';
      }

      const res = await getProjectList(params);

      setProjects(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error('❌ 프로젝트 불러오기 실패:', err);
    } finally {
      setLoading(false);
    }
  }, [
    page,
    selectedYear,
    selectedBrand,
    selectedCategory,
    selectedClient,
    selectedTeam,
    selectedStatus,
    searchQuery,
    activeTab,
    showFavoritesOnly,
  ]);

  // 마운트 시 호출
  useEffect(() => {
    fetchProjects();
    fetchFavorites();
  }, [fetchProjects, fetchFavorites]);

  // 북마크 토글 버튼
  const handleToggleFavorites = () => {
    setShowFavoritesOnly((prev) => !prev);
    setPage(1);
  };

  return (
    <>
      {/* ---------------- 상단 필터 ---------------- */}
      {isMobile ? (
        <div className="mb-4 bg-white">
          <div className="mb-4 flex items-center rounded-sm bg-gray-300 p-1 px-1.5">
            <Button
              onClick={() => handleTabChange('mine')}
              className={`h-8 w-1/2 rounded-sm text-sm ${
                activeTab === 'mine'
                  ? 'bg-primary hover:bg-primary active:bg-primary text-white'
                  : 'text-muted-foreground bg-transparent hover:bg-transparent active:bg-transparent'
              }`}>
              내 프로젝트
            </Button>
            <Button
              onClick={() => handleTabChange('others')}
              className={`h-8 w-1/2 rounded-sm text-sm ${
                activeTab === 'others'
                  ? 'bg-primary hover:bg-primary active:bg-primary text-white'
                  : 'text-muted-foreground bg-transparent hover:bg-transparent active:bg-transparent'
              }`}>
              전체 프로젝트
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-x-1">
              <Button type="button" size="xs" variant="ghost" className="text-gray-600" onClick={() => {}}>
                <ListFilter className="size-3" /> 필터
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="xs"
                className={cn(
                  'text-gray-600 transition-colors',
                  showFavoritesOnly
                    ? 'text-primary-yellow-500 [&_svg]:fill-current'
                    : 'hover:text-primary-yellow-500 hover:[&_svg]:fill-current'
                )}
                onClick={handleToggleFavorites}>
                <Star className="size-3" fill={showFavoritesOnly ? 'currentColor' : 'none'} /> 북마크
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                className="hover:text-primary-blue-500 text-gray-600"
                onClick={() => handleTabChange(activeTab)}>
                <RefreshCw className="size-3" /> 초기화
              </Button>
            </div>

            <Button size="sm" onClick={() => setRegisterDialog(true)}>
              프로젝트 생성
            </Button>
          </div>
        </div>
      ) : (
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex items-center rounded-sm bg-gray-300 p-1 px-1.5">
              <Button
                onClick={() => handleTabChange('mine')}
                className={`h-8 w-18 rounded-sm p-0 text-sm ${
                  activeTab === 'mine'
                    ? 'bg-primary hover:bg-primary active:bg-primary text-white'
                    : 'text-muted-foreground bg-transparent hover:bg-transparent active:bg-transparent'
                }`}>
                내 프로젝트
              </Button>
              <Button
                onClick={() => handleTabChange('others')}
                className={`h-8 w-18 rounded-sm p-0 text-sm ${
                  activeTab === 'others'
                    ? 'bg-primary hover:bg-primary active:bg-primary text-white'
                    : 'text-muted-foreground bg-transparent hover:bg-transparent active:bg-transparent'
                }`}>
                전체 프로젝트
              </Button>
            </div>

            <div className="flex items-center gap-x-2 before:mr-3 before:ml-5 before:inline-flex before:h-7 before:w-[1px] before:bg-gray-300 before:align-middle">
              {activeTab === 'others' && (
                <Select value={selectedYear} onValueChange={(v) => handleFilterChange(setSelectedYear, 'project_year', v)}>
                  <SelectTrigger size="sm" className="px-2">
                    <SelectValue placeholder="년도 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((y) => (
                      <SelectItem size="sm" key={y} value={y}>
                        {y}년
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Select value={selectedBrand} onValueChange={(v) => handleFilterChange(setSelectedBrand, 'brand', v)}>
                <SelectTrigger size="sm" className="px-2">
                  <SelectValue placeholder="소속 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem size="sm" value="PMG">
                      PMG
                    </SelectItem>
                    <SelectItem size="sm" value="MCS">
                      MCS
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

              <MultiSelect
                size="sm"
                ref={categoryRef}
                className="max-w-[80px] min-w-auto! max-xl:hidden"
                maxCount={0}
                autoSize={true}
                placeholder="카테고리"
                defaultValue={selectedCategory}
                options={categoryOptions}
                onValueChange={(v) => handleFilterChange(setSelectedCategory, 'category', v)}
                simpleSelect={true}
                hideSelectAll={true}
              />

              <MultiSelect
                size="sm"
                ref={clientRef}
                className="max-w-[80px] min-w-auto!"
                maxCount={0}
                autoSize={true}
                placeholder="클라이언트"
                defaultValue={selectedClient}
                options={clientOptions}
                onValueChange={(v) => handleFilterChange(setSelectedClient, 'client_id', v)}
                simpleSelect={true}
                hideSelectAll={true}
              />

              <MultiSelect
                size="sm"
                ref={teamRef}
                className="max-w-[80px] min-w-auto! max-xl:hidden"
                maxCount={0}
                autoSize={true}
                placeholder="팀 선택"
                defaultValue={selectedTeam}
                options={teamOptions}
                onValueChange={(v) => handleFilterChange(setSelectedTeam, 'team_id', v)}
                simpleSelect={true}
                hideSelectAll={true}
              />

              <MultiSelect
                size="sm"
                ref={statusRef}
                className="max-w-[80px] min-w-auto! max-xl:hidden"
                maxCount={0}
                autoSize={true}
                placeholder="상태 선택"
                defaultValue={selectedStatus}
                options={statusOptions}
                onValueChange={(v) => handleFilterChange(setSelectedStatus, 'status', v)}
                simpleSelect={true}
                hideSelectAll={true}
              />

              <Button
                type="button"
                variant="svgIcon"
                size="icon"
                className={cn(
                  'size-6 text-gray-600 transition-colors',
                  showFavoritesOnly
                    ? 'text-primary-yellow-500 [&_svg]:fill-current'
                    : 'hover:text-primary-yellow-500 hover:[&_svg]:fill-current'
                )}
                onClick={handleToggleFavorites}>
                <Star fill={showFavoritesOnly ? 'currentColor' : 'none'} />
              </Button>
              <Button
                type="button"
                variant="svgIcon"
                size="icon"
                className="hover:text-primary-blue-500 size-6 text-gray-600"
                onClick={() => handleTabChange(activeTab)}>
                <RefreshCw />
              </Button>
            </div>
          </div>

          <div className="flex gap-x-2">
            <Input
              className="max-w-42"
              size="sm"
              placeholder="검색어 입력"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setSearchQuery(searchInput);
                }
              }}
            />

            <Button size="sm" onClick={() => setRegisterDialog(true)}>
              프로젝트 생성
            </Button>
          </div>
        </div>
      )}

      {/* ---------------- 프로젝트 리스트 ---------------- */}
      {isMobile ? (
        <ProjectCardList projects={projects} favorites={favorites} onToggleFavorite={toggleFavorite} search={search} />
      ) : (
        <ProjectTable projects={projects} favorites={favorites} onToggleFavorite={toggleFavorite} search={search} />
      )}

      {/* ---------------- 페이지네이션 ---------------- */}
      <div className="mt-5">
        <AppPagination totalPages={Math.ceil(total / pageSize)} initialPage={page} visibleCount={5} onPageChange={(p) => setPage(p)} />
      </div>

      {/* ---------------- 프로젝트 생성 다이얼로그 ---------------- */}
      <Dialog open={registerDialog} onOpenChange={setRegisterDialog}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>프로젝트 생성하기</DialogTitle>
            <DialogDescription>새 프로젝트 생성을 위한 정보를 입력해 주세요.</DialogDescription>
          </DialogHeader>
          <ProjectCreateForm onClose={() => setRegisterDialog(false)} onSuccess={handleCreateSuccess} />
        </DialogContent>
      </Dialog>
    </>
  );
}
