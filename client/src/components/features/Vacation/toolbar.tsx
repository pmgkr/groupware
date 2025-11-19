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
  onFilterChange?: (filters: VacationFilters) => void;
  checkedItems?: number[];
  onApproveAll?: () => void;
}

export default function VacationToolbar({ 
  activeTab = 'vacation',
  onTabChange = () => {},
  onTeamSelect = () => {},
  onFilterChange = () => {},
  checkedItems = [],
  onApproveAll = () => {}
}: VacationToolbarProps) {
  const { user } = useAuth();
  
  // 팀 관련 state
  const [teams, setTeams] = useState<MyTeamItem[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  
  // 일정 필터 state
  const [filters, setFilters] = useState<VacationFilters>({
    year: new Date().getFullYear().toString(),
    status: [],
    vacationType: [],
    eventType: []
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

          {activeTab === 'vacation' && (
            <>
            {/* 휴가 유형 선택 */}
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
            </>
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
      
      <Button onClick={onApproveAll} size="sm" disabled={checkedItems.length === 0}>승인하기</Button>
    </div>
  );
}

