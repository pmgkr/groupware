import { useState, useEffect } from 'react';
import { dashboardApi, type Vacation, type Calendar, type Meetingroom, type Notification, type Wlog, type Notice } from '@/api/dashboard';

export function useDashboard() {
  const [wlog, setWlog] = useState<Wlog>({
    wlogWeek: [],
    wlogToday: []
  });
  const [vacation, setVacation] = useState<Vacation | null>(null);
  const [notification, setNotification] = useState<Notification[]>([]);
  const [calendar, setCalendar] = useState<Calendar[]>([]);
  const [meetingroom, setMeetingroom] = useState<Meetingroom[]>([]);
  const [notice, setNotice] = useState<Notice[]>([]);
  useEffect(() => {

    const fetchWlog = async () => {
        try {
            const data = await dashboardApi.getWlog();
            console.log('근무시간 정보:', data);
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
            console.log('공지사항 정보:', data);
        } catch (error) {
            console.error('공지사항 정보 조회 실패:', error);
        }
    };
    const fetchCalendar = async () => {
        try {
            const data = await dashboardApi.getCalendar();
            setCalendar(data);
        } catch (error) {
            console.error('캘린더 정보 조회 실패:', error);
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
    fetchCalendar();
    fetchMeetingroom();
    fetchNotice();
  }, []);

  return { wlog, vacation, notification, calendar, meetingroom, notice };
}

