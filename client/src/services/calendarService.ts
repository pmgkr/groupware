import { scheduleApi } from '@/api/calendar';
import { convertScheduleToEvent, type CalendarEvent } from '@/utils/calendarHelper';
import {
  getSchType,
  getSchVacationType,
  getSchVacationTime,
  getSchEventType,
  getSchTitle,
  calculateVacationUsed,
  calculateTimes
} from '@/utils/calendarHelper';

/**
 * 캘린더 이벤트 로드 서비스
 */
export interface LoadEventsParams {
  date: Date;
  filterMyEvents?: boolean;
  currentUser?: {
    user_id?: string;
    user_name?: string;
  };
}

export const loadCalendarEvents = async ({
  date,
  filterMyEvents = false,
  currentUser
}: LoadEventsParams): Promise<CalendarEvent[]> => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  
  // 실제 API 호출
  const apiResponse = await scheduleApi.getSchedules({ year, month }) as any;

  // API 응답에서 실제 스케줄 배열 추출
  const schedules = Array.isArray(apiResponse.items) ? apiResponse.items : (apiResponse.items?.items || []);

  if (Array.isArray(schedules) && schedules.length > 0) {
    console.log('schedules:', schedules);
  }
  
  // null이 아닌 항목, sch_status가 'N'이 아닌 항목만 필터링하고 변환
  let calendarEvents = schedules
    .filter((schedule: any) => schedule !== null && schedule.sch_sdate && schedule.sch_status !== 'N')
    .map((schedule: any) => convertScheduleToEvent(schedule, currentUser));
  
  // "내 일정" 필터링
  if (filterMyEvents && currentUser?.user_id) {
    calendarEvents = calendarEvents.filter((event: CalendarEvent) => event.resource.userId === currentUser.user_id);
  }
  
  return calendarEvents;
};

/**
 * 일정 생성 데이터 인터페이스
 */
export interface CreateEventData {
  eventType: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  startTime?: string;
  endTime?: string;
  description?: string;
  vacationDaysUsed?: number;
}

/**
 * 일정 생성 서비스
 */
export interface CreateEventParams {
  eventData: CreateEventData;
  user: {
    user_id: string;
    team_id: number;
  };
}

export const createCalendarEvent = async ({
  eventData,
  user
}: CreateEventParams): Promise<{ ok: boolean; id: number }> => {
  const schType = getSchType(eventData.eventType);
  const schVacationType = getSchVacationType(eventData.eventType);
  const schVacationTime = getSchVacationTime(eventData.eventType);
  const schEventType = getSchEventType(eventData.eventType);

  // sch_year 계산 (시작 날짜의 연도)
  const schYear = new Date(eventData.startDate).getFullYear();

  // 시간 계산
  const times = calculateTimes(schVacationType, {
    allDay: eventData.allDay,
    startTime: eventData.startTime,
    endTime: eventData.endTime
  });
  
  // DB에 저장할 데이터 구조 - 프로덕션 서버 API에 맞춤
  const scheduleData: any = {
    team_id: user.team_id, // 프로덕션 서버 필수 (user_id는 JWT에서 자동 추출)
    // user_name: user.user_name, // TODO: 프로덕션 서버 업데이트 후 활성화
    sch_title: getSchTitle(eventData.eventType),
    sch_year: schYear, // 프로덕션 서버 필수
    sch_type: schType,
    sch_sdate: eventData.startDate,
    sch_stime: times.stime,
    sch_edate: eventData.endDate,
    sch_etime: times.etime,
    sch_isAllday: eventData.allDay ? 'Y' : 'N',
    sch_description: eventData.description || '',
    sch_status: 'Y'
  };

  // vacation 타입일 때만 vacation 관련 필드 추가
  if (schVacationType) {
    scheduleData.sch_vacation_type = schVacationType;
    scheduleData.sch_vacation_used = calculateVacationUsed(
      eventData.eventType, 
      eventData.startDate, 
      eventData.endDate,
      eventData.vacationDaysUsed
    );
    
    // vacation_time 필드 추가 (반차/반반차의 경우 필수)
    if (schVacationTime) {
      scheduleData.sch_vacation_time = schVacationTime;
    }
  }

  // event 타입일 때만 event_type 추가
  if (schEventType) {
    scheduleData.sch_event_type = schEventType;
  }

  // API 호출하여 DB에 저장
  return await scheduleApi.createSchedule(scheduleData);
};

