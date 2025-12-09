import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { type OvertimeListResponse } from '@/api/working';
import { managerOvertimeApi } from '@/api/manager/overtime';
import { managerWorkingApi } from '@/api/manager/working';
import { getMemberList } from '@/api/common/team';
import { useAuth } from '@/contexts/AuthContext';
import type { WorkData } from '@/types/working';
import type { WorkingListItem, DayWorkInfo } from '@/components/working/list';
import { getWeekEndDate, getWeekNumber } from '@/utils/dateHelper';
import { calculateWeeklyStats } from '@/utils/workingStatsHelper';
import { convertApiDataToWorkData } from '@/services/workingDataConverter';

interface UseWorkingDataProps {
  weekStartDate: Date;
  selectedTeamIds: number[];
  page?: 'admin' | 'manager';
}

export function useWorkingData({ weekStartDate, selectedTeamIds, page }: UseWorkingDataProps) {
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

        // 1. 멤버 목록 가져오기 (team_id 포함)
        const teamIdsToQuery = selectedTeamIds.length > 0 ? selectedTeamIds : (user?.team_id ? [user.team_id] : []);
        
        if (teamIdsToQuery.length === 0) {
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

        // 2. 초과근무 목록 조회 (team_id로) - 모든 상태 포함 (H: 승인대기, T: 승인완료, N: 취소완료)
        let allOvertimeResponse: OvertimeListResponse = { items: [], total: 0, page: 1, size: 1000, pages: 0 };
        
        try {
          const flags = ['H', 'T', 'N']; // 승인대기, 승인완료, 취소완료 모두 조회
          const overtimePromises = teamIdsToQuery.flatMap(teamId => 
            flags.map(flag => 
              managerOvertimeApi.getManagerOvertimeList({ team_id: teamId, page: 1, size: 1000, flag })
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
          // 초과근무 조회 실패 시 무시
        }

        // 3. 팀별로 근태 데이터 조회
        const transformedData: any[] = []; // 정렬을 위해 임시로 any 사용

        // 주차 번호 계산
        const { year, week } = getWeekNumber(startDate);
        
        // 팀별로 그룹화
        const teamGroups = new Map<number, typeof teamMembers>();
        teamMembers.forEach(member => {
          if (!teamGroups.has(member.team_id)) {
            teamGroups.set(member.team_id, []);
          }
          teamGroups.get(member.team_id)!.push(member);
        });
        
        // 각 팀별로 API 호출
        for (const [teamId, members] of teamGroups) {
          try {
            // 관리자 - 근태 로그 주간 조회 (팀별로 조회)
            let workLogResponse: any;
            
            if (page === 'admin') {
              // Admin API 사용
              const adminResponse = await managerWorkingApi.getAdminWorkLogsWeek({
                team_id: teamId,
                weekno: week,
                yearno: year
              });
              // Admin API 응답을 WorkLogResponse 형식으로 변환
              workLogResponse = {
                wlog: adminResponse.wlog || [],
                vacation: adminResponse.vacation || []
              };
            } else {
              // Manager API 사용
              workLogResponse = await managerWorkingApi.getManagerWorkLogsWeek({
                team_id: teamId,
                weekno: week,
                yearno: year
              });
            }
            
            // 각 팀원별로 데이터 처리
            for (const member of members) {
              try {
                // 해당 팀원의 데이터만 필터링
                const memberWlogs = (workLogResponse.wlog || []).filter((w: any) => 
                  w.user_id === member.user_id
                );
                const memberVacations = (workLogResponse.vacation || []).filter((v: any) => 
                  v.user_id === member.user_id
                );

            // 스케줄 API를 통해 이벤트 가져오기 (해당 팀원)
            let scheduleEvents: any[] = [];
            try {
              const { scheduleApi } = await import('@/api/calendar');
              const year = startDate.getFullYear();
              const month = startDate.getMonth() + 1;
              
              // 승인완료(Y)와 승인대기(H) 모두 가져오기 위해 sch_status 파라미터 제거
              // (API가 배열을 받지 않을 수 있으므로 클라이언트에서 필터링)
              const response = await scheduleApi.getSchedules({ 
                year, 
                month, 
                user_id: member.user_id
              }) as any;
              
              const schedules = Array.isArray(response?.items) ? response.items : (response?.items?.items || []);
              
              // 모든 일정(이벤트 + 휴가)을 vacation 형식으로 변환
              schedules
                .filter((sch: any) => {
                  // 승인완료(Y) 또는 승인대기(H)만 + 해당 팀원 일정만
                  return (sch.sch_status === 'Y' || sch.sch_status === 'H')
                    && sch.user_id === member.user_id;
                })
                .forEach((sch: any) => {
                  // 시작일부터 종료일까지 각 날짜에 대해 vacation 항목 생성
                  // dayjs를 사용하여 날짜 문자열을 파싱 (한국 시간대 고려)
                  const schStartDate = dayjs(sch.sch_sdate).startOf('day');
                  const schEndDate = dayjs(sch.sch_edate).startOf('day');
                  const weekStart = dayjs(startDate).startOf('day');
                  const weekEnd = dayjs(endDate).startOf('day');
                  
                  // 시작일부터 종료일까지 반복
                  let currentDate = schStartDate;
                  while (currentDate.isBefore(schEndDate, 'day') || currentDate.isSame(schEndDate, 'day')) {
                    const dateStr = currentDate.format('YYYY-MM-DD');
                    
                    // 해당 주간 범위 내에 있는 날짜만 추가
                    if ((currentDate.isAfter(weekStart, 'day') || currentDate.isSame(weekStart, 'day')) 
                        && (currentDate.isBefore(weekEnd, 'day') || currentDate.isSame(weekEnd, 'day'))) {
                      scheduleEvents.push({
                        user_id: member.user_id,
                        user_nm: member.user_name || '',
                        tdate: dateStr,
                        stime: sch.sch_stime,
                        etime: sch.sch_etime,
                        wmin: 0,
                        kind: sch.sch_type === 'event' 
                          ? sch.sch_event_type  // 이벤트: remote, field, etc
                          : sch.sch_vacation_type, // 휴가: day, half, quarter, official
                        type: sch.sch_type === 'vacation' 
                          ? sch.sch_vacation_time  // 휴가: morning, afternoon
                          : '-', // 이벤트는 type 없음
                        sch_created_at: sch.sch_created_at // created_at 추가
                      });
                    }
                    
                    // 다음 날로 이동
                    currentDate = currentDate.add(1, 'day');
                  }
                });
            } catch (err) {
              // 스케줄 조회 실패 시 무시
            }

            // 전체 초과근무 목록에서 해당 팀원의 것만 필터링
            const memberOvertimes = allOvertimeResponse.items?.filter(
              ot => ot.user_id === member.user_id
            ) || [];
            
            // schedule API에서 모든 일정(휴가 + 이벤트)을 가져오므로 workLogResponse.vacation은 제외
            // (중복 방지를 위해 schedule API 데이터만 사용)
            const combinedVacations = scheduleEvents;
            
            // convertApiDataToWorkData로 주간 데이터 생성 (필터링된 데이터 사용)
            const userWorkData = await convertApiDataToWorkData(
              memberWlogs,
              combinedVacations,
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
            
            // 승인완료된 추가근무는 뱃지만 추가근무로 표시, 시간은 원래 데이터 사용
            if (dayData.overtimeStatus === '승인완료') {
              const totalTime = dayData.totalHours === 0 && dayData.totalMinutes === 0
                ? '진행중'
                : `${dayData.totalHours}h ${dayData.totalMinutes}m`;
              
              return {
                workType: '추가근무', // 승인완료된 추가근무는 뱃지에 항상 추가근무로 표시
                workTypes: dayData.workTypes,
                startTime: dayData.startTime,
                endTime: dayData.endTime !== '-' ? dayData.endTime : undefined,
                totalTime,
                hasOvertime,
                overtimeId,
                overtimeStatus,
                holidayName: dayData.holidayName,
              };
            }
            
            // 근무 타입이 없으면 데이터 없음 (단, 승인완료된 추가근무가 있으면 위에서 이미 처리됨)
            if (dayData.workType === '-') {
              return { 
                workType: dayData.workType,
                workTypes: dayData.workTypes, // 여러 workType이 있을 경우 배열 전달
                totalTime: '-',
                hasOvertime,
                overtimeId,
                overtimeStatus,
                holidayName: dayData.holidayName,
              };
            }
            
            // 출근 데이터가 없으면 근무타입만 표시하고 시간은 "-"
            if (dayData.startTime === '-') {
              return {
                workType: dayData.workType,
                workTypes: dayData.workTypes, // 여러 workType이 있을 경우 배열 전달
                totalTime: '-',
                hasOvertime,
                overtimeId,
                overtimeStatus,
                holidayName: dayData.holidayName,
              };
            }
            
            // 출근 데이터가 있으면 근무타입에 관계없이 모두 표시
            // 출근은 했지만 퇴근을 안 한 경우 (진행 중)
            const totalTime = dayData.totalHours === 0 && dayData.totalMinutes === 0
              ? '진행중'
              : `${dayData.totalHours}h ${dayData.totalMinutes}m`;
            
            return {
              workType: dayData.workType,
              workTypes: dayData.workTypes, // 여러 workType이 있을 경우 배열 전달
              startTime: dayData.startTime,
              endTime: dayData.endTime !== '-' ? dayData.endTime : undefined,
              totalTime,
              hasOvertime,
              overtimeId,
              overtimeStatus,
              holidayName: dayData.holidayName,
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
                // 근태 로그 로드 실패 시 무시
              }
            }
          } catch (error) {
            // 팀 근태 로그 조회 실패 시 무시
          }
        }

        // _teamId 제거 (임시 필드)
        const cleanedData = transformedData.map(({ _teamId, ...rest }: any) => rest);

        setWorkingList(cleanedData);
      } catch (error) {
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


