import { useState, useEffect, useMemo } from 'react';
import { Button } from "@components/ui/button";
import { MultiSelect } from "@components/multiselect/multi-select";
import { useAuth } from '@/contexts/AuthContext';
import { getTeams } from '@/api/teams';
import { type MyTeamItem } from '@/api/working';
import { Select, SelectItem, SelectGroup, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select';

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
}

export default function OvertimeToolbar({ 
  activeTab = 'weekday',
  onTabChange = () => {},
  onTeamSelect = () => {},
  onFilterChange = () => {},
  checkedItems = [],
  onApproveAll = () => {}
}: OvertimeToolbarProps) {
  const { user } = useAuth();
  
  // 팀 관련 state
  const [teams, setTeams] = useState<MyTeamItem[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  
  // 추가근무 필터 state
  const [filters, setFilters] = useState<OvertimeFilters>({
    year: new Date().getFullYear().toString(),
    status: [],
    mealAllowance: [],
    transportAllowance: [],
    compensation: []
  });

  // 팀 목록 로드
  const loadTeams = async () => {
    try {
      if (!user?.user_id) {
        return;
      }
      
      // 전체 팀 목록 조회
      const allTeamDetails = await getTeams({});
      
      let teamItems: MyTeamItem[] = [];
      
      // admin 권한 체크
      if (user.user_level === 'admin') {
        // 모든 팀 표시
        teamItems = allTeamDetails.map(team => ({
          seq: 0,
          manager_id: user.user_id,
          manager_name: user.user_name || '',
          team_id: team.team_id,
          team_name: team.team_name,
          parent_id: team.parent_id || undefined,
          level: team.level,
        }));
        
        setTeams(teamItems);
        return;
      }
      
      // 일반 사용자 (manager)
      if (!user?.team_id) {
        return;
      }
      
      // 사용자의 팀 정보 찾기
      const myTeam = allTeamDetails.find(t => t.team_id === user.team_id);
      if (!myTeam) {
        return;
      }
      
      if (myTeam.level === 0) {
        // 국장인 경우: 본인의 국과 모든 하위 팀 표시
        // 본인의 국 추가
        teamItems.push({
          seq: 0,
          manager_id: user.user_id,
          manager_name: user.user_name || '',
          team_id: myTeam.team_id,
          team_name: myTeam.team_name,
          parent_id: myTeam.parent_id || undefined,
          level: myTeam.level,
        });
        
        // 하위 팀들 추가
        const subTeams = allTeamDetails.filter(t => t.parent_id === myTeam.team_id);
        subTeams.forEach(sub => {
          teamItems.push({
            seq: 0,
            manager_id: user.user_id,
            manager_name: user.user_name || '',
            team_id: sub.team_id,
            team_name: sub.team_name,
            parent_id: sub.parent_id || undefined,
            level: sub.level,
          });
        });
      } else if (myTeam.level === 1) {
        // 팀장인 경우: 본인의 팀만 표시
        teamItems = [{
          seq: 0,
          manager_id: user.user_id,
          manager_name: user.user_name || '',
          team_id: myTeam.team_id,
          team_name: myTeam.team_name,
          parent_id: myTeam.parent_id || undefined,
          level: myTeam.level,
        }];
      } else {
        return;
      }
      
      setTeams(teamItems);
      
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
      // 추가근무 필터 핸들러
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
    loadTeams();
  }, [user]);

  // 팀 목록이 로드되면 모든 팀 선택
  useEffect(() => {
    if (teams.length > 0 && selectedTeams.length === 0) {
      const allTeamIds = teams.map(team => String(team.team_id));
      setSelectedTeams(allTeamIds);
      
      // 부모 컴포넌트에 알림
      const teamIds = allTeamIds.map(id => parseInt(id));
      onTeamSelect(teamIds);
    }
  }, [teams]);

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

  return (
    <div className="w-full flex items-center justify-between mb-5">
      <div className="flex items-center">
        {/* 탭 버튼 */}
        <div className="flex items-center rounded-sm bg-gray-300 p-1 px-1.5">
          <Button
            onClick={() => onTabChange('weekday')}
            className={`h-8 w-22 rounded-sm p-0 text-sm ${
              activeTab === 'weekday'
                ? 'bg-primary hover:bg-primary active:bg-primary text-white'
                : 'text-muted-foreground bg-transparent hover:bg-transparent active:bg-transparent'
            }`}>
            평일 추가근무
          </Button>
          <Button
            onClick={() => onTabChange('weekend')}
            className={`h-8 w-18 rounded-sm p-0 text-sm ${
              activeTab === 'weekend'
                ? 'bg-primary hover:bg-primary active:bg-primary text-white'
                : 'text-muted-foreground bg-transparent hover:bg-transparent active:bg-transparent'
            }`}>
            휴일 근무
          </Button>
        </div>

        {/* 필터 셀렉트들 */}
        <div className="flex items-center gap-2 before:mx-5 before:inline-flex before:h-7 before:w-[1px] before:bg-gray-300 before:align-middle">
          
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

          {/* 상태 선택 */}
          <MultiSelect
            simpleSelect={true}
            options={[
              { value: 'pending', label: '승인대기' },
              { value: 'approved', label: '승인완료' },
              { value: 'rejected', label: '반려됨' },
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
      
      <Button onClick={onApproveAll} size="sm" disabled={checkedItems.length === 0}>승인하기</Button>
    </div>
  );
}

