import { useState, useEffect, useRef, useMemo } from 'react';
import dayjs from 'dayjs';
import { managerWorkingApi } from '@/api/manager/working';
import { getTeams as getManagerTeams } from '@/api/manager/teams';
import { getTeams as getAdminTeams } from '@/api/admin/teams';
import { useAuth } from '@/contexts/AuthContext';
import type { WorkData } from '@/types/working';
import type { WorkingListItem, DayWorkInfo } from '@/components/working/list';
import { getWeekEndDate, getWeekNumber } from '@/utils/dateHelper';
import { calculateWeeklyStats } from '@/utils/workingStatsHelper';
import { convertApiDataToWorkData } from '@/services/workingDataConverter';

// 모듈 레벨 캐시 (모든 인스턴스가 공유)
const wlogCache = new Map<string, any>();

// 모듈 레벨 로딩 상태 관리 (중복 호출 방지)
const loadingStates = new Map<string, Promise<any>>();

interface UseWorkingDataProps {
  weekStartDate: Date;
  selectedTeamIds: number[];
  page?: 'admin' | 'manager';
}

export function useWorkingData({ weekStartDate, selectedTeamIds, page }: UseWorkingDataProps) {
  const { user } = useAuth();
  const [workingList, setWorkingList] = useState<WorkingListItem[]>([]);
  const [loading, setLoading] = useState(false);
  
  // 중복 호출 방지 ref
  const loadingRef = useRef(false);
  const lastParamsRef = useRef<string>('');

  // 안정적인 의존성 키 생성
  const paramsKey = useMemo(() => {
    const teamIdsKey = [...selectedTeamIds].sort((a, b) => a - b).join(',');
    const { year, week } = getWeekNumber(weekStartDate);
    return `${teamIdsKey}-${year}-${week}-${page || ''}`;
  }, [selectedTeamIds, weekStartDate, page]);

  useEffect(() => {
    const loadTeamWorkLogs = async () => {
      // 모듈 레벨에서 같은 paramsKey로 이미 로딩 중이면 스킵
      if (loadingStates.has(paramsKey)) {
        try {
          await loadingStates.get(paramsKey);
        } catch {
          // 에러 무시
        }
        return;
      }

      // 로딩 Promise 생성
      const loadPromise = (async () => {
        loadingRef.current = true;
        lastParamsRef.current = paramsKey;
        setLoading(true);
      try {
        const startDate = weekStartDate;
        const endDate = getWeekEndDate(weekStartDate);

        // 팀명 매핑 (team_id -> team_name)
        const teamNameMap = new Map<number, string>();
        try {
          const teamList =
            page === 'admin'
              ? await getAdminTeams({})
              : await getManagerTeams({});
          teamList.forEach((t: any) => {
            if (t.team_id != null && t.team_name) {
              teamNameMap.set(Number(t.team_id), t.team_name);
            }
          });
        } catch {
          // 실패 시 팀 ID 그대로 사용
        }

        // 팀 선택: 없으면 admin은 전체, manager는 담당 모든 팀
        let teamIdsToQuery: (number | null)[] = [];
        if (selectedTeamIds.length > 0) {
          teamIdsToQuery = selectedTeamIds;
        } else if (page === 'admin') {
          teamIdsToQuery = [null]; // 전체 조회용 (null 전달 시 team_id 파라미터 제외)
        } else {
          try {
            const myTeams = await getManagerTeams({});
            const ids = myTeams.map((t: any) => t.team_id).filter((id: any) => id != null);
            if (ids.length > 0) {
              teamIdsToQuery = ids;
            } else {
              teamIdsToQuery = user?.team_id ? [user.team_id] : [];
            }
          } catch {
            teamIdsToQuery = user?.team_id ? [user.team_id] : [];
          }
        }

        if (teamIdsToQuery.length === 0) {
          setWorkingList([]);
          setLoading(false);
          return;
        }

        // 주차 번호 계산
        const { year, week } = getWeekNumber(startDate);

        // 모든 팀(또는 전체) 호출 결과 모으기
        const aggregatedWlog: any[] = [];
        const aggregatedVacation: any[] = [];

        for (const teamId of teamIdsToQuery) {
          try {
            let workLogResponse: any;

            const cacheKey = `${teamId ?? 'all'}-${week}-${year}-${page || ''}`;
            if (wlogCache.has(cacheKey)) {
              workLogResponse = wlogCache.get(cacheKey)!;
            } else if (loadingStates.has(cacheKey)) {
              try {
                await loadingStates.get(cacheKey);
                if (wlogCache.has(cacheKey)) {
                  workLogResponse = wlogCache.get(cacheKey)!;
                }
              } catch {
                // 무시
              }
            }

            if (!workLogResponse) {
              const loadPromise = (async () => {
                if (page === 'admin') {
                  const adminResponse = await managerWorkingApi.getAdminWorkLogsWeek({
                    // team_id가 null이면 파라미터 없이 전체 조회
                    ...(teamId != null ? { team_id: teamId } : {}),
                    weekno: week,
                    yearno: year,
                  } as any);
                  workLogResponse = {
                    wlog: adminResponse.wlog || [],
                    vacation: adminResponse.vacation || [],
                  };
                } else {
                  workLogResponse = await managerWorkingApi.getManagerWorkLogsWeek({
                    team_id: teamId || user?.team_id || 0,
                    weekno: week,
                    yearno: year,
                  });
                }
                wlogCache.set(cacheKey, workLogResponse);
                return workLogResponse;
              })();

              loadingStates.set(cacheKey, loadPromise);
              try {
                workLogResponse = await loadPromise;
              } finally {
                loadingStates.delete(cacheKey);
              }
            }

            // 팀 정보 보존: 기존 item에 team_id가 있으면 유지, 없으면 현재 쿼리한 teamId 사용
            const annotateTeam = (arr: any[] = []) =>
              arr.map((item) => ({ ...item, team_id: item.team_id ?? (teamId || null) }));

            aggregatedWlog.push(...annotateTeam(workLogResponse.wlog || []));
            aggregatedVacation.push(...annotateTeam(workLogResponse.vacation || []));
          } catch (err) {
            // 실패 시 건너뜀
          }
        }

        // 사용자별로 변환
        const transformedData: any[] = [];

        const uniqueUsers = Array.from(
          new Map(
            aggregatedWlog
              .map((w) => [w.user_id, { user_id: w.user_id, user_name: w.user_nm, team_id: w.team_id }])
          ).values()
        );

        for (const userInfo of uniqueUsers) {
          const memberWlogs = aggregatedWlog.filter((w) => w.user_id === userInfo.user_id);
          const memberVacations = aggregatedVacation.filter((v) => v.user_id === userInfo.user_id);

          // schedule/초과근무 호출 없이 wlog + vacation만으로 생성
          const userWorkData = await convertApiDataToWorkData(
            memberWlogs,
            memberVacations,
            [], // overtime 미사용
            weekStartDate,
            userInfo.user_id
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
            id: userInfo.user_id,
            department: (() => {
              const tid = userInfo.team_id;
              if (tid == null) return '-';
              return teamNameMap.get(Number(tid)) || String(tid);
            })(),
            name: userInfo.user_name || userInfo.user_id,
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
            _teamId: userInfo.team_id, // 정렬용 (임시)
          });
        }

        // _teamId 제거 (임시 필드) 후 정렬 (부서 → 이름)
        const cleanedData = transformedData
          .map(({ _teamId, ...rest }: any) => rest)
          .sort((a: any, b: any) => {
            const depA = String(a.department ?? '');
            const depB = String(b.department ?? '');
            if (depA !== depB) return depA.localeCompare(depB, 'ko');
            const nameA = String(a.name ?? '');
            const nameB = String(b.name ?? '');
            return nameA.localeCompare(nameB, 'ko');
          });

        setWorkingList(cleanedData);
      } catch (error) {
        setWorkingList([]);
      } finally {
        setLoading(false);
        loadingRef.current = false;
        loadingStates.delete(paramsKey);
      }
      })();
      
      loadingStates.set(paramsKey, loadPromise);
      
      try {
        await loadPromise;
      } catch (error) {
        // 에러는 이미 내부에서 처리됨
      }
    };

    if (user?.team_id || selectedTeamIds.length > 0 || page === 'admin') {
      loadTeamWorkLogs();
    }
  }, [paramsKey, user?.team_id, page]);

  return { workingList, loading };
}


