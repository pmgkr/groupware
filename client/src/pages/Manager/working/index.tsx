import { useState, useEffect, useMemo } from 'react';
import dayjs from 'dayjs';
import WorkingList, { type WorkingListItem, type DayWorkInfo } from '@components/working/list';
import Toolbar from '@components/working/toolbar';
import { workingApi } from '@/api/working';
import { getMemberList } from '@/api/common/team';
import { useAuth } from '@/contexts/AuthContext';
import type { WorkData } from '@/types/working';
import { getWeekStartDate, getWeekEndDate } from '@/utils/dateHelper';
import { calculateWeeklyStats } from '@/utils/workingStatsHelper';
import { convertApiDataToWorkData } from '@/services/workingDataConverter';

export default function ManagerWorking() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [workingList, setWorkingList] = useState<WorkingListItem[]>([]);
  const [loading, setLoading] = useState(false);

  // 현재 주의 시작일 계산
  const weekStartDate = useMemo(() => getWeekStartDate(currentDate), [currentDate]);

  // 팀원들의 근태 데이터 가져오기
  const loadTeamWorkLogs = async () => {
    if (!user?.team_id) {
      return;
    }

    setLoading(true);
    try {
      const startDate = weekStartDate;
      const endDate = getWeekEndDate(weekStartDate);

      const sdate = dayjs(startDate).format('YYYY-MM-DD');
      const edate = dayjs(endDate).format('YYYY-MM-DD');

      // 1. 같은 팀 멤버 목록 가져오기 (team_id로 필터링)
      const teamMembers = await getMemberList(user.team_id);
      
      console.log('👥 같은 팀 멤버:', teamMembers.length, teamMembers);

      // 2. 초과근무 목록 가져오기 (모든 팀원의 것)
      const overtimeResponse = await workingApi.getOvertimeList({ 
        page: 1, 
        size: 1000 
      });

      // 3. 각 팀원별로 근태 데이터 조회
      const transformedData: WorkingListItem[] = [];

      for (const member of teamMembers) {
        try {
          // 각 팀원의 근태 로그 조회
          const workLogResponse = await workingApi.getWorkLogs({
            search_id: member.user_id,
            sdate,
            edate,
          });

          // convertApiDataToWorkData로 주간 데이터 생성
          const userWorkData = await convertApiDataToWorkData(
            workLogResponse.wlog || [],
            workLogResponse.vacation || [],
            overtimeResponse.items?.filter(ot => ot.user_id === member.user_id) || [],
            weekStartDate,
            member.user_id
          );

        // 주간 통계 계산
        const weeklyStats = calculateWeeklyStats(userWorkData);

        // 요일별 근무시간 추출
        const formatDayTime = (dayData: WorkData): DayWorkInfo => {
          // 근무 타입이 없으면 데이터 없음
          if (dayData.workType === '-') {
            return { 
              workType: dayData.workType,
              totalTime: '-' 
            };
          }
          
          // 출근 데이터가 없으면 근무타입만 표시하고 시간은 "-"
          if (dayData.startTime === '-') {
            return {
              workType: dayData.workType,
              totalTime: '-'
            };
          }
          
          // 출근 데이터가 있으면 근무타입에 관계없이 모두 표시
          // 출근은 했지만 퇴근을 안 한 경우 (진행 중)
          const totalTime = dayData.totalHours === 0 && dayData.totalMinutes === 0
            ? '진행중'
            : `${dayData.totalHours}h ${dayData.totalMinutes}m`;
          
          return {
            workType: dayData.workType,
            startTime: dayData.startTime,
            endTime: dayData.endTime !== '-' ? dayData.endTime : undefined,
            totalTime,
          };
        };

        transformedData.push({
          id: member.user_id,
          department: member.team_name || '-',
          name: member.user_name || member.user_id,
          workResult: userWorkData.some(d => d.totalHours > 0) ? '정상' : '-',
          weeklyTotal: `${weeklyStats.workHours}h ${weeklyStats.workMinutes}m`,
          monday: formatDayTime(userWorkData[0]),
          tuesday: formatDayTime(userWorkData[1]),
          wednesday: formatDayTime(userWorkData[2]),
          thursday: formatDayTime(userWorkData[3]),
          friday: formatDayTime(userWorkData[4]),
          saturday: formatDayTime(userWorkData[5]),
          sunday: formatDayTime(userWorkData[6]),
          note: '',
        });
        } catch (error) {
          console.error(`${member.user_id} 근태 로그 로드 실패:`, error);
        }
      }

      console.log('✅ 최종 데이터:', transformedData);
      setWorkingList(transformedData);
    } catch (error) {
      console.error('❌ 팀원 근태 로그 로드 실패:', error);
      setWorkingList([]);
    } finally {
      setLoading(false);
    }
  };

  // currentDate가 변경될 때 데이터 로드
  useEffect(() => {
    if (user?.team_id) {
      loadTeamWorkLogs();
    }
  }, [currentDate, weekStartDate, user?.team_id]);

  return (
    <div>
      <Toolbar currentDate={currentDate} onDateChange={setCurrentDate} />
      <WorkingList
        data={workingList}
        loading={loading}
      />
    </div>
  );
}
