import { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from "@components/ui/button";
import { MultiSelect } from "@components/multiselect/multi-select";
import { useAuth } from '@/contexts/AuthContext';
import { getTeams } from '@/api/admin/teams';
import { getTeams as getManagerTeams, type MyTeamItem } from '@/api/manager/teams';
import { Select, SelectItem, SelectGroup, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getGrowingYears } from '@/utils';
import { useIsMobileViewport } from '@/hooks/useViewport';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { ListFilter, RefreshCw } from 'lucide-react';

// 셀렉트 옵션 타입 정의
export interface SelectOption {
  value: string;
  label: string;
}

export interface OvertimeFilters {
  year?: string;
  status?: string[];
  mealAllowance?: string[];
  transportAllowance?: string[];
  compensation?: string[];
}

interface OvertimeToolbarProps {
  activeTab?: 'weekday' | 'weekend';
  onTabChange?: (tab: 'weekday' | 'weekend') => void;
  onTeamSelect?: (teamIds: number[]) => void;
  onFilterChange?: (filters: OvertimeFilters) => void;
  checkedItems?: number[];
  onApproveAll?: () => void;
  page?: 'manager' | 'admin';
  maxCount?: number;
}

export default function OvertimeToolbar({ 
  activeTab = 'weekday',
  onTabChange = () => {},
  onTeamSelect = () => {},
  onFilterChange = () => {},
  checkedItems = [],
  onApproveAll = () => {},
  page = 'manager',
  maxCount = 0
}: OvertimeToolbarProps) {
  const { user } = useAuth();
  const isMobile = useIsMobileViewport();
  
  // 팀 관련 state
  const [teams, setTeams] = useState<MyTeamItem[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  
  // 팀 목록 로드 중복 방지 ref
  const teamsLoadedRef = useRef(false);
  
  const yearOptions = getGrowingYears().reverse();

  // 연장근무 필터 state
  const [filters, setFilters] = useState<OvertimeFilters>({
    year: new Date().getFullYear().toString(),
    status: page === 'admin' && activeTab === 'weekend' ? ['approved'] : [], // admin이고 휴일일 때 기본값: 보상대기
    mealAllowance: [],
    transportAllowance: [],
    compensation: []
  });

  // 팀 목록 로드
  const loadTeams = async () => {
    if (teamsLoadedRef.current) return;
    
    try {
      if (!user?.user_id) {
        return;
      }
      
      // page prop에 따라 분기
      if (page === 'admin') {
        // admin 페이지: 모든 팀 표시
        const allTeamDetails = await getTeams({});
        const teamItems: MyTeamItem[] = allTeamDetails.map(team => ({
          seq: 0,
          manager_id: user.user_id,
          manager_name: user.user_name || '',
          team_id: team.team_id,
          team_name: team.team_name,
          parent_id: team.parent_id || undefined,
          level: team.level,
        }));
        
        setTeams(teamItems);
        teamsLoadedRef.current = true;
        return;
      }
      
      // manager 페이지: 권한 상관없이 자기가 팀장인 팀 목록만 조회
      const allTeamDetails = await getManagerTeams({});
      const teamItems: MyTeamItem[] = allTeamDetails.map(team => ({
        seq: 0,
        manager_id: team.manager_id || '',
        manager_name: team.manager_name || '',
        team_id: team.team_id,
        team_name: team.team_name,
        parent_id: team.parent_id || undefined,
        level: team.level,
      }));
      
      setTeams(teamItems);
      teamsLoadedRef.current = true;
      
    } catch (error) {
      console.error('팀 목록 로드 실패:', error);
      setTeams([]);
    }
  };

  // 셀렉트 변경 핸들러
  const handleSelectChange = (id: string, value: string[] | string) => {
    if (id === 'teams') {
      const teamValues = Array.isArray(value) ? value : [value];
      setSelectedTeams(teamValues);
      
      if (teamValues.length > 0) {
        const teamIds = teamValues.map(v => parseInt(v));
        onTeamSelect(teamIds);
      } else {
        onTeamSelect([]);
      }
    } else {
      // 연장근무 필터 핸들러
      const newFilters = { ...filters };
      
      if (id === 'year') {
        newFilters.year = Array.isArray(value) ? value[0] : value;
      } else if (id === 'status') {
        newFilters.status = Array.isArray(value) ? value : [value];
      } else if (id === 'mealAllowance') {
        newFilters.mealAllowance = Array.isArray(value) ? value : [value];
      } else if (id === 'transportAllowance') {
        newFilters.transportAllowance = Array.isArray(value) ? value : [value];
      } else if (id === 'compensation') {
        newFilters.compensation = Array.isArray(value) ? value : [value];
      }
      
      setFilters(newFilters);
      onFilterChange(newFilters);
    }
  };

  // 초기 팀 목록 로드
  useEffect(() => {
    // page나 user가 변경되면 리셋
    teamsLoadedRef.current = false;
    loadTeams();
  }, [user, page]);

  // 초기 마운트 시 admin이고 weekend일 때 보상대기 필터 설정
  useEffect(() => {
    if (page === 'admin' && activeTab === 'weekend') {
      const newFilters = {
        ...filters,
        status: ['approved']
      };
      setFilters(newFilters);
      onFilterChange(newFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 초기 마운트 시에만 실행

  // 팀 옵션 (알파벳순 정렬)
  const teamOptions = useMemo(() => {
    const sortedTeams = [...teams].sort((a, b) => 
      a.team_name.localeCompare(b.team_name, 'ko')
    );
    return sortedTeams.map(team => ({
      value: String(team.team_id),
      label: team.team_name
    }));
  }, [teams]);

  // 상태 옵션 (탭에 따라 다름)
  const statusOptions = useMemo(() => {
    if (activeTab === 'weekday') {
      // 평일 연장장근무: 승인대기, 승인완료, 취소완료
      return [
        { value: 'pending', label: '승인대기' },
        { value: 'approved', label: '승인완료' },
        { value: 'rejected', label: '취소완료' },
      ];
    } else {
      // 휴일 근무: 승인대기, 보상대기, 보상완료, 취소완료
      return [
        { value: 'pending', label: '승인대기' },
        { value: 'approved', label: '보상대기' },
        { value: 'confirmed', label: '보상완료' },
        { value: 'rejected', label: '취소완료' },
      ];
    }
  }, [activeTab]);

  // 탭 변경 시 상태 필터 기본값 설정
  useEffect(() => {
    if (activeTab === 'weekday') {
      // 평일: admin일 때는 필터 없음(전체), manager일 때는 승인대기만 기본 선택
      const newFilters = {
        ...filters,
        status: page === 'admin' ? [] : ['pending']
      };
      setFilters(newFilters);
      onFilterChange(newFilters);
    } else {
      // 휴일: admin일 때는 보상대기, manager일 때는 승인대기
      const newFilters = {
        ...filters,
        status: page === 'admin' ? ['approved'] : ['pending']
      };
      setFilters(newFilters);
      onFilterChange(newFilters);
    }
  }, [activeTab, page]);

  // 필터 초기화 함수
  const handleReset = () => {
    const defaultFilters: OvertimeFilters = {
      year: new Date().getFullYear().toString(),
      status: page === 'admin' && activeTab === 'weekend' ? ['approved'] : (page === 'admin' ? [] : ['pending']),
      mealAllowance: [],
      transportAllowance: [],
      compensation: []
    };
    setFilters(defaultFilters);
    setSelectedTeams([]);
    onFilterChange(defaultFilters);
    onTeamSelect([]);
  };

  return (
    <div className="w-full flex items-center justify-between mb-5">
      
        <div className="flex max-md:flex-wrap! max-md:w-full max-md:gap-2">
          {/* 탭 버튼 */}
          <div className="flex items-center rounded-sm bg-gray-300 p-1 px-1.5 max-md:w-full!">
            <Button
              onClick={() => onTabChange('weekday')}
              className={`h-8 w-22 rounded-sm p-0 text-sm max-md:flex-1 ${
                activeTab === 'weekday'
                  ? 'bg-primary hover:bg-primary active:bg-primary text-white'
                  : 'text-muted-foreground bg-transparent hover:bg-transparent active:bg-transparent'
              }`}>
              평일 연장근무
            </Button>
            <Button
              onClick={() => onTabChange('weekend')}
              className={`h-8 w-18 rounded-sm p-0 text-sm max-md:flex-1 ${
                activeTab === 'weekend'
                  ? 'bg-primary hover:bg-primary active:bg-primary text-white'
                  : 'text-muted-foreground bg-transparent hover:bg-transparent active:bg-transparent'
              }`}>
              휴일 근무
            </Button>
          </div>
          {isMobile ? (
            <>
            {/* 필터 버튼 및 승인 버튼 */}
            <div className="flex w-full items-center justify-between">
              <Drawer direction="bottom">
                <DrawerTrigger asChild>
                  <Button size="sm" variant="ghost" className="has-[>svg]:px-0 text-gray-500">
                    <ListFilter className="size-4" /> 필터
                  </Button>
                </DrawerTrigger>
                <DrawerContent className="pointer-events-auto">
                  <DrawerHeader>
                    <div className="flex justify-between">
                      <DrawerTitle className="text-left">상세 필터</DrawerTitle>
                      <Button type="button" variant="ghost" size="xs" className="hover:text-primary-blue-500 text-gray-600" onClick={handleReset}>
                        <RefreshCw className="size-4" /> 초기화
                      </Button>
                    </div>
                  </DrawerHeader>
                  <div className="flex flex-col gap-y-2 px-4 pb-8">

                    <div className="flex gap-x-2 w-full">
                      {/* 연도 단일 선택 */}
                      <div className="w-1/2">
                        <FilterTitle label="연도 선택" />
                        <Select value={filters.year} onValueChange={(v) => handleSelectChange('year', v)}>
                          <SelectTrigger className="w-full px-2">
                            <SelectValue placeholder="연도 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {yearOptions.map((y) => (
                                <SelectItem key={y} value={y}>
                                  {y}년
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* 팀 선택 */}
                      <div className="w-1/2">
                        <FilterTitle label="팀 선택" />
                        <MultiSelect
                          // simpleSelect={true}
                          options={teamOptions}
                          onValueChange={(value) => handleSelectChange('teams', value)}
                          defaultValue={selectedTeams}
                          placeholder="팀 선택"
                          size="default"
                          maxCount={1}
                          searchable={true}
                          hideSelectAll={false}
                          autoSize={true}
                          className="w-full max-w-full min-w-auto! multi-select"
                          modalPopover={true}
                        />
                      </div>
                    </div>

                    {/* 상태 선택 */}
                    <div>
                      <FilterTitle label="상태 선택" />
                      <MultiSelect
                        // simpleSelect={true}
                        options={statusOptions}
                        onValueChange={(value) => handleSelectChange('status', value)}
                        defaultValue={filters.status}
                        placeholder="상태"
                        size="default"
                        maxCount={3}
                        searchable={false}
                        hideSelectAll={false}
                        autoSize={true}
                        className="w-full max-w-full min-w-auto! multi-select"
                        modalPopover={true}
                      />
                    </div>

                    {activeTab === 'weekday' && (
                      <div className="flex gap-x-2 w-full">
                        {/* 식대 선택 */}
                        <div className="w-1/2">
                          <FilterTitle label="식대 선택" />
                          <MultiSelect
                            // simpleSelect={true}
                            options={[
                              { value: 'used', label: '사용' },
                              { value: 'notUsed', label: '미사용' },
                            ]}
                            onValueChange={(value) => handleSelectChange('mealAllowance', value)}
                            defaultValue={filters.mealAllowance}
                            placeholder="식대"
                            size="default"
                            maxCount={2}
                            searchable={false}
                            hideSelectAll={false}
                            autoSize={true}
                            className="w-full max-w-full min-w-auto! multi-select"
                            modalPopover={true}
                          />
                        </div>

                        {/* 교통비 선택 */}
                        <div className="w-1/2">
                          <FilterTitle label="교통비 선택" />
                          <MultiSelect
                            // simpleSelect={true}
                            options={[
                              { value: 'used', label: '사용' },
                              { value: 'notUsed', label: '미사용' },
                            ]}
                            onValueChange={(value) => handleSelectChange('transportAllowance', value)}
                            defaultValue={filters.transportAllowance}
                            placeholder="교통비"
                            size="default"
                            maxCount={2}
                            searchable={false}
                            hideSelectAll={false}
                            autoSize={true}
                            className="w-full max-w-full min-w-auto! multi-select"
                            modalPopover={true}
                          />
                        </div>
                      </div>
                    )}

                    {activeTab === 'weekend' && (
                      <div>
                        <FilterTitle label="보상 선택" />
                        <MultiSelect
                          // simpleSelect={true}
                          options={[
                            { value: 'special', label: '특별대휴' },
                            { value: 'compensatory', label: '보상휴가' },
                            { value: 'allowance', label: '수당지급' },
                          ]}
                          onValueChange={(value) => handleSelectChange('compensation', value)}
                          defaultValue={filters.compensation}
                          placeholder="보상"
                          size="default"
                          maxCount={3}
                          searchable={false}
                          hideSelectAll={false}
                          autoSize={true}
                          className="w-full max-w-full min-w-auto! multi-select"
                          modalPopover={true}
                        />
                      </div>
                    )}
                  </div>
                </DrawerContent>
              </Drawer>
              {!(page === 'admin' && activeTab === 'weekday') && (
                <Button onClick={onApproveAll} size="sm" disabled={checkedItems.length === 0}>
                  {page === 'admin' && activeTab === 'weekend' ? '보상 지급하기' : '승인하기'}
                </Button>
              )}
            </div>
            </>
            ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {/* 필터 셀렉트들 */}
                <div className="flex items-center gap-2 before:mx-5 before:inline-flex before:h-7 before:w-[1px] before:bg-gray-300 before:align-middle">
                {/* 연도 단일 선택 */}
                <Select value={filters.year} onValueChange={(v) => handleSelectChange('year', v)}>
                    <SelectTrigger size="sm" className="px-2">
                      <SelectValue placeholder="연도 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {yearOptions.map((y) => (
                          <SelectItem size="sm" key={y} value={y}>
                            {y}년
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                
                {/* 팀 선택 */}
                <MultiSelect
                  simpleSelect={true}
                  options={teamOptions}
                  onValueChange={(value) => handleSelectChange('teams', value)}
                  defaultValue={selectedTeams}
                  placeholder="팀 선택"
                  size="sm"
                  maxCount={0}
                  searchable={true}
                  hideSelectAll={false}
                  autoSize={true}
                  className="min-w-[120px]! w-auto! max-w-[200px]! multi-select"
                />

                {/* 상태 선택 */}
                <MultiSelect
                  simpleSelect={true}
                  options={statusOptions}
                  onValueChange={(value) => handleSelectChange('status', value)}
                  defaultValue={filters.status}
                  placeholder="상태"
                  size="sm"
                  maxCount={0}
                  searchable={false}
                  hideSelectAll={false}
                  autoSize={true}
                  className="min-w-[120px]! w-auto! max-w-[200px]! multi-select"
                />

                {activeTab === 'weekday' && (
                  <>
                  {/* 식대 선택 */}
                  <MultiSelect
                    simpleSelect={true}
                    options={[
                      { value: 'used', label: '사용' },
                      { value: 'notUsed', label: '미사용' },
                    ]}
                    onValueChange={(value) => handleSelectChange('mealAllowance', value)}
                    defaultValue={filters.mealAllowance}
                    placeholder="식대"
                    size="sm"
                    maxCount={0}
                    searchable={false}
                    hideSelectAll={false}
                    autoSize={true}
                    className="min-w-[120px]! w-auto! max-w-[200px]! multi-select"
                  />

                  {/* 교통비 선택 */}
                  <MultiSelect
                    simpleSelect={true}
                    options={[
                      { value: 'used', label: '사용' },
                      { value: 'notUsed', label: '미사용' },
                    ]}
                    onValueChange={(value) => handleSelectChange('transportAllowance', value)}
                    defaultValue={filters.transportAllowance}
                    placeholder="교통비"
                    size="sm"
                    maxCount={0}
                    searchable={false}
                    hideSelectAll={false}
                    autoSize={true}
                    className="min-w-[120px]! w-auto! max-w-[200px]! multi-select"
                  />
                  </>
                )}

                {activeTab === 'weekend' && (
                  <>
                  {/* 보상 선택 */}
                  <MultiSelect
                    simpleSelect={true}
                    options={[
                      { value: 'special', label: '특별대휴' },
                      { value: 'compensatory', label: '보상휴가' },
                      { value: 'allowance', label: '수당지급' },
                    ]}
                    onValueChange={(value) => handleSelectChange('compensation', value)}
                    defaultValue={filters.compensation}
                    placeholder="보상"
                    size="sm"
                    maxCount={0}
                    searchable={false}
                    hideSelectAll={false}
                    autoSize={true}
                    className="min-w-[120px]! w-auto! max-w-[200px]! multi-select"
                  />
                </>
                )}

                </div>
              </div>
            </div>
          )}
        </div>
                                
        {!isMobile && !(page === 'admin' && activeTab === 'weekday') && (
          <Button onClick={onApproveAll} size="sm" disabled={checkedItems.length === 0}>
            {page === 'admin' && activeTab === 'weekend' ? '보상 지급하기' : '승인하기'}
          </Button>
        )}
    </div>
  );
}

function FilterTitle({ label }: { label: string }) {
  return <p className="mb-1 text-base font-medium text-gray-600">{label}</p>;
}
