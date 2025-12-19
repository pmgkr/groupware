import { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router';
import { Button } from "@components/ui/button";
import { MultiSelect } from "@components/multiselect/multi-select";
import { useAuth } from '@/contexts/AuthContext';
import { getTeams } from '@/api/admin/teams';
import { getTeams as getManagerTeams, type MyTeamItem } from '@/api/manager/teams';
import { getMemberList } from '@/api/common/team';
import { Select, SelectItem, SelectGroup, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select';

// 셀렉트 옵션 타입 정의
export interface SelectOption {
  value: string;
  label: string;
}

export interface VacationFilters {
  year?: string;
  status?: string[];
  vacationType?: string[];
  eventType?: string[];
}

interface VacationToolbarProps {
  activeTab?: 'vacation' | 'event';
  onTabChange?: (tab: 'vacation' | 'event') => void;
  onTeamSelect?: (teamIds: number[]) => void;
  onUserSelect?: (userIds: string[]) => void;
  onFilterChange?: (filters: VacationFilters) => void;
  checkedItems?: number[];
  onApproveAll?: () => void;
  onListClick?: () => void;
  page?: 'manager' | 'admin';
  maxCount?: number;
  initialTeamIds?: number[];
  initialUserIds?: string[];
}

export default function VacationToolbar({ 
  activeTab = 'vacation',
  onTabChange = () => {},
  onTeamSelect = () => {},
  onUserSelect = () => {},
  onFilterChange = () => {},
  checkedItems = [],
  onApproveAll = () => {},
  onListClick = () => {},
  page = 'manager',
  maxCount = 0,
  initialTeamIds,
  initialUserIds
}: VacationToolbarProps) {
  const { user } = useAuth();
  const location = useLocation();
  const isManagerContext = location.pathname.startsWith('/manager');
  
  // 최고관리자-휴가관리-상세페이지
  const isAdminDetailPage = location.pathname.includes('/vacation/user/');
  
  // 팀 관련 state
  const [teams, setTeams] = useState<MyTeamItem[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  
  // 팀원 관련 state (Admin일 때만 사용)
  const [teamMembers, setTeamMembers] = useState<Array<{ user_id: string; user_name: string }>>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  // 초기값 설정 여부를 추적하는 ref
  const initialTeamSetRef = useRef(false);
  const initialUserSetRef = useRef(false);
  
  // 일정 필터 state
  const [filters, setFilters] = useState<VacationFilters>({
    year: new Date().getFullYear().toString(),
    status: page === 'manager' ? ['H'] : [], // manager 페이지에서는 취소요청됨(H) 기본 선택
    vacationType: [],
    eventType: []
  });

  // 팀 목록 로드
  const loadTeams = async () => {
    try {
      if (!user?.user_id) {
        return;
      }
      
      // 매니저 컨텍스트(경로 기준)면 자신의 팀만, 아니면 page 기준
      if (isManagerContext || page === 'manager') {
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
        return;
      }

      // 관리자 컨텍스트: 모든 팀
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
      
    } catch (error) {
      console.error('팀 목록 로드 실패:', error);
      setTeams([]);
    }
  };

  // 선택된 팀들의 팀원 목록 로드 (Admin일 때만)
  const loadTeamMembers = async (teamIds: number[]) => {
    if (page !== 'admin' || teamIds.length === 0) {
      setTeamMembers([]);
      setSelectedUsers([]);
      onUserSelect([]);
      return;
    }

    try {
      const memberPromises = teamIds.map(async (teamId) => {
        const members = await getMemberList(teamId);
        return members.map((m: any) => ({
          user_id: m.user_id,
          user_name: m.user_name
        }));
      });
      
      const memberResults = await Promise.all(memberPromises);
      const allMembers = memberResults.flat();
      
      // 중복 제거
      const uniqueMembers = allMembers.filter((member, index, self) =>
        index === self.findIndex(m => m.user_id === member.user_id)
      );
      
      setTeamMembers(uniqueMembers);
    } catch (error) {
      console.error('팀원 목록 로드 실패:', error);
      setTeamMembers([]);
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
        
        // Admin일 때 선택된 팀의 팀원 목록 로드
        if (page === 'admin') {
          loadTeamMembers(teamIds);
        }
      } else {
        onTeamSelect([]);
        if (page === 'admin') {
          setTeamMembers([]);
          setSelectedUsers([]);
          onUserSelect([]);
        }
      }
    } else if (id === 'users') {
      let userValues = Array.isArray(value) ? value : [value];
      
      // 상세 페이지에서는 최대 1개만 선택 가능
      if (isAdminDetailPage && userValues.length > 1) {
        // 가장 최근에 선택한 항목만 유지
        userValues = [userValues[userValues.length - 1]];
      }
      
      setSelectedUsers(userValues);
      onUserSelect(userValues);
    } else {
      // 일정 필터 핸들러
      const newFilters = { ...filters };
      
      if (id === 'year') {
        newFilters.year = Array.isArray(value) ? value[0] : value;
      } else if (id === 'status') {
        newFilters.status = Array.isArray(value) ? value : [value];
      } else if (id === 'vacationType') {
        newFilters.vacationType = Array.isArray(value) ? value : [value];
      } else if (id === 'eventType') {
        newFilters.eventType = Array.isArray(value) ? value : [value];
      }
      
      setFilters(newFilters);
      onFilterChange(newFilters);
    }
  };

  // 초기 필터 설정 (manager 페이지에서 취소요청됨 기본 선택)
  useEffect(() => {
    if (page === 'manager') {
      const initialFilters = {
        ...filters,
        status: ['H']
      };
      setFilters(initialFilters);
      onFilterChange(initialFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // 초기 팀 목록 로드
  useEffect(() => {
    loadTeams();
  }, [user, page]);

  // 팀 자동선택 제거: 초기 상태는 선택 없음 유지
  
  // 상세 페이지에서 초기 팀 선택값 설정 (한 번만 실행)
  useEffect(() => {
    if (isAdminDetailPage && teams.length > 0 && initialTeamIds && initialTeamIds.length > 0 && !initialTeamSetRef.current) {
      const teamIds = initialTeamIds.map(id => String(id));
      // 이미 같은 값이면 설정하지 않음
      const currentTeamIds = selectedTeams.map(id => parseInt(id)).sort().join(',');
      const newTeamIds = initialTeamIds.sort().join(',');
      
      if (currentTeamIds !== newTeamIds) {
        setSelectedTeams(teamIds);
        onTeamSelect(initialTeamIds);
        initialTeamSetRef.current = true;
        
        // 팀원 목록 로드
        loadTeamMembers(initialTeamIds);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdminDetailPage, teams, initialTeamIds]);
  
  // 상세 페이지에서 초기 유저 선택값 설정 (한 번만 실행)
  useEffect(() => {
    if (isAdminDetailPage && teamMembers.length > 0 && initialUserIds && initialUserIds.length > 0 && !initialUserSetRef.current) {
      // 이미 같은 값이면 설정하지 않음
      const currentUserIds = [...selectedUsers].sort().join(',');
      const newUserIds = [...initialUserIds].sort().join(',');
      
      if (currentUserIds !== newUserIds) {
        setSelectedUsers(initialUserIds);
        onUserSelect(initialUserIds);
        initialUserSetRef.current = true;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdminDetailPage, teamMembers, initialUserIds]);

  // 선택된 팀이 변경될 때 팀원 목록 로드 (Admin일 때만, 상세 페이지가 아닐 때만)
  useEffect(() => {
    // 상세 페이지에서는 initialTeamIds로 이미 설정했으므로 이 로직을 건너뜀
    if (isAdminDetailPage && initialTeamSetRef.current) {
      return;
    }
    
    if (page === 'admin' && selectedTeams.length > 0) {
      const teamIds = selectedTeams.map(id => parseInt(id));
      loadTeamMembers(teamIds);
    } else if (page === 'admin' && selectedTeams.length === 0) {
      setTeamMembers([]);
      setSelectedUsers([]);
      onUserSelect([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTeams, page, isAdminDetailPage]);

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

  // 팀원 옵션 (알파벳순 정렬)
  const userOptions = useMemo(() => {
    const sortedMembers = [...teamMembers].sort((a, b) => 
      a.user_name.localeCompare(b.user_name, 'ko')
    );
    return sortedMembers.map(member => ({
      value: member.user_id,
      label: member.user_name
    }));
  }, [teamMembers]);

  return (
    <div className="w-full flex items-center justify-between mb-5">
      <div className="flex items-center">
        {/* 탭 버튼 */}
        { page === 'manager' && (
          <div className="flex items-center gap-2 after:mx-5 after:inline-flex after:h-7 after:w-[1px] after:bg-gray-300 after:align-middle">
            <div className="flex items-center rounded-sm bg-gray-300 p-1 px-1.5">
              <Button
                onClick={() => onTabChange('vacation')}
                className={`h-8 w-18 rounded-sm p-0 text-sm ${
                  activeTab === 'vacation'
                    ? 'bg-primary hover:bg-primary active:bg-primary text-white'
                    : 'text-muted-foreground bg-transparent hover:bg-transparent active:bg-transparent'
                }`}>
                휴가
              </Button>
              <Button
                onClick={() => onTabChange('event')}
                className={`h-8 w-18 rounded-sm p-0 text-sm ${
                  activeTab === 'event'
                    ? 'bg-primary hover:bg-primary active:bg-primary text-white'
                    : 'text-muted-foreground bg-transparent hover:bg-transparent active:bg-transparent'
                }`}>
                이벤트
              </Button>
            </div>
          </div>
        )}
        {/* 필터 셀렉트들 */}
        <div className="flex items-center gap-2 ">
          
          {/* 연도 단일 선택 */}
          <Select value={filters.year} onValueChange={(v) => handleSelectChange('year', v)}>
              <SelectTrigger size="sm">
                <SelectValue placeholder="연도 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem size="sm" value="2025">
                    2025
                  </SelectItem>
                  <SelectItem size="sm" value="2024">
                    2024
                  </SelectItem>
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

          {/* 팀원 선택 (Admin일 때만) */}
          {page === 'admin' && (
            <MultiSelect
              simpleSelect={true}
              options={userOptions}
              onValueChange={(value) => handleSelectChange('users', value)}
              defaultValue={selectedUsers}
              placeholder="팀원 선택"
              size="sm"
              maxCount={0}
              searchable={true}
              hideSelectAll={isAdminDetailPage}
              autoSize={true}
              className="min-w-[120px]! w-auto! max-w-[200px]! multi-select"
              disabled={selectedTeams.length === 0}
            />
          )}

          {/* 상태 선택 (Manager일 때만) */}
          {page === 'manager' && (
            <MultiSelect
              simpleSelect={true}
              options={[
                { value: 'H', label: '취소요청됨' },
                { value: 'Y', label: '승인완료' },
                { value: 'N', label: '취소완료' },
              ]}
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
          )}

          {/* 휴가 유형 선택 (Manager일 때만) */}
          {page === 'manager' && activeTab === 'vacation' && (
            <MultiSelect
              simpleSelect={true}
              options={[
                { value: 'day', label: '연차' },
                { value: 'half', label: '반차' },
                { value: 'quarter', label: '반반차' },
                { value: 'official', label: '공가' },
              ]}
              onValueChange={(value) => handleSelectChange('vacationType', value)}
              defaultValue={filters.vacationType}
              placeholder="휴가 유형"
              size="sm"
              maxCount={0}
              searchable={false}
              hideSelectAll={false}
              autoSize={true}
              className="min-w-[120px]! w-auto! max-w-[200px]! multi-select"
            />
          )}

          {activeTab === 'event' && (
            <>
            {/* 이벤트 유형 선택 */}
            <MultiSelect
              simpleSelect={true}
              options={[
                { value: 'remote', label: '재택근무' },
                { value: 'field', label: '외부근무' },
                { value: 'etc', label: '기타' },
              ]}
              onValueChange={(value) => handleSelectChange('eventType', value)}
              defaultValue={filters.eventType}
              placeholder="이벤트 유형"
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
      
      {page === 'manager' && (
        <Button onClick={onApproveAll} size="sm" disabled={checkedItems.length === 0}>승인하기</Button>
      )}
      {page === 'admin' && isAdminDetailPage && (
        <Button onClick={onListClick} variant="outline" size="sm">목록</Button>
      )}
    </div>
  );
}

