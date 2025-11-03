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
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<WorkData[]>([]);
  
  // 현재 주의 시작일 계산
  const weekStartDate = useMemo(() => getWeekStartDate(currentDate), [currentDate]);

  // API에서 근태 로그 데이터 가져오기
  const loadWorkLogs = async () => {
    if (!user?.user_id) {
      return;
    }
    
    setIsLoading(true);
    try {
      const startDate = weekStartDate;
      const endDate = getWeekEndDate(weekStartDate);
      
      const sdate = dayjs(startDate).format('YYYY-MM-DD');
      const edate = dayjs(endDate).format('YYYY-MM-DD');
      
      // 근태 로그와 초과근무 목록 병렬로 가져오기
      const [workLogResponse, overtimeResponse] = await Promise.all([
        workingApi.getWorkLogs({
          search_id: user.user_id,
          sdate,
          edate,
        }),
        workingApi.getOvertimeList({
          page: 1,
          size: 100,
        })
      ]);
      
      // API 데이터를 WorkData 형식으로 변환
      const apiData = await convertApiDataToWorkData(
        workLogResponse.wlog || [], 
        workLogResponse.vacation || [], 
        overtimeResponse.items || [],
        weekStartDate,
        user.user_id
      );
      setData(apiData);
    } catch (error) {
      console.error('근태 로그 로드 실패:', error);
      setData([]);
    } finally {
      setIsLoading(false);
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
      />
      <Overview weeklyStats={weeklyStats} />
      <Table 
        data={data}
        onDataRefresh={loadWorkLogs}
      />
    </div>
  );
}
