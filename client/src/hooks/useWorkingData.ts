import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { workingApi, type OvertimeListResponse } from '@/api/working';
import { getMemberList } from '@/api/common/team';
import { useAuth } from '@/contexts/AuthContext';
import type { WorkData } from '@/types/working';
import type { WorkingListItem, DayWorkInfo } from '@/components/working/list';
import { getWeekEndDate } from '@/utils/dateHelper';
import { calculateWeeklyStats } from '@/utils/workingStatsHelper';
import { convertApiDataToWorkData } from '@/services/workingDataConverter';

interface UseWorkingDataProps {
  weekStartDate: Date;
  selectedTeamIds: number[];
}

export function useWorkingData({ weekStartDate, selectedTeamIds }: UseWorkingDataProps) {
  const { user } = useAuth();
  const [workingList, setWorkingList] = useState<WorkingListItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadTeamWorkLogs = async () => {
      setLoading(true);
      try {
        const startDate = weekStartDate;
        const endDate = getWeekEndDate(weekStartDate);

        const sdate = dayjs(startDate).format('YYYY-MM-DD');
        const edate = dayjs(endDate).format('YYYY-MM-DD');

        console.log('📊 근태 데이터 로드 시작...');
        console.log('   조회 기간:', { sdate, edate, startDate, endDate });
        console.log('   selectedTeamIds:', selectedTeamIds);
        console.log('   user.team_id:', user?.team_id);

        // 1. 멤버 목록 가져오기 (team_id 포함)
        const teamIdsToQuery = selectedTeamIds.length > 0 ? selectedTeamIds : (user?.team_id ? [user.team_id] : []);
        
        console.log('   → 조회할 팀 ID:', teamIdsToQuery);
        
        if (teamIdsToQuery.length === 0) {
          console.warn('   ⚠️ 조회할 팀이 없습니다.');
          setWorkingList([]);
          setLoading(false);
          return;
        }

        const memberPromises = teamIdsToQuery.map(async (teamId) => {
          const members = await getMemberList(teamId);
          return members.map(member => ({ ...member, team_id: member.team_id || teamId }));
        });
        const memberResults = await Promise.all(memberPromises);
        const allTeamMembers = memberResults.flat();
        
        // 중복 제거
        const teamMembers = allTeamMembers.filter((member, index, self) =>
          index === self.findIndex(m => m.user_id === member.user_id)
        );
        
        console.log(`   ✅ 조회된 팀원: ${teamMembers.length}명`);

        // 2. 초과근무 목록 조회 (team_id로) - 모든 상태 포함 (H: 승인대기, T: 승인완료, N: 반려됨)
        let allOvertimeResponse: OvertimeListResponse = { items: [], total: 0, page: 1, size: 1000, pages: 0 };
        
        try {
          const flags = ['H', 'T', 'N']; // 승인대기, 승인완료, 반려됨 모두 조회
          const overtimePromises = teamIdsToQuery.flatMap(teamId => 
            flags.map(flag => 
              workingApi.getManagerOvertimeList({ team_id: teamId, page: 1, size: 1000, flag })
                .catch(() => ({ items: [], total: 0, page: 1, size: 1000, pages: 0 }))
            )
          );
          const overtimeResults = await Promise.all(overtimePromises);
          const allItems = overtimeResults.flatMap(result => result.items || []);
          
          // 중복 제거 (같은 id가 여러 번 조회될 수 있음)
          const uniqueItems = allItems.filter((item, index, self) =>
            index === self.findIndex(t => t.id === item.id)
          );
          
          allOvertimeResponse = {
            items: uniqueItems,
            total: uniqueItems.length,
            page: 1,
            size: 1000,
            pages: 1
          };
        } catch (error) {
          console.error('초과근무 조회 실패:', error);
        }

        // 3. 각 팀원별로 근태 데이터 조회
        const transformedData: any[] = []; // 정렬을 위해 임시로 any 사용

        for (const member of teamMembers) {
          try {
            // 각 팀원의 근태 로그 조회
            const workLogResponse = await workingApi.getWorkLogs({
              search_id: member.user_id,
              sdate,
              edate,
            });
            
            // API 응답 데이터 형식 확인 (디버깅용)
            if (member.user_id === 'yeonsang.lee@pmgasia.com') {
              console.log('📋 yeonsang.lee 근태 로그 전체 응답:', {
                totalCount: workLogResponse.wlog?.length,
                wlogs: workLogResponse.wlog,
                dates: workLogResponse.wlog?.map((w: any) => w.tdate)
              });
            }

            // 전체 초과근무 목록에서 해당 팀원의 것만 필터링
            const memberOvertimes = allOvertimeResponse.items?.filter(
              ot => ot.user_id === member.user_id
            ) || [];
            
            // convertApiDataToWorkData로 주간 데이터 생성
            const userWorkData = await convertApiDataToWorkData(
              workLogResponse.wlog || [],
              workLogResponse.vacation || [],
              memberOvertimes,
              weekStartDate,
              member.user_id
            );

          // 주간 통계 계산
          const weeklyStats = calculateWeeklyStats(userWorkData);

          // 요일별 근무시간 추출
          const formatDayTime = (dayData: WorkData): DayWorkInfo => {
            const hasOvertime = dayData.overtimeStatus !== '신청하기';
            const overtimeId = dayData.overtimeId?.toString();
            const overtimeStatus = dayData.overtimeStatus;
            
            // 근무 타입이 없으면 데이터 없음
            if (dayData.workType === '-') {
              return { 
                workType: dayData.workType,
                totalTime: '-',
                hasOvertime,
                overtimeId,
                overtimeStatus,
              };
            }
            
            // 출근 데이터가 없으면 근무타입만 표시하고 시간은 "-"
            if (dayData.startTime === '-') {
              return {
                workType: dayData.workType,
                totalTime: '-',
                hasOvertime,
                overtimeId,
                overtimeStatus,
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
              hasOvertime,
              overtimeId,
              overtimeStatus,
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
            _teamId: member.team_id, // 정렬용 (임시)
          });
          } catch (error) {
            console.error(`${member.user_id} 근태 로그 로드 실패:`, error);
          }
        }

        // _teamId 제거 (임시 필드)
        const cleanedData = transformedData.map(({ _teamId, ...rest }: any) => rest);

        setWorkingList(cleanedData);
      } catch (error) {
        console.error('❌ 팀원 근태 로그 로드 실패:', error);
        setWorkingList([]);
      } finally {
        setLoading(false);
      }
    };

    if (user?.team_id || selectedTeamIds.length > 0) {
      loadTeamWorkLogs();
    }
  }, [weekStartDate, selectedTeamIds, user?.team_id]);

  return { workingList, loading };
}

