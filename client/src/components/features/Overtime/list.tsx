import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import OvertimeViewDialog from '@/components/working/OvertimeViewDialog';
import OvertimeDialog from '@/components/working/OvertimeDialog';
import { useAuth } from '@/contexts/AuthContext';
import { workingApi } from '@/api/working';
import { managerOvertimeApi } from '@/api/manager/overtime';
import { adminOvertimeApi, type overtimeItem } from '@/api/admin/overtime';
import { getTeams } from '@/api/admin/teams';
import { getTeams as getManagerTeams } from '@/api/manager/teams';
import { getTeams as getCommonTeams } from '@/api/teams';
import type { OvertimeItem } from '@/api/working';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { OvertimeFilters } from '@/components/features/Overtime/toolbar';
import { Badge } from '@/components/ui/badge';
import { buildOvertimeApiParams } from '@/utils/overtimeHelper';
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
const formatTime = (timeStr: string | null | undefined) => {
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
  isPage?: 'manager' | 'admin';
}

export default function OvertimeList({ 
  teamIds = [],
  activeTab = 'weekday',
  filters = {},
  onCheckedItemsChange = () => {},
  isPage = 'manager'
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
  const [isReapplyDialogOpen, setIsReapplyDialogOpen] = useState(false);
  const [selectedOvertime, setSelectedOvertime] = useState<OvertimeItem | null>(null);
  const [overtimeDetailData, setOvertimeDetailData] = useState<any>(null);
  
  // 일괄 승인 확인 모달 state
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [approveCounts, setApproveCounts] = useState({ overtime: 0, compensation: 0 });
  
  // 관리자 여부
  const isManager = user?.user_level === 'manager' || user?.user_level === 'admin';

  // 중복 호출 방지 ref
  const teamsLoadedRef = useRef(false);
  const loadingRef = useRef(false);
  const lastTeamIdsKeyRef = useRef<string>('');

  // 팀 목록 로드
  useEffect(() => {
    if (teamsLoadedRef.current) return;
    
    const loadTeams = async () => {
      try {
        const teamList = isPage === 'admin' 
          ? await getTeams({})
          : await getManagerTeams({});
        setTeams(teamList.map(t => ({ team_id: t.team_id, team_name: t.team_name })));
        teamsLoadedRef.current = true;
      } catch (error) {
      }
    };
    loadTeams();
  }, [isPage]);

  // teamIds를 문자열로 변환하여 안정적인 의존성 생성
  const teamIdsKey = useMemo(() => {
    const ids = [...teamIds].sort((a, b) => a - b).join(',');
    // 팀 미선택 시, 관리중인 팀 목록이 로드된 상태라면 그 목록을 키에 포함시킴
    // 이렇게 해야 초기 로딩 시 teams가 로드된 후 데이터를 다시 페치함
    if (teamIds.length === 0 && teams.length > 0) {
      const managedIds = teams.map(t => t.team_id).sort((a, b) => a - b).join(',');
      return `all-${managedIds}`;
    }
    return ids || 'all';
  }, [teamIds, teams]);

  // 데이터 조회 함수
  const fetchOvertimeData = useCallback(async () => {
    // 이미 로딩 중이면 중복 호출 방지
    if (loadingRef.current) return;
    
    // 같은 teamIds 조합이면 스킵
    if (lastTeamIdsKeyRef.current === teamIdsKey) {
      return;
    }

    loadingRef.current = true;
    lastTeamIdsKeyRef.current = teamIdsKey;
    setLoading(true);
    try {
      const teamIdsToQuery = teamIds;
      
      if (isPage === 'admin') {
        // Admin API 사용: 각 팀별로 데이터 조회
        // teamIds가 비어있으면 전체 조회 (undefined 전달)
        const responses = teamIdsToQuery.length === 0
          ? [await adminOvertimeApi.getOvertimeList(undefined, 1, 1000, '')]
          : await Promise.all(teamIdsToQuery.map(teamId => 
              adminOvertimeApi.getOvertimeList(teamId, 1, 1000, '')
            ));
        const allItems = responses.flatMap(response => response.items || []);
        
        // overtimeItem을 OvertimeItem으로 변환 (ot_stime이 null일 수 있음)
        const convertedItems: OvertimeItem[] = allItems.map(item => ({
          ...item,
          ot_stime: item.ot_stime || ''
        }));
        
        // 중복 제거 (같은 id가 여러 번 조회될 수 있음)
        const uniqueItems = convertedItems.filter((item, index, self) =>
          index === self.findIndex(t => t.id === item.id)
        );
        
        setAllData(uniqueItems);
      } else {
        // Manager API 사용
        // teamIds가 비어있으면 (필터 미선택), 관리중인 모든 팀의 데이터를 각각 조회하여 병합
        const targetTeamIds = teamIdsToQuery.length > 0 
          ? teamIdsToQuery 
          : teams.map(t => t.team_id);

        const responses = targetTeamIds.length === 0
          ? [await managerOvertimeApi.getManagerOvertimeList({ page: 1, size: 1000, flag: '' })]
          : await Promise.all(
              targetTeamIds.map(teamId =>
                managerOvertimeApi.getManagerOvertimeList({
                  team_id: teamId,
                  page: 1,
                  size: 1000,
                  flag: '',
                })
              )
            );
        const allItems = responses.flatMap(response => response.items || []);
        
        // 중복 제거 (같은 id가 여러 번 조회될 수 있음)
        const uniqueItems = allItems.filter((item, index, self) =>
          index === self.findIndex(t => t.id === item.id)
        );
        
        setAllData(uniqueItems);
      }
    } catch (error) {
      setAllData([]);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [teamIdsKey, isPage, teams]);

  // 데이터 조회
  useEffect(() => {
    fetchOvertimeData();
  }, [fetchOvertimeData]);

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
    
    // 정렬: admin일 때는 보상대기(T) 최우선, manager일 때는 승인대기(H) 최우선, 그 다음 신청일 최근순
    result.sort((a, b) => {
      if (isPage === 'admin') {
        // admin: 보상대기(T)를 최우선으로
        if (a.ot_status === 'T' && b.ot_status !== 'T') return -1;
        if (a.ot_status !== 'T' && b.ot_status === 'T') return 1;
      } else {
        // manager: 승인대기(H)를 최우선으로
        if (a.ot_status === 'H' && b.ot_status !== 'H') return -1;
        if (a.ot_status !== 'H' && b.ot_status === 'H') return 1;
      }
      
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

  // 선택 가능한 상태 확인 헬퍼 함수 (isPage prop 기반)
  const isSelectableStatus = useCallback((status: string) => {
    if (isPage === 'admin') {
      // admin 페이지: 평일 추가근무는 선택 불가, 휴일 근무는 보상대기(T)만 선택 가능
      if (activeTab === 'weekday') return false;
      return status === 'T';
    } else {
      // manager 페이지: 승인대기(H)만 선택 가능
      return status === 'H';
    }
  }, [isPage, activeTab]);

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
      if (isPage === 'admin') {
        const detail = await adminOvertimeApi.getOvertimeDetail(item.id);
        setOvertimeDetailData(detail);
      } else {
        const detail = await managerOvertimeApi.getManagerOvertimeDetail(item.id);
        setOvertimeDetailData(detail);
      }
    } catch (error) {
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
      if (isPage === 'admin') {
        await adminOvertimeApi.approveOvertime(selectedOvertime.id);
      } else {
        await managerOvertimeApi.approveOvertime(selectedOvertime.id);
      }
      fetchOvertimeData(); // 데이터 새로고침
      handleCloseOvertimeDialog();
    } catch (error) {
      throw error;
    }
  };

  // 추가근무 반려 핸들러
  const handleRejectOvertime = async (reason: string) => {
    if (!selectedOvertime?.id) return;
    
    try {
      if (isPage === 'admin') {
        // Admin API는 reason 파라미터가 없음
        await adminOvertimeApi.rejectOvertime(selectedOvertime.id);
      } else {
        await managerOvertimeApi.rejectOvertime(selectedOvertime.id, reason);
      }
      fetchOvertimeData(); // 데이터 새로고침
      handleCloseOvertimeDialog();
    } catch (error) {
      throw error;
    }
  };

  // 보상 지급 핸들러 (보상대기 상태 승인)
  const handleCompensationOvertime = async () => {
    if (!selectedOvertime?.id) return;
    
    try {
      if (isPage === 'admin') {
        // Admin API에서는 보상 지급도 approveOvertime 사용
        await adminOvertimeApi.approveOvertime(selectedOvertime.id);
      } else {
        await managerOvertimeApi.confirmOvertimeCompensation({ ot_seq: selectedOvertime.id });
      }
      fetchOvertimeData(); // 데이터 새로고침
      handleCloseOvertimeDialog();
    } catch (error) {
      throw error;
    }
  };

  // 재신청 핸들러
  const handleReapplyOvertime = () => {
    // 재신청하기: ViewDialog 닫고 신청 Dialog 열기
    setIsOvertimeDialogOpen(false);
    setIsReapplyDialogOpen(true);
  };

  // 재신청 다이얼로그 닫기
  const handleCloseReapplyDialog = () => {
    setIsReapplyDialogOpen(false);
    setSelectedOvertime(null);
  };

  // 재신청 저장 핸들러
  const handleReapplySave = async (overtimeData: any) => {
    if (!selectedOvertime) return;
    
    try {
      // WorkData 형식으로 변환
      const selectedDay = {
        date: selectedOvertime.ot_date,
        dayOfWeek: dayjs(selectedOvertime.ot_date).format('ddd') as '월' | '화' | '수' | '목' | '금' | '토' | '일',
        workType: "-" as const,
        isHoliday: false
      };
      
      // 추가근무 API 파라미터 구성
      const apiParams = buildOvertimeApiParams(selectedDay as any, overtimeData, []);
      
      // API 호출(Dialog에서 저장하므로 해당 코드 삭제)
      // await workingApi.requestOvertime(apiParams);
      
      // 성공 시 데이터 다시 로드
      fetchOvertimeData();
      
      handleCloseReapplyDialog();
    } catch (error: any) {
      const errorMessage = error?.message || error?.response?.data?.message || '알 수 없는 오류가 발생했습니다.';
      alert(`재신청에 실패했습니다.\n오류: ${errorMessage}`);
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
      if (isPage === 'admin') {
        await Promise.all(
          checkedItems.map(id => adminOvertimeApi.approveOvertime(id))
        );
      } else {
        await Promise.all(
          checkedItems.map(id => managerOvertimeApi.approveOvertime(id))
        );
      }
      
      // 확인 모달 닫기
      setIsConfirmDialogOpen(false);
      
      // Toast로 성공 메시지 표시
      let description = '';
      if (isPage === 'admin' && overtime > 0 && compensation > 0) {
        description = `${overtime}개의 추가근무 요청과 ${compensation}개의 보상지급 요청이 승인 완료되었습니다.`;
      } else if (isPage === 'admin' && compensation > 0) {
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
                <TableHead className="w-[16%] text-center p-2">예상근무시간</TableHead>
                <TableHead className="w-[10%] text-center p-2">보상방식</TableHead>
                </>
            }
            <TableHead className="w-[12%] text-center p-2">클라이언트명</TableHead>
            <TableHead className="w-[20%] text-center p-2">작업내용</TableHead>
            <TableHead className="w-[10%] text-center p-2">신청일</TableHead>
            <TableHead className="w-[10%] text-center p-2">상태</TableHead>
            {!(isPage === 'admin' && activeTab === 'weekday') && (
              <TableHead className="w-[5%] text-center p-2">
                <Checkbox 
                  id="chk_all" 
                  className={cn('mx-auto flex size-4 items-center justify-center bg-white leading-none', checkAll && 'bg-primary-blue-150')} 
                  checked={checkAll} 
                  onCheckedChange={handleCheckAll} 
                />
              </TableHead>
            )}
          </TableRow>
        </TableHeader>

        <TableBody>
        {loading ? (
          <TableRow>
            <TableCell 
              className="h-100 text-gray-500" 
              colSpan={activeTab === 'weekday' ? (isPage === 'admin' ? 10 : 11) : (isPage === 'admin' ? 10 : 10)}
            >
              추가근무 신청 데이터 불러오는 중
            </TableCell>
          </TableRow>
        ) : paginatedData.length === 0 ? (
          <TableRow>
            <TableCell 
              className="h-100 text-gray-500" 
              colSpan={activeTab === 'weekday' ? (isPage === 'admin' ? 10 : 11) : (isPage === 'admin' ? 10 : 10)}
            >
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
              <TableCell className="text-center p-2 whitespace-nowrap">{getTeamName(item.team_id)}</TableCell>
              <TableCell className="text-center p-2">{item.user_name}</TableCell>
              <TableCell className="text-center p-2 whitespace-nowrap">
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
                <TableCell className="w-[16%] text-center p-2">
                  {formatTime(item.ot_stime)} - {formatTime(item.ot_etime)} <span className="text-gray-500 text-sm font-normal">({formatHours(item.ot_hours)})</span>
                </TableCell>
                <TableCell className="w-[10%] text-center p-2">{getRewardText(item.ot_reward)}</TableCell>
                </>
              }
              <TableCell className="text-center p-2 whitespace-nowrap text-ellipsis overflow-hidden">{item.ot_client || '-'}</TableCell>
              <TableCell className="text-left p-2 whitespace-nowrap text-ellipsis overflow-hidden">{item.ot_description || '-'}</TableCell>
              <TableCell className="text-center p-2 whitespace-nowrap">
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
              {!(isPage === 'admin' && activeTab === 'weekday') && (
                <TableCell className="text-center p-2" onClick={(e) => e.stopPropagation()}>
                  <Checkbox 
                    id={`chk_${item.id}`} 
                    className={cn('mx-auto flex size-4 items-center justify-center bg-white leading-none', checkedItems.includes(item.id) && 'bg-primary-blue-150')} 
                    checked={checkedItems.includes(item.id)} 
                    disabled={!isSelectableStatus(item.ot_status)}
                    onCheckedChange={(checked) => handleCheckItem(item.id, checked as boolean)} 
                  />
                </TableCell>
              )}
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
            onApprove={
              isManager && !isOwnRequest && isPage !== 'admin'
                ? handleApproveOvertime 
                : undefined
            }
            onReject={
              isManager && !isOwnRequest && 
              isPage === 'admin' && activeTab === 'weekend' && selectedOvertime.ot_status === 'T'
                ? handleRejectOvertime 
                : undefined
            }
            onCompensation={
              isManager && !isOwnRequest && isPage === 'admin' && activeTab === 'weekend'
                ? handleCompensationOvertime 
                : undefined
            }
            onReapply={isOwnRequest ? handleReapplyOvertime : undefined}
            isManager={isManager}
            isOwnRequest={isOwnRequest}
            activeTab={activeTab}
            isPage={isPage}
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

      {/* 재신청 다이얼로그 */}
      {selectedOvertime && (() => {
        // WorkData 형식으로 변환
        const selectedDay = {
          date: selectedOvertime.ot_date,
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
          overtimeStatus: getStatusText(selectedOvertime.ot_status) as "신청하기" | "승인대기" | "승인완료" | "취소완료",
          overtimeData: overtimeDetailData?.info ? {
            expectedStartTime: overtimeDetailData.info.ot_stime ? overtimeDetailData.info.ot_stime.split(':')[0] : '',
            expectedStartTimeMinute: overtimeDetailData.info.ot_stime ? overtimeDetailData.info.ot_stime.split(':')[1] : '',
            expectedEndTime: overtimeDetailData.info.ot_etime ? overtimeDetailData.info.ot_etime.split(':')[0] : '',
            expectedEndMinute: overtimeDetailData.info.ot_etime ? overtimeDetailData.info.ot_etime.split(':')[1] : '',
            mealAllowance: overtimeDetailData.info.ot_food === 'Y' ? 'yes' : 'no',
            transportationAllowance: overtimeDetailData.info.ot_trans === 'Y' ? 'yes' : 'no',
            overtimeHours: overtimeDetailData.info.ot_hours ? String(Math.floor(parseFloat(overtimeDetailData.info.ot_hours))) : '',
            overtimeMinutes: overtimeDetailData.info.ot_hours ? String(Math.round((parseFloat(overtimeDetailData.info.ot_hours) % 1) * 60)) : '',
            overtimeType: overtimeDetailData.info.ot_reward === 'special' ? 'special_vacation' : 
                         overtimeDetailData.info.ot_reward === 'annual' ? 'compensation_vacation' : 'event',
            clientName: overtimeDetailData.info.ot_client || "",
            workDescription: overtimeDetailData.info.ot_description || ""
          } : undefined
        };
        
        return (
          <OvertimeDialog
            isOpen={isReapplyDialogOpen}
            onClose={handleCloseReapplyDialog}
            onSave={handleReapplySave}
            selectedDay={selectedDay as any}
          />
        );
      })()}

      {/* 일괄 승인 확인 모달 */}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isPage === 'admin' && activeTab === 'weekend' ? '보상 지급 확인' : '승인 확인'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {(() => {
                if (isPage === 'manager') {
                  return (
                    <>
                      {approveCounts.overtime}개의 추가근무 요청을 승인하시겠습니까?
                    </>
                  );
                } else if (isPage === 'admin') {
                  return (
                    <>
                      {approveCounts.compensation}개의 보상지급 요청을 {activeTab === 'weekend' ? '지급' : '승인'}하시겠습니까?
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
              {isPage === 'admin' && activeTab === 'weekend' ? '보상 지급하기' : '승인하기'}
            </AlertDialogAction>
            <AlertDialogCancel>닫기</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
