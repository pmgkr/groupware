// client/src/components/calendar/toolbar.tsx
import React, { useState, useEffect, useMemo } from 'react';
import type { View } from "react-big-calendar";
import { Button } from "../ui/button";
import { MultiSelect } from "../multiselect/multi-select";
import { getTeams } from '@/api/teams';

// 셀렉트 옵션 타입 정의
interface SelectOption {
  value: string;
  label: string;
}

interface SelectConfig {
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
  onNavigate: (action: 'PREV' | 'NEXT' | 'TODAY') => void;
  onView: (view: View) => void;
  currentView: View;
  currentDate: Date;
  selectConfigs: SelectConfig[];
  onSelectChange: (selectId: string, value: string[]) => void;
  onAddEvent: () => void;
  onTeamSelect?: (teamIds: number[]) => void;
}

export default function CustomToolbar({ onNavigate, onView, currentView, currentDate, selectConfigs, onSelectChange, onAddEvent, onTeamSelect = () => {} }: ToolbarProps) {
  // 팀 목록 state
  const [teams, setTeams] = useState<{ team_id: number; team_name: string; }[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

  // 전체 팀 목록 로드 (권한 체크 없이)
  const loadTeams = async () => {
    try {
      const allTeams = await getTeams({});
      setTeams(allTeams.map(t => ({ team_id: t.team_id, team_name: t.team_name })));
    } catch (error) {
      console.error('팀 목록 로드 실패:', error);
      setTeams([]);
    }
  };

  // 초기 팀 목록 로드
  useEffect(() => {
    loadTeams();
  }, []);

  // 팀 선택 핸들러
  const handleTeamSelectChange = (value: string[]) => {
    setSelectedTeams(value);
    
    if (value.length > 0) {
      const teamIds = value.map(v => parseInt(v));
      onTeamSelect(teamIds);
    } else {
      onTeamSelect([]);
    }
  };

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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
    }).format(date);
  };

  return (
    <div className="flex items-center justify-between mb-5 relative">

      {/* 왼쪽: 네비게이션 버튼들 */}
      <div className="flex items-center gap-2">

        {/* 팀 선택 */}
        <MultiSelect
          simpleSelect={true}
          options={teamOptions}
          onValueChange={handleTeamSelectChange}
          defaultValue={selectedTeams}
          placeholder="팀 선택"
          size="sm"
          maxCount={0}
          searchable={true}
          hideSelectAll={false}
          autoSize={true}
          className="min-w-[120px]! w-auto! max-w-[200px]! multi-select"
        />

        {/* 동적 셀렉트 렌더링 */}
        {selectConfigs.map((config) => (
          <MultiSelect
            key={config.id}
            options={config.options}
            onValueChange={(value) => onSelectChange(config.id, value)}
            defaultValue={config.value || []}
            placeholder={config.placeholder}
            size="sm"
            maxCount={config.maxCount}
            searchable={config.searchable}
            hideSelectAll={config.hideSelectAll}
            autoSize={config.autoSize}
            className="min-w-[120px]! w-auto! max-w-[200px]! multi-select"
          />
        ))}

        {/* 중앙: 현재 날짜 표시 */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-5">
          <Button
            onClick={() => onNavigate('PREV')}
            variant="ghost"
            size="icon"
            className="p-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>

          <div className="text-xl font-semibold text-gray-950 px-2">
            {formatDate(currentDate)}
          </div>

          <Button
            onClick={() => onNavigate('NEXT')}
            variant="ghost"
            size="icon"
            className="p-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>
      </div>



      {/* 오른쪽: 뷰 변경 버튼들 */}
      <div className="flex items-center gap-1">
        <Button
          onClick={onAddEvent}
          variant="outline"
          size="sm"
        >
          + 일정 등록
        </Button>
        <Button
          onClick={() => onNavigate('TODAY')}
          variant="outline"
          size="sm"
        >
          오늘
        </Button>
        <Button
          onClick={() => onView('month')}
          variant={currentView === 'month' ? 'default' : 'outline'}
          size="sm"
        >
          달력
        </Button>
        <Button
          onClick={() => onView('agenda')}
          variant={currentView === 'agenda' ? 'default' : 'outline'}
          size="sm"
        >
          전체
        </Button>
        {/* <Button
          onClick={() => onView('week')}
          variant={currentView === 'week' ? 'default' : 'outline'}
          size="sm"
        >
          주간
        </Button>
        <Button
          onClick={() => onView('day')}
          variant={currentView === 'day' ? 'default' : 'outline'}
          size="sm"
        >
          일간
        </Button> */}
      </div>
    </div>
  );
} 