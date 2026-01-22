import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router';
import { cn } from '@/lib/utils';
import { getGrowingYears } from '@/utils';
import { useViewport, useIsMobileViewport } from '@/hooks/useViewport';

import { ProjectCreateForm } from './_components/ProjectCreate';
import { getProjectList, type ProjectListItem, getClientList, getTeamList, getBookmarkList, addBookmark, removeBookmark } from '@/api';
import { ProjectCardList } from './_responsive/ProjectCardList';
import { ProjectTable } from './_responsive/ProjectTable';
import { ProjectFilterPC } from './_responsive/ProjectFilterPC';
import { ProjectFilterMobile } from './_responsive/ProjectFilterMo';

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
  const handleFilterChange = (key: string, value: any) => {
    setPage(1);

    switch (key) {
      case 'project_year':
        setSelectedYear(value);
        break;
      case 'brand':
        setSelectedBrand(value);
        break;
      case 'category':
        setSelectedCategory(value);
        break;
      case 'client_id':
        setSelectedClient(value);
        break;
      case 'team_id':
        setSelectedTeam(value);
        break;
      case 'status':
        setSelectedStatus(value);
        break;
    }

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

    updateSearchParams({ page: 1 });
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
        <ProjectFilterMobile
          activeTab={activeTab}
          yearOptions={yearOptions}
          selectedYear={selectedYear}
          selectedBrand={selectedBrand}
          selectedCategory={selectedCategory}
          selectedClient={selectedClient}
          selectedTeam={selectedTeam}
          selectedStatus={selectedStatus}
          searchInput={searchInput}
          showFavoritesOnly={showFavoritesOnly}
          categoryRef={categoryRef}
          clientRef={clientRef}
          teamRef={teamRef}
          statusRef={statusRef}
          categoryOptions={categoryOptions}
          clientOptions={clientOptions}
          teamOptions={teamOptions}
          statusOptions={statusOptions}
          onTabChange={handleTabChange}
          onFilterChange={handleFilterChange}
          onSearchInputChange={setSearchInput}
          onSearchSubmit={() => setSearchQuery(searchInput)}
          onToggleFavorites={handleToggleFavorites}
          onReset={() => handleTabChange(activeTab)}
          onCreate={() => setRegisterDialog(true)}
        />
      ) : (
        <ProjectFilterPC
          activeTab={activeTab}
          yearOptions={yearOptions}
          selectedYear={selectedYear}
          selectedBrand={selectedBrand}
          selectedCategory={selectedCategory}
          selectedClient={selectedClient}
          selectedTeam={selectedTeam}
          selectedStatus={selectedStatus}
          searchInput={searchInput}
          showFavoritesOnly={showFavoritesOnly}
          categoryRef={categoryRef}
          clientRef={clientRef}
          teamRef={teamRef}
          statusRef={statusRef}
          categoryOptions={categoryOptions}
          clientOptions={clientOptions}
          teamOptions={teamOptions}
          statusOptions={statusOptions}
          onTabChange={handleTabChange}
          onFilterChange={handleFilterChange}
          onSearchInputChange={setSearchInput}
          onSearchSubmit={() => setSearchQuery(searchInput)}
          onToggleFavorites={handleToggleFavorites}
          onReset={() => handleTabChange(activeTab)}
          onCreate={() => setRegisterDialog(true)}
        />
      )}

      {/* ---------------- 프로젝트 리스트 ---------------- */}
      {isMobile ? (
        <ProjectCardList projects={projects} favorites={favorites} onToggleFavorite={toggleFavorite} search={search} />
      ) : (
        <ProjectTable projects={projects} favorites={favorites} onToggleFavorite={toggleFavorite} search={search} />
      )}

      {/* ---------------- 페이지네이션 ---------------- */}
      {projects.length !== 0 && (
        <div className="mt-5">
          <AppPagination totalPages={Math.ceil(total / pageSize)} initialPage={page} visibleCount={5} onPageChange={(p) => setPage(p)} />
        </div>
      )}

      {/* ---------------- 프로젝트 생성 다이얼로그 ---------------- */}
      <Dialog open={registerDialog} onOpenChange={setRegisterDialog}>
        <DialogContent className="flex h-full max-h-full flex-col md:h-auto md:max-h-[90vh]" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader className="text-left">
            <DialogTitle>프로젝트 생성하기</DialogTitle>
            <DialogDescription>새 프로젝트 생성을 위한 정보를 입력해 주세요.</DialogDescription>
          </DialogHeader>
          <ProjectCreateForm onClose={() => setRegisterDialog(false)} onSuccess={handleCreateSuccess} />
        </DialogContent>
      </Dialog>
    </>
  );
}
