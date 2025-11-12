import { useState, useEffect, useMemo } from 'react';
import dayjs from 'dayjs';
import WorkingList, { type WorkingListItem, type DayWorkInfo } from '@components/working/list';
import Toolbar, { type SelectConfig } from '@components/working/toolbar';
import { workingApi, type OvertimeListResponse, type MyTeamItem } from '@/api/working';
import { getMemberList } from '@/api/common/team';
import { useAuth } from '@/contexts/AuthContext';
import type { WorkData } from '@/types/working';
import { getWeekStartDate, getWeekEndDate } from '@/utils/dateHelper';
import { calculateWeeklyStats } from '@/utils/workingStatsHelper';
import { convertApiDataToWorkData } from '@/services/workingDataConverter';
import { getTeams } from '@/api/teams';

export default function ManagerWorking() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [workingList, setWorkingList] = useState<WorkingListItem[]>([]);
  const [loading, setLoading] = useState(false);

  // 필터 상태
  const [myTeams, setMyTeams] = useState<MyTeamItem[]>([]); // 관리자의 팀 목록 (원본)
  const [departments, setDepartments] = useState<MyTeamItem[]>([]); // 국 목록 (level=0)
  const [subTeams, setSubTeams] = useState<MyTeamItem[]>([]); // 선택된 국의 하위 팀 목록
  const [selectedDepartment, setSelectedDepartment] = useState<string[]>([]); // 선택된 국
  const [selectedSubTeams, setSelectedSubTeams] = useState<string[]>([]); // 선택된 하위 팀들
  const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>([]); // 선택된 팀 ID 목록

  // 현재 주의 시작일 계산
  const weekStartDate = useMemo(() => getWeekStartDate(currentDate), [currentDate]);

  // 관리자의 팀 목록 로드
  const loadMyTeams = async () => {
    try {
      console.log('🔍 팀 목록 로드 시작...');
      console.log('   현재 로그인 사용자:', user?.user_id, 'level:', user?.user_level, 'team_id:', user?.team_id);
      
      if (!user?.user_id) {
        console.error('  ✖ 로그인 정보가 없습니다.');
        return;
      }
      
      // 전체 팀 목록 조회
      console.log('📡 전체 팀 목록 조회 중...');
      const allTeamDetails = await getTeams({});
      console.log('✅ 전체 팀 목록:', allTeamDetails.length, '개');
      
      // admin 권한 체크
      if (user.user_level === 'admin') {
        console.log('🔑 관리자 권한: 모든 국 표시');
        
        // 모든 level=0인 국 조회
        const allDepartments = allTeamDetails.filter(t => t.level === 0);
        
        const depts: MyTeamItem[] = allDepartments.map(dept => ({
          seq: 0,
          manager_id: user.user_id,
          manager_name: user.user_name || '',
          team_id: dept.team_id,
          team_name: dept.team_name,
          parent_id: dept.parent_id || undefined,
          level: dept.level,
        }));
        
        console.log('🎯 1차 필터에 표시할 국:', depts.length, '개');
        console.log('   목록:', depts.map(d => d.team_name).join(', '));
        
        setDepartments(depts);
        setMyTeams([{
          seq: 0,
          manager_id: user.user_id,
          manager_name: user.user_name || '',
          team_id: 0,
          team_name: 'admin',
          level: -1, // admin 표시용
          parent_id: undefined
        }]);
        return;
      }
      
      // 일반 사용자 (manager)
      if (!user?.team_id) {
        console.error('  ✖ 팀 정보가 없습니다.');
        return;
      }
      
      // 사용자의 팀 정보 찾기
      const myTeam = allTeamDetails.find(t => t.team_id === user.team_id);
      if (!myTeam) {
        console.error('  ✖ 사용자의 팀 정보를 찾을 수 없습니다.');
        return;
      }
      
      console.log('👤 내 팀 정보:', {
        team_id: myTeam.team_id,
        team_name: myTeam.team_name,
        level: myTeam.level,
        parent_id: myTeam.parent_id
      });
      
      // 국 결정 로직
      let departmentId: number;
      let departmentName: string;
      
      if (myTeam.level === 0) {
        // 국장인 경우: 본인의 팀이 국
        departmentId = myTeam.team_id;
        departmentName = myTeam.team_name;
        console.log('   ✓ 국장 권한: 국 =', departmentName);
      } else if (myTeam.level === 1 && myTeam.parent_id) {
        // 팀장인 경우: parent_id가 국
        const parentDept = allTeamDetails.find(t => t.team_id === myTeam.parent_id);
        if (!parentDept) {
          console.error('  ✖ 상위 국을 찾을 수 없습니다.');
          return;
        }
        departmentId = parentDept.team_id;
        departmentName = parentDept.team_name;
        console.log('   ✓ 팀장 권한: 소속 국 =', departmentName);
      } else {
        console.error('  ✖ 지원하지 않는 팀 레벨입니다:', myTeam.level);
        return;
      }
      
      // 1차 필터: 국 설정
      const depts: MyTeamItem[] = [{
        seq: 0,
        manager_id: user.user_id,
        manager_name: user.user_name || '',
        team_id: departmentId,
        team_name: departmentName,
        parent_id: undefined,
        level: 0,
      }];
      
      console.log('🎯 1차 필터에 표시할 국:', departmentName, `(${departmentId})`);
      
      setDepartments(depts);
      setMyTeams([{
        seq: 0,
        manager_id: user.user_id,
        manager_name: user.user_name || '',
        team_id: myTeam.team_id,
        team_name: myTeam.team_name,
        level: myTeam.level,
        parent_id: myTeam.parent_id || undefined
      }]); // 내 실제 팀 정보 저장
      
    } catch (error) {
      console.error('❌ 팀 목록 로드 실패:', error);
      setDepartments([]);
      setSubTeams([]);
    }
  };

  // 국의 하위 팀 목록 로드
  const loadSubTeams = async (departmentId: number): Promise<number[]> => {
    try {
      console.log(`📋 국(${departmentId})의 하위 팀 조회 중...`);
      
      if (!user?.user_id) {
        console.error('  ✖ 로그인 정보가 없습니다.');
        return [];
      }
      
      const allTeamDetails = await getTeams({});
      
      // 해당 국의 모든 하위 팀 조회
      const allSubTeams = allTeamDetails.filter(t => 
        t.parent_id === departmentId && t.level === 1
      );
      
      console.log(`   해당 국의 전체 하위 팀 ${allSubTeams.length}개:`, allSubTeams.map(t => t.team_name).join(', '));
      
      let subTeamItems: MyTeamItem[] = [];
      
      // admin 권한 체크
      if (user.user_level === 'admin') {
        console.log('   🔑 관리자 권한: 모든 하위 팀 표시');
        subTeamItems = allSubTeams.map(sub => ({
          seq: 0,
          manager_id: user.user_id,
          manager_name: user.user_name || '',
          team_id: sub.team_id,
          team_name: sub.team_name,
          parent_id: sub.parent_id || undefined,
          level: sub.level,
        }));
      } else {
        // 일반 사용자
        if (!user?.team_id) {
          console.error('  ✖ 팀 정보가 없습니다.');
          return [];
        }
        
        // 내 팀 정보
        const myTeam = allTeamDetails.find(t => t.team_id === user.team_id);
        if (!myTeam) {
          console.error('  ✖ 내 팀 정보를 찾을 수 없습니다.');
          return [];
        }
        
        console.log('   내 팀:', myTeam.team_name, `(level=${myTeam.level})`);
        
        if (myTeam.level === 0) {
          // 국장인 경우: 모든 하위 팀 표시
          console.log('   ✓ 국장 권한: 모든 하위 팀 표시');
          subTeamItems = allSubTeams.map(sub => ({
            seq: 0,
            manager_id: user.user_id,
            manager_name: user.user_name || '',
            team_id: sub.team_id,
            team_name: sub.team_name,
            parent_id: sub.parent_id || undefined,
            level: sub.level,
          }));
        } else if (myTeam.level === 1) {
          // 팀장인 경우: 본인의 팀만 표시
          console.log('   ✓ 팀장 권한: 본인 팀만 표시');
          const mySubTeam = allSubTeams.find(t => t.team_id === user.team_id);
          if (mySubTeam) {
            subTeamItems = [{
              seq: 0,
              manager_id: user.user_id,
              manager_name: user.user_name || '',
              team_id: mySubTeam.team_id,
              team_name: mySubTeam.team_name,
              parent_id: mySubTeam.parent_id || undefined,
              level: mySubTeam.level,
            }];
          }
        }
      }
      
      console.log(`   ↳ 2차 필터에 표시할 팀 ${subTeamItems.length}개:`, subTeamItems.map(t => t.team_name).join(', '));
      setSubTeams(subTeamItems);
      
      // 하위 팀 ID 배열 반환
      const teamIds = subTeamItems.map(t => t.team_id);
      return teamIds;
    } catch (error) {
      console.error('하위 팀 조회 실패:', error);
      setSubTeams([]);
      return [];
    }
  };

  // 여러 국의 하위 팀을 모두 조회
  const loadMultipleDepartmentTeams = async (deptIds: number[]) => {
    try {
      if (!user?.user_id) {
        console.error('  ✖ 로그인 정보가 없습니다.');
        return { allTeamIds: [], allSubTeams: [] };
      }

      const allTeamDetails = await getTeams({});
      const allSubTeamItems: MyTeamItem[] = [];
      const allTeamIds: number[] = [];

      for (const deptId of deptIds) {
        console.log(`📋 국(${deptId})의 하위 팀 조회 중...`);

        // 해당 국의 모든 하위 팀 조회
        const deptSubTeams = allTeamDetails.filter(
          t => t.parent_id === deptId && t.level === 1
        );

        console.log(`   해당 국의 전체 하위 팀 ${deptSubTeams.length}개:`, deptSubTeams.map(t => t.team_name).join(', '));

        // admin 권한 체크
        if (user.user_level === 'admin') {
          // admin: 모든 하위 팀 추가
          deptSubTeams.forEach(sub => {
            allSubTeamItems.push({
              seq: 0,
              manager_id: user.user_id,
              manager_name: user.user_name || '',
              team_id: sub.team_id,
              team_name: sub.team_name,
              parent_id: sub.parent_id || undefined,
              level: sub.level,
            });
            allTeamIds.push(sub.team_id);
          });
        } else if (user?.team_id) {
          // 내 팀 정보
          const myTeam = allTeamDetails.find(t => t.team_id === user.team_id);

          if (myTeam?.level === 0) {
            // 국장: 모든 하위 팀 추가
            deptSubTeams.forEach(sub => {
              allSubTeamItems.push({
                seq: 0,
                manager_id: user.user_id,
                manager_name: user.user_name || '',
                team_id: sub.team_id,
                team_name: sub.team_name,
                parent_id: sub.parent_id || undefined,
                level: sub.level,
              });
              allTeamIds.push(sub.team_id);
            });
          } else if (myTeam?.level === 1) {
            // 팀장: 본인의 팀만 추가
            const mySubTeam = deptSubTeams.find(t => t.team_id === user.team_id);
            if (mySubTeam) {
              allSubTeamItems.push({
                seq: 0,
                manager_id: user.user_id,
                manager_name: user.user_name || '',
                team_id: mySubTeam.team_id,
                team_name: mySubTeam.team_name,
                parent_id: mySubTeam.parent_id || undefined,
                level: mySubTeam.level,
              });
              allTeamIds.push(mySubTeam.team_id);
            }
          }
        }
      }

      // 중복 제거
      const uniqueTeamIds = Array.from(new Set(allTeamIds));
      const uniqueSubTeams = allSubTeamItems.filter(
        (item, index, self) => index === self.findIndex(t => t.team_id === item.team_id)
      );

      console.log(`   ↳ 2차 필터에 표시할 팀 ${uniqueSubTeams.length}개:`, uniqueSubTeams.map(t => t.team_name).join(', '));

      return { allTeamIds: uniqueTeamIds, allSubTeams: uniqueSubTeams };
    } catch (error) {
      console.error('하위 팀 조회 실패:', error);
      return { allTeamIds: [], allSubTeams: [] };
    }
  };

  // 셀렉트 변경 핸들러
  const handleSelectChange = async (id: string, value: string[]) => {
    if (id === 'department') {
      setSelectedDepartment(value);
      
      if (value.length > 0) {
        const deptIds = value.map(v => parseInt(v));
        const selectedDepts = departments.filter(d => deptIds.includes(d.team_id));
        console.log(`🎯 국 선택: ${selectedDepts.map(d => d.team_name).join(', ')} (ids=${deptIds.join(', ')})`);
        
        // 모든 선택된 국의 하위 팀 조회
        const { allTeamIds, allSubTeams } = await loadMultipleDepartmentTeams(deptIds);
        
        console.log(`   → 자동 선택: 모든 하위 팀 ${allTeamIds.length}개`, allTeamIds);
        
        // UI에 표시할 하위 팀 목록 설정
        setSubTeams(allSubTeams);
        
        // 데이터 조회용 (국 ID + 하위 팀 ID 모두 포함)
        const allIdsWithDepartments = [...deptIds, ...allTeamIds];
        setSelectedTeamIds(allIdsWithDepartments);
        
        console.log(`   → 조회할 팀 ID (국 포함): ${allIdsWithDepartments.length}개`, allIdsWithDepartments);
        
        // UI 표시용 (2차 필터를 전체 선택 상태로)
        setSelectedSubTeams(allTeamIds.map(id => String(id)));
      } else {
        setSubTeams([]);
        setSelectedTeamIds([]);
        setSelectedSubTeams([]);
      }
    } else if (id === 'subteams') {
      setSelectedSubTeams(value);
      
      // 선택된 하위 팀들의 ID만 사용
      if (value.length > 0) {
        const subTeamIds = value.map(v => parseInt(v));
        console.log(`🎯 하위 팀 선택:`, subTeamIds);
        setSelectedTeamIds(subTeamIds);
      } else {
        // 하위 팀 선택 해제 시 → 다시 모든 팀 표시
        const allSubTeamIds = subTeams.map(t => t.team_id);
        console.log(`   → 선택 해제: 모든 하위 팀으로 복원`);
        setSelectedTeamIds(allSubTeamIds);
        setSelectedSubTeams(allSubTeamIds.map(id => String(id)));
      }
    }
  };

  // 초기 팀 목록 로드
  useEffect(() => {
    loadMyTeams();
  }, []);

  // 팀원들의 근태 데이터 가져오기
  const loadTeamWorkLogs = async () => {
    setLoading(true);
    try {
      const startDate = weekStartDate;
      const endDate = getWeekEndDate(weekStartDate);

      const sdate = dayjs(startDate).format('YYYY-MM-DD');
      const edate = dayjs(endDate).format('YYYY-MM-DD');

      console.log('📊 근태 데이터 로드 시작...');
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

      // 국장을 제일 위로 정렬 (선택된 국 ID에 해당하는 사람들)
      const selectedDeptIds = selectedDepartment.map(d => parseInt(d));
      const sortedData = transformedData.sort((a: any, b: any) => {
        const aIsDeptManager = selectedDeptIds.includes(a._teamId);
        const bIsDeptManager = selectedDeptIds.includes(b._teamId);
        
        if (aIsDeptManager && !bIsDeptManager) return -1; // a가 국장 → 위로
        if (!aIsDeptManager && bIsDeptManager) return 1;  // b가 국장 → 위로
        return 0; // 동일하면 순서 유지
      });

      // _teamId 제거 (임시 필드)
      const cleanedData = sortedData.map(({ _teamId, ...rest }: any) => rest);

      setWorkingList(cleanedData);
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

    // 첫 번째 필터: 국 선택 (항상 level=0, 다중 선택 가능)
    configs.push({
      id: 'department',
      placeholder: '국 선택',
      options: departments.map(dept => ({
        value: String(dept.team_id),
        label: dept.team_name
      })),
      value: selectedDepartment,
      searchable: true,
      hideSelectAll: false,
      autoSize: true,
    });

    // 두 번째 필터: 하위 팀 선택 (국 선택 후 표시)
    if (selectedDepartment.length > 0 && subTeams.length > 0) {
      configs.push({
        id: 'subteams',
        placeholder: '팀 선택',
        options: subTeams.map(team => ({
          value: String(team.team_id),
          label: team.team_name
        })),
        value: selectedSubTeams,
        searchable: true,
        hideSelectAll: false,
        autoSize: true,
      });
    }

    return configs;
  }, [departments, selectedDepartment, subTeams, selectedSubTeams]);

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
