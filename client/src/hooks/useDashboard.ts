import { useState, useEffect, useCallback, useMemo } from 'react';
import { dashboardApi, type VacationSummaryItem, type Calendar, type Meetingroom, type Notification, type Wlog, type Notice, type Expense } from '@/api/dashboard';
import { formatKST, timeToMinutes } from '@/utils/date';
import dayjs from 'dayjs';

// 미팅룸 관련 함수
const getMeetingroomKoreanName = (mrName: string): string => {
  const nameMap: Record<string, string> = {
    'Beijing Room': '베이징룸',
    'Tokyo Room': '도쿄룸',
    'Singapore Room': '싱가폴룸',
    'Sydney Room': '시드니룸',
    'Manila Room': '마닐라룸',
    'Bangkok Room': '방콕룸',
  };
  return nameMap[mrName] || mrName;
};

const getMeetingroomBadgeColor = (mrName: string): string => {
  const colorMap: Record<string, string> = {
    'Beijing Room': 'bg-[#FF6B6B]',
    'Tokyo Room': 'bg-[#FFA46B]',
    'Singapore Room': 'bg-[#2FC05D]',
    'Sydney Room': 'bg-[#6BADFF]',
    'Manila Room': 'bg-[#5E6BFF]',
    'Bangkok Room': 'bg-[#DA6BFF]',
  };
  return colorMap[mrName] || 'bg-gray-500';
};

// 비용 관련 함수
const getExpenseStepStatusName = (status: string): string => {
  const nameMap: Record<string, string> = {
    'Saved': '임시저장',
    'Claimed': '승인대기',
    'Confirmed': '승인완료',
    'Approved': '지급대기',
    'Completed': '지급완료',
    'Rejected': '반려됨',
  };
  return nameMap[status] || status;
};

const getExpenseBadgeColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    // grayish variant의 className
    'Saved': 'bg-gray-100 text-gray-700 [a&]:hover:bg-gray-300/90 border-gray-300/50',
    // secondary variant의 className
    'Claimed': 'bg-primary-blue-100 text-primary-blue [a&]:hover:bg-secondary/90 border-primary-blue-300/10',
    // default variant의 className
    'Confirmed': 'bg-primary-blue-500 text-primary-foreground [a&]:hover:bg-primary/90',
    'Approved': 'bg-primary-blue/80',
    'Completed': 'bg-primary-blue',
    'Rejected': 'bg-destructive',
  };
  return colorMap[status] || 'bg-gray-500';
};

export function useDashboard(selectedDate?: Date) {
  const [wlog, setWlog] = useState<Wlog>({
    wlogWeek: [],
    wlogToday: [],
    wlogSchedule: []
  });
  const [vacation, setVacation] = useState<VacationSummaryItem | null>(null);
  const [notification, setNotification] = useState<Notification[]>([]);
  const [calendar, setCalendar] = useState<Calendar[]>([]);
  const [meetingroom, setMeetingroom] = useState<Meetingroom[]>([]);
  const [notice, setNotice] = useState<Notice[]>([]);
  const [expense, setExpense] = useState<Expense[]>([]);
  
  // 초기 데이터 로드 (한 번만 실행)
  useEffect(() => {
    const fetchWlog = async () => {
        try {
            const data = await dashboardApi.getWlog();
            setWlog(data);
        } catch (error) {
            console.error('근무시간 정보 조회 실패:', error);
        }
    };
    
    const fetchVacation = async () => {
      try {
        const currentYear = new Date().getFullYear();
        const data = await dashboardApi.getVacation(currentYear);
        const summaryItem = Array.isArray(data?.summary) ? data.summary[0] : null;
        setVacation(summaryItem || null);
      } catch (error) {
        console.error('휴가 정보 조회 실패:', error);
      }
    };

    const fetchNotice = async () => {
        try {
            const data = await dashboardApi.getNotice(4);
            setNotice(data);
        } catch (error) {
            console.error('공지사항 정보 조회 실패:', error);
        }
    };

    const fetchNotification = async () => {
        try {
            const data = await dashboardApi.getNotification();
            setNotification(data);
        } catch (error) {
            console.error('알림 정보 조회 실패:', error);
        }
    };

    const fetchMeetingroom = async () => {
        try {
            const data = await dashboardApi.getMeetingroom();
            setMeetingroom(data);
        } catch (error) {
            console.error('회의실 정보 조회 실패:', error);
        }
    };

    const fetchExpense = async () => {
        try {
            const data = await dashboardApi.getExpense();
            // API에서 이미 nexpense 배열을 반환하므로 그대로 사용
            const expenseArray = Array.isArray(data) ? data : [];
            setExpense(expenseArray);
        } catch (error) {
            console.error('비용 정보 조회 실패:', error);
            setExpense([]);
        }
    };

    fetchWlog();
    fetchVacation();
    fetchNotification();
    fetchMeetingroom();
    fetchNotice();
    fetchExpense();
  }, []);

  // 선택된 날짜가 변경될 때 캘린더 데이터만 업데이트
  useEffect(() => {
    const fetchCalendar = async () => {
        try {
            const t_date = selectedDate ? formatKST(selectedDate, true) : undefined;
            const data = await dashboardApi.getCalendar(t_date);
            setCalendar(data || []);
        } catch (error) {
            console.error('캘린더 정보 조회 실패:', error);
            setCalendar([]);
        }
    };

    fetchCalendar();
  }, [selectedDate]);

  // EventViewDialog 상태 관리
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [selectedCalendar, setSelectedCalendar] = useState<Calendar | null>(null);

  // 캘린더 항목 클릭 핸들러 (useCallback으로 메모이제이션하여 리렌더링 방지)
  const handleCalendarClick = useCallback((calendar: Calendar) => {
    setSelectedCalendar(calendar);
    setIsEventDialogOpen(true);
  }, []);

  // 다이얼로그 닫기 핸들러 (useCallback으로 메모이제이션하여 리렌더링 방지)
  const handleCloseDialog = useCallback(() => {
    setIsEventDialogOpen(false);
    setSelectedCalendar(null);
  }, []);

  // Calendar 데이터를 EventData 형식으로 변환 (useCallback으로 메모이제이션)
  const convertCalendarToEventData = useCallback((calendar: Calendar) => {
    const allDay = typeof calendar.allDay === 'boolean' 
      ? calendar.allDay 
      : calendar.allDay === 'Y';
    
    // sch_label에 따라 category 결정
    const vacationLabels = ['연차', '반차', '반반차', '공가'];
    const category = vacationLabels.includes(calendar.sch_label) ? 'vacation' : 'event';
    
    return {
      title: calendar.sch_label,
      description: calendar.description || '',
      startDate: calendar.startDate || '',
      endDate: calendar.endDate || '',
      startTime: calendar.startTime || '',
      endTime: calendar.endTime || '',
      allDay: allDay,
      category: category,
      eventType: calendar.sch_label,
      author: calendar.user_name,
      userId: '', // Dashboard API에서 제공하지 않음
      teamId: undefined,
      status: '등록 완료' as const,
    };
  }, []);

  // 정렬된 캘린더 데이터 (useMemo로 메모이제이션하여 불필요한 재정렬 방지)
  // 정렬 순서: 연차 -> 오전 반차 -> 오후 반차 -> 공가 -> 외부일정 -> 재택
  const getSortOrder = (label: string): number => {
    if (label === '연차') return 1;
    if (label === '오전 반차') return 2;
    if (label === '오후 반차') return 3;
    if (label === '공가') return 4;
    if (label === '외부 일정') return 5;
    if (label === '재택') return 6;
    // 기타 항목은 맨 뒤로
    return 999;
  };

  const sortedCalendar = useMemo(() => {
    return [...calendar].sort((a, b) => {
      const orderA = getSortOrder(a.sch_label);
      const orderB = getSortOrder(b.sch_label);
      return orderA - orderB;
    });
  }, [calendar]);

  // selectedEventData 메모이제이션 (Dialog 리렌더링 최소화)
  const selectedEventData = useMemo(() => {
    return selectedCalendar ? convertCalendarToEventData(selectedCalendar) : undefined;
  }, [selectedCalendar, convertCalendarToEventData]);

  // 정렬된 미팅룸 데이터 (useMemo로 메모이제이션)
  const sortedMeetingroom = useMemo(() => {
    return [...meetingroom].sort((a, b) => {
      const startA = timeToMinutes(a.stime);
      const startB = timeToMinutes(b.stime);
      
      if (startA !== startB) {
        return startA - startB;
      }
      
      // 같은 stime일 경우 etime으로 정렬
      const endA = timeToMinutes(a.etime);
      const endB = timeToMinutes(b.etime);
      return endA - endB;
    });
  }, [meetingroom]);

  return { 
    wlog, 
    vacation, 
    notification, 
    calendar: sortedCalendar, // 정렬된 캘린더 반환
    meetingroom: sortedMeetingroom, // 정렬된 미팅룸 반환
    notice,
    expense, // 비용 데이터
    // EventViewDialog 관련
    isEventDialogOpen,
    selectedCalendar,
    selectedEventData, // 메모이제이션된 이벤트 데이터
    handleCalendarClick,
    handleCloseDialog,
    // 미팅룸 관련 함수
    getMeetingroomKoreanName,
    getMeetingroomBadgeColor,
    // 비용 관련 함수
    getExpenseStepStatusName,
    getExpenseBadgeColor
  };
}

