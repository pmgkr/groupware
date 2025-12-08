import { useState } from 'react';
import OvertimeToolbar, { type OvertimeFilters } from '@components/features/Overtime/toolbar';
import OvertimeList from '@components/features/Overtime/list';

export default function AdminOvertime() {
  const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<'weekday' | 'weekend'>('weekday');
  const [overtimeFilters, setOvertimeFilters] = useState<OvertimeFilters>({});
  const [checkedItems, setCheckedItems] = useState<number[]>([]);

  // 평일 추가근무/휴일 근무 탭 변경 핸들러
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
  };

  // 체크된 항목 변경 핸들러
  const handleCheckedItemsChange = (items: number[]) => {
    setCheckedItems(items);
  };

  // 일괄 승인 핸들러
  const handleApproveAll = () => {
    // window 객체를 통해 list 컴포넌트의 함수 호출
    if ((window as any).__overtimeApproveAll) {
      (window as any).__overtimeApproveAll();
    }
  };

  return (
    <div>
      <OvertimeToolbar 
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onTeamSelect={handleTeamSelect}
        onFilterChange={handleFilterChange}
        checkedItems={checkedItems}
        onApproveAll={handleApproveAll}
        page="admin"
      />
      
      <OvertimeList
        teamIds={selectedTeamIds}
        activeTab={activeTab}
        filters={overtimeFilters}
        onCheckedItemsChange={handleCheckedItemsChange}
        isPage="admin"
      />
    </div>
  );
}

