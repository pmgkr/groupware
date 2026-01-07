import { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from "@components/ui/button";
import { MultiSelect } from "@components/multiselect/multi-select";
import type { WorkingListItem } from './list';
import { useAuth } from '@/contexts/AuthContext';
import { getTeams } from '@/api/admin/teams';
import { getTeams as getManagerTeams, type MyTeamItem } from '@/api/manager/teams';
import WorkTimeDownload from './WorkTimeDownload';

// 셀렉트 옵션 타입 정의
export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectConfig {
  id: string;
  placeholder: string;
  options: SelectOption[];
  value?: string[];
  autoSize?: boolean;
  maxCount?: number;
  searchable?: boolean;
  hideSelectAll?: boolean;
}

interface ToolbarProps {
  currentDate: Date;
  onDateChange: (newDate: Date) => void;
  onTeamSelect?: (teamIds: number[]) => void;
  showTeamSelect?: boolean; // 팀 선택 셀렉터 표시 여부
  page?: 'manager' | 'admin'; // 페이지 타입 (manager/admin일 때만 팀 필터 사용)
  workingList?: WorkingListItem[]; // 다운로드용 데이터 (admin/manager)
  weekStartDate?: Date; // 다운로드용 주차 정보
  initialSelectedTeamIds?: number[]; // 초기 선택된 팀 ID 목록
}

export default function Toolbar({ 
  currentDate, 
  onDateChange,
  onTeamSelect = () => {},
  showTeamSelect = true,
  page,
  workingList = [],
  weekStartDate,
  initialSelectedTeamIds = [],
}: ToolbarProps) {
  const { user } = useAuth();
  
  // 팀 관련 state
  const [teams, setTeams] = useState<MyTeamItem[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  // 팀 목록 로드 중복 방지 ref
  const teamsLoadedRef = useRef(false);

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
      
    } catch (error) {
      setTeams([]);
    }
  };

  // 셀렉트 변경 핸들러
  const handleSelectChange = (id: string, value: string[]) => {
    if (id === 'teams') {
      setSelectedTeams(value);
      
      if (value.length > 0) {
        const teamIds = value.map(v => parseInt(v));
        onTeamSelect(teamIds);
      } else {
        onTeamSelect([]);
      }
    }
  };

  const selectedTeamIds = useMemo(
    () => selectedTeams.map((id) => Number(id)).filter((n) => !Number.isNaN(n)),
    [selectedTeams]
  );

  // 셀렉트 옵션 설정
  const selectConfigs: SelectConfig[] = useMemo(() => {
    // 팀 선택 (다중 선택 가능, 알파벳순 정렬)
    const sortedTeams = [...teams].sort((a, b) => 
      a.team_name.localeCompare(b.team_name, 'ko')
    );

    return [{
      id: 'teams',
      placeholder: '팀 선택',
      options: sortedTeams.map(team => ({
        value: String(team.team_id),
        label: team.team_name
      })),
      value: selectedTeams,
      searchable: true,
      hideSelectAll: false,
      autoSize: true,
    }];
  }, [teams, selectedTeams]);

  // Manager/Admin 페이지에서만 팀 목록 로드
  useEffect(() => {
    if (page === 'manager' || page === 'admin') {
      // page나 user가 변경되면 리셋
      teamsLoadedRef.current = false;
      loadTeams();
    }
  }, [user, page]);

  // 초기 선택된 팀 ID가 변경되면 selectedTeams 업데이트
  const prevInitialTeamIdsRef = useRef<number[]>(initialSelectedTeamIds);
  const isInitialMountRef = useRef(true);
  const selectedTeamsRef = useRef<string[]>(selectedTeams);
  
  // selectedTeams가 변경될 때마다 ref 업데이트
  useEffect(() => {
    selectedTeamsRef.current = selectedTeams;
  }, [selectedTeams]);
  
  useEffect(() => {
    // 배열이 실제로 변경되었는지 확인
    const hasChanged = 
      prevInitialTeamIdsRef.current.length !== initialSelectedTeamIds.length ||
      prevInitialTeamIdsRef.current.some((id, idx) => id !== initialSelectedTeamIds[idx]);
    
    if (isInitialMountRef.current || hasChanged) {
      isInitialMountRef.current = false;
      prevInitialTeamIdsRef.current = [...initialSelectedTeamIds];
      
      if (initialSelectedTeamIds.length > 0) {
        const newSelectedTeams = initialSelectedTeamIds.map(id => String(id));
        // 실제로 다른 경우에만 업데이트
        if (newSelectedTeams.length !== selectedTeamsRef.current.length ||
            newSelectedTeams.some((id, idx) => id !== selectedTeamsRef.current[idx])) {
          setSelectedTeams(newSelectedTeams);
        }
      } else if (selectedTeamsRef.current.length > 0) {
        setSelectedTeams([]);
      }
    }
  }, [initialSelectedTeamIds]);

  // 날짜 네비게이션 핸들러
  const handleNavigate = (action: 'PREV' | 'NEXT' | 'TODAY') => {
    const newDate = new Date(currentDate);
    switch (action) {
      case 'PREV':
        newDate.setDate(newDate.getDate() - 7); // 일주일 전으로
        break;
      case 'NEXT':
        newDate.setDate(newDate.getDate() + 7); // 일주일 후로
        break;
      case 'TODAY':
        newDate.setTime(Date.now());
        break;
    }
    onDateChange(newDate);
  };

  // 주간 날짜 범위 표시 형식 (월요일 ~ 일요일)
  const formatWeekDisplay = (date: Date) => {
    // 해당 주의 월요일 구하기
    const dayOfWeek = date.getDay();
    const monday = new Date(date);
    // 일요일(0)인 경우 -6일, 나머지는 -(dayOfWeek-1)일
    const daysToMonday = dayOfWeek === 0 ? -6 : -(dayOfWeek - 1);
    monday.setDate(date.getDate() + daysToMonday);
    
    // 해당 주의 일요일 구하기 (월요일 + 6일)
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const day = d.getDate();
      return `${year}년 ${month}월 ${day}일`;
    };
    
    return `${formatDate(monday)} - ${formatDate(sunday)}`;
  };

  return (
    <div className="w-full flex items-center justify-between mb-5 relative">
      
      {/* 왼쪽: 팀 필터 (Manager/Admin 페이지에서만 표시) */}
      {showTeamSelect && (page === 'manager' || page === 'admin') && (
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex items-center gap-2">
              {selectConfigs.map((config) => (
                <MultiSelect
                  simpleSelect={true}
                  key={config.id}
                  options={config.options}
                  onValueChange={(value) => handleSelectChange(config.id, value)}
                  defaultValue={config.value || []}
                  placeholder={config.placeholder}
                  size="sm"
                  maxCount={2}
                  searchable={config.searchable}
                  hideSelectAll={config.hideSelectAll}
                  autoSize={config.autoSize}
                  className="min-w-[120px]! w-auto! max-w-[200px]! multi-select"
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 중앙: 현재 날짜 표시 */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-5">
        <Button
          onClick={() => handleNavigate('PREV')}
          variant="ghost"
          size="icon"
          className="p-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Button>

        <div className="text-xl font-semibold text-gray-950 px-2">
          {formatWeekDisplay(currentDate)}
        </div>

        <Button
          onClick={() => handleNavigate('NEXT')}
          variant="ghost"
          size="icon"
          className="p-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>

      {/* 오른쪽: 뷰 변경 버튼들 */}
      <div className="flex items-center gap-1 float-right ml-auto">
        <Button
          onClick={() => handleNavigate('TODAY')}
          variant="outline"
          size="sm"
        >
          오늘
        </Button>
        <WorkTimeDownload
          currentDate={currentDate}
          page={page}
          workingList={workingList}
          selectedTeamIds={selectedTeamIds}
        />
      </div>
    </div>
  );
}
