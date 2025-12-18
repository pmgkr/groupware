import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import type { CalendarEvent } from '@/utils/calendarHelper';
import { validateUser, formatErrorMessage } from '@/utils/calendarHelper';
import { loadCalendarEvents, createCalendarEvent } from '@/services/calendarService';
import { notificationApi } from '@/api/notification';
import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';
import { defaultEventTitleMapper } from '@/components/calendar/config';
import { findManager } from '@/utils/managerHelper';

interface UseCalendarProps {
  filterMyEvents?: boolean;
}

export function useCalendar({ filterMyEvents = false }: UseCalendarProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addAlert } = useAppAlert();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  const loadEvents = useCallback(async (date: Date, filterMy: boolean) => {
    try {
      const calendarEvents = await loadCalendarEvents({
        date,
        filterMyEvents: filterMy,
        currentUser: user || undefined
      });
      setEvents(calendarEvents);
    } catch (err) {
      navigate('/404', {
        state: {
          code: '503',
          title: '일정 불러오기 실패',
          message: err instanceof Error ? err.message : '일정을 불러오는데 실패했습니다.'
        }
      });
      setEvents([]);
    }
  }, [user, navigate]);

  const handleSaveEvent = useCallback(async (eventData: any) => {
    try {
      const userValidation = validateUser(user);
      if (!userValidation.valid) {
        navigate('/404', {
          state: {
            code: '401',
            title: '인증 실패',
            message: userValidation.error || '사용자 정보를 불러올 수 없습니다.'
          }
        });
        return false;
      }

      await createCalendarEvent({
        eventData,
        user: {
          user_id: user!.user_id!,
          team_id: user!.team_id!
        }
      });

      // 알림 전송
      if (user?.team_id != null) {
        try {
          const manager = await findManager(user.team_id);              // 이벤트/휴가 공통 라벨 (calendar config 매퍼 사용)
          const eventLabel = defaultEventTitleMapper(eventData?.eventType || '') || (eventData.title || '일정');

          if (manager.id) {

            // 팀장
            await notificationApi.registerNotification({
              user_id: manager.id,
              user_name: manager.name,
              noti_target: user!.user_id!,
              noti_title: `${eventLabel} (${eventData.startDate}-${eventData.endDate})`,
              noti_message: `일정을 등록했습니다.`,
              noti_type: eventData.category,
              noti_url: '/calendar',
            });

            // 본인
            await notificationApi.registerNotification({
              user_id: user!.user_id!,
              user_name: user!.user_name || '',
              noti_target: user!.user_id!,
              noti_title: `${eventLabel} (${eventData.startDate}-${eventData.endDate})`,
              noti_message: `일정을 등록했습니다.`,
              noti_type: eventData.category,
              noti_url: '/calendar',
            });
          }
        } catch (e) {
          console.error('알림 전송 실패:', e);
        }
      }

      addAlert({
        title: '일정 등록 완료',
        message: `<p><span class="text-primary-blue-500 font-semibold">${eventLabel}(${eventData.startDate}~${eventData.endDate})</span>이(가) 등록되었습니다.</p>`,
        duration: 2000,
      });

      await loadEvents(currentDate, filterMyEvents);
      return true;
    } catch (err: any) {
      const errorMessage = formatErrorMessage(err);
      navigate('/404', {
        state: {
          code: '500',
          title: '일정 등록 실패',
          message: errorMessage
        }
      });
      
      try {
        await loadEvents(currentDate, filterMyEvents);
      } catch (reloadErr) {
        // Silent fail
      }
      return true;
    }
  }, [user, currentDate, filterMyEvents, loadEvents, navigate, addAlert]);

  const handleDateChange = useCallback((date: Date) => {
    setCurrentDate(date);
  }, []);

  useEffect(() => {
    loadEvents(currentDate, filterMyEvents);
  }, [filterMyEvents, currentDate, loadEvents]);

  return {
    events,
    handleSaveEvent,
    handleDateChange
  };
}

