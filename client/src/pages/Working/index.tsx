import React, { useState, useMemo, useEffect } from "react";
import dayjs from "dayjs";
import Toolbar, { type SelectConfig } from "@components/working/toolbar";
import Table from "@components/working/table";
import Overview from "@components/working/Overview";
import { workingApi } from "@/api/working";
import { useAuth } from "@/contexts/AuthContext";
import type { WorkData } from "@/types/working";
import { getWeekStartDate, getWeekEndDate } from "@/utils/dateHelper";
import { calculateWeeklyStats } from "@/utils/workingStatsHelper";
import { convertApiDataToWorkData } from "@/services/workingDataConverter";
import { getTeams, type TeamDto } from "@/api/teams";


export default function WorkHoursTable() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<WorkData[]>([]);
  
  // 필터 상태
  const [departments, setDepartments] = useState<TeamDto[]>([]); // 국 목록
  const [selectedDepartment, setSelectedDepartment] = useState<string[]>([]); // 선택된 국
  const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>([]); // 선택된 국+하위 팀들의 ID 목록
  
  // 현재 주의 시작일 계산
  const weekStartDate = useMemo(() => getWeekStartDate(currentDate), [currentDate]);

  // 국 목록 로드 (tlevel=1)
  const loadDepartments = async () => {
    try {
      const depts = await getTeams({ tlevel: 1 });
      setDepartments(depts);
    } catch (error) {
      console.error('국 목록 로드 실패:', error);
      setDepartments([]);
    }
  };

  // 국 선택 시 해당 국 + 하위 팀 목록 로드
  const loadDepartmentWithTeams = async (departmentId: number) => {
    try {
      const teamList = await getTeams({ parent_id: departmentId });
      // 국 ID + 하위 팀 ID들을 모두 배열에 담기
      const teamIds = [departmentId, ...teamList.map(team => team.team_id)];
      setSelectedTeamIds(teamIds);
      console.log(`📋 국 ${departmentId} 선택 → 조회할 팀 ID 목록:`, teamIds);
    } catch (error) {
      console.error('팀 목록 로드 실패:', error);
      setSelectedTeamIds([departmentId]); // 실패해도 국 ID는 포함
    }
  };

  // 셀렉트 변경 핸들러
  const handleSelectChange = (id: string, value: string[]) => {
    if (id === 'department') {
      setSelectedDepartment(value);
      
      // 국이 선택된 경우 해당 국 + 하위 팀 목록 로드
      if (value.length > 0) {
        const deptId = parseInt(value[0]);
        loadDepartmentWithTeams(deptId);
      } else {
        setSelectedTeamIds([]);
      }
    }
  };

  // 초기 국 목록 로드
  useEffect(() => {
    loadDepartments();
  }, []);

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

  // 셀렉트 옵션 설정
  const selectConfigs: SelectConfig[] = useMemo(() => {
    const configs: SelectConfig[] = [];

    // 국 필터만 표시
    configs.push({
      id: 'department',
      placeholder: '국 선택',
      options: departments.map(dept => ({
        value: String(dept.team_id),
        label: dept.team_name
      })),
      value: selectedDepartment,
      maxCount: 1,
      searchable: true,
      hideSelectAll: true,
      autoSize: true,
    });

    return configs;
  }, [departments, selectedDepartment]);

  return (
    <div>
      <Toolbar
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        selectConfigs={selectConfigs}
        onSelectChange={handleSelectChange}
      />
      <Overview weeklyStats={weeklyStats} />
      <Table 
        data={data}
        onDataRefresh={loadWorkLogs}
      />
    </div>
  );
}
