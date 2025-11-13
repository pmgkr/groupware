import { useState, useEffect, useMemo } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import OvertimeViewDialog from '@/components/working/OvertimeViewDialog';
import { useAuth } from '@/contexts/AuthContext';
import { workingApi } from '@/api/working';
import type { OvertimeItem } from '@/api/working';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { OvertimeFilters } from '@/components/features/Overtime/toolbar';

dayjs.locale('ko');

// 시간 문자열에서 HH:mm 추출 (ISO timestamp 또는 HH:mm:ss -> HH:mm)
const formatTime = (timeStr: string) => {
  if (!timeStr) return '-';
  
  // ISO 형식 (1970-01-01T20:15:00 또는 2025-10-28T20:15:00)인 경우
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

export interface OvertimeListProps {
  teamIds?: number[];
  activeTab?: 'weekday' | 'weekend';
  filters?: OvertimeFilters;
}

export default function OvertimeList({ 
  teamIds = [],
  activeTab = 'weekday',
  filters = {}
}: OvertimeListProps) {
  const { user } = useAuth();
  
  // 데이터 state
  const [allData, setAllData] = useState<OvertimeItem[]>([]);
  const [loading, setLoading] = useState(false);
  
  // 체크박스 state
  const [checkedItems, setCheckedItems] = useState<number[]>([]);
  const [checkAll, setCheckAll] = useState(false);
  
  // 추가근무 다이얼로그 state
  const [isOvertimeDialogOpen, setIsOvertimeDialogOpen] = useState(false);
  const [selectedOvertime, setSelectedOvertime] = useState<OvertimeItem | null>(null);
  const [overtimeDetailData, setOvertimeDetailData] = useState<any>(null);
  
  // 관리자 여부
  const isManager = user?.user_level === 'manager' || user?.user_level === 'admin';

  // 데이터 조회
  useEffect(() => {
    fetchOvertimeData();
  }, [teamIds]);

  const fetchOvertimeData = async () => {
    setLoading(true);
    try {
      // 팀이 선택된 경우 각 팀별로 데이터 조회
      if (teamIds.length > 0) {
        const promises = teamIds.map(teamId => 
          workingApi.getManagerOvertimeList({
            team_id: teamId,
            page: 1,
            size: 1000
          })
        );
        const responses = await Promise.all(promises);
        const allItems = responses.flatMap(response => response.items || []);
        setAllData(allItems);
      } else {
        // 팀이 선택되지 않은 경우 전체 조회
        const response = await workingApi.getManagerOvertimeList({
          page: 1,
          size: 1000
        });
        setAllData(response.items || []);
      }
    } catch (error) {
      console.error('초과근무 데이터 조회 실패:', error);
      setAllData([]);
    } finally {
      setLoading(false);
    }
  };

  // 필터링된 데이터
  const filteredData = useMemo(() => {
    let result = [...allData];
    
    // 탭 필터 (평일 추가근무 vs 주말 근무)
    if (activeTab === 'weekday') {
      // 평일 추가근무: weekday
      result = result.filter(item => item.ot_type === 'weekday');
    } else if (activeTab === 'weekend') {
      // 주말 근무: saturday, sunday, holiday
      result = result.filter(item => ['saturday', 'sunday', 'holiday'].includes(item.ot_type));
    }
    
    // 연도 필터
    if (filters.year) {
      result = result.filter(item => {
        const year = dayjs(item.ot_date).format('YYYY');
        return year === filters.year;
      });
    }
    
    // 상태 필터 (pending=H, approved=T, rejected=N)
    if (filters.status && filters.status.length > 0) {
      const statusMap: Record<string, string> = {
        'pending': 'H',
        'approved': 'T',
        'rejected': 'N'
      };
      const mappedStatuses = filters.status.map(s => statusMap[s]).filter(Boolean);
      if (mappedStatuses.length > 0) {
        result = result.filter(item => mappedStatuses.includes(item.ot_status));
      }
    }
    
    // 식대 필터
    if (filters.mealAllowance && filters.mealAllowance.length > 0) {
      result = result.filter(item => {
        if (filters.mealAllowance!.includes('used') && filters.mealAllowance!.includes('notUsed')) {
          return true; // 둘 다 선택된 경우 모두 표시
        }
        if (filters.mealAllowance!.includes('used')) {
          return item.ot_food === 'Y';
        }
        if (filters.mealAllowance!.includes('notUsed')) {
          return item.ot_food === 'N';
        }
        return true;
      });
    }
    
    // 교통비 필터
    if (filters.transportAllowance && filters.transportAllowance.length > 0) {
      result = result.filter(item => {
        if (filters.transportAllowance!.includes('used') && filters.transportAllowance!.includes('notUsed')) {
          return true; // 둘 다 선택된 경우 모두 표시
        }
        if (filters.transportAllowance!.includes('used')) {
          return item.ot_trans === 'Y';
        }
        if (filters.transportAllowance!.includes('notUsed')) {
          return item.ot_trans === 'N';
        }
        return true;
      });
    }
    
    // 보상 필터 (none=없음, special=특별대휴, compensatory=보상휴가, allowance=수당지급)
    if (filters.compensation && filters.compensation.length > 0) {
      const compensationMap: Record<string, string> = {
        'none': '',
        'special': 'special',
        'compensatory': 'annual',
        'allowance': 'pay'
      };
      const mappedCompensations = filters.compensation.map(c => compensationMap[c]);
      result = result.filter(item => {
        const reward = item.ot_reward || '';
        return mappedCompensations.includes(reward);
      });
    }
    
    return result;
  }, [allData, activeTab, filters]);

  // 필터 변경 시 체크박스 초기화
  useEffect(() => {
    setCheckedItems([]);
    setCheckAll(false);
  }, [activeTab, filters]);

  // 전체 선택
  const handleCheckAll = (checked: boolean) => {
    setCheckAll(checked);
    setCheckedItems(checked ? filteredData.map((item) => item.id) : []);
  };

  // 개별 선택
  const handleCheckItem = (id: number, checked: boolean) => {
    setCheckedItems((prev) => (checked ? [...prev, id] : prev.filter((i) => i !== id)));
  };

  // 추가근무 클릭 핸들러
  const handleOvertimeClick = async (item: OvertimeItem) => {
    setSelectedOvertime(item);
    setIsOvertimeDialogOpen(true);
    
    // 초과근무 상세 정보 조회
    try {
      const detail = await workingApi.getManagerOvertimeDetail(item.id);
      setOvertimeDetailData(detail);
    } catch (error) {
      console.error('초과근무 상세 조회 실패:', error);
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
    if (!selectedOvertime?.id) return;
    
    try {
      await workingApi.approveOvertime(selectedOvertime.id);
      fetchOvertimeData(); // 데이터 새로고침
      handleCloseOvertimeDialog();
    } catch (error) {
      console.error('승인 실패:', error);
      throw error;
    }
  };

  // 추가근무 반려 핸들러
  const handleRejectOvertime = async (reason: string) => {
    if (!selectedOvertime?.id) return;
    
    try {
      await workingApi.rejectOvertime(selectedOvertime.id, reason);
      fetchOvertimeData(); // 데이터 새로고침
      handleCloseOvertimeDialog();
    } catch (error) {
      console.error('반려 실패:', error);
      throw error;
    }
  };

  // 상태 텍스트 변환
  const getStatusText = (status: string) => {
    switch (status) {
      case 'H': return '승인대기';
      case 'T': return '승인완료';
      case 'N': return '반려됨';
      default: return status;
    }
  };

  // 상태 색상 클래스
  const getStatusColorClass = (status: string) => {
    switch (status) {
      case 'H': return 'text-orange-600 font-semibold';
      case 'T': return 'text-green-600 font-semibold';
      case 'N': return 'text-red-600 font-semibold';
      default: return 'text-gray-600';
    }
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

  // Y/N 텍스트 변환
  const getYNText = (value: string) => {
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

  return (
    <>
      <Table variant="primary" align="center" className="table-fixed">
        <TableHeader>
          <TableRow className="[&_th]:text-[13px] [&_th]:font-medium">
            <TableHead className="w-[5%] text-center p-2">
              <Checkbox 
                id="chk_all" 
                className={cn('mx-auto flex size-4 items-center justify-center bg-white leading-none', checkAll && 'bg-primary-blue-150')} 
                checked={checkAll} 
                onCheckedChange={handleCheckAll} 
              />
            </TableHead>
            <TableHead className="w-[7%] text-center p-2">이름</TableHead>
            <TableHead className="w-[10%] text-center p-2">초과근무날짜</TableHead>
            {activeTab === 'weekday' ?
                <>
                <TableHead className="w-[8%] text-center p-2">예상퇴근시간</TableHead>
                <TableHead className="w-[8%] text-center p-2">식대</TableHead>
                <TableHead className="w-[8%] text-center p-2">교통비</TableHead>
                </>
            :
                <>
                <TableHead className="w-[8%] text-center p-2">예상근무시간</TableHead>
                <TableHead className="w-[10%] text-center p-2">보상방식</TableHead>
                </>
            }
            <TableHead className="w-[12%] text-center p-2">클라이언트명</TableHead>
            <TableHead className="w-[20%] text-center p-2">작업내용</TableHead>
            <TableHead className="w-[10%] text-center p-2">신청일</TableHead>
            <TableHead className="w-[10%] text-center p-2">상태</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
        {loading ? (
          <TableRow>
            <TableCell className="h-100 text-gray-500" colSpan={10}>
              초과근무 신청 데이터 불러오는 중
            </TableCell>
          </TableRow>
        ) : filteredData.length === 0 ? (
          <TableRow>
            <TableCell className="h-100 text-gray-500" colSpan={10}>
              초과근무 신청 데이터가 없습니다.
            </TableCell>
          </TableRow>
        ) : (
          filteredData.map((item) => (
            <TableRow 
              key={item.id}
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleOvertimeClick(item)}
            >
              <TableCell className="text-center p-2" onClick={(e) => e.stopPropagation()}>
                <Checkbox 
                  id={`chk_${item.id}`} 
                  className={cn('mx-auto flex size-4 items-center justify-center bg-white leading-none', checkedItems.includes(item.id) && 'bg-primary-blue-150')} 
                  checked={checkedItems.includes(item.id)} 
                  onCheckedChange={(checked) => handleCheckItem(item.id, checked as boolean)} 
                />
              </TableCell>
              <TableCell className="text-center p-2">{item.user_name}</TableCell>
              <TableCell className="text-center p-2">
                {item.ot_date ? dayjs(item.ot_date).format('YYYY-MM-DD (ddd)') : '-'}
              </TableCell>
              {activeTab === 'weekday' ?
                <>
                <TableCell className="w-[8%] text-center p-2">{formatTime(item.ot_etime)}</TableCell>
                <TableCell className="w-[8%] text-center p-2">{getYNText(item.ot_food)}</TableCell>
                <TableCell className="w-[8%] text-center p-2">{getYNText(item.ot_trans)}</TableCell>
                </>
                :
                <>
                <TableCell className="w-[8%] text-center p-2">{formatHours(item.ot_hours)}</TableCell>
                <TableCell className="w-[10%] text-center p-2">{getRewardText(item.ot_reward)}</TableCell>
                </>
              }
              <TableCell className="text-center p-2">{item.ot_client || '-'}</TableCell>
              <TableCell className="text-left p-2">
                <div className="truncate" title={item.ot_description}>
                  {item.ot_description || '-'}
                </div>
              </TableCell>
              <TableCell className="text-center p-2">
                {item.ot_created_at ? dayjs(item.ot_created_at).format('YYYY-MM-DD HH:mm:ss') : '-'}
              </TableCell>
              <TableCell className={cn("text-center p-2", getStatusColorClass(item.ot_status))}>
                {getStatusText(item.ot_status)}
              </TableCell>
            </TableRow>
          ))
        )}
        </TableBody>
      </Table>

      {/* 추가근무 다이얼로그 */}
      {selectedOvertime && (() => {
        const isOwnRequest = selectedOvertime.user_id === user?.user_id;
        
        // API 응답 데이터를 모달 형식으로 변환
        const convertOvertimeData = () => {
          if (!overtimeDetailData?.info) return undefined;
          
          const info = overtimeDetailData.info;
          
          // ot_etime에서 시/분 추출 (타임존 변환 없이)
          let expectedHour = "";
          let expectedMinute = "";
          if (info.ot_etime) {
            const timeStr = info.ot_etime.includes('T') ? info.ot_etime.split('T')[1] : info.ot_etime;
            const timeParts = timeStr.split(':');
            expectedHour = timeParts[0];
            expectedMinute = timeParts[1];
          }
          
          const hours = info.ot_hours ? parseFloat(info.ot_hours) : 0;
          
          return {
            expectedEndTime: expectedHour,
            expectedEndMinute: expectedMinute,
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
          if (status === 'N') return '반려됨';
          return '신청하기';
        };
        
        return (
          <OvertimeViewDialog
            isOpen={isOvertimeDialogOpen}
            onClose={handleCloseOvertimeDialog}
            onCancel={async () => {
              if (selectedOvertime.id) {
                await workingApi.cancelOvertime(selectedOvertime.id);
                fetchOvertimeData();
                handleCloseOvertimeDialog();
              }
            }}
            onApprove={isManager && !isOwnRequest ? handleApproveOvertime : undefined}
            onReject={isManager && !isOwnRequest ? handleRejectOvertime : undefined}
            isManager={isManager}
            isOwnRequest={isOwnRequest}
            selectedDay={{
              date: dayjs(selectedOvertime.ot_date).format('YYYY-MM-DD'),
              dayOfWeek: dayjs(selectedOvertime.ot_date).format('ddd') as '월' | '화' | '수' | '목' | '금' | '토' | '일',
              workType: "-" as const,
              startTime: '-',
              endTime: '-',
              basicHours: 0,
              basicMinutes: 0,
              overtimeHours: 0,
              overtimeMinutes: 0,
              totalHours: 0,
              totalMinutes: 0,
              overtimeStatus: overtimeDetailData?.info ? mapStatus(overtimeDetailData.info.ot_status) : 
                            getStatusText(selectedOvertime.ot_status) as "신청하기" | "승인대기" | "승인완료" | "반려됨",
              overtimeData: convertOvertimeData()
            }}
          />
        );
      })()}
    </>
  );
}
