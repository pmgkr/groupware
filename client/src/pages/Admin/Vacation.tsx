import { useState } from 'react';
import UserList from '@/components/features/Vacation/userList';
import Toolbar from '@components/features/Vacation/toolbar';
import type { VacationFilters } from '@components/features/Vacation/toolbar';

export default function AdminVacation() {
  // 선택된 팀 ID 목록
  const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>([]);
  // 선택된 유저 ID 목록
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  
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

  // 유저 선택 핸들러
  const handleUserSelect = (userIds: string[]) => {
    setSelectedUserIds(userIds);
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

  const year = filters.year ? parseInt(filters.year) : new Date().getFullYear();

  return (
    <>
      <Toolbar 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onTeamSelect={handleTeamSelect}
        onUserSelect={handleUserSelect}
        onFilterChange={handleFilterChange}
        checkedItems={checkedItems}
        onApproveAll={handleApproveAll}
        page="admin"
      />
      <UserList 
        year={year}
        teamIds={selectedTeamIds}
        userIds={selectedUserIds}
      />
    </>
  );
}