import { useState, useEffect, useMemo } from 'react';
import dayjs from 'dayjs';
import { Button } from '@components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import WorkHoursBar from '@components/ui/WorkHoursBar';
import WorkingDetailDialog from '@/components/working/WorkingDetailDialog';
import OvertimeViewDialog from '@/components/working/OvertimeViewDialog';
import WorkTimeEditDialog from '@/components/working/WorkTimeEditDialog';
import { useAuth } from '@/contexts/AuthContext';
import { workingApi } from '@/api/working';
import { managerOvertimeApi } from '@/api/manager/overtime';
import { managerWorkingApi } from '@/api/manager/working';
import { Settings } from 'lucide-react';
import { getCachedHolidays } from '@/services/holidayApi';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { getWorkTypeColor } from '@/utils/workTypeHelper';
import { SortIcon } from '@/utils';

export interface DayWorkInfo {
  workType: string;
  workTypes?: Array<{
    type: string;
    createdAt: string;
  }>; // 여러 workType이 있을 경우 배열로 저장 (+뱃지 표시용)
  startTime?: string;
  endTime?: string;
  totalTime: string;
  hasOvertime?: boolean;
  overtimeId?: string;
  overtimeStatus?: string;
  holidayName?: string | null; // 공휴일 이름
}

export interface WorkingListItem {
  id: string;
  department: string;
  name: string;
  workResult: string;
  weeklyTotal: string;
  monday: DayWorkInfo;
  tuesday: DayWorkInfo;
  wednesday: DayWorkInfo;
  thursday: DayWorkInfo;
  friday: DayWorkInfo;
  saturday: DayWorkInfo;
  sunday: DayWorkInfo;
  note?: string;
}

export interface WorkingListProps {
  data?: WorkingListItem[];
  loading?: boolean;
  weekStartDate?: Date;
  page?: 'admin' | 'manager';
}

export default function WorkingList({ 
  data = [], 
  loading = false,
  weekStartDate,
  page
}: WorkingListProps) {
  const { user } = useAuth();
  
  // 체크박스 state
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [checkAll, setCheckAll] = useState(false);
  
  // 상세보기 다이얼로그 state
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);
  
  // 추가근무 다이얼로그 state
  const [isOvertimeDialogOpen, setIsOvertimeDialogOpen] = useState(false);
  const [selectedOvertime, setSelectedOvertime] = useState<{ userId: string; dayKey: string; overtimeId: string } | null>(null);
  const [overtimeDetailData, setOvertimeDetailData] = useState<any>(null);
  
  // 출퇴근 시간 수정 다이얼로그 state
  const [isWorkTimeEditDialogOpen, setIsWorkTimeEditDialogOpen] = useState(false);
  const [selectedWorkTime, setSelectedWorkTime] = useState<{ 
    userId: string; 
    userName: string;
    date: string; 
    startTime: string; 
    endTime: string;
    dayKey: string;
  } | null>(null);
  
  // 관리자 여부
  const isManager = user?.user_level === 'manager' || user?.user_level === 'admin';

  // 각 요일의 날짜 계산
  const getDayDate = (dayIndex: number) => {
    if (!weekStartDate) return '';
    return dayjs(weekStartDate).add(dayIndex, 'day').format('MM/DD');
  };

  // 각 요일의 공휴일 이름 가져오기
  const [holidayNames, setHolidayNames] = useState<(string | null)[]>([]);
  const [sortState, setSortState] = useState<{ key: string; order: 'asc' | 'desc' } | null>(null);

  useEffect(() => {
    const loadHolidayNames = async () => {
      if (!weekStartDate) return;

      // 이번 주에 포함된 연도만 추출 (연말/연초跨 가능)
      const dates = Array.from({ length: 7 }, (_, index) => dayjs(weekStartDate).add(index, 'day'));
      const years = Array.from(new Set(dates.map((d) => d.year())));

      // 연도별 공휴일을 한 번씩만 호출
      const holidaysByYear = await Promise.all(years.map((y) => getCachedHolidays(y)));
      const holidayMap = new Map<string, string>(); // YYYYMMDD -> name
      holidaysByYear.forEach((holidays) => {
        holidays.forEach((h) => {
          if (h.date && (h as any).dateName) {
            holidayMap.set(h.date, (h as any).dateName);
          } else if (h.locdate && (h as any).dateName) {
            holidayMap.set(String(h.locdate), (h as any).dateName);
          }
        });
      });

      const names = dates.map((d) => {
        const key = d.format('YYYYMMDD');
        return holidayMap.get(key) || null;
      });

      setHolidayNames(names);
    };

    loadHolidayNames();
  }, [weekStartDate]);

  // 날짜와 공휴일 이름을 함께 표시하는 함수
  const getDayDateWithHoliday = (dayIndex: number) => {
    const dateStr = getDayDate(dayIndex);
    const holidayName = holidayNames[dayIndex];
    
    if (holidayName) {
      return `${dateStr} ${holidayName}`;
    }
    return dateStr;
  };

  // 전체 선택
  const handleCheckAll = (checked: boolean) => {
    setCheckAll(checked);
    setCheckedItems(checked ? data.map((item) => item.id) : []);
  };

  // 개별 선택
  const handleCheckItem = (id: string, checked: boolean) => {
    setCheckedItems((prev) => (checked ? [...prev, id] : prev.filter((i) => i !== id)));
  };

  // 상세보기 버튼 클릭
  const handleViewDetail = (userId: string, userName: string) => {
    setSelectedUser({ id: userId, name: userName });
    setIsDetailDialogOpen(true);
  };

  // 다이얼로그 닫기
  const handleCloseDetailDialog = () => {
    setIsDetailDialogOpen(false);
    setSelectedUser(null);
  };

  // 추가근무 클릭 핸들러
  const handleOvertimeClick = async (userId: string, dayKey: string, overtimeId: string) => {
    setSelectedOvertime({ userId, dayKey, overtimeId });
    setIsOvertimeDialogOpen(true);
    
    // 추가근무 상세 정보 조회
    try {
      const detail = await managerOvertimeApi.getManagerOvertimeDetail(parseInt(overtimeId));
      setOvertimeDetailData(detail);
    } catch (error) {
      console.error('추가근무 상세 조회 실패:', error);
    }
  };

  // 추가근무 다이얼로그 닫기
  const handleCloseOvertimeDialog = () => {
    setIsOvertimeDialogOpen(false);
    setSelectedOvertime(null);
    setOvertimeDetailData(null);
  };

  // 추가근무 승인 핸들러
  const handleApproveOvertime = async () => {
    if (!selectedOvertime?.overtimeId) return;
    
    try {
      await managerOvertimeApi.approveOvertime(parseInt(selectedOvertime.overtimeId));
      // 데이터 새로고침을 위해 부모 컴포넌트에 알림 (나중에 구현)
      window.location.reload(); // 임시로 새로고침
    } catch (error) {
      console.error('승인 실패:', error);
      throw error;
    }
  };

  // 추가근무 반려 핸들러
  const handleRejectOvertime = async (reason: string) => {
    if (!selectedOvertime?.overtimeId) return;
    
    try {
      await managerOvertimeApi.rejectOvertime(parseInt(selectedOvertime.overtimeId), reason);
      // 데이터 새로고침을 위해 부모 컴포넌트에 알림 (나중에 구현)
      window.location.reload(); // 임시로 새로고침
    } catch (error) {
      console.error('반려 실패:', error);
      throw error;
    }
  };

  // 출퇴근 시간 수정 클릭 핸들러
  const handleWorkTimeEditClick = (userId: string, userName: string, dayKey: string, dayIndex: number, dayInfo: DayWorkInfo) => {
    if (!weekStartDate) return;
    
    const date = dayjs(weekStartDate).add(dayIndex, 'day').format('YYYY-MM-DD');
    setSelectedWorkTime({
      userId,
      userName,
      date,
      startTime: dayInfo.startTime || '',
      endTime: dayInfo.endTime || '',
      dayKey
    });
    setIsWorkTimeEditDialogOpen(true);
  };

  // 출퇴근 시간 수정 다이얼로그 닫기
  const handleCloseWorkTimeEditDialog = () => {
    setIsWorkTimeEditDialogOpen(false);
    setSelectedWorkTime(null);
  };

  // 출퇴근 시간 저장 핸들러
  const handleSaveWorkTime = async (startTime: string, endTime: string) => {
    if (!selectedWorkTime) return;
    
    try {
      const endpoint = page === 'admin' ? '/admin/wlog/update' : '/manager/wlog/update';
      console.log('✅ 출퇴근 시간 수정 요청:', {
        user_id: selectedWorkTime.userId,
        tdate: selectedWorkTime.date,
        stime: startTime ? `${startTime}:00` : '',
        etime: endTime ? `${endTime}:00` : '',
        endpoint
      });
      
      if (page === 'admin') {
        await managerWorkingApi.updateAdminWorkTime(
          selectedWorkTime.userId,
          selectedWorkTime.date,
          startTime,
          endTime
        );
      } else {
        await managerWorkingApi.updateWorkTime(
          selectedWorkTime.userId,
          selectedWorkTime.date,
          startTime,
          endTime
        );
      }
      
      console.log('✅ 출퇴근 시간 수정 성공!');
      // 데이터 새로고침
      window.location.reload();
    } catch (error: any) {
      console.error('❌ 출퇴근 시간 수정 실패:', error);
      console.error('에러 상세:', {
        message: error?.message,
        status: error?.status,
        response: error?.response
      });
      throw error;
    }
  };

  // 주간 누적 시간을 숫자로 변환 (예: "40h 30m" → 40.5)
  const parseWeeklyTotal = (weeklyTotal: string): number => {
    const match = weeklyTotal.match(/(\d+)h\s*(\d+)m/);
    if (!match) return 0;
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    return hours + minutes / 60;
  };

  const timeToMinutes = (t?: string) => {
    if (!t || t === '-' || !t.includes(':')) return Number.POSITIVE_INFINITY;
    const [h, m] = t.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return Number.POSITIVE_INFINITY;
    return h * 60 + m;
  };

  const getSortValue = (item: WorkingListItem, key: string) => {
    if (key === 'weekly') return parseWeeklyTotal(item.weeklyTotal);
    const dayMap: Record<string, keyof WorkingListItem> = {
      monday: 'monday',
      tuesday: 'tuesday',
      wednesday: 'wednesday',
      thursday: 'thursday',
      friday: 'friday',
      saturday: 'saturday',
      sunday: 'sunday',
    };
    const dayKey = dayMap[key];
    if (!dayKey) return 0;
    const dayInfo = item[dayKey] as DayWorkInfo;
    return timeToMinutes(dayInfo?.startTime);
  };

  const sortedData = useMemo(() => {
    if (!sortState) return data;
    const cloned = [...data];
    cloned.sort((a, b) => {
      const diff = getSortValue(a, sortState.key) - getSortValue(b, sortState.key);
      return sortState.order === 'asc' ? diff : -diff;
    });
    return cloned;
  }, [data, sortState]);

  const toggleSort = (key: string) => {
    setSortState((prev) => {
      if (!prev || prev.key !== key) return { key, order: 'desc' };
      if (prev.order === 'desc') return { key, order: 'asc' };
      return null;
    });
  };


  // 추가근무 도트 색상 함수
  const getOvertimeDotColor = (overtimeStatus?: string) => {
    switch (overtimeStatus) {
      case '승인대기': return { bg: 'bg-orange-500', ping: 'bg-orange-400' };
      case '승인완료': return { bg: 'bg-green-500', ping: 'bg-green-400' };
      case '취소완료': return { bg: 'bg-gray-400', ping: 'bg-gray-300' };
      default: return { bg: 'bg-orange-500', ping: 'bg-orange-400' };
    }
  };

  // 요일별 근무 정보 포맷팅
  const formatDayWork = (dayInfo: DayWorkInfo, userId: string, userName: string, dayKey: string, dayIndex: number) => {
    const dotColor = getOvertimeDotColor(dayInfo.overtimeStatus);
    const isPending = dayInfo.overtimeStatus === '승인대기';
    const hasWorkTime = dayInfo.startTime && dayInfo.startTime !== '-';

    // 근무 타입이 없을 때
    if (dayInfo.workType === '-') {
      // 추가근무가 있으면 표시 (승인대기 상태일 때만 도트 표시)
      if (dayInfo.hasOvertime) {
        return (
          <div className="flex flex-col gap-1">
            {/* 메인 배지 컨테이너 */}
            <span 
              className="h-[20px] inline-flex self-center px-2 py-0.5 text-xs font-semibold rounded-full relative bg-gray-50 text-gray-400 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => dayInfo.overtimeId && handleOvertimeClick(userId, dayKey, dayInfo.overtimeId)}
            >
              - {/* 첫 번째 "-" 텍스트 */}
              
              {/* 추가근무 알림 도트 - 승인대기 상태일 때만 표시 */}
              {isPending && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  {/* 애니메이션 */}
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dotColor.ping} opacity-75`}></span>
                  {/* 도트 */}
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${dotColor.bg} border border-white`}></span>
                </span>
              )}
            </span>              
            <span className="text-gray-400 h-[20px]">-</span>
            <span className="text-gray-400 h-[16px]">-</span>
          </div>
        );
      }
      
      // 추가근무도 없으면 관리자는 톱니바퀴만, 일반 사용자는 "-" 표시
      if (isManager) {
        return (
          <div className="flex flex-col gap-1">
            <span className="text-gray-400">-</span>
            <span className="text-gray-400">-</span>
            <div className="flex items-center justify-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleWorkTimeEditClick(userId, userName, dayKey, dayIndex, dayInfo);
                }}
                className="p-0.5 hover:bg-gray-200 rounded transition-colors"
                title="출퇴근시간 수정"
              >
                <Settings className="w-3 h-3 text-gray-500 cursor-pointer" />
              </button>
            </div>
          </div>
        );
      }
      
      return (
        <div className="flex flex-col gap-1">
          <span className="text-gray-400">-</span>
          <span className="text-gray-400">-</span>
          <span className="text-gray-400">-</span>
        </div>
      );
    }

    // workTypes 배열이 있고 여러 개인 경우
    const hasMultipleWorkTypes = dayInfo.workTypes && dayInfo.workTypes.length > 1;
    const latestWorkType = hasMultipleWorkTypes ? dayInfo.workTypes![0] : null;
    const otherWorkTypes = hasMultipleWorkTypes ? dayInfo.workTypes!.slice(1) : [];
    
    // 표시할 workType 결정
    const displayWorkType = hasMultipleWorkTypes ? latestWorkType!.type : dayInfo.workType;

    return (
      <div className="flex flex-col gap-1">
        <div className="inline-flex items-center gap-1 flex-wrap justify-center">
          <span 
            className={`inline-flex self-center px-2 py-0.5 text-xs font-semibold rounded-full relative ${getWorkTypeColor(displayWorkType)} ${dayInfo.hasOvertime ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
            onClick={() => dayInfo.hasOvertime && dayInfo.overtimeId && handleOvertimeClick(userId, dayKey, dayInfo.overtimeId)}
          >
            {displayWorkType}
            {/* 추가근무 알림 도트 - 승인대기 상태일 때만 표시 */}
            {isPending && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dotColor.ping} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${dotColor.bg} border border-white`}></span>
              </span>
            )}
          </span>
          {/* 이벤트가 여러개일 때 이벤트 목록 툴팁 노출 */}
          {hasMultipleWorkTypes && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="grayish" className="px-1 py-0 text-xs cursor-pointer">
                    +{otherWorkTypes.length}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="flex flex-col gap-1">
                    {dayInfo.workTypes!.map((wt, idx) => (
                      <div key={idx} className="text-sm">                                 
                        {wt.type}
                      </div>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <span className="text-sm font-medium">{dayInfo.totalTime}</span>
        {isManager ? (
          <div className="flex items-center justify-center gap-1">
            {hasWorkTime ? (
              <>
                <span className="text-xs text-gray-600">
                  {dayInfo.startTime}{dayInfo.endTime && dayInfo.endTime !== '-' ? ` - ${dayInfo.endTime}` : ' - 진행중'}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleWorkTimeEditClick(userId, userName, dayKey, dayIndex, dayInfo);
                  }}
                  className="p-0.5 hover:bg-gray-200 rounded transition-colors cursor-pointer"
                  title="출퇴근시간 수정"
                >
                  <Settings className="w-3 h-3 text-gray-500" />
                </button>
              </>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleWorkTimeEditClick(userId, userName, dayKey, dayIndex, dayInfo);
                }}
                className="p-0.5 hover:bg-gray-200 rounded transition-colors cursor-pointer"
                title="출퇴근시간 수정"
              >
                <Settings className="w-3 h-3 text-gray-500" />
              </button>
            )}
          </div>
        ) : (
          <span className="text-xs text-gray-600">
            {dayInfo.startTime ? `${dayInfo.startTime}${dayInfo.endTime ? ` - ${dayInfo.endTime}` : ' - 진행중'}` : '-'}
          </span>
        )}
      </div>
    );
  };

  return (
    <>
      <Table variant="primary" align="center" className="table-fixed">
        <TableHeader>
          <TableRow className="[&_th]:text-[13px] [&_th]:font-medium">
            <TableHead className="w-[8%] text-center p-0">부서</TableHead>
            <TableHead className="w-[6%]">이름</TableHead>
            <TableHead className="w-[15%]">
              <Button
                type="button"
                variant="svgIcon"
                className="h-full w-full gap-1 text-[13px] has-[>svg]:p-0"
                onClick={() => toggleSort('weekly')}
              >
                주간 누적시간
                <SortIcon order={sortState?.key === 'weekly' ? sortState.order : undefined} />
              </Button>
            </TableHead>
            <TableHead className="w-[8%]">
              <div className="flex flex-col">
                <span className={`text-sm ${holidayNames[0] ? 'text-red-600' : 'text-gray-800'}`}>{getDayDate(0)}(월)</span>
                {holidayNames[0] && <span className="text-xs text-red-600">{holidayNames[0]}</span>}
              </div>
            </TableHead>
            <TableHead className="w-[8%]">
              <div className="flex flex-col">
                <span className={`text-sm ${holidayNames[1] ? 'text-red-600' : 'text-gray-800'}`}>{getDayDate(1)}(화)</span>
                {holidayNames[1] && <span className="text-xs text-red-600">{holidayNames[1]}</span>}
              </div>
            </TableHead>
            <TableHead className="w-[8%]">
              <div className="flex flex-col">
                <span className={`text-sm ${holidayNames[2] ? 'text-red-600' : 'text-gray-800'}`}>{getDayDate(2)}(수)</span>
                {holidayNames[2] && <span className="text-xs text-red-600">{holidayNames[2]}</span>}
              </div>
            </TableHead>
            <TableHead className="w-[8%]">
              <div className="flex flex-col">
                <span className={`text-sm ${holidayNames[3] ? 'text-red-600' : 'text-gray-800'}`}>{getDayDate(3)}(목)</span>
                {holidayNames[3] && <span className="text-xs text-red-600">{holidayNames[3]}</span>}
              </div>
            </TableHead>
            <TableHead className="w-[8%]">
              <div className="flex flex-col">
                <span className={`text-sm ${holidayNames[4] ? 'text-red-600' : 'text-gray-800'}`}>{getDayDate(4)}(금)</span>
                {holidayNames[4] && <span className="text-xs text-red-600">{holidayNames[4]}</span>}
              </div>
            </TableHead>
            <TableHead className="w-[8%]">
              <div className="flex flex-col">
                <span className={`text-sm ${holidayNames[5] ? 'text-red-600' : 'text-gray-800'}`}>{getDayDate(5)}(토)</span>
                {holidayNames[5] && <span className="text-xs text-red-600">{holidayNames[5]}</span>}
              </div>
            </TableHead>
            <TableHead className="w-[8%]">
              <div className="flex flex-col">
                <span className={`text-sm ${holidayNames[6] ? 'text-red-600' : 'text-gray-800'}`}>{getDayDate(6)}(일)</span>
                {holidayNames[6] && <span className="text-xs text-red-600">{holidayNames[6]}</span>}
              </div>
            </TableHead>
            <TableHead className="w-[8%]">자세히 보기</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
        {loading ? (
          <TableRow>
            <TableCell className="h-100 text-gray-500" colSpan={11}>
              근태 데이터 불러오는 중
            </TableCell>
          </TableRow>
        ) : data.length === 0 ? (
          <TableRow>
            <TableCell className="h-100 text-gray-500" colSpan={11}>
              근태 데이터가 없습니다.
            </TableCell>
          </TableRow>
        ) : (
            sortedData.map((item) => (
              <TableRow key={item.id} className="[&_td]:text-[13px]">
                <TableCell className="text-center p-0">{item.department}</TableCell>
                <TableCell className="max-[1800px]:px-2">{item.name}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium">{item.weeklyTotal}</span>
                    <WorkHoursBar hours={parseWeeklyTotal(item.weeklyTotal)} className="w-full" hide40h={true} />
                  </div>
                </TableCell>
                <TableCell className="max-[1800px]:px-2">{formatDayWork(item.monday, item.id, item.name, 'monday', 0)}</TableCell>
                <TableCell className="max-[1800px]:px-2">{formatDayWork(item.tuesday, item.id, item.name, 'tuesday', 1)}</TableCell>
                <TableCell className="max-[1800px]:px-2">{formatDayWork(item.wednesday, item.id, item.name, 'wednesday', 2)}</TableCell>
                <TableCell className="max-[1800px]:px-2">{formatDayWork(item.thursday, item.id, item.name, 'thursday', 3)}</TableCell>
                <TableCell className="max-[1800px]:px-2">{formatDayWork(item.friday, item.id, item.name, 'friday', 4)}</TableCell>
                <TableCell className="max-[1800px]:px-2">{formatDayWork(item.saturday, item.id, item.name, 'saturday', 5)}</TableCell>
                <TableCell className="max-[1800px]:px-2">{formatDayWork(item.sunday, item.id, item.name, 'sunday', 6)}</TableCell>
                <TableCell className="max-[1800px]:px-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleViewDetail(item.id, item.name)}
                  >
                    보기
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      
      {/* 상세보기 다이얼로그 */}
      {selectedUser && weekStartDate && (
        <WorkingDetailDialog
          isOpen={isDetailDialogOpen}
          onClose={handleCloseDetailDialog}
          userId={selectedUser.id}
          userName={selectedUser.name}
          weekStartDate={weekStartDate}
        />
      )}

      {/* 추가근무 다이얼로그 */}
      {selectedOvertime && weekStartDate && (() => {
        const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const dayIndex = dayKeys.indexOf(selectedOvertime.dayKey);
        const selectedItem = data.find(item => item.id === selectedOvertime.userId);
        const selectedDayInfo = selectedItem?.[selectedOvertime.dayKey as keyof Pick<WorkingListItem, 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'>] as DayWorkInfo | undefined;
        const isOwnRequest = selectedOvertime.userId === user?.user_id;
        
        // API 응답 데이터를 모달 형식으로 변환
        const convertOvertimeData = () => {
          if (!overtimeDetailData?.info) return undefined;
          
          const info = overtimeDetailData.info;
          
          // ot_stime에서 시/분 추출 (출근 시간)
          let expectedStartHour = "";
          let expectedStartMinute = "";
          if (info.ot_stime) {
            const timeStr = info.ot_stime.includes('T') ? info.ot_stime.split('T')[1] : info.ot_stime;
            const timeParts = timeStr.split(':');
            expectedStartHour = timeParts[0];
            expectedStartMinute = timeParts[1];
          }
          
          // ot_etime에서 시/분 추출 (퇴근 시간)
          let expectedEndHour = "";
          let expectedEndMinute = "";
          if (info.ot_etime) {
            const timeStr = info.ot_etime.includes('T') ? info.ot_etime.split('T')[1] : info.ot_etime;
            const timeParts = timeStr.split(':');
            expectedEndHour = timeParts[0];
            expectedEndMinute = timeParts[1];
          }
          
          const hours = info.ot_hours ? parseFloat(info.ot_hours) : 0;
          
          return {
            expectedStartTime: expectedStartHour,
            expectedStartTimeMinute: expectedStartMinute,
            expectedEndTime: expectedEndHour,
            expectedEndMinute: expectedEndMinute,
            mealAllowance: info.ot_food === 'Y' ? 'yes' : 'no',
            transportationAllowance: info.ot_trans === 'Y' ? 'yes' : 'no',
            overtimeHours: String(Math.floor(hours)),
            overtimeMinutes: String(Math.round((hours % 1) * 60)),
            overtimeType: info.ot_reward === 'special' ? 'special_vacation' : 
                         info.ot_reward === 'annual' ? 'compensation_vacation' : 'event',
            clientName: info.ot_client || "",
            workDescription: info.ot_description || ""
          };
        };
        
        // 상태 매핑
        const mapStatus = (status: string) => {
          if (status === 'H') return '승인대기';
          if (status === 'T') return '승인완료';
          if (status === 'Y') return '보상완료';
          if (status === 'N') return '취소완료';
          return '신청하기';
        };
        
        return (
          <OvertimeViewDialog
            isOpen={isOvertimeDialogOpen}
            onClose={handleCloseOvertimeDialog}
            onCancel={async () => {
              if (selectedOvertime.overtimeId) {
                await workingApi.cancelOvertime(parseInt(selectedOvertime.overtimeId));
                window.location.reload();
              }
            }}
            onApprove={isManager && !isOwnRequest ? handleApproveOvertime : undefined}
            onReject={isManager && !isOwnRequest ? handleRejectOvertime : undefined}
            isManager={isManager}
            isOwnRequest={isOwnRequest}
            selectedDay={{
              date: dayjs(weekStartDate).add(dayIndex, 'day').format('YYYY-MM-DD'),
              dayOfWeek: ['월', '화', '수', '목', '금', '토', '일'][dayIndex],
              workType: (selectedDayInfo?.workType || '-') as "-" | "일반근무" | "외부근무" | "재택근무" | "연차" | "오전반차" | "오전반반차" | "오후반차" | "오후반반차" | "공가" | "공휴일",
              isHoliday: selectedDayInfo?.workType === '공휴일' ? true : undefined,
              holidayName: selectedDayInfo?.workType === '공휴일' ? selectedDayInfo?.holidayName || null : null,
              startTime: selectedDayInfo?.startTime || '-',
              endTime: selectedDayInfo?.endTime || '-',
              basicHours: 0,
              basicMinutes: 0,
              overtimeHours: 0,
              overtimeMinutes: 0,
              totalHours: 0,
              totalMinutes: 0,
              overtimeStatus: overtimeDetailData?.info ? mapStatus(overtimeDetailData.info.ot_status) : 
                            (selectedDayInfo?.overtimeStatus || '신청하기') as "신청하기" | "승인대기" | "승인완료" | "보상완료" | "취소완료" | "보상대기",
              overtimeData: convertOvertimeData()
            }}
          />
        );
      })()}

      {/* 출퇴근 시간 수정 다이얼로그 */}
      {selectedWorkTime && (
        <WorkTimeEditDialog
          isOpen={isWorkTimeEditDialogOpen}
          onClose={handleCloseWorkTimeEditDialog}
          onSave={handleSaveWorkTime}
          userName={selectedWorkTime.userName}
          date={selectedWorkTime.date}
          startTime={selectedWorkTime.startTime}
          endTime={selectedWorkTime.endTime}
        />
      )}
    </>
  );
}
