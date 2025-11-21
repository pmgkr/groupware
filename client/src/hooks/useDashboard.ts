import { useState, useEffect, useCallback, useMemo } from 'react';
import { dashboardApi, type Vacation, type Calendar, type Meetingroom, type Notification, type Wlog, type Notice } from '@/api/dashboard';
import { formatKST } from '@/utils/date';
import dayjs from 'dayjs';

export function useDashboard(selectedDate?: Date) {
  const [wlog, setWlog] = useState<Wlog>({
    wlogWeek: [],
    wlogToday: []
  });
  const [vacation, setVacation] = useState<Vacation | null>(null);
  const [notification, setNotification] = useState<Notification[]>([]);
  const [calendar, setCalendar] = useState<Calendar[]>([]);
  const [meetingroom, setMeetingroom] = useState<Meetingroom[]>([]);
  const [notice, setNotice] = useState<Notice[]>([]);
  
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
        setVacation(data);
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

    fetchWlog();
    fetchVacation();
    fetchNotification();
    fetchMeetingroom();
    fetchNotice();
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
    // 시작일/종료일이 있으면 사용하고, 없으면 선택된 날짜 사용
    const startDate = calendar.sch_sdate || (selectedDate ? dayjs(selectedDate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'));
    const endDate = calendar.sch_edate || startDate;
    
    // 시작시간/종료시간이 있으면 사용하고, 없으면 기본값 사용
    const startTime = calendar.sch_stime || '00:00:00';
    const endTime = calendar.sch_etime || '23:59:59';
    
    // 종일 여부 확인 (기본값: true)
    const allDay = calendar.sch_isAllday === 'Y' || (!calendar.sch_stime && !calendar.sch_etime);
    
    // sch_label에 따라 category 결정
    const vacationLabels = ['연차', '반차', '반반차', '공가'];
    const category = vacationLabels.includes(calendar.sch_label) ? 'vacation' : 'event';
    
    return {
      title: calendar.sch_label,
      description: '',
      startDate: startDate,
      endDate: endDate,
      startTime: startTime,
      endTime: endTime,
      allDay: allDay,
      category: category,
      eventType: calendar.sch_label,
      author: calendar.user_name,
      userId: '', // Dashboard API에서 제공하지 않음
      teamId: undefined,
      status: '등록 완료' as const,
    };
  }, [selectedDate]);

  // 정렬된 캘린더 데이터 (useMemo로 메모이제이션하여 불필요한 재정렬 방지)
  const calendarBadges = ['연차', '반차', '반반차', '공가', '외부 일정', '재택'];
  const sortedCalendar = useMemo(() => {
    return [...calendar].sort((a, b) => {
      const indexA = calendarBadges.indexOf(a.sch_label);
      const indexB = calendarBadges.indexOf(b.sch_label);
      // calendarBadges에 없는 경우 맨 뒤로 정렬
      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }, [calendar]);

  // selectedEventData 메모이제이션 (Dialog 리렌더링 최소화)
  const selectedEventData = useMemo(() => {
    return selectedCalendar ? convertCalendarToEventData(selectedCalendar) : undefined;
  }, [selectedCalendar, convertCalendarToEventData]);

  return { 
    wlog, 
    vacation, 
    notification, 
    calendar: sortedCalendar, // 정렬된 캘린더 반환
    meetingroom, 
    notice,
    // EventViewDialog 관련
    isEventDialogOpen,
    selectedCalendar,
    selectedEventData, // 메모이제이션된 이벤트 데이터
    handleCalendarClick,
    handleCloseDialog
  };
}

