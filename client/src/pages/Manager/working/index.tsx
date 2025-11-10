import { useState, useEffect, useMemo } from 'react';
import dayjs from 'dayjs';
import WorkingList, { type WorkingListItem, type DayWorkInfo } from '@components/working/list';
import Toolbar, { type SelectConfig } from '@components/working/toolbar';
import { workingApi, type OvertimeListResponse } from '@/api/working';
import { getMemberList } from '@/api/common/team';
import { useAuth } from '@/contexts/AuthContext';
import type { WorkData } from '@/types/working';
import { getWeekStartDate, getWeekEndDate } from '@/utils/dateHelper';
import { calculateWeeklyStats } from '@/utils/workingStatsHelper';
import { convertApiDataToWorkData } from '@/services/workingDataConverter';
import { getTeams, type TeamDto } from '@/api/teams';

export default function ManagerWorking() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [workingList, setWorkingList] = useState<WorkingListItem[]>([]);
  const [loading, setLoading] = useState(false);

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

  // 팀원들의 근태 데이터 가져오기
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

      // 2. 초과근무 목록 조회 (team_id로)
      let allOvertimeResponse: OvertimeListResponse = { items: [], total: 0, page: 1, size: 1000, pages: 0 };
      
      try {
        const overtimePromises = teamIdsToQuery.map(teamId => 
          workingApi.getManagerOvertimeList({ team_id: teamId, page: 1, size: 1000 })
            .catch(() => ({ items: [], total: 0, page: 1, size: 1000, pages: 0 }))
        );
        const overtimeResults = await Promise.all(overtimePromises);
        const allItems = overtimeResults.flatMap(result => result.items || []);
        
        allOvertimeResponse = {
          items: allItems,
          total: allItems.length,
          page: 1,
          size: 1000,
          pages: 1
        };
      } catch (error) {
        console.error('초과근무 조회 실패:', error);
      }

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
        });
        } catch (error) {
          console.error(`${member.user_id} 근태 로그 로드 실패:`, error);
        }
      }

      setWorkingList(transformedData);
    } catch (error) {
      console.error('❌ 팀원 근태 로그 로드 실패:', error);
      setWorkingList([]);
    } finally {
      setLoading(false);
    }
  };

  // currentDate 또는 필터가 변경될 때 데이터 로드
  useEffect(() => {
    if (user?.team_id || selectedTeamIds.length > 0) {
      loadTeamWorkLogs();
    }
  }, [currentDate, weekStartDate, user?.team_id, selectedTeamIds]);

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
      <WorkingList
        data={workingList}
        loading={loading}
        weekStartDate={weekStartDate}
      />
    </div>
  );
}
