import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import UserList from '@/components/features/Vacation/userList';
import Toolbar from '@components/features/Vacation/toolbar';
import type { VacationFilters } from '@components/features/Vacation/toolbar';
import VacationHistory from '@components/features/Vacation/history';
import { adminVacationApi } from '@/api/admin/vacation';

export default function VacationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // 선택된 팀 ID 목록 - 클릭한 유저의 팀으로 설정
  const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>([]);
  // 선택된 유저 ID 목록 - 클릭한 유저로 설정 (초기값으로 id 설정)
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(id ? [id] : []);
  
  // 활성 탭 (휴가 vs 이벤트)
  const [activeTab, setActiveTab] = useState<'vacation' | 'event'>('vacation');
  
  // 필터 상태
  const [filters, setFilters] = useState<VacationFilters>({});

  // 체크된 항목들
  const [checkedItems, setCheckedItems] = useState<number[]>([]);

  // 유저 정보 state (toolbar에 전달하기 위해)
  const [userTeamId, setUserTeamId] = useState<number | null>(null);
  const [userName, setUserName] = useState<string>('');

  // id가 변경되면 상태 초기화
  useEffect(() => {
    if (!id) {
      setSelectedUserIds([]);
      setSelectedTeamIds([]);
      setUserTeamId(null);
      setUserName('');
    }
  }, [id]);

  // 유저 정보 로드 및 필터 설정
  useEffect(() => {
    const loadUserInfo = async () => {
      if (!id) return;
      
      try {
        const currentYear = filters.year ? parseInt(filters.year) : new Date().getFullYear();
        const response = await adminVacationApi.getVacationInfo(id, currentYear, 1, 20);
        
        // 유저 ID 설정 (같은 값이면 업데이트하지 않음)
        setSelectedUserIds(prev => {
          const newIds = [response.header.user_id];
          if (prev.length === newIds.length && prev[0] === newIds[0]) return prev;
          return newIds;
        });
        setUserName(response.header.user_name);
        
        // 팀 ID 설정 (같은 값이면 업데이트하지 않음)
        if (response.header.team_id) {
          setSelectedTeamIds(prev => {
            const newIds = [response.header.team_id];
            if (prev.length === newIds.length && prev[0] === newIds[0]) return prev;
            return newIds;
          });
          setUserTeamId(response.header.team_id);
        }
      } catch (error) {
        console.error('유저 정보 로드 실패:', error);
        // 에러 발생 시에도 상태 초기화
        setSelectedUserIds([]);
        setSelectedTeamIds([]);
        setUserTeamId(null);
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
    
    // 상세 페이지에서 유저 선택 시 URL 업데이트 (1개만 선택 가능)
    if (userIds.length === 1) {
      navigate(`/admin/vacation/user/${userIds[0]}`, { replace: true });
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
        initialTeamIds={userTeamId ? [userTeamId] : undefined}
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