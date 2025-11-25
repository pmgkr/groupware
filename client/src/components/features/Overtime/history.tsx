import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import OvertimeViewDialog from '@/components/working/OvertimeViewDialog';
import { useAuth } from '@/contexts/AuthContext';
import { MyOvertimeHistory as fetchMyOvertimeHistory, type MyOvertimeItem } from '@/api/mypage';
import { workingApi } from '@/api/working';
import { useToast } from '@/components/ui/use-toast';
import { AppPagination } from '@/components/ui/AppPagination';
import { Badge } from '@/components/ui/badge';
import type { WorkData } from '@/types/working';
dayjs.locale('ko');

export interface MyOvertimeHistoryProps {
  activeTab?: 'weekday' | 'weekend';
  selectedYear?: number;
}

export default function MyOvertimeHistory({ activeTab = 'weekday', selectedYear = new Date().getFullYear() }: MyOvertimeHistoryProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // 데이터 state
  const [allData, setAllData] = useState<MyOvertimeItem[]>([]);
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
  
  // 추가근무 다이얼로그 state
  const [isOvertimeDialogOpen, setIsOvertimeDialogOpen] = useState(false);
  const [selectedOvertime, setSelectedOvertime] = useState<MyOvertimeItem | null>(null);

  // 연도 변경 시 페이지 리셋
  useEffect(() => {
    setPage(1);
  }, [selectedYear]);

  // 탭 변경 시 페이지 리셋
  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  // 데이터 조회 함수
  const fetchOvertimeData = useCallback(async () => {
    if (!user?.user_id) {
      setAllData([]);
      return;
    }

    setLoading(true);
    try {
      const overtimeData = await fetchMyOvertimeHistory(page, pageSize, selectedYear, user.user_id);
      setAllData(overtimeData.items || []);
      setLoading(false);
    } catch (error) {
      console.error('추가근무 내역 조회 실패:', error);
      setAllData([]);
      setLoading(false);
    }
  }, [user?.user_id, selectedYear, page, pageSize]);

  // 데이터 조회
  useEffect(() => {
    fetchOvertimeData();
  }, [fetchOvertimeData]);

  // 탭에 따라 필터링된 데이터
  const filteredData = useMemo(() => {
    let result = [...allData];
    
    // 탭 필터 (평일 추가근무 vs 휴일 근무)
    if (activeTab === 'weekday') {
      // 평일 추가근무: weekday
      result = result.filter(item => item.ot_type === 'weekday' || item.ot_type === 'week');
    } else if (activeTab === 'weekend') {
      // 휴일 근무: saturday, sunday, holiday
      result = result.filter(item => ['saturday', 'sunday', 'holiday', 'sat', 'sun'].includes(item.ot_type));
    }
    
    // 신청일 기준으로 정렬 (최신순)
    result.sort((a, b) => {
      const dateA = dayjs(a.ot_created_at);
      const dateB = dayjs(b.ot_created_at);
      return dateB.diff(dateA);
    });
    
    return result;
  }, [allData, activeTab]);

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

  // 시간 문자열에서 HH:mm 추출
  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '-';
    
    // ISO 형식인 경우
    if (timeStr.includes('T')) {
      const timePart = timeStr.split('T')[1];
      const parts = timePart.split(':');
      if (parts.length >= 2) {
        return `${parts[0]}:${parts[1]}`;
      }
      return timePart;
    }
    
    // HH:mm:ss 형식인 경우
    const parts = timeStr.split(':');
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}`;
    }
    
    return timeStr;
  };

  // MyOvertimeItem을 WorkData로 변환하는 함수
  const convertToWorkData = useCallback((item: MyOvertimeItem): WorkData => {
    // ot_etime에서 시/분 추출
    let expectedHour = "";
    let expectedMinute = "";
    if (item.ot_etime) {
      const timeStr = item.ot_etime.includes('T') ? item.ot_etime.split('T')[1] : item.ot_etime;
      const timeParts = timeStr.split(':');
      expectedHour = timeParts[0] || "";
      expectedMinute = timeParts[1] || "";
    }
    
    // ot_hours에서 시간/분 추출
    const hours = item.ot_hours ? parseFloat(item.ot_hours) : 0;
    const overtimeHours = String(Math.floor(hours));
    const overtimeMinutes = String(Math.round((hours % 1) * 60));
    
    // 상태 매핑
    const mapStatus = (status: string): WorkData['overtimeStatus'] => {
      if (status === 'H') return '승인대기';
      if (status === 'T') {
        return activeTab === 'weekday' ? '승인완료' : '보상대기';
      }
      if (status === 'N') return '반려됨';
      if (status === 'Y') return '승인완료';
      return '신청하기';
    };
    
    // 보상 방식 매핑
    const mapRewardType = (reward: string) => {
      if (reward === 'special') return 'special_vacation';
      if (reward === 'annual') return 'compensation_vacation';
      if (reward === 'pay') return 'event';
      return '';
    };
    
    // 요일 계산 (한국어 요일 배열 사용)
    const date = dayjs(item.ot_date);
    const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];
    const dayOfWeek = daysOfWeek[date.day()] as '월' | '화' | '수' | '목' | '금' | '토' | '일';
    
    return {
      date: item.ot_date,
      dayOfWeek: dayOfWeek,
      workType: '-',
      startTime: item.ot_stime ? formatTime(item.ot_stime) : '-',
      endTime: item.ot_etime ? formatTime(item.ot_etime) : '-',
      basicHours: 0,
      basicMinutes: 0,
      overtimeHours: 0,
      overtimeMinutes: 0,
      totalHours: 0,
      totalMinutes: 0,
      overtimeStatus: mapStatus(item.ot_status),
      overtimeId: item.id,
      overtimeData: {
        expectedEndTime: expectedHour,
        expectedEndMinute: expectedMinute,
        mealAllowance: item.ot_food === 'Y' ? 'yes' : 'no',
        transportationAllowance: item.ot_trans === 'Y' ? 'yes' : 'no',
        overtimeHours: overtimeHours,
        overtimeMinutes: overtimeMinutes,
        overtimeType: mapRewardType(item.ot_reward),
        clientName: item.ot_client || "",
        workDescription: item.ot_description || ""
      }
    };
  }, [activeTab]);

  // 추가근무 클릭 핸들러
  const handleOvertimeClick = async (item: MyOvertimeItem) => {
    setSelectedOvertime(item);
    setIsOvertimeDialogOpen(true);
  };

  // 추가근무 다이얼로그 닫기
  const handleCloseOvertimeDialog = () => {
    setIsOvertimeDialogOpen(false);
    setSelectedOvertime(null);
  };

  // 추가근무 취소 핸들러
  const handleCancelOvertime = async () => {
    if (!selectedOvertime?.id) return;
    
    try {
      await workingApi.cancelOvertime(selectedOvertime.id);
      fetchOvertimeData();
      handleCloseOvertimeDialog();
    } catch (error) {
      throw error;
    }
  };

  // 재신청 핸들러
  const handleReapplyOvertime = () => {
    // 재신청은 별도 페이지나 다이얼로그로 이동할 수 있음
    // 여기서는 다이얼로그만 닫기
    handleCloseOvertimeDialog();
  };

  // Y/N 텍스트 변환
  const getYNText = (value: string | null) => {
    if (!value) return '-';
    return value === 'Y' ? '사용' : '미사용';
  };

  // 시간 포맷팅 (소수점 -> 시간:분)
  const formatHours = (hours: string) => {
    const h = parseFloat(hours);
    if (isNaN(h)) return '-';
    const hourPart = Math.floor(h);
    const minutePart = Math.round((h - hourPart) * 60);
    return `${hourPart}시간 ${minutePart}분`;
  };

  // 보상 방식 텍스트 변환
  const getRewardText = (reward: string) => {
    switch (reward) {
      case 'special': return '특별대휴';
      case 'annual': return '보상휴가';
      case 'pay': return '수당지급';
      default: return reward;
    }
  };

  // 상태 텍스트 변환
  const getStatusText = (status: string) => {
    switch (status) {
      case 'H': return '승인대기';
      case 'T': return activeTab === 'weekday' ? '승인완료' : '보상대기';
      case 'Y': return '보상완료';
      case 'N': return '반려됨';
      default: return status;
    }
  };

  // 상태 색상 클래스
  const getStatusColorClass = (status: string) => {
    switch (status) {
      case 'H': return 'text-orange-600 font-semibold'; // 승인대기
      case 'T': return 'text-green-600 font-semibold'; // 승인완료
      case 'N': return 'text-red-600 font-semibold'; // 반려됨
      default: return 'text-gray-600';
    }
  };

  return (
    <>
      <div ref={tableRef} className="w-full">
      <Table key={`table-${page}`} variant="primary" align="center" className="table-fixed w-full">
        <TableHeader>
          <TableRow className="[&_th]:text-[13px] [&_th]:font-medium">
            <TableHead className="w-[10%] text-center p-2">추가근무날짜</TableHead>
            {activeTab === 'weekday' ? (
              <>
                <TableHead className="w-[8%] text-center p-2">예상퇴근시간</TableHead>
                <TableHead className="w-[8%] text-center p-2">식대</TableHead>
                <TableHead className="w-[8%] text-center p-2">교통비</TableHead>
              </>
            ) : (
              <>
                <TableHead className="w-[8%] text-center p-2">예상근무시간</TableHead>
                <TableHead className="w-[10%] text-center p-2">보상방식</TableHead>
              </>
            )}
            <TableHead className="w-[12%] text-center p-2">클라이언트명</TableHead>
            <TableHead className="w-[20%] text-center p-2">작업내용</TableHead>
            <TableHead className="w-[10%] text-center p-2">신청일</TableHead>
            <TableHead className="w-[10%] text-center p-2">상태</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody key={`tbody-${page}`}>
        {loading ? (
          <TableRow>
            <TableCell className="h-100 text-gray-500 w-full" colSpan={activeTab === 'weekday' ? 9 : 8}>
              데이터 불러오는 중
            </TableCell>
          </TableRow>
        ) : !loading && paginatedData.length === 0 ? (
          <TableRow>
            <TableCell className="h-100 text-gray-500 w-full" colSpan={activeTab === 'weekday' ? 9 : 8}>
              데이터가 없습니다.
            </TableCell>
          </TableRow>
        ) : (
          paginatedData.map((item, index) => (
            <TableRow 
              key={`${item.id}-${index}`}
              className="[&_td]:text-[13px] cursor-pointer hover:bg-gray-50"
              onClick={() => handleOvertimeClick(item)}
            >
              <TableCell className="text-center p-2">
                {item.ot_date ? dayjs(item.ot_date).format('YYYY-MM-DD (ddd)') : '-'}
              </TableCell>
              {activeTab === 'weekday' ? (
                <>
                  <TableCell className="text-center p-2">{formatTime(item.ot_etime)}</TableCell>
                  <TableCell className="text-center p-2">{getYNText(item.ot_food)}</TableCell>
                  <TableCell className="text-center p-2">{getYNText(item.ot_trans)}</TableCell>
                </>
              ) : (
                <>
                  <TableCell className="text-center p-2">{formatHours(item.ot_hours)}</TableCell>
                  <TableCell className="text-center p-2">{getRewardText(item.ot_reward)}</TableCell>
                </>
              )}
              <TableCell className="text-center p-2 whitespace-nowrap text-ellipsis overflow-hidden">{item.ot_client || '-'}</TableCell>
              <TableCell className="text-left p-2 whitespace-nowrap text-ellipsis overflow-hidden">{item.ot_description || '-'}</TableCell>
              <TableCell className="text-center p-2">
                {item.ot_created_at ? dayjs(item.ot_created_at).format('YYYY-MM-DD HH:mm:ss') : '-'}
              </TableCell>
              <TableCell className="text-center p-2">
                {item.ot_status === 'H' && (
                  <Badge variant="default" size="table" title="승인대기">
                    {getStatusText(item.ot_status)}
                  </Badge>
                )}
                {item.ot_status === 'T' && (
                  <Badge 
                    variant={activeTab === 'weekday' ? 'outline' : 'secondary'} 
                    size="table" 
                    title={activeTab === 'weekday' ? '승인완료' : '보상대기'}
                  >
                    {getStatusText(item.ot_status)}
                  </Badge>
                )}
                {item.ot_status === 'Y' && (
                  <Badge variant="outline" size="table" title="보상완료">
                    {getStatusText(item.ot_status)}
                  </Badge>
                )}
                {item.ot_status === 'N' && (
                  <Badge variant="grayish" size="table" title="반려됨">
                    {getStatusText(item.ot_status)}
                  </Badge>
                )}
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

      {/* 추가근무 다이얼로그 */}
      {selectedOvertime && (
        <OvertimeViewDialog
          isOpen={isOvertimeDialogOpen}
          onClose={handleCloseOvertimeDialog}
          onCancel={handleCancelOvertime}
          onReapply={handleReapplyOvertime}
          selectedDay={convertToWorkData(selectedOvertime)}
          isManager={false}
          isOwnRequest={true}
          activeTab={activeTab}
          user={user ? { user_level: user.user_level, team_id: user.team_id ?? undefined } : undefined}
        />
      )}

    </>
  );
}
