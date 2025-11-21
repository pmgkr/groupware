import { useState, useEffect } from 'react';
import { dashboardApi, type Vacation, type Calendar, type Meetingroom, type Notification } from '@/api/dashboard';

export function useDashboard() {
  const [vacation, setVacation] = useState<Vacation | null>(null);
  const [notification, setNotification] = useState<Notification[]>([]);
  const [calendar, setCalendar] = useState<Calendar[]>([]);
  const [meetingroom, setMeetingroom] = useState<Meetingroom[]>([]);

  useEffect(() => {
    const fetchVacation = async () => {
      try {
        const currentYear = new Date().getFullYear();
        const data = await dashboardApi.getVacation(currentYear);
        setVacation(data);
      } catch (error) {
        console.error('휴가 정보 조회 실패:', error);
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

    fetchVacation();
    fetchNotification();
    fetchCalendar();
    fetchMeetingroom();
  }, []);

  return { vacation, notification, calendar, meetingroom };
}

