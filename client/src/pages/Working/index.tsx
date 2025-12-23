import React, { useState, useMemo, useEffect } from "react";
import dayjs from "dayjs";
import Toolbar from "@components/working/toolbar";
import Table from "@components/working/table";
import Overview from "@components/working/Overview";
import { workingApi } from "@/api/working";
import { useAuth } from "@/contexts/AuthContext";
import type { WorkData } from "@/types/working";
import { getWeekStartDate, getWeekEndDate, getWeekNumber } from "@/utils/dateHelper";
import { convertApiDataToWorkData } from "@/services/workingDataConverter";
import { formatMinutes } from "@/utils/date";


export default function WorkHoursTable() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [data, setData] = useState<WorkData[]>([]);
  
  // 현재 주의 시작일 계산
  const weekStartDate = useMemo(() => getWeekStartDate(currentDate), [currentDate]);
  
  // 주차와 연도 계산
  const { week, year } = useMemo(() => getWeekNumber(weekStartDate), [weekStartDate]);

  // API에서 근태 로그 데이터 가져오기
  const loadWorkLogs = async () => {
    if (!user?.user_id) {
      return;
    }
    
    try {
      const startDate = weekStartDate;
      const endDate = getWeekEndDate(weekStartDate);
      
      // 근태 로그, 초과근무, 스케줄(이벤트) 병렬로 가져오기
      // WlogWeek API 사용
      const [wlogWeekResponse, overtimeResponse, scheduleEvents] = await Promise.all([
        workingApi.getWlogWeek({
          weekno: week,
          yearno: year,
        }),
        workingApi.getOvertimeList({
          page: 1,
          size: 100,
        }),
        // schedule API로 이벤트만 가져오기
        (async () => {
          try {
            const { scheduleApi } = await import('@/api/calendar');
            const year = startDate.getFullYear();
            const month = startDate.getMonth() + 1;
            const response = await scheduleApi.getSchedules({ 
              year, 
              month, 
              user_id: user.user_id
            }) as any;
            const schedules = Array.isArray(response?.items) ? response.items : (response?.items?.items || []);
            
            // 모든 일정(이벤트 + 휴가)을 vacation 형식으로 변환
            const scheduleVacations: any[] = [];
            
            schedules
              .filter((sch: any) => {
                // 승인완료(Y) 또는 승인대기(H)만 + 본인 일정만
                return (sch.sch_status === 'Y' || sch.sch_status === 'H')
                  && sch.user_id === user.user_id;
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
                    scheduleVacations.push({
                      user_id: user.user_id,
                      user_nm: user.user_name || '',
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
            
            return scheduleVacations;
          } catch (err) {
            console.error('스케줄 조회 실패:', err);
            return [];
          }
        })()
      ]);
      
      // schedule API에서 모든 일정(휴가 + 이벤트)을 가져오므로 wlogWeekResponse.vacation과 병합
      // API 데이터를 WorkData 형식으로 변환
      const apiData = await convertApiDataToWorkData(
        wlogWeekResponse.wlog || [], 
        [...(wlogWeekResponse.vacation || []), ...(wlogWeekResponse.event || []), ...scheduleEvents],
        overtimeResponse.items || [],
        weekStartDate,
        user.user_id
      );
      setData(apiData);
    } catch (error) {
      console.error('근태 로그 로드 실패:', error);
      setData([]);
    }
  };
  
  // currentDate가 변경될 때 데이터 로드
  useEffect(() => {
    if (user?.user_id) {
      loadWorkLogs();
    }
  }, [currentDate, weekStartDate, user?.user_id, week, year]);

  // 주간 근무시간 통계 계산 (data 배열의 합계 사용)
  const weeklyStats = useMemo(() => {
    // 각 항목의 시간들을 분 단위로 합산
    const totalBasicMinutes = data.reduce((sum, day) => sum + (day.basicHours * 60) + (day.basicMinutes || 0), 0);
    const totalOvertimeMinutes = data.reduce((sum, day) => sum + (day.overtimeHours * 60) + (day.overtimeMinutes || 0), 0);
    const totalWorkMinutes = data.reduce((sum, day) => sum + (day.totalHours * 60) + (day.totalMinutes || 0), 0);

    const { hours: basicWorkHours, minutes: basicWorkMinutes } = formatMinutes(totalBasicMinutes);
    const { hours: overtimeWorkHours, minutes: overtimeWorkMinutes } = formatMinutes(totalOvertimeMinutes);
    const { hours: workHours, minutes: workMinutes } = formatMinutes(totalWorkMinutes);
    
    // 남은 시간 계산 (52시간 기준)
    const remainingMinutes = Math.max(0, (52 * 60) - totalWorkMinutes);
    const { hours: remainingHours, minutes: remainingMins } = formatMinutes(remainingMinutes);
    
    return {
      workHours,
      workMinutes,
      remainingHours,
      remainingMinutes: remainingMins,
      basicWorkHours,
      basicWorkMinutes,
      overtimeWorkHours,
      overtimeWorkMinutes,
    };
  }, [data]);

  return (
    <div>
      <Toolbar
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        showTeamSelect={false}
      />
      <Overview weeklyStats={weeklyStats} />
      <Table 
        data={data}
        onDataRefresh={loadWorkLogs}
      />
    </div>
  );
}
