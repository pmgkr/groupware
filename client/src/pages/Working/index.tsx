import React, { useState, useMemo, useEffect } from "react";
import dayjs from "dayjs";
import Toolbar from "@components/working/toolbar";
import Table from "@components/working/table";
import Overview from "@components/working/Overview";
import { workingApi } from "@/api/working";
import { useAuth } from "@/contexts/AuthContext";
import type { WorkData } from "@/types/working";
import { getWeekStartDate, getWeekEndDate } from "@/utils/dateHelper";
import { calculateWeeklyStats } from "@/utils/workingStatsHelper";
import { convertApiDataToWorkData } from "@/services/workingDataConverter";


export default function WorkHoursTable() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [data, setData] = useState<WorkData[]>([]);
  
  // 현재 주의 시작일 계산
  const weekStartDate = useMemo(() => getWeekStartDate(currentDate), [currentDate]);

  // API에서 근태 로그 데이터 가져오기
  const loadWorkLogs = async () => {
    if (!user?.user_id) {
      return;
    }
    
    try {
      const startDate = weekStartDate;
      const endDate = getWeekEndDate(weekStartDate);
      
      const sdate = dayjs(startDate).format('YYYY-MM-DD');
      const edate = dayjs(endDate).format('YYYY-MM-DD');
      
      // 근태 로그, 초과근무, 스케줄(이벤트) 병렬로 가져오기
      const [workLogResponse, overtimeResponse, scheduleEvents] = await Promise.all([
        workingApi.getWorkLogs({
          search_id: user.user_id,
          sdate,
          edate,
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
              user_id: user.user_id,
              sch_status: 'Y' // 승인된 일정만
            }) as any;
            const schedules = Array.isArray(response?.items) ? response.items : (response?.items?.items || []);
            
            // 이벤트만 필터링하여 vacation 형식으로 변환
            const eventVacations: any[] = [];
            
            schedules
              .filter((sch: any) => {
                // 이벤트만 + 취소된 일정 제외 + 본인 일정만
                return sch.sch_type === 'event' 
                  && sch.sch_status !== 'N' 
                  && sch.user_id === user.user_id;
              })
              .forEach((sch: any) => {
                // 시작일부터 종료일까지 각 날짜에 대해 vacation 항목 생성
                const schStartDate = new Date(sch.sch_sdate);
                const schEndDate = new Date(sch.sch_edate);
                
                // 현재 날짜를 시작일로 설정
                const currentDate = new Date(schStartDate);
                
                // 시작일부터 종료일까지 반복
                while (currentDate <= schEndDate) {
                  const dateStr = dayjs(currentDate).format('YYYY-MM-DD');
                  const isInRange = currentDate >= startDate && currentDate <= endDate;
                  
                  // 해당 주간 범위 내에 있는 날짜만 추가
                  if (isInRange) {
                    eventVacations.push({
                      user_id: user.user_id,
                      user_nm: user.user_name || '',
                      tdate: dateStr,
                      stime: sch.sch_stime,
                      etime: sch.sch_etime,
                      wmin: 0,
                      kind: sch.sch_event_type, // remote, field, etc
                      type: '-'
                    });
                  }
                  
                  // 다음 날로 이동
                  currentDate.setDate(currentDate.getDate() + 1);
                }
              });
            
            return eventVacations;
          } catch (err) {
            console.error('스케줄 조회 실패:', err);
            return [];
          }
        })()
      ]);
      
      // vacation 배열과 schedule 이벤트 합치기
      const combinedVacations = [...(workLogResponse.vacation || []), ...scheduleEvents];
      
      // API 데이터를 WorkData 형식으로 변환
      const apiData = await convertApiDataToWorkData(
        workLogResponse.wlog || [], 
        combinedVacations,
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
  }, [currentDate, weekStartDate, user?.user_id]);

  // 주간 근무시간 통계 계산
  const weeklyStats = useMemo(() => calculateWeeklyStats(data), [data]);

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
