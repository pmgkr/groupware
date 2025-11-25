import { useState, useEffect, useMemo, useCallback } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import OvertimeViewDialog from '@/components/working/OvertimeViewDialog';
import { useAuth } from '@/contexts/AuthContext';
import { workingApi } from '@/api/working';
import { getTeams } from '@/api/teams';
import { getMemberList } from '@/api/common/team';
import type { OvertimeItem } from '@/api/working';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { OvertimeFilters } from '@/components/features/Overtime/toolbar';
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
import { useToast } from '@/components/ui/use-toast';
import { AppPagination } from '@/components/ui/AppPagination';

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
  onCheckedItemsChange?: (items: number[]) => void;
}

export default function OvertimeList({ 
  teamIds = [],
  activeTab = 'weekday',
  filters = {},
  onCheckedItemsChange = () => {}
}: OvertimeListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // 데이터 state
  const [allData, setAllData] = useState<OvertimeItem[]>([]);
  const [loading, setLoading] = useState(false);

  // 페이지네이션 state
  const [page, setPage] = useState(1);
  const pageSize = 15;
  
  // 팀 목록 state
  const [teams, setTeams] = useState<{ team_id: number; team_name: string }[]>([]);
  
  // 체크박스 state
  const [checkedItems, setCheckedItems] = useState<number[]>([]);
  const [checkAll, setCheckAll] = useState(false);
  
  // 추가근무 다이얼로그 state
  const [isOvertimeDialogOpen, setIsOvertimeDialogOpen] = useState(false);
  const [selectedOvertime, setSelectedOvertime] = useState<OvertimeItem | null>(null);
  const [overtimeDetailData, setOvertimeDetailData] = useState<any>(null);
  
  // 일괄 승인 확인 모달 state
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [approveCounts, setApproveCounts] = useState({ overtime: 0, compensation: 0 });
  
  // 관리자 여부
  const isManager = user?.user_level === 'manager' || user?.user_level === 'admin';

  // 팀 목록 로드
  useEffect(() => {
    const loadTeams = async () => {
      try {
        const teamList = await getTeams({});
        setTeams(teamList.map(t => ({ team_id: t.team_id, team_name: t.team_name })));
      } catch (error) {
        console.error('팀 목록 조회 실패:', error);
      }
    };
    loadTeams();
  }, []);

  // 데이터 조회
  useEffect(() => {
    fetchOvertimeData();
  }, [teamIds, user?.team_id, user?.user_level]);

  const fetchOvertimeData = async () => {
    setLoading(true);
    try {
      // teamIds가 있으면 사용, 없으면 user.team_id 사용
      let teamIdsToQuery: number[] = [];
      
      if (teamIds.length > 0) {
        // 팀이 선택된 경우
        teamIdsToQuery = teamIds;
      } else if (user?.user_level === 'manager') {
        // manager인 경우: /manager/myteam으로 관리하는 모든 팀 조회
        try {
          const myTeamResponse = await workingApi.getMyTeamList();
          teamIdsToQuery = (myTeamResponse.items || []).map(team => team.team_id);
        } catch (error) {
          console.error('관리 팀 목록 조회 실패:', error);
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
        setAllData([]);
        setLoading(false);
        return;
      }
      
      // 각 팀별로 데이터 조회
      const promises = teamIdsToQuery.map(teamId => 
        workingApi.getManagerOvertimeList({
          team_id: teamId,
          page: 1,
          size: 1000
        })
      );
      const responses = await Promise.all(promises);
      const allItems = responses.flatMap(response => response.items || []);
      
      // 중복 제거 (같은 id가 여러 번 조회될 수 있음)
      const uniqueItems = allItems.filter((item, index, self) =>
        index === self.findIndex(t => t.id === item.id)
      );
      
      setAllData(uniqueItems);
    } catch (error) {
      console.error('추가근무 데이터 조회 실패:', error);
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
    
    // 상태 필터 (pending=H, approved=T, confirmed=Y, rejected=N)
    if (filters.status && filters.status.length > 0) {
      const statusMap: Record<string, string> = {
        'pending': 'H',
        'approved': 'T',
        'confirmed': 'Y',
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
    
    // 정렬: 1) 승인대기 최우선, 2) 신청일 최근순
    result.sort((a, b) => {
      // 1. 승인대기(H)를 최우선으로
      if (a.ot_status === 'H' && b.ot_status !== 'H') return -1;
      if (a.ot_status !== 'H' && b.ot_status === 'H') return 1;
      
      // 2. 신청일(ot_created_at) 최근순 (내림차순)
      const dateA = a.ot_created_at ? new Date(a.ot_created_at).getTime() : 0;
      const dateB = b.ot_created_at ? new Date(b.ot_created_at).getTime() : 0;
      return dateB - dateA;
    });
    
    return result;
  }, [allData, activeTab, filters]);

  // 페이지네이션 적용된 데이터
  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, page, pageSize]);

  // 전체 데이터 개수 및 페이지 수
  const total = filteredData.length;
  const totalPages = Math.ceil(total / pageSize);

  // 필터 변경 시 체크박스 초기화 및 첫 페이지로 이동
  useEffect(() => {
    setCheckedItems([]);
    setCheckAll(false);
    onCheckedItemsChange([]);
    setPage(1);
  }, [activeTab, filters]);

  // HR팀 또는 Finance팀 관리자/관리자 권한 확인 함수
  const isHrOrFinanceTeam = useCallback(() => {
    return (user?.user_level === 'manager' || user?.user_level === 'admin') && 
           (user?.team_id === 1 || user?.team_id === 5);
  }, [user]);

  // 선택 가능한 상태 확인 헬퍼 함수
  const isSelectableStatus = useCallback((status: string) => {
    if (isHrOrFinanceTeam() && activeTab === 'weekend') {
      // HR/Finance팀 관리자의 휴일 근무: H 또는 T
      return status === 'H' || status === 'T';
    } else {
      // 나머지: H만
      return status === 'H';
    }
  }, [isHrOrFinanceTeam, activeTab]);

  // 전체 선택
  const handleCheckAll = (checked: boolean) => {
    setCheckAll(checked);
    const newCheckedItems = checked 
      ? paginatedData.filter(item => isSelectableStatus(item.ot_status)).map((item) => item.id) 
      : [];
    setCheckedItems(newCheckedItems);
  };

  // 개별 선택
  const handleCheckItem = (id: number, checked: boolean) => {
    setCheckedItems((prev) => {
      return checked ? [...prev, id] : prev.filter((i) => i !== id);
    });
  };

  // checkedItems 변경 시 부모 컴포넌트에 알림
  useEffect(() => {
    onCheckedItemsChange(checkedItems);
  }, [checkedItems, onCheckedItemsChange]);

  // checkAll 상태 자동 업데이트
  useEffect(() => {
    const selectableItems = paginatedData.filter(item => isSelectableStatus(item.ot_status));
    const selectableIds = selectableItems.map(item => item.id);
    const allSelected = selectableIds.length > 0 && selectableIds.every(id => checkedItems.includes(id));
    setCheckAll(allSelected);
  }, [checkedItems, paginatedData, isSelectableStatus]);

  // 추가근무 클릭 핸들러
  const handleOvertimeClick = async (item: OvertimeItem) => {
    setSelectedOvertime(item);
    setIsOvertimeDialogOpen(true);
    
    // 추가근무 상세 정보 조회
    try {
      const detail = await workingApi.getManagerOvertimeDetail(item.id);
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

  // 보상 지급 핸들러 (보상대기 상태 승인)
  const handleCompensationOvertime = async () => {
    if (!selectedOvertime?.id) return;
    
    try {
      await workingApi.confirmOvertimeCompensation({ ot_seq: selectedOvertime.id });
      fetchOvertimeData(); // 데이터 새로고침
      handleCloseOvertimeDialog();
    } catch (error) {
      console.error('보상 지급 실패:', error);
      throw error;
    }
  };

  // 일괄 승인 확인 모달 열기
  const handleApproveAllOvertime = () => {
    if (checkedItems.length === 0) return;
    
    // 체크된 항목들을 상태별로 분류
    const checkedOvertimeItems = allData.filter(item => 
      checkedItems.includes(item.id) && item.ot_status === 'H'
    );
    const checkedCompensationItems = allData.filter(item => 
      checkedItems.includes(item.id) && item.ot_status === 'T'
    );
    
    setApproveCounts({
      overtime: checkedOvertimeItems.length,
      compensation: checkedCompensationItems.length
    });
    setIsConfirmDialogOpen(true);
  };

  // 실제 일괄 승인 처리
  const handleConfirmApprove = async () => {
    const { overtime, compensation } = approveCounts;
    try {
      // 모든 체크된 항목에 대해 승인 요청
      await Promise.all(
        checkedItems.map(id => workingApi.approveOvertime(id))
      );
      
      // 확인 모달 닫기
      setIsConfirmDialogOpen(false);
      
      // Toast로 성공 메시지 표시
      const canShowCompensation = isHrOrFinanceTeam() && activeTab === 'weekend';
      
      let description = '';
      if (canShowCompensation && overtime > 0 && compensation > 0) {
        description = `${overtime}개의 추가근무 요청과 ${compensation}개의 보상지급 요청이 승인 완료되었습니다.`;
      } else if (canShowCompensation && compensation > 0) {
        description = `${compensation}개의 보상지급 요청이 승인 완료되었습니다.`;
      } else {
        const totalCount = overtime + compensation;
        description = `${totalCount}개의 추가근무 요청이 승인 완료되었습니다.`;
      }
      
      toast({
        title: "승인 완료",
        description,
      });
      
      // 체크박스 초기화 및 데이터 새로고침
      setCheckedItems([]);
      setCheckAll(false);
      onCheckedItemsChange([]);
      fetchOvertimeData();
    } catch (error) {
      console.error('일괄 승인 실패:', error);
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
    (window as any).__overtimeApproveAll = handleApproveAllOvertime;
    return () => {
      delete (window as any).__overtimeApproveAll;
    };
  }, [checkedItems]);

  // 상태 텍스트 변환
  const getStatusText = (status: string) => {
    switch (status) {
      case 'H': return '승인대기';
      case 'T': return activeTab === 'weekday' ? '승인완료' : '보상대기';
      case 'Y': return '보상완료';
      case 'N': return '취소완료';
      default: return status;
    }
  };

  // 상태 색상 클래스
  const getStatusColorClass = (status: string) => {
    switch (status) {
      case 'H': return 'text-orange-600 font-semibold'; // 승인대기
      case 'T': return 'text-green-600 font-semibold'; // 승인완료
      case 'N': return 'text-red-600 font-semibold'; // 취소완료
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

  // 부서명 조회 (동기 함수)
  const getTeamName = (teamId: number) => {
    const team = teams.find(t => t.team_id === teamId);
    return team?.team_name || '-';
  };

  return (
    <>
      <Table variant="primary" align="center" className="table-fixed">
        <TableHeader>
          <TableRow className="[&_th]:text-[13px] [&_th]:font-medium">
            <TableHead className="w-[7%] text-center p-2">부서</TableHead>
            <TableHead className="w-[7%] text-center p-2">이름</TableHead>
            <TableHead className="w-[10%] text-center p-2">추가근무날짜</TableHead>
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

        <TableBody>
        {loading ? (
          <TableRow>
            <TableCell className="h-100 text-gray-500" colSpan={10}>
              추가근무 신청 데이터 불러오는 중
            </TableCell>
          </TableRow>
        ) : paginatedData.length === 0 ? (
          <TableRow>
            <TableCell className="h-100 text-gray-500" colSpan={10}>
              추가근무 신청 데이터가 없습니다.
            </TableCell>
          </TableRow>
        ) : (
          paginatedData.map((item) => (
            <TableRow 
              key={item.id}
              className={`[&_td]:text-[13px] cursor-pointer hover:bg-gray-50 ${item.ot_status === 'N' ? 'opacity-40' : ''}`}
              onClick={() => handleOvertimeClick(item)}
            >
              <TableCell className="text-center p-2">{getTeamName(item.team_id)}</TableCell>
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
                  <Badge variant="grayish" size="table" title="취소완료">
                    {getStatusText(item.ot_status)}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-center p-2" onClick={(e) => e.stopPropagation()}>
                <Checkbox 
                  id={`chk_${item.id}`} 
                  className={cn('mx-auto flex size-4 items-center justify-center bg-white leading-none', checkedItems.includes(item.id) && 'bg-primary-blue-150')} 
                  checked={checkedItems.includes(item.id)} 
                  disabled={!isSelectableStatus(item.ot_status)}
                  onCheckedChange={(checked) => handleCheckItem(item.id, checked as boolean)} 
                />
              </TableCell>
            </TableRow>
          ))
        )}
        </TableBody>
      </Table>
      {total > 0 && (
        <div className="mt-5">
          <AppPagination totalPages={totalPages} initialPage={page} visibleCount={10} onPageChange={(p) => setPage(p)} />
        </div>
      )}

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
          if (status === 'T') {
            // 평일 추가근무는 승인완료, 휴일 근무는 보상대기
            return activeTab === 'weekday' ? '승인완료' : '보상대기';
          }
          if (status === 'N') return '취소완료';
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
            onCompensation={isManager && !isOwnRequest ? handleCompensationOvertime : undefined}
            isManager={isManager}
            isOwnRequest={isOwnRequest}
            activeTab={activeTab}
            user={user ? { user_level: user.user_level, team_id: user.team_id ?? undefined } : undefined}
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
                            getStatusText(selectedOvertime.ot_status) as "신청하기" | "승인대기" | "승인완료" | "취소완료" | "보상대기",
              overtimeData: convertOvertimeData()
            }}
          />
        );
      })()}

      {/* 일괄 승인 확인 모달 */}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>승인 확인</AlertDialogTitle>
            <AlertDialogDescription>
              {(() => {
                const canShowCompensation = isHrOrFinanceTeam() && activeTab === 'weekend';
                
                if (canShowCompensation && approveCounts.overtime > 0 && approveCounts.compensation > 0) {
                  return (
                    <>
                      {approveCounts.overtime}개의 추가근무 요청과 {approveCounts.compensation}개의 보상지급 요청을 승인하시겠습니까?
                    </>
                  );
                } else if (canShowCompensation && approveCounts.compensation > 0) {
                  return (
                    <>
                      {approveCounts.compensation}개의 보상지급 요청을 승인하시겠습니까?
                    </>
                  );
                } else {
                  const totalCount = approveCounts.overtime + approveCounts.compensation;
                  return (
                    <>
                      {totalCount}개의 추가근무 요청을 승인하시겠습니까?
                    </>
                  );
                }
              })()}
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
