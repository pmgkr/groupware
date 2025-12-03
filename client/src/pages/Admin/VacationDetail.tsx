import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import UserList from '@/components/features/Vacation/userList';
import Toolbar from '@components/features/Vacation/toolbar';
import type { VacationFilters } from '@components/features/Vacation/toolbar';
import MyVacationHistoryComponent from '@components/features/Vacation/history';
import { adminVacationApi } from '@/api/admin/vacation';

export default function VacationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // 선택된 팀 ID 목록 - 클릭한 유저의 팀으로 설정
  const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>([]);
  // 선택된 유저 ID 목록 - 클릭한 유저로 설정
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  
  // 활성 탭 (휴가 vs 이벤트)
  const [activeTab, setActiveTab] = useState<'vacation' | 'event'>('vacation');
  
  // 필터 상태
  const [filters, setFilters] = useState<VacationFilters>({});

  // 체크된 항목들
  const [checkedItems, setCheckedItems] = useState<number[]>([]);

  // 유저 정보 로드 및 필터 설정
  useEffect(() => {
    const loadUserInfo = async () => {
      if (!id) return;
      
      try {
        const currentYear = filters.year ? parseInt(filters.year) : new Date().getFullYear();
        const response = await adminVacationApi.getVacationInfo(id, currentYear, 1, 20);
        
        // 유저 ID 설정
        setSelectedUserIds([response.header.user_id]);
        
        // 팀 ID 설정
        if (response.header.team_id) {
          setSelectedTeamIds([response.header.team_id]);
        }
      } catch (error) {
        console.error('유저 정보 로드 실패:', error);
      }
    };
    
    loadUserInfo();
  }, [id, filters.year]);

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

  // 목록으로 돌아가기 핸들러
  const handleListClick = () => {
    navigate('/admin/vacation');
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
      />
      <UserList 
        year={year}
        teamIds={selectedTeamIds}
        userIds={selectedUserIds}
      />
      <div className="mt-6">
        <MyVacationHistoryComponent
        userId={id}
        year={year}
      />
      </div>
    </>
  );
}