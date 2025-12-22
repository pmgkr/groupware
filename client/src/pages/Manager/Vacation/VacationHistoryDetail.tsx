import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import UserList from '@/components/features/Vacation/userList';
import Toolbar from '@components/features/Vacation/toolbar';
import type { VacationFilters } from '@components/features/Vacation/toolbar';
import VacationHistory from '@components/features/Vacation/history';

export default function VacationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // 선택된 팀 ID 목록
  const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>([]);
  // 선택된 유저 ID 목록 - 클릭한 유저로 설정 (초기값으로 id 설정)
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(id ? [id] : []);
  
  // 활성 탭 (휴가 vs 이벤트)
  const [activeTab, setActiveTab] = useState<'vacation' | 'event'>('vacation');
  
  // 필터 상태
  const [filters, setFilters] = useState<VacationFilters>({});

  // 체크된 항목들
  const [checkedItems, setCheckedItems] = useState<number[]>([]);

  // id가 변경되면 상태 초기화
  useEffect(() => {
    if (!id) {
      setSelectedUserIds([]);
      setSelectedTeamIds([]);
    } else {
      setSelectedUserIds([id]);
    }
  }, [id]);

  // 팀 선택 핸들러
  const handleTeamSelect = (teamIds: number[]) => {
    setSelectedTeamIds(teamIds);
  };

  // 유저 선택 핸들러
  const handleUserSelect = (userIds: string[]) => {
    setSelectedUserIds(userIds);
    
    // 상세 페이지에서 유저 선택 시 URL 업데이트 (1개만 선택 가능)
    if (userIds.length === 1) {
      navigate(`/manager/vacation/user/${userIds[0]}`, { replace: true });
    }
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

  // 목록으로 돌아가기 핸들러
  const handleListClick = () => {
    navigate('/manager/vacation/history');
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
        onListClick={handleListClick}
        page="admin"
        initialUserIds={id ? [id] : undefined}
      />
      <UserList 
        year={year}
        teamIds={selectedTeamIds}
        userIds={selectedUserIds}
      />
      <div className="mt-6">
        <VacationHistory
        userId={id}
        year={year}
      />
      </div>
    </>
  );
}