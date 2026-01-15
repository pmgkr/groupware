import React, { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from 'react-router';
import dayjs from "dayjs";
import Toolbar from "@components/working/toolbar";
import Table from "@components/working/table";
import Overview from "@components/working/Overview";
import { workingApi } from "@/api/working";
import { useAuth } from "@/contexts/AuthContext";
import type { WorkData } from "@/types/working";
import { getWeekStartDate, getWeekEndDate, getWeekNumber, getDateFromWeekNumber } from "@/utils/dateHelper";
import { convertApiDataToWorkData } from "@/services/workingDataConverter";
import { formatMinutes } from "@/utils/date";


export default function WorkHoursTable() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const isInitialMount = useRef(true);
  const isUpdatingFromUrl = useRef(false);
  
  // URL에서 파라미터 읽기
  const urlYear = searchParams.get('year');
  const urlWeek = searchParams.get('week');

  // 초기 날짜 설정: URL 파라미터가 있으면 사용, 없으면 오늘
  const getInitialDate = () => {
    if (urlYear && urlWeek) {
      const year = parseInt(urlYear, 10);
      const week = parseInt(urlWeek, 10);
      if (!isNaN(year) && !isNaN(week)) {
        return getDateFromWeekNumber(year, week);
      }
    }
    return new Date();
  };

  const [currentDate, setCurrentDate] = useState(() => getInitialDate());
  const [data, setData] = useState<WorkData[]>([]);
  
  // URL 파라미터가 변경되면 state 업데이트 (외부에서 URL이 변경된 경우만)
  const prevUrlYearRef = useRef(urlYear);
  const prevUrlWeekRef = useRef(urlWeek);
  const currentDateRef = useRef(currentDate);
  
  // currentDate가 변경될 때마다 ref 업데이트
  useEffect(() => {
    currentDateRef.current = currentDate;
  }, [currentDate]);
  
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevUrlYearRef.current = urlYear;
      prevUrlWeekRef.current = urlWeek;
      return;
    }

    if (isUpdatingFromUrl.current) {
      prevUrlYearRef.current = urlYear;
      prevUrlWeekRef.current = urlWeek;
      return;
    }

    // URL 파라미터가 실제로 변경된 경우에만 업데이트
    if (urlYear !== prevUrlYearRef.current || urlWeek !== prevUrlWeekRef.current) {
      prevUrlYearRef.current = urlYear;
      prevUrlWeekRef.current = urlWeek;

      if (urlYear && urlWeek) {
        const year = parseInt(urlYear, 10);
        const week = parseInt(urlWeek, 10);
        if (!isNaN(year) && !isNaN(week)) {
          const newDate = getDateFromWeekNumber(year, week);
          const currentWeekStart = getWeekStartDate(currentDateRef.current);
          const newWeekStart = getWeekStartDate(newDate);
          // 실제로 다른 주인 경우에만 업데이트
          if (currentWeekStart.getTime() !== newWeekStart.getTime()) {
            isUpdatingFromUrl.current = true;
            setCurrentDate(newDate);
            setTimeout(() => {
              isUpdatingFromUrl.current = false;
            }, 0);
          }
        }
      }
    }
  }, [urlYear, urlWeek]);
  
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
      
      // 근태 로그, 초과근무 병렬로 가져오기
      // WlogWeek API 사용
      const [wlogWeekResponse, overtimeResponse] = await Promise.all([
        workingApi.getWlogWeek({
          weekno: week,
          yearno: year,
        }),
        workingApi.getOvertimeList({
          page: 1,
          size: 100,
        }),
      ]);
      
      // API 데이터를 WorkData 형식으로 변환
      const apiData = await convertApiDataToWorkData(
        wlogWeekResponse.wlog || [], 
        [...(wlogWeekResponse.vacation || []), ...(wlogWeekResponse.event || [])],
        overtimeResponse.items || [],
        weekStartDate,
        user.user_id
      );
      setData(apiData);
    } catch (error) {
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

  // 날짜 변경 핸들러: URL 업데이트
  const handleDateChange = (newDate: Date) => {
    if (isUpdatingFromUrl.current) return;
    
    setCurrentDate(newDate);
    const { year, week } = getWeekNumber(getWeekStartDate(newDate));
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('year', year.toString());
    newSearchParams.set('week', week.toString());
    setSearchParams(newSearchParams, { replace: true });
  };

  return (
    <div>
      <Toolbar
        currentDate={currentDate}
        onDateChange={handleDateChange}
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
