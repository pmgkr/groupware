import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import EventViewDialog from '@/components/calendar/EventViewDialog';
import { useAuth } from '@/contexts/AuthContext';
import { MyVacationHistory as fetchVacationHistory, type MyVacationItem as VacationItem } from '@/api/mypage/vacation';
import { adminVacationApi } from '@/api/admin/vacation';
import { useToast } from '@/components/ui/use-toast';
import { AppPagination } from '@/components/ui/AppPagination';

dayjs.locale('ko');

export interface VacationHistoryProps {
  userId?: string;
  year?: number;
}

export default function VacationHistory({ userId, year }: VacationHistoryProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // 연도 state - props로 받거나 기본값 사용
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(year || currentYear);
  
  // userId가 변경되면 selectedYear도 업데이트
  useEffect(() => {
    if (year !== undefined) {
      setSelectedYear(year);
    }
  }, [year]);
  
  // userId가 변경되면 데이터 초기화
  useEffect(() => {
    if (userId) {
      setAllData([]);
    }
  }, [userId]);
  
  // 데이터 state
  const [allData, setAllData] = useState<VacationItem[]>([]);
  const [loading, setLoading] = useState(false);

  // 페이지네이션 state (URL 파라미터와 동기화)
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const pageSize = 15;
  
  // userId가 props로 전달되면 Admin API 사용, 없으면 VacationHistory API 사용
  const isAdminView = !!userId;

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
  const [selectedEvent, setSelectedEvent] = useState<VacationItem | null>(null);
  const [selectedCancelledItem, setSelectedCancelledItem] = useState<VacationItem | null>(null);

  // 데이터 조회 함수
  const fetchScheduleData = useCallback(async () => {
    // userId가 props로 전달되면 해당 유저의 데이터를 조회, 없으면 현재 로그인한 유저의 데이터 조회
    const targetUserId = userId || user?.user_id;
    
    if (!targetUserId) {
      setAllData([]);
      return;
    }

    setLoading(true);
    try {
      let vacationData: VacationItem[];
      
      if (isAdminView) {
        // Admin API 사용: /admin/vacation/info - 모든 페이지를 순회해서 데이터 가져오기
        vacationData = [];
        let currentPage = 1;
        const fetchSize = 100; // 한 번에 가져올 데이터 수
        let hasMore = true;
        
        while (hasMore) {
          const response = await adminVacationApi.getVacationInfo(targetUserId, selectedYear, currentPage, fetchSize);
          const pageData = (response.body || []).map(item => ({
            sch_id: item.sch_id,
            v_year: item.v_year,
            v_type: item.v_type,
            v_count: item.v_count,
            sdate: item.sdate,
            edate: item.edate,
            remark: item.remark,
            wdate: item.wdate
          }));
          
          vacationData = [...vacationData, ...pageData];
          
          // footer 정보로 다음 페이지가 있는지 확인
          if (response.footer) {
            const total = response.footer.total || 0;
            const fetched = vacationData.length;
            hasMore = fetched < total;
          } else {
            // footer가 없으면 현재 페이지에 데이터가 없으면 종료
            hasMore = pageData.length > 0;
          }
          
          currentPage++;
          
          // 무한 루프 방지 (최대 100페이지까지만)
          if (currentPage > 100) {
            break;
          }
        }
      } else {
        // VacationHistory API 사용
        vacationData = await fetchVacationHistory(selectedYear);
      }
      
      setAllData(vacationData);
      setLoading(false);
    } catch (error) {
      console.error('휴가 이력 로드 실패:', error);
      setAllData([]);
      setLoading(false);
    }
  }, [userId, user?.user_id, selectedYear, page, pageSize, isAdminView]);

  // 데이터 조회
  useEffect(() => {
    fetchScheduleData();
  }, [fetchScheduleData]);

  // 원본 항목과 취소된 항목을 그룹핑
  const groupedData = useMemo(() => {
    const result: Array<{ item: VacationItem; cancelledItem?: VacationItem }> = [];
    const processedIds = new Set<number>();
    
    // 모든 항목을 순회하면서 원본과 취소 항목을 매칭
    allData.forEach(item => {
      // 이미 처리된 항목은 건너뛰기
      if (processedIds.has(item.sch_id)) {
        return;
      }
      
      // 취소 완료된 항목인 경우 (sch_status === 'N' 또는 v_type === 'cancel')
      const isCancelled = item.sch_status === 'N' || item.v_type === 'cancel';
      
      if (isCancelled) {
        // 같은 sch_id를 가진 원본 항목 찾기
        let originalItem = allData.find(
          other => other.sch_id === item.sch_id && 
                   other.sch_status !== 'N' &&
                   other.v_type !== 'cancel' &&
                   other !== item
        );
        
        // sch_id로 찾지 못한 경우, 같은 기간과 유형을 가진 원본 항목 찾기
        if (!originalItem) {
          originalItem = allData.find(
            other => other.sdate === item.sdate &&
                     other.edate === item.edate &&
                     other.v_type !== 'cancel' &&
                     other.sch_status !== 'N' &&
                     other !== item &&
                     !processedIds.has(other.sch_id)
          );
        }
        
        if (originalItem) {
          // 원본 항목과 취소 항목을 함께 표시
          result.push({
            item: originalItem,
            cancelledItem: item
          });
          processedIds.add(item.sch_id);
          processedIds.add(originalItem.sch_id);
        } else {
          // 원본 항목을 찾지 못한 경우 취소 항목만 표시
          result.push({
            item: item,
            cancelledItem: undefined
          });
          processedIds.add(item.sch_id);
        }
      } else {
        // 원본 항목인 경우
        // 같은 sch_id를 가진 취소 항목 찾기
        let cancelledItem = allData.find(
          other => other.sch_id === item.sch_id && 
                   (other.sch_status === 'N' || other.v_type === 'cancel') &&
                   other !== item
        );
        
        // sch_id로 찾지 못한 경우, 같은 기간과 유형을 가진 취소 항목 찾기
        if (!cancelledItem) {
          cancelledItem = allData.find(
            other => other.sdate === item.sdate &&
                     other.edate === item.edate &&
                     (other.sch_status === 'N' || other.v_type === 'cancel') &&
                     other !== item &&
                     !processedIds.has(other.sch_id)
          );
        }
        
        if (cancelledItem) {
          // 원본 항목과 취소 항목을 함께 표시
          result.push({
            item: item,
            cancelledItem: cancelledItem
          });
          processedIds.add(item.sch_id);
          processedIds.add(cancelledItem.sch_id);
        } else {
          // 취소 항목이 없는 경우 원본만 표시
          result.push({
            item: item,
            cancelledItem: undefined
          });
          processedIds.add(item.sch_id);
        }
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

  // sch_status를 상태 텍스트로 변환하는 함수
  const getScheduleStatusText = (schStatus?: string): "등록 완료" | "취소 요청됨" | "취소 완료" => {
    if (!schStatus) return '등록 완료';
    if (schStatus === 'Y') return '등록 완료';
    if (schStatus === 'H') return '취소 요청됨';
    if (schStatus === 'N') return '취소 완료';
    return '등록 완료';
  };

  // 일정 클릭 핸들러
  const handleEventClick = async (item: VacationItem, cancelledItem?: VacationItem) => {
    setSelectedEvent(item);
    setSelectedCancelledItem(cancelledItem || null);
    setIsEventDialogOpen(true);
  };

  // 일정 다이얼로그 닫기
  const handleCloseEventDialog = () => {
    setIsEventDialogOpen(false);
    setSelectedEvent(null);
    setSelectedCancelledItem(null);
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
      <div ref={tableRef} className="w-full">
      <Table key={`table-${page}`} variant="primary" align="center" className="table-fixed w-full">
        <TableHeader>
          <TableRow className="[&_th]:text-[13px] [&_th]:font-medium">
            <TableHead className="w-[20%] text-center p-2">기간</TableHead>
            <TableHead className="w-[10%] text-center p-2">유형</TableHead>
            <TableHead className="w-[10%] text-center p-2">휴가일수</TableHead>
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
          paginatedData.map((group, index) => {
            const hasCancelled = !!group.cancelledItem;
            
            return (
              <TableRow 
                key={`${group.item.sch_id}-${index}`}
                className={`[&_td]:text-[13px] cursor-pointer ${
                  hasCancelled 
                    // ? ' [&_td]:text-gray-400' 
                    ? 'opacity-40' 
                    : ''
                }`}
                onClick={() => handleEventClick(group.item, group.cancelledItem)}
              >
                <TableCell className="text-center p-2">{group.item.sdate} - {group.item.edate}</TableCell>
                <TableCell className="text-center p-2">
                  <div className="flex flex-col gap-0.5">
                    <span>{getVacationTypeText(group.item.v_type)}</span>
                    {hasCancelled && (
                      <span className="text-red-500">
                        {getVacationTypeText(group.cancelledItem!.v_type)}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center p-2">
                  <div className="flex flex-col gap-0.5">
                    <span>{group.item.v_count || '-'}</span>
                    {hasCancelled && (
                      <span className="text-gray-800">{group.cancelledItem!.v_count || '-'}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center p-2">
                  <div className="flex flex-col gap-0.5">
                    <span>{group.item.wdate ? dayjs(group.item.wdate).format('YYYY-MM-DD') : '-'}</span>
                    {hasCancelled && (
                      <span className="text-gray-800">{group.cancelledItem!.wdate ? dayjs(group.cancelledItem!.wdate).format('YYYY-MM-DD') : '-'}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-left p-2">
                  <div className="flex flex-col gap-0.5">
                    <span>{group.item.remark || '-'}</span>
                    {hasCancelled && (
                      <span className="text-gray-800">{group.cancelledItem!.remark || '-'}</span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
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
            title: getVacationTypeText(selectedEvent.v_type) || '',
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
            status: selectedCancelledItem 
              ? '취소 완료' 
              : getScheduleStatusText(selectedEvent.sch_status),
            createdAt: selectedEvent.wdate
          }}
        />
      )}

    </>
  );
}
