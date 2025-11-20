import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import EventViewDialog from '@/components/calendar/EventViewDialog';
import { useAuth } from '@/contexts/AuthContext';
import { scheduleApi, type Schedule } from '@/api/calendar';
import { getTeams } from '@/api/teams';
import { getMemberList } from '@/api/common/team';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import type { VacationFilters } from '@/components/features/Vacation/toolbar';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { AppPagination } from '@/components/ui/AppPagination';

dayjs.locale('ko');

// 시간 문자열에서 HH:mm 추출 (ISO timestamp 또는 HH:mm:ss -> HH:mm)
const formatTime = (timeStr: string) => {
  if (!timeStr) return '-';
  
  if (timeStr.includes('T')) {
    const timePart = timeStr.split('T')[1];
    const parts = timePart.split(':');
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}`;
    }
    return timePart;
  }
  
  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]}`;
  }
  
  return timeStr;
};

export interface VacationListProps {
  teamIds?: number[];
  activeTab?: 'vacation' | 'event';
  filters?: VacationFilters;
  onCheckedItemsChange?: (items: number[]) => void;
}

export default function VacationList({ 
  teamIds = [],
  activeTab = 'vacation',
  filters = {},
  onCheckedItemsChange = () => {}
}: VacationListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // 데이터 state
  const [allData, setAllData] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);

  // 페이지네이션 state (URL 파라미터와 동기화)
  const [searchParams, setSearchParams] = useSearchParams();
  const urlPage = Number(searchParams.get('page')) || 1;
  const [page, setPage] = useState(urlPage);
  const pageSize = 15;

  // URL 파라미터와 page state 동기화 (초기 로드 시에만)
  useEffect(() => {
    const urlPageValue = Number(searchParams.get('page')) || 1;
    if (urlPageValue !== page) {
      setPage(urlPageValue);
    }
  }, []);

  // page 변경 시 URL 파라미터 업데이트
  useEffect(() => {
    const currentUrlPage = Number(searchParams.get('page')) || 1;
    if (currentUrlPage !== page) {
      const newParams = new URLSearchParams(searchParams);
      if (page === 1) {
        newParams.delete('page');
      } else {
        newParams.set('page', String(page));
      }
      setSearchParams(newParams, { replace: true });
    }
  }, [page, searchParams, setSearchParams]);
  
  // 팀 목록 state
  const [teams, setTeams] = useState<{ team_id: number; team_name: string }[]>([]);
  
  // 체크박스 state
  const [checkedItems, setCheckedItems] = useState<number[]>([]);
  const [checkAll, setCheckAll] = useState(false);
  
  // 일정 다이얼로그 state
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Schedule | null>(null);
  
  // 일괄 승인 확인 모달 state
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [approveCount, setApproveCount] = useState(0);
  
  // 관리자 여부
  const isManager = user?.user_level === 'manager' || user?.user_level === 'admin';

  // 팀 목록 로드
  useEffect(() => {
    const loadTeams = async () => {
      try {
        const teamList = await getTeams({});
        setTeams(teamList.map(t => ({ team_id: t.team_id, team_name: t.team_name })));
      } catch (error) {
      }
    };
    loadTeams();
  }, []);

  // 현재 요청 추적을 위한 ref (탭 변경 시 이전 요청 취소용)
  const currentRequestRef = useRef<string | null>(null);

  // 데이터 조회 함수 (useCallback으로 메모이제이션)
  const fetchScheduleData = useCallback(async () => {
    // 현재 요청 ID 생성 (탭 + 타임스탬프)
    const requestId = `${activeTab}-${Date.now()}`;
    currentRequestRef.current = requestId;
    
    setLoading(true);
    // 기존 데이터 초기화 (탭 변경 시 이전 데이터가 남지 않도록)
    setAllData([]);
    
    try {
      const year = filters.year ? parseInt(filters.year) : new Date().getFullYear();
      const currentTab = activeTab; // 클로저 문제 방지를 위해 로컬 변수에 저장
      
      // 근태 관리와 동일한 로직: teamIds가 있으면 사용, 없으면 user.team_id 사용
      let teamIdsToQuery: number[] = [];
      
      if (teamIds.length > 0) {
        teamIdsToQuery = teamIds;
      } else if (user?.user_level === 'manager') {
        // manager인 경우: /manager/myteam으로 관리하는 모든 팀 조회
        try {
          const { workingApi } = await import('@/api/working');
          const myTeamResponse = await workingApi.getMyTeamList();
          teamIdsToQuery = (myTeamResponse.items || []).map(team => team.team_id);
        } catch (error) {
          // 실패 시 user.team_id 사용
          if (user?.team_id) {
            teamIdsToQuery = [user.team_id];
          }
        }
      } else if (user?.team_id) {
        // 일반 사용자 또는 admin인 경우
        teamIdsToQuery = [user.team_id];
      }
      
      if (teamIdsToQuery.length === 0) {
        // 요청이 취소되었는지 확인
        if (currentRequestRef.current !== requestId) return;
        setAllData([]);
        setLoading(false);
        return;
      }
      
      // 각 팀의 멤버 목록 가져오기
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
      
      // 각 팀원의 user_id로 스케줄 조회
      const allSchedules: Schedule[] = [];
      
      // 1월부터 12월까지 병렬로 조회 (성능 개선)
      const monthPromises = Array.from({ length: 12 }, (_, i) => i + 1).map(async (month) => {
        try {
          // 각 팀원별로 스케줄 조회 (currentTab에 따라 sch_type 필터링)
          const schedulePromises = teamMembers.map(member =>
            scheduleApi.getSchedules({
              year,
              month,
              user_id: member.user_id,
              sch_type: currentTab === 'vacation' ? 'vacation' : 'event'
            }).catch(() => null)
          );
          
          const scheduleResponses = await Promise.all(schedulePromises);
          const monthSchedules: Schedule[] = [];
          
          scheduleResponses.forEach((apiResponse: any) => {
            if (!apiResponse) return;
            
            // API 응답에서 실제 스케줄 배열 추출
            let schedules: any[] = [];
            if (Array.isArray(apiResponse)) {
              schedules = apiResponse;
            } else if (Array.isArray(apiResponse?.items)) {
              schedules = apiResponse.items;
            } else if (apiResponse?.items?.items && Array.isArray(apiResponse.items.items)) {
              schedules = apiResponse.items.items;
            }
            
            if (Array.isArray(schedules) && schedules.length > 0) {
              // null이 아니고 날짜가 있으며, currentTab에 맞는 sch_type만 필터링
              const validSchedules = schedules.filter((schedule: any) => 
                schedule !== null && 
                schedule.sch_sdate &&
                schedule.sch_type === (currentTab === 'vacation' ? 'vacation' : 'event')
              );
              monthSchedules.push(...validSchedules);
            }
          });
          
          return monthSchedules;
        } catch (error) {
          // 해당 월 데이터가 없으면 빈 배열 반환
          return [];
        }
      });
      
      // 모든 월의 데이터를 병렬로 가져옴
      const monthResults = await Promise.all(monthPromises);
      monthResults.forEach(monthSchedules => {
        allSchedules.push(...monthSchedules);
      });
      
      // 요청이 취소되었는지 최종 확인 (데이터 저장 직전에만 확인)
      if (currentRequestRef.current !== requestId) {
        setLoading(false);
        return;
      }
      
      // 현재 활성 탭과 일치하는지 최종 확인
      if (activeTab !== currentTab) {
        setLoading(false);
        return;
      }
      
      // 최종 확인: 현재 활성 탭과 일치하는 데이터만 저장
      const finalSchedules = allSchedules.filter(schedule => 
        schedule.sch_type === (activeTab === 'vacation' ? 'vacation' : 'event')
      );
      
      // 전체 데이터 저장 (모든 필터링은 filteredData useMemo에서 처리)
      setAllData(finalSchedules);
    } catch (error) {
      // 요청이 취소되었는지 확인
      if (currentRequestRef.current !== requestId) {
        setLoading(false);
        return;
      }
      setAllData([]);
      setLoading(false);
    } finally {
      // 요청이 취소되었는지 확인하고 로딩 상태 해제
      if (currentRequestRef.current === requestId) {
        setLoading(false);
      } else {
        // 요청이 취소된 경우에도 로딩 상태 해제
        setLoading(false);
      }
    }
  }, [activeTab, filters.year, teamIds, user?.team_id, user?.user_level]);

  // 데이터 조회 (연도 변경 시에만 API 호출)
  useEffect(() => {
    fetchScheduleData();
  }, [fetchScheduleData]);

  // 필터링된 데이터
  const filteredData = useMemo(() => {
    let result = [...allData];
    
    // 팀 필터 (가장 먼저 적용)
    if (teamIds.length > 0) {
      result = result.filter(item => teamIds.includes(item.team_id));
    }
    
    // 탭 필터 (휴가 vs 이벤트)
    if (activeTab === 'vacation') {
      result = result.filter(item => item.sch_type === 'vacation');
    } else if (activeTab === 'event') {
      result = result.filter(item => item.sch_type === 'event');
    }
    
    // 연도 필터
    if (filters.year) {
      result = result.filter(item => {
        // sch_sdate에서 연도 추출 (YYYY-MM-DD 형식)
        if (item.sch_sdate) {
          const year = dayjs(item.sch_sdate).format('YYYY');
          return year === filters.year;
        }
        // sch_year 필드가 있으면 그것도 확인
        if (item.sch_year) {
          return String(item.sch_year) === filters.year;
        }
        return false;
      });
    }
    
    // 상태 필터 (H=취소요청됨, Y=승인완료, N=취소완료)
    if (filters.status && filters.status.length > 0) {
      result = result.filter(item => filters.status!.includes(item.sch_status));
    }
    
    // 휴가 유형 필터
    if (filters.vacationType && filters.vacationType.length > 0 && activeTab === 'vacation') {
      result = result.filter(item => {
        if (!item.sch_vacation_type) return false;
        return filters.vacationType!.includes(item.sch_vacation_type);
      });
    }
    
    // 이벤트 유형 필터
    if (filters.eventType && filters.eventType.length > 0 && activeTab === 'event') {
      result = result.filter(item => {
        if (!item.sch_event_type) return false;
        return filters.eventType!.includes(item.sch_event_type);
      });
    }
    
    // 정렬: 1) 승인대기 최우선, 2) 시작일 최근순
    result.sort((a, b) => {
      // 1. 승인대기(H)를 최우선으로
      if (a.sch_status === 'H' && b.sch_status !== 'H') return -1;
      if (a.sch_status !== 'H' && b.sch_status === 'H') return 1;
      
      // 2. 시작일(sch_sdate) 최근순 (내림차순)
      const dateA = a.sch_created_at ? new Date(a.sch_created_at).getTime() : 0;
      const dateB = b.sch_created_at ? new Date(b.sch_created_at).getTime() : 0;
      return dateB - dateA;
    });
    
    return result;
  }, [allData, teamIds, activeTab, filters]);

  // 페이지네이션 적용된 데이터
  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, page, pageSize]);

  // 페이지 변경 시 테이블을 맨 위로 스크롤
  const tableRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (tableRef.current && page > 1) {
      tableRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [page]);

  // 전체 데이터 개수 및 페이지 수
  const total = filteredData.length;
  const totalPages = Math.ceil(total / pageSize);

  // 탭 변경 시 데이터 초기화 및 첫 페이지로 이동
  useEffect(() => {
    setCheckedItems([]);
    setCheckAll(false);
    onCheckedItemsChange([]);
    setPage(1);
  }, [activeTab]);

  // 팀 필터 변경 시 첫 페이지로 이동
  useEffect(() => {
    setPage(1);
  }, [teamIds]);

  // 필터 변경 시 체크박스 초기화 및 첫 페이지로 이동
  useEffect(() => {
    setCheckedItems([]);
    setCheckAll(false);
    onCheckedItemsChange([]);
    setPage(1);
  }, [filters]);

  // 전체 선택 (현재 페이지의 반려됨, 승인완료 제외)
  const handleCheckAll = (checked: boolean) => {
    setCheckAll(checked);
    const newCheckedItems = checked 
      ? paginatedData.filter(item => item.sch_status !== 'N' && item.sch_status !== 'Y').map((item) => item.id) 
      : [];
    setCheckedItems(newCheckedItems);
    onCheckedItemsChange(newCheckedItems);
  };

  // 개별 선택
  const handleCheckItem = (id: number, checked: boolean) => {
    setCheckedItems((prev) => {
      const newItems = checked ? [...prev, id] : prev.filter((i) => i !== id);
      onCheckedItemsChange(newItems);
      return newItems;
    });
  };

  // 일정 클릭 핸들러
  const handleEventClick = async (item: Schedule) => {
    setSelectedEvent(item);
    setIsEventDialogOpen(true);
  };

  // 일정 다이얼로그 닫기
  const handleCloseEventDialog = () => {
    setIsEventDialogOpen(false);
    setSelectedEvent(null);
  };

  // 취소 요청 핸들러 (사용자가 취소 신청)
  const handleRequestCancel = async () => {
    if (!selectedEvent?.id) return;
    
    try {
      await scheduleApi.updateScheduleStatus(selectedEvent.id, 'H');
      fetchScheduleData();
      handleCloseEventDialog();
    } catch (error) {
      throw error;
    }
  };

  // 취소 승인 핸들러 (매니저가 취소 승인)
  const handleApproveCancel = async () => {
    if (!selectedEvent?.id) return;
    
    try {
      await scheduleApi.approveScheduleCancel(selectedEvent.id);
      fetchScheduleData();
      handleCloseEventDialog();
      toast({
        title: "취소 승인 완료",
        description: "일정 취소가 승인되었습니다.",
      });
    } catch (error) {
      toast({
        title: "승인 실패",
        description: "취소 승인 중 오류가 발생했습니다.",
        variant: "destructive",
      });
      throw error;
    }
  };

  // 일괄 승인 확인 모달 열기
  const handleApproveAllSchedule = () => {
    if (checkedItems.length === 0) return;
    setApproveCount(checkedItems.length);
    setIsConfirmDialogOpen(true);
  };

  // 실제 일괄 승인 처리 (취소 요청 승인)
  const handleConfirmApprove = async () => {
    const count = approveCount;
    try {
      // 모든 체크된 항목에 대해 취소 요청 승인 (관리자 API 사용)
      await Promise.all(
        checkedItems.map(id => scheduleApi.approveScheduleCancel(id))
      );
      
      setIsConfirmDialogOpen(false);
      
      toast({
        title: "취소 승인 완료",
        description: `${count}개의 일정 취소가 승인되었습니다.`,
      });
      
      // 체크박스 초기화 및 데이터 새로고침
      setCheckedItems([]);
      setCheckAll(false);
      onCheckedItemsChange([]);
      fetchScheduleData();
    } catch (error) {
      toast({
        title: "승인 실패",
        description: "일괄 승인 중 오류가 발생했습니다.",
        variant: "destructive",
      });
      setIsConfirmDialogOpen(false);
    }
  };

  // 일괄 승인 함수를 외부에 노출 (toolbar 버튼에서 호출)
  useEffect(() => {
    (window as any).__VacationApproveAll = handleApproveAllSchedule;
    return () => {
      delete (window as any).__VacationApproveAll;
    };
  }, [checkedItems]);

  // 상태 텍스트 변환
  const getStatusText = (status: string) => {
    switch (status) {
      case 'H': return '취소요청됨';
      case 'Y': return '승인완료';
      case 'N': return '취소완료';
      default: return status;
    }
  };

  // 휴가 유형 텍스트 변환
  const getVacationTypeText = (vacationType?: string | null, vacationTime?: string | null) => {
    if (!vacationType) return '-';
    
    const baseType = {
      'day': '연차',
      'half': '반차',
      'quarter': '반반차',
      'official': '공가'
    }[vacationType] || vacationType;
    
    if ((vacationType === 'half' || vacationType === 'quarter') && vacationTime) {
      const timeText = vacationTime === 'morning' ? '오전' : '오후';
      return `${baseType}(${timeText})`;
    }
    
    return baseType;
  };

  // 이벤트 유형 텍스트 변환
  const getEventTypeText = (eventType?: string | null) => {
    if (!eventType) return '-';
    
    return {
      'remote': '재택근무',
      'field': '외부근무',
      'etc': '기타'
    }[eventType] || eventType;
  };

  // 부서명 조회 (동기 함수)
  const getTeamName = (teamId: number) => {
    const team = teams.find(t => t.team_id === teamId);
    return team?.team_name || '-';
  };

  // 날짜 범위 포맷팅
  const getDateRangeText = (item: Schedule) => {
    const startDate = dayjs(item.sch_sdate);
    const endDate = dayjs(item.sch_edate);
    
    if (item.sch_isAllday === 'Y') {
      if (startDate.isSame(endDate, 'day')) {
        return startDate.format('YYYY-MM-DD (ddd)');
      } else {
        return `${startDate.format('YYYY-MM-DD (ddd)')} - ${endDate.format('YYYY-MM-DD (ddd)')} `;
      }
    } else {
      const startTime = formatTime(item.sch_stime);
      const endTime = formatTime(item.sch_etime);
      
      if (startDate.isSame(endDate, 'day')) {
        return `${startDate.format('YYYY-MM-DD (ddd)')}`;
        // return `${startDate.format('YYYY-MM-DD(ddd)')} ${startTime} - ${endTime}`;
      } else {
        return `${startDate.format('YYYY-MM-DD (ddd)')} ${startTime} - ${endDate.format('YYYY-MM-DD (ddd)')} ${endTime}`;
      }
    }
  };

  return (
    <>
      <div ref={tableRef}>
      <Table key={`table-${page}-${activeTab}`} variant="primary" align="center" className="table-fixed">
        <TableHeader>
          <TableRow className="[&_th]:text-[13px] [&_th]:font-medium">
            <TableHead className="w-[7%] text-center p-2">부서</TableHead>
            <TableHead className="w-[7%] text-center p-2">이름</TableHead>
            <TableHead className="w-[10%] text-center p-2">
              {activeTab === 'vacation' ? '휴가 유형' : '이벤트 유형'}
            </TableHead>
            <TableHead className="w-[20%] text-center p-2">기간</TableHead>
            {activeTab === 'vacation' && (
              <TableHead className="w-[20%] text-center p-2">사용휴가일수</TableHead>
            )}
            <TableHead className="w-[10%] text-center p-2">등록일</TableHead>
            <TableHead className="w-[8%] text-center p-2">상태</TableHead>
            <TableHead className="w-[5%] text-center p-2">
              <Checkbox 
                id="chk_all" 
                className={cn('mx-auto flex size-4 items-center justify-center bg-white leading-none', checkAll && 'bg-primary-blue-150')} 
                checked={checkAll} 
                onCheckedChange={handleCheckAll} 
              />
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody key={`tbody-${page}-${activeTab}`}>
        {loading ? (
          <TableRow>
            <TableCell className="h-100 text-gray-500" colSpan={8}>
              일정 데이터 불러오는 중
            </TableCell>
          </TableRow>
        ) : paginatedData.length === 0 ? (
          <TableRow>
            <TableCell className="h-100 text-gray-500" colSpan={8}>
              일정 데이터가 없습니다.
            </TableCell>
          </TableRow>
        ) : (
          paginatedData.map((item, index) => (
            <TableRow 
              key={`${item.id}-${item.sch_sdate}-${item.user_id}-${index}`}
              className="[&_td]:text-[13px] cursor-pointer hover:bg-gray-50"
              onClick={() => handleEventClick(item)}
            >
              <TableCell className="text-center p-2">{getTeamName(item.team_id)}</TableCell>
              <TableCell className="text-center p-2">{item.user_name || '-'}</TableCell>
              <TableCell className="text-center p-2">
                {activeTab === 'vacation' 
                  ? getVacationTypeText(item.sch_vacation_type, item.sch_vacation_time)
                  : getEventTypeText(item.sch_event_type)
                }
              </TableCell>
              <TableCell className="text-center p-2">{getDateRangeText(item)}</TableCell>
              {activeTab === 'vacation' && item.sch_vacation_used && (
                <TableCell className="text-center p-2">{item.sch_vacation_used}</TableCell>
              )}
              <TableCell className="text-center p-2">
                {item.sch_created_at ? dayjs(item.sch_created_at).format('YYYY-MM-DD') : '-'}
              </TableCell>
              <TableCell className="text-center p-2">
                {item.sch_status === 'H' && (
                  <Badge variant="default" size="table" title="취소요청됨">
                    {getStatusText(item.sch_status)}
                  </Badge>
                )}
                {item.sch_status === 'Y' && (
                  <Badge variant="outline" size="table" title="승인완료">
                    {getStatusText(item.sch_status)}
                  </Badge>
                )}
                {item.sch_status === 'N' && (
                  <Badge variant="grayish" size="table" title="취소완료">
                    {getStatusText(item.sch_status)}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-center p-2" onClick={(e) => e.stopPropagation()}>
                <Checkbox 
                  id={`chk_${item.id}`} 
                  className={cn('mx-auto flex size-4 items-center justify-center bg-white leading-none', checkedItems.includes(item.id) && 'bg-primary-blue-150')} 
                  checked={checkedItems.includes(item.id)} 
                  disabled={item.sch_status === 'N' || item.sch_status === 'Y'}
                  onCheckedChange={(checked) => handleCheckItem(item.id, checked as boolean)} 
                />
              </TableCell>
            </TableRow>
          ))
        )}
        </TableBody>
      </Table>
      </div>
      {total > 0 && (
        <div className="mt-5">
          <AppPagination 
            key={`pagination-${page}-${activeTab}`}
            totalPages={totalPages} 
            initialPage={page} 
            visibleCount={5} 
            onPageChange={(p) => {
              setPage(p);
            }} 
          />
        </div>
      )}

      {/* 일정 다이얼로그 */}
      {selectedEvent && (
        <EventViewDialog
          isOpen={isEventDialogOpen}
          onClose={handleCloseEventDialog}
          onRequestCancel={handleRequestCancel}
          onApproveCancel={handleApproveCancel}
          selectedEvent={{
            id: String(selectedEvent.id),
            title: selectedEvent.sch_title,
            description: selectedEvent.sch_description || '',
            startDate: selectedEvent.sch_sdate,
            endDate: selectedEvent.sch_edate,
            startTime: selectedEvent.sch_stime,
            endTime: selectedEvent.sch_etime,
            allDay: selectedEvent.sch_isAllday === 'Y',
            category: selectedEvent.sch_type,
            eventType: selectedEvent.sch_type === 'vacation' 
              ? getVacationTypeText(selectedEvent.sch_vacation_type, selectedEvent.sch_vacation_time)
              : getEventTypeText(selectedEvent.sch_event_type),
            author: selectedEvent.user_name || '-',
            userId: selectedEvent.user_id || '',
            teamId: selectedEvent.team_id,
            status: selectedEvent.sch_status === 'Y' ? '등록 완료' : selectedEvent.sch_status === 'H' ? '취소 요청됨' : '취소 완료',
            createdAt: selectedEvent.sch_created_at
          }}
        />
      )}

      {/* 일괄 취소 승인 확인 모달 */}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>취소 승인 확인</AlertDialogTitle>
            <AlertDialogDescription>
              {approveCount}개의 일정 취소 요청을 승인하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleConfirmApprove}>
              승인하기
            </AlertDialogAction>
            <AlertDialogCancel>닫기</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
