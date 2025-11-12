import { useState } from 'react';
import OvertimeToolbar, { type OvertimeFilters } from '@components/features/Overtime/toolbar';

export default function ManagerOvertime() {
  const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'overtime'>('all');
  const [overtimeFilters, setOvertimeFilters] = useState<OvertimeFilters>({});

  // 탭 변경 핸들러 (필터로 작동)
  const handleTabChange = (tab: 'all' | 'overtime') => {
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
      
      <div className="flex h-96 items-center justify-center rounded-lg border border-dashed border-gray-300">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">추가근무 관리</h3>
          <p className="text-sm text-gray-500 mb-3">
            {activeTab === 'all' ? '전체 추가근무 신청 내역' : '승인 대기 중인 추가근무'}을 표시합니다.
          </p>
          <div className="text-xs text-gray-400 space-y-1">
            <p>현재 필터: {activeTab === 'all' ? '전체' : '승인 대기'}</p>
            <p>선택된 팀: {selectedTeamIds.length > 0 ? selectedTeamIds.join(', ') : '전체'}</p>
            {overtimeFilters.year && <p>연도: {overtimeFilters.year}</p>}
            {overtimeFilters.status && overtimeFilters.status.length > 0 && (
              <p>상태: {overtimeFilters.status.join(', ')}</p>
            )}
            {overtimeFilters.mealAllowance && overtimeFilters.mealAllowance.length > 0 && (
              <p>식대: {overtimeFilters.mealAllowance.join(', ')}</p>
            )}
            {overtimeFilters.transportAllowance && overtimeFilters.transportAllowance.length > 0 && (
              <p>교통비: {overtimeFilters.transportAllowance.join(', ')}</p>
            )}
            {overtimeFilters.compensation && overtimeFilters.compensation.length > 0 && (
              <p>보상: {overtimeFilters.compensation.join(', ')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

