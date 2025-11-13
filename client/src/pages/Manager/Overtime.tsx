import { useState } from 'react';
import OvertimeToolbar, { type OvertimeFilters } from '@components/features/Overtime/toolbar';
import OvertimeList from '@components/features/Overtime/list';

export default function ManagerOvertime() {
  const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<'weekday' | 'weekend'>('weekday');
  const [overtimeFilters, setOvertimeFilters] = useState<OvertimeFilters>({});

  // 탭 변경 핸들러 (필터로 작동)
  const handleTabChange = (tab: 'weekday' | 'weekend') => {
    setActiveTab(tab);
  };

  // 팀 선택 핸들러
  const handleTeamSelect = (teamIds: number[]) => {
    setSelectedTeamIds(teamIds);
  };

  // 추가근무 필터 변경 핸들러
  const handleFilterChange = (filters: OvertimeFilters) => {
    setOvertimeFilters(filters);
    console.log('추가근무 필터 변경:', filters);
  };

  return (
    <div>
      <OvertimeToolbar 
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onTeamSelect={handleTeamSelect}
        onFilterChange={handleFilterChange}
      />
      
      <OvertimeList
        teamIds={selectedTeamIds}
        activeTab={activeTab}
        filters={overtimeFilters}
      />
    </div>
  );
}

