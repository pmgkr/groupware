import { useState } from 'react';
import VacationList from '@components/features/Vacation/list';
import Toolbar from '@components/features/Vacation/toolbar';
import type { VacationFilters } from '@components/features/Vacation/toolbar';

export default function ManagerVacation() {
  // 선택된 팀 ID 목록
  const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>([]);
  
  // 활성 탭 (휴가 vs 이벤트)
  const [activeTab, setActiveTab] = useState<'vacation' | 'event'>('vacation');
  
  // 필터 상태
  const [filters, setFilters] = useState<VacationFilters>({});
  
  // 체크된 항목들
  const [checkedItems, setCheckedItems] = useState<number[]>([]);

  // 팀 선택 핸들러
  const handleTeamSelect = (teamIds: number[]) => {
    setSelectedTeamIds(teamIds);
  };
  
  // 필터 변경 핸들러
  const handleFilterChange = (newFilters: VacationFilters) => {
    setFilters(newFilters);
  };
  
  // 일괄 승인 핸들러
  const handleApproveAll = () => {
    // window 객체에 VacationList에서 등록한 함수 호출
    if ((window as any).__VacationApproveAll) {
      (window as any).__VacationApproveAll();
    }
  };

  return (
    <div>
      <Toolbar 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onTeamSelect={handleTeamSelect}
        onFilterChange={handleFilterChange}
        checkedItems={checkedItems}
        onApproveAll={handleApproveAll}
        page="manager"
      />
      
      <VacationList
        teamIds={selectedTeamIds}
        activeTab={activeTab}
        filters={filters}
        onCheckedItemsChange={setCheckedItems}
      />
    </div>
  );
}
