import { useState, useMemo } from 'react';
import WorkingList from '@components/working/list';
import Toolbar from '@components/working/toolbar';
import { getWeekStartDate } from '@/utils/dateHelper';
import { useWorkingData } from '@/hooks/useWorkingData';

export default function ManagerWorking() {
  const [currentDate, setCurrentDate] = useState(new Date());

  // 선택된 팀 ID 목록
  const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>([]);

  // 현재 주의 시작일 계산
  const weekStartDate = useMemo(() => getWeekStartDate(currentDate), [currentDate]);
  
  // 근태 데이터 로드
  const { workingList, loading } = useWorkingData({ weekStartDate, selectedTeamIds });

  // 팀 선택 핸들러
  const handleTeamSelect = (teamIds: number[]) => {
    setSelectedTeamIds(teamIds);
  };

  return (
    <div className="mb-5">
      <Toolbar 
        currentDate={currentDate} 
        onDateChange={setCurrentDate} 
        onTeamSelect={handleTeamSelect}
      />
      
      <WorkingList
        data={workingList}
        loading={loading}
        weekStartDate={weekStartDate}
      />
    </div>
  );
}
