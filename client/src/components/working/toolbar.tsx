import { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from "@components/ui/button";
import { MultiSelect } from "@components/multiselect/multi-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@components/ui/dialog';
import { RadioButton, RadioGroup } from '@components/ui/radioButton';
import type { WorkingListItem, DayWorkInfo } from './list';
import { getWeekStartDate, getWeekNumber } from '@/utils/dateHelper';
import { convertApiDataToWorkData } from '@/services/workingDataConverter';
import { useAuth } from '@/contexts/AuthContext';
import { getTeams } from '@/api/admin/teams';
import { getTeams as getManagerTeams, type MyTeamItem } from '@/api/manager/teams';
import * as XLSX from 'xlsx';

// 셀렉트 옵션 타입 정의
export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectConfig {
  id: string;
  placeholder: string;
  options: SelectOption[];
  value?: string[];
  autoSize?: boolean;
  maxCount?: number;
  searchable?: boolean;
  hideSelectAll?: boolean;
}

interface ToolbarProps {
  currentDate: Date;
  onDateChange: (newDate: Date) => void;
  onTeamSelect?: (teamIds: number[]) => void;
  showTeamSelect?: boolean; // 팀 선택 셀렉터 표시 여부
  page?: 'manager' | 'admin'; // 페이지 타입 (manager/admin일 때만 팀 필터 사용)
  workingList?: WorkingListItem[]; // 다운로드용 데이터 (admin/manager)
  weekStartDate?: Date; // 다운로드용 주차 정보
}

export default function Toolbar({ 
  currentDate, 
  onDateChange,
  onTeamSelect = () => {},
  showTeamSelect = true,
  page,
  workingList = [],
  weekStartDate,
}: ToolbarProps) {
  const { user } = useAuth();
  
  // 팀 관련 state
  const [teams, setTeams] = useState<MyTeamItem[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [isExcelDialogOpen, setExcelDialogOpen] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // 팀 목록 로드 중복 방지 ref
  const teamsLoadedRef = useRef(false);

  // 팀 목록 로드
  const loadTeams = async () => {
    if (teamsLoadedRef.current) return;
    
    try {
      if (!user?.user_id) {
        return;
      }
      
      // page prop에 따라 분기
      if (page === 'admin') {
        // admin 페이지: 모든 팀 표시
        const allTeamDetails = await getTeams({});
        const teamItems: MyTeamItem[] = allTeamDetails.map(team => ({
          seq: 0,
          manager_id: user.user_id,
          manager_name: user.user_name || '',
          team_id: team.team_id,
          team_name: team.team_name,
          parent_id: team.parent_id || undefined,
          level: team.level,
        }));
        
        setTeams(teamItems);
        return;
      }
      
      // manager 페이지: 권한 상관없이 자기가 팀장인 팀 목록만 조회
      const allTeamDetails = await getManagerTeams({});
      const teamItems: MyTeamItem[] = allTeamDetails.map(team => ({
        seq: 0,
        manager_id: team.manager_id || '',
        manager_name: team.manager_name || '',
        team_id: team.team_id,
        team_name: team.team_name,
        parent_id: team.parent_id || undefined,
        level: team.level,
      }));
      
      setTeams(teamItems);
      
    } catch (error) {
      console.error('팀 목록 로드 실패:', error);
      setTeams([]);
    }
  };

  // 셀렉트 변경 핸들러
  const handleSelectChange = (id: string, value: string[]) => {
    if (id === 'teams') {
      setSelectedTeams(value);
      
      if (value.length > 0) {
        const teamIds = value.map(v => parseInt(v));
        onTeamSelect(teamIds);
      } else {
        onTeamSelect([]);
      }
    }
  };

  // 엑셀 다운로드용 월 목록
  const monthOptions = useMemo(() => 
    Array.from({ length: 12 }, (_, idx) => `${idx + 1}월`)
  , []);

  const selectedTeamIds = useMemo(
    () => selectedTeams.map((id) => Number(id)).filter((n) => !Number.isNaN(n)),
    [selectedTeams]
  );

  const toggleMonthSelection = (monthLabel: string) => {
    setSelectedMonths((prev) => {
      const alreadySelected = prev.includes(monthLabel);
      if (alreadySelected) {
        return prev.filter((m) => m !== monthLabel);
      }
      return [...prev, monthLabel];
    });
  };

  const formatDayCell = (dayInfo?: DayWorkInfo) => {
    if (!dayInfo || !dayInfo.workType || dayInfo.workType === '-') {
      return dayInfo?.holidayName ? `${dayInfo.holidayName}` : '-';
    }

    const parts: string[] = [];
    parts.push(dayInfo.workType);
    if (dayInfo.startTime) {
      const timeRange = `${dayInfo.startTime}${dayInfo.endTime ? `-${dayInfo.endTime}` : ''}`;
      parts.push(timeRange);
    }
    if (dayInfo.totalTime) {
      parts.push(`(${dayInfo.totalTime})`);
    }
    if (dayInfo.holidayName) {
      parts.push(`[${dayInfo.holidayName}]`);
    }
    return parts.join(' ');
  };

  const resolveTeamIdsToQuery = async () => {
    if (selectedTeamIds.length > 0) return selectedTeamIds;
    if (page === 'admin') return [null];

    try {
      const myTeams = await getManagerTeams({});
      const ids = myTeams.map((t: any) => t.team_id).filter((id: any) => id != null);
      if (ids.length > 0) return ids;
    } catch {
      // ignore
    }

    return user?.team_id ? [user.team_id] : [];
  };

  const resolveTeamNameMap = async () => {
    const map = new Map<number, string>();
    try {
      const teamList = page === 'admin' ? await getTeams({}) : await getManagerTeams({});
      teamList.forEach((t: any) => {
        if (t.team_id != null && t.team_name) {
          map.set(Number(t.team_id), t.team_name);
        }
      });
    } catch {
      // ignore
    }
    return map;
  };

  const fetchWeekData = async (teamId: number | null, weekStart: Date) => {
    const { year, week } = getWeekNumber(weekStart);
    if (page === 'admin') {
      const adminResp = await (await import('@/api/manager/working')).managerWorkingApi.getAdminWorkLogsWeek({
        team_id: teamId ?? null,
        weekno: week,
        yearno: year,
      });
      return {
        wlog: adminResp.wlog || [],
        vacation: adminResp.vacation || [],
        event: adminResp.event || [],
      };
    }

    const resp = await (await import('@/api/manager/working')).managerWorkingApi.getManagerWorkLogsWeek({
      team_id: teamId ?? user?.team_id ?? 0,
      weekno: week,
      yearno: year,
    });
    return {
      wlog: resp.wlog || [],
      vacation: resp.vacation || [],
      event: resp.event || [],
    };
  };

  const buildMonthSheetRows = async (monthIndex: number) => {
    const year = currentDate.getFullYear();
    const monthStart = new Date(year, monthIndex, 1);
    const monthEnd = new Date(year, monthIndex + 1, 0);

    const teamIdsToQuery = await resolveTeamIdsToQuery();
    if (teamIdsToQuery.length === 0) return [['팀 정보가 없습니다.']];

    const teamNameMap = await resolveTeamNameMap();

    type UserAccum = {
      id: string;
      name: string;
      teamId?: number | null;
      department?: string;
      cells: Record<string, string>;
    };
    const userMap = new Map<string, UserAccum>();

    // 화면 순서 유지용 기본 시드 (workingList가 있을 경우)
    workingList.forEach((item) => {
      userMap.set(item.id, {
        id: item.id,
        name: item.name,
        department: item.department,
        teamId: undefined,
        cells: {},
      });
    });

    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const dayKeys = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    });

    for (const teamId of teamIdsToQuery) {
      let weekStart = getWeekStartDate(monthStart);
      while (weekStart <= monthEnd) {
        const weekData = await fetchWeekData(teamId, weekStart);

        const uniqueUsers = Array.from(
          new Map(
            [...(weekData.wlog || []), ...(weekData.vacation || []), ...(weekData.event || [])].map((w: any) => [
              w.user_id,
              { user_id: w.user_id, user_name: w.user_nm, team_id: w.team_id ?? teamId },
            ])
          ).values()
        );

        for (const userInfo of uniqueUsers) {
          const memberWlogs = (weekData.wlog || []).filter((w: any) => w.user_id === userInfo.user_id);
          const memberVacations = (weekData.vacation || []).filter((v: any) => v.user_id === userInfo.user_id);
          const memberEvents = (weekData.event || []).filter((e: any) => e.user_id === userInfo.user_id);

          const weekWorkData = await convertApiDataToWorkData(
            memberWlogs,
            [...memberVacations, ...memberEvents],
            [],
            new Date(weekStart),
            userInfo.user_id
          );

          weekWorkData
            .filter((d) => {
              const dDate = new Date(d.date);
              return dDate.getMonth() === monthIndex && dDate.getFullYear() === year;
            })
            .forEach((d) => {
              const accum =
                userMap.get(userInfo.user_id) || {
                  id: userInfo.user_id,
                  name: userInfo.user_name || userInfo.user_id,
                  teamId: userInfo.team_id ?? teamId,
                  department:
                    userInfo.team_id != null
                      ? teamNameMap.get(Number(userInfo.team_id)) || String(userInfo.team_id)
                      : undefined,
                  cells: {} as Record<string, string>,
                };

              const dept =
                accum.teamId != null
                  ? teamNameMap.get(Number(accum.teamId)) || String(accum.teamId)
                  : accum.department || '-';

              const timeRange =
                d.startTime && d.startTime !== '-'
                  ? `${d.startTime}${d.endTime && d.endTime !== '-' ? `-${d.endTime}` : ' - 진행중'}`
                  : '';
              const totalStr =
                d.totalHours != null && d.totalMinutes != null
                  ? `${d.totalHours}h ${d.totalMinutes}m`
                  : '';
              const holiday = d.holidayName ? `[${d.holidayName}]` : '';

              const cellParts = [d.workType && d.workType !== '-' ? d.workType : '-', timeRange, totalStr, holiday]
                .map((v) => v || '')
                .filter((v) => v.trim() !== '')
                .join(' ');

              accum.department = dept;
              accum.cells[d.date] = cellParts || '-';

              userMap.set(userInfo.user_id, accum);
            });
        }

        const nextWeek = new Date(weekStart);
        nextWeek.setDate(weekStart.getDate() + 7);
        weekStart = nextWeek;
      }
    }

    const rows: (string | number)[][] = [];
    rows.push(['월', `${year}-${String(monthIndex + 1).padStart(2, '0')}`]);
    rows.push(['생성 시각', new Date().toLocaleString()]);
    rows.push([]);

    const dayHeaders = dayKeys.map((k) => {
      const d = new Date(k);
      const dow = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
      return `${k}(${dow})`;
    });
    rows.push(['부서', '이름', ...dayHeaders]);

    if (userMap.size === 0) {
      rows.push(['데이터가 없습니다.']);
      return rows;
    }

    const screenOrder = workingList.map((w) => w.id);
    const sortedUsers = Array.from(userMap.values()).sort((a, b) => {
      const idxA = screenOrder.indexOf(a.id);
      const idxB = screenOrder.indexOf(b.id);
      if (idxA !== -1 || idxB !== -1) {
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
      }
      const depA = (a.department || '').toString();
      const depB = (b.department || '').toString();
      if (depA !== depB) return depA.localeCompare(depB, 'ko');
      return a.name.localeCompare(b.name, 'ko');
    });

    sortedUsers.forEach((u) => {
      const row = [
        u.department || '-',
        u.name || '-',
        ...dayKeys.map((k) => u.cells[k] || '-'),
      ];
      rows.push(row);
    });

    return rows;
  };

  const downloadExcel = async () => {
    if (selectedMonths.length === 0) return;
    setIsDownloading(true);

    const workbook = XLSX.utils.book_new();
    for (const monthLabel of selectedMonths) {
      const monthIndex = Math.max(0, Math.min(11, parseInt(monthLabel.replace('월', ''), 10) - 1));
      const rows = await buildMonthSheetRows(monthIndex);
      const worksheet = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(workbook, worksheet, monthLabel);
    }

    XLSX.writeFile(workbook, `근무_${selectedMonths.join('_')}.xlsx`);
    setExcelDialogOpen(false);
    setSelectedMonths([]);
    setIsDownloading(false);
  };

  // 셀렉트 옵션 설정
  const selectConfigs: SelectConfig[] = useMemo(() => {
    // 팀 선택 (다중 선택 가능, 알파벳순 정렬)
    const sortedTeams = [...teams].sort((a, b) => 
      a.team_name.localeCompare(b.team_name, 'ko')
    );

    return [{
      id: 'teams',
      placeholder: '팀 선택',
      options: sortedTeams.map(team => ({
        value: String(team.team_id),
        label: team.team_name
      })),
      value: selectedTeams,
      searchable: true,
      hideSelectAll: false,
      autoSize: true,
    }];
  }, [teams, selectedTeams]);

  // Manager/Admin 페이지에서만 팀 목록 로드
  useEffect(() => {
    if (page === 'manager' || page === 'admin') {
      // page나 user가 변경되면 리셋
      teamsLoadedRef.current = false;
      loadTeams();
    }
  }, [user, page]);

  // 날짜 네비게이션 핸들러
  const handleNavigate = (action: 'PREV' | 'NEXT' | 'TODAY') => {
    const newDate = new Date(currentDate);
    switch (action) {
      case 'PREV':
        newDate.setDate(newDate.getDate() - 7); // 일주일 전으로
        break;
      case 'NEXT':
        newDate.setDate(newDate.getDate() + 7); // 일주일 후로
        break;
      case 'TODAY':
        newDate.setTime(Date.now());
        break;
    }
    onDateChange(newDate);
  };

  // 주간 날짜 범위 표시 형식 (월요일 ~ 일요일)
  const formatWeekDisplay = (date: Date) => {
    // 해당 주의 월요일 구하기
    const dayOfWeek = date.getDay();
    const monday = new Date(date);
    // 일요일(0)인 경우 -6일, 나머지는 -(dayOfWeek-1)일
    const daysToMonday = dayOfWeek === 0 ? -6 : -(dayOfWeek - 1);
    monday.setDate(date.getDate() + daysToMonday);
    
    // 해당 주의 일요일 구하기 (월요일 + 6일)
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const day = d.getDate();
      return `${year}년 ${month}월 ${day}일`;
    };
    
    return `${formatDate(monday)} - ${formatDate(sunday)}`;
  };

  return (
    <div className="w-full flex items-center justify-between mb-5 relative">
      
      {/* 왼쪽: 팀 필터 (Manager/Admin 페이지에서만 표시) */}
      {showTeamSelect && (page === 'manager' || page === 'admin') && (
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex items-center gap-2">
              {selectConfigs.map((config) => (
                <MultiSelect
                  simpleSelect={true}
                  key={config.id}
                  options={config.options}
                  onValueChange={(value) => handleSelectChange(config.id, value)}
                  defaultValue={config.value || []}
                  placeholder={config.placeholder}
                  size="sm"
                  maxCount={2}
                  searchable={config.searchable}
                  hideSelectAll={config.hideSelectAll}
                  autoSize={config.autoSize}
                  className="min-w-[120px]! w-auto! max-w-[200px]! multi-select"
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 중앙: 현재 날짜 표시 */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-5">
        <Button
          onClick={() => handleNavigate('PREV')}
          variant="ghost"
          size="icon"
          className="p-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Button>

        <div className="text-xl font-semibold text-gray-950 px-2">
          {formatWeekDisplay(currentDate)}
        </div>

        <Button
          onClick={() => handleNavigate('NEXT')}
          variant="ghost"
          size="icon"
          className="p-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>

      {/* 오른쪽: 뷰 변경 버튼들 */}
      <div className="flex items-center gap-1 float-right ml-auto">
        <Button
          onClick={() => handleNavigate('TODAY')}
          variant="outline"
          size="sm"
        >
          오늘
        </Button>
        <Dialog
          open={isExcelDialogOpen}
          onOpenChange={(open) => {
            setExcelDialogOpen(open);
            if (!open) setSelectedMonths([]);
          }}
        >
          <DialogTrigger asChild>
            <Button
              variant="default"
              size="sm"
            >
              Excel 다운로드
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>다운로드할 월 선택</DialogTitle>
              <DialogDescription>
                원하는 달을 모두 선택해 주세요. 해당 월(1일~말일)의 근태 데이터가 각 달 이름의 시트로 다운로드됩니다.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-3 gap-2">
              {monthOptions.map((month) => {
                const isSelected = selectedMonths.includes(month);
                return (
                  <RadioGroup
                    key={month}
                    value={isSelected ? month : ''}
                  >
                    <RadioButton
                      value={month}
                      label={month}
                      variant="dynamic"
                      size="md"
                      iconHide
                      className="justify-center"
                      onClick={(e) => {
                        e.preventDefault();
                        toggleMonthSelection(month);
                      }}
                    />
                  </RadioGroup>
                );
              })}
            </div>
            <div className="flex justify-between items-center pt-4">
              <span className="text-xs text-gray-500">필요한 달을 모두 선택한 뒤 다운로드하세요.</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setExcelDialogOpen(false)}>
                  취소
                </Button>
                <Button
                  size="sm"
                  onClick={downloadExcel}
                  disabled={selectedMonths.length === 0 || isDownloading}
                >
                  {isDownloading ? '다운로드 중...' : '다운로드하기'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
