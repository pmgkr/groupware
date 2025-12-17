import { useState, useMemo } from 'react';
import LatecomerComponent from '@components/working/Latecomer';
import Toolbar from '@components/working/toolbar';
import { getWeekStartDate } from '@/utils/dateHelper';

export default function Latecomer() {
  const [currentDate, setCurrentDate] = useState(new Date());

  // 선택된 팀 ID 목록
  const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>([]);

  // 현재 주의 시작일 계산
  const weekStartDate = useMemo(() => getWeekStartDate(currentDate), [currentDate]);

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
        page="admin"
      />
      
      <LatecomerComponent
        currentDate={currentDate}
        selectedTeamIds={selectedTeamIds}
        page="admin"
      />
    </div>
  );
}

