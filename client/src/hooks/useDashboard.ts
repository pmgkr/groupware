import { useState, useEffect } from 'react';
import { dashboardApi, type Vacation, type Calendar, type Meetingroom, type Notification, type Wlog, type Notice } from '@/api/dashboard';
import { formatKST } from '@/utils/date';

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

  return { wlog, vacation, notification, calendar, meetingroom, notice };
}

