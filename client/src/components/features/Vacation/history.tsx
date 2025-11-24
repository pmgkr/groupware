import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import EventViewDialog from '@/components/calendar/EventViewDialog';
import { useAuth } from '@/contexts/AuthContext';
import { MyVacationHistory as fetchMyVacationHistory, type MyVacationItem } from '@/api/mypage';
import { useToast } from '@/components/ui/use-toast';
import { AppPagination } from '@/components/ui/AppPagination';
import Overview from '@/components/features/Vacation/overview';

dayjs.locale('ko');

export interface MyVacationHistoryProps {}

export default function MyVacationHistory({}: MyVacationHistoryProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // 연도 state
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  
  // 데이터 state
  const [allData, setAllData] = useState<MyVacationItem[]>([]);
  const [loading, setLoading] = useState(false);

  // 페이지네이션 state (URL 파라미터와 동기화)
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
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
  
  // 일정 다이얼로그 state
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<MyVacationItem | null>(null);

  // 연도 변경 핸들러
  const handleYearChange = (year: string) => {
    const yearNum = parseInt(year);
    setSelectedYear(yearNum);
    // 페이지를 1로 리셋
    setPage(1);
  };

  // 데이터 조회 함수
  const fetchScheduleData = useCallback(async () => {
    if (!user?.user_id || !user?.team_id) {
      setAllData([]);
      return;
    }

    setLoading(true);
    try {
      const vacationData = await fetchMyVacationHistory(selectedYear);
      
      setAllData(vacationData);
      setLoading(false);
    } catch (error) {
      setAllData([]);
      setLoading(false);
    }
  }, [user?.user_id, user?.team_id, selectedYear]);

  // 데이터 조회
  useEffect(() => {
    fetchScheduleData();
  }, [fetchScheduleData]);

  // sch_id별로 그룹화된 데이터
  const groupedData = useMemo(() => {
    const groups = new Map<number, MyVacationItem[]>();
    
    allData.forEach(item => {
      if (!groups.has(item.sch_id)) {
        groups.set(item.sch_id, []);
      }
      groups.get(item.sch_id)!.push(item);
    });
    
    // 일반 항목과 취소 완료 항목을 함께 표시
    const result: Array<{ item: MyVacationItem; cancelledItem?: MyVacationItem }> = [];
    
    groups.forEach((items, schId) => {
      const mainItem = items.find(item => item.v_type !== 'cancel');
      const cancelledItem = items.find(item => item.v_type === 'cancel');
      
      // 일반 항목이 있으면 표시
      if (mainItem) {
        result.push({
          item: mainItem,
          cancelledItem: cancelledItem
        });
      }
    });
    
    // 승인일 기준으로 정렬 (최신순)
    result.sort((a, b) => {
      const dateA = dayjs(a.item.wdate);
      const dateB = dayjs(b.item.wdate);
      return dateB.diff(dateA);
    });
    
    return result;
  }, [allData]);

  // 페이지네이션 적용된 데이터
  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return groupedData.slice(startIndex, endIndex);
  }, [groupedData, page, pageSize]);

  // 페이지 변경 시 테이블을 맨 위로 스크롤
  const tableRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (tableRef.current && page > 1) {
      tableRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [page]);

  // 전체 데이터 개수 및 페이지 수
  const total = groupedData.length;
  const totalPages = Math.ceil(total / pageSize);

  // 일정 클릭 핸들러
  const handleEventClick = async (item: MyVacationItem) => {
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
    if (!selectedEvent?.sch_id) return;
    
    try {
      // API 호출 제거됨
      fetchScheduleData();
      handleCloseEventDialog();
    } catch (error) {
      throw error;
    }
  };

  // 취소 승인 핸들러 (매니저가 취소 승인)
  const handleApproveCancel = async () => {
    if (!selectedEvent?.sch_id) return;
    
    try {
      // API 호출 제거됨
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


  // 휴가 유형 텍스트 변환
  const getVacationTypeText = (vacationType?: string | null, vacationTime?: string | null) => {
    if (!vacationType) return '-';
    
    const baseType = {
      'day': '연차',
      'half': '반차',
      'quarter': '반반차',
      'official': '공가',
      'current': '기본연차',
      'carryover': '이월연차',
      'comp': '특별대휴',
      'long': '근속휴가',
      'cancel': '취소완료'
    }[vacationType] || vacationType;
    
    if ((vacationType === 'half' || vacationType === 'quarter') && vacationTime) {
      const timeText = vacationTime === 'morning' ? '오전' : '오후';
      return `${baseType}(${timeText})`;
    }
    
    return baseType;
  };

  return (
    <>
      <Overview onYearChange={handleYearChange} />

      <div ref={tableRef} className="w-full">
      <Table key={`table-${page}`} variant="primary" align="center" className="table-fixed w-full">
        <TableHeader>
          <TableRow className="[&_th]:text-[13px] [&_th]:font-medium">
            <TableHead className="w-[20%] text-center p-2">기간</TableHead>
            <TableHead className="w-[10%] text-center p-2">유형</TableHead>
            <TableHead className="w-[10%] text-center p-2">사용휴가일수</TableHead>
            <TableHead className="w-[15%] text-center p-2">승인일</TableHead>
            <TableHead className="w-[35%] text-center p-2">설명</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody key={`tbody-${page}`}>
        {loading ? (
          <TableRow>
            <TableCell className="h-100 text-gray-500 w-full" colSpan={5}>
              데이터 불러오는 중
            </TableCell>
          </TableRow>
        ) : !loading && paginatedData.length === 0 ? (
          <TableRow>
            <TableCell className="h-100 text-gray-500 w-full" colSpan={5}>
              데이터가 없습니다.
            </TableCell>
          </TableRow>
        ) : (
          paginatedData.flatMap((group, index) => {
            const hasCancelled = !!group.cancelledItem;
            const rows = [
              <TableRow 
                key={`${group.item.sch_id}-main-${index}`}
                className={`[&_td]:text-[13px] cursor-pointer ${
                  hasCancelled 
                    ? 'bg-gray-100 [&_td]:text-gray-500 border-0' 
                    : 'hover:bg--50'
                }`}
                onClick={() => handleEventClick(group.item)}
              >
                <TableCell className="text-gray-700! text-center p-2">{group.item.sdate} - {group.item.edate}</TableCell>
                <TableCell className="text-center p-2 pb-1">
                  {getVacationTypeText(group.item.v_type)}
                </TableCell>
                <TableCell className="text-center p-2">{group.item.v_count || '-'}</TableCell>
                <TableCell className="text-center p-2">{group.item.wdate ? dayjs(group.item.wdate).format('YYYY-MM-DD') : '-'}</TableCell>
                <TableCell className="text-left p-2">{group.item.remark || '-'}</TableCell>
              </TableRow>
            ];
            
            // 취소된 항목이 있으면 별도 행으로 표시
            if (group.cancelledItem) {
              rows.push(
                <TableRow 
                  key={`${group.cancelledItem.sch_id}-cancelled-${index}`}
                  className="[&_td]:text-[13px] cursor-pointer hover:bg-gray-50"
                  onClick={() => handleEventClick(group.cancelledItem!)}
                >
                  <TableCell className="text-center p-2"></TableCell>
                  <TableCell className="text-center p-2 text-red-500">
                    {getVacationTypeText(group.cancelledItem.v_type)}
                  </TableCell>
                  <TableCell className="text-center p-2">{group.cancelledItem.v_count || '-'}</TableCell>
                  <TableCell className="text-center p-2">{group.cancelledItem.wdate ? dayjs(group.cancelledItem.wdate).format('YYYY-MM-DD') : '-'}</TableCell>
                  <TableCell className="text-left p-2">{group.cancelledItem.remark || '-'}</TableCell>
                </TableRow>
              );
            }
            
            return rows;
          })
        )}
        </TableBody>
      </Table>
      </div>
      {total > 0 && (
        <div className="mt-5">
          <AppPagination 
            key={`pagination-${page}`}
            totalPages={totalPages} 
            initialPage={page} 
            visibleCount={10} 
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
            id: String(selectedEvent.sch_id),
            title: selectedEvent.remark || '',
            description: selectedEvent.remark || '',
            startDate: selectedEvent.sdate,
            endDate: selectedEvent.edate,
            startTime: '00:00:00',
            endTime: '00:00:00',
            allDay: true,
            category: 'vacation',
            eventType: getVacationTypeText(selectedEvent.v_type),
            author: user?.user_name || '-',
            userId: user?.user_id || '',
            teamId: user?.team_id || 0,
            status: '등록 완료',
            createdAt: selectedEvent.wdate
          }}
        />
      )}

    </>
  );
}
