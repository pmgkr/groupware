import { useState, useEffect, useCallback, useRef } from 'react';
import { getProjectList, type ProjectListItem, getClientList, getTeamList, getBookmarkList, addBookmark, removeBookmark } from '@/api';
import { cn } from '@/lib/utils';
import { ProjectCreateForm } from './_components/ProjectCreate';

import { Input } from '@/components/ui/input';
import { Button } from '@components/ui/button';
import { AppPagination } from '@/components/ui/AppPagination';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectItem } from '@components/ui/select';
import { MultiSelect, type MultiSelectOption, type MultiSelectRef } from '@components/multiselect/multi-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ProjectRow } from './_components/ProjectListRow';
import { Star, RefreshCw } from 'lucide-react';

export default function ProjectList() {
  const [registerDialog, setRegisterDialog] = useState(false);

  // 프로젝트 리스트 API 조회용 State
  const [favorites, setFavorites] = useState<string[]>([]);
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // 상단 필터용 state
  const [activeTab, setActiveTab] = useState<'mine' | 'others'>('mine');
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
    { label: 'CAMPAIGN', value: 'CAMPAIGN' },
    { label: 'Event', value: 'Event' },
    { label: 'Web', value: 'Web' },
  ];

  const statusOptions: MultiSelectOption[] = [
    { label: '진행중', value: 'in-progress' },
    { label: '종료됨', value: 'completed' },
    { label: '정산완료', value: 'done' },
    { label: '취소됨', value: 'cancelled' },
  ];

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

  // 필터 변경 시 page 초기화
  const handleFilterChange = (setter: any, value: any) => {
    setter(value);
    setPage(1);
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
  };

  // 즐겨찾기 리스트 불러오기
  const fetchFavorites = useCallback(async () => {
    try {
      const res = await getBookmarkList();
      // 응답이 [{ project_id: string }, ...] 형태라면
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

      // 북마크를 클릭한 경우 추가 파라미터 전달
      if (showFavoritesOnly) {
        params.tagged = 'Y';
      }

      console.log('params:', params);

      const res = await getProjectList(params);

      console.log(res);

      setProjects(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error('❌ 프로젝트 불러오기 실패:', err);
    } finally {
      setLoading(false);
    }
  }, [page, selectedBrand, selectedCategory, selectedClient, selectedTeam, selectedStatus, searchQuery, activeTab, showFavoritesOnly]);

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
            <Select value={selectedBrand} onValueChange={(v) => handleFilterChange(setSelectedBrand, v)}>
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
              className="max-w-[80px] min-w-auto!"
              maxCount={0}
              autoSize={true}
              placeholder="카테고리"
              options={categoryOptions}
              onValueChange={(v) => handleFilterChange(setSelectedCategory, v)}
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
              options={clientOptions}
              onValueChange={(v) => handleFilterChange(setSelectedClient, v)}
              simpleSelect={true}
              hideSelectAll={true}
            />

            <MultiSelect
              size="sm"
              ref={teamRef}
              className="max-w-[80px] min-w-auto!"
              maxCount={0}
              autoSize={true}
              placeholder="팀 선택"
              options={teamOptions}
              onValueChange={(v) => handleFilterChange(setSelectedTeam, v)}
              simpleSelect={true}
              hideSelectAll={true}
            />

            <MultiSelect
              size="sm"
              ref={statusRef}
              className="max-w-[80px] min-w-auto!"
              maxCount={0}
              autoSize={true}
              placeholder="상태 선택"
              options={statusOptions}
              onValueChange={(v) => handleFilterChange(setSelectedStatus, v)}
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

      {/* ---------------- 테이블 ---------------- */}
      <Table variant="primary" align="center" className="table-fixed">
        <TableHeader>
          <TableRow className="[&_th]:px-4 [&_th]:text-[13px] [&_th]:font-medium">
            <TableHead className="w-12 px-0"></TableHead>
            <TableHead className="w-22 px-0">프로젝트#</TableHead>
            <TableHead className="w-[6%]">소속</TableHead>
            <TableHead className="w-[10%]">카테고리</TableHead>
            <TableHead>프로젝트 이름</TableHead>
            <TableHead className="w-[14%]">클라이언트</TableHead>
            <TableHead className="w-[8%]">오너</TableHead>
            <TableHead className="w-[8%]">팀</TableHead>
            <TableHead className="w-[8%]">상태</TableHead>
            <TableHead className="w-[10%]">시작일</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.length > 0 ? (
            projects.map((p) => (
              <ProjectRow key={p.project_id} item={p} isFavorite={favorites.includes(p.project_id)} onToggleFavorite={toggleFavorite} />
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={10} className="py-8 text-center text-gray-500">
                등록된 프로젝트가 없습니다.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

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
