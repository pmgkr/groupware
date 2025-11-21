import { parse } from "date-fns/parse";
import type { Schedule } from '@/api/calendar';
import type { UserDTO } from '@/api/auth';

/**
 * 사용자 검증 유틸리티
 */
export const validateUser = (user: UserDTO | null | undefined): { valid: boolean; error?: string } => {
  if (!user?.user_id || user?.team_id === null || user?.team_id === undefined) {
    return {
      valid: false,
      error: '사용자 정보를 불러올 수 없습니다. 다시 로그인해주세요.'
    };
  }
  return { valid: true };
};

/**
 * 에러 메시지 포맷팅 유틸리티
 */
export const formatErrorMessage = (err: any): string => {
  let errorMessage = '일정 등록 중 오류가 발생했습니다';
  
  if (err.message) {
    errorMessage += `\n에러: ${err.message}`;
  }
  
  if (err.data) {
    if (err.data.message) {
      errorMessage += `\n상세: ${err.data.message}`;
    }
    if (err.data.error) {
      errorMessage += `\n${err.data.error}`;
    }
    // 필드별 에러가 있는 경우
    if (err.data.errors) {
      errorMessage += `\n필드 에러: ${JSON.stringify(err.data.errors)}`;
    }
  }
  
  return errorMessage;
};

// CalendarEvent 타입 정의
export interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  author: string;
  description: string;
  resource: {
    id?: number;
    seq: number;
    userId: string;
    teamId: number;
    teamName?: string;
    schTitle: string;
    schType: string;
    schVacationType: string | null;
    schEventType: string | null;
    schSdate: string;
    schStime: string;
    schEdate: string;
    schEtime: string;
    schIsAllday: string;
    schIsHoliday: string;
    schDescription: string;
    schStatus: string;
    schModifiedAt: Date;
    schCreatedAt: Date;
  };
}

/**
 * DB 데이터를 CalendarEvent로 변환하는 함수
 */
export const convertScheduleToEvent = (schedule: Schedule, currentUser?: any): CalendarEvent => {
  const startDate = parse(`${schedule.sch_sdate} ${schedule.sch_stime}`, "yyyy-MM-dd HH:mm:ss", new Date());
  const endDate = parse(`${schedule.sch_edate} ${schedule.sch_etime}`, "yyyy-MM-dd HH:mm:ss", new Date());
  
  // user_name 결정: API에서 제공하면 사용, 없으면 현재 로그인 사용자 정보 활용
  const getUserName = (): string => {
    if (schedule.user_name) return schedule.user_name;
    if (currentUser && schedule.user_id === currentUser.user_id) {
      return currentUser.user_name || currentUser.user_id;
    }
    return schedule.user_id || '';
  };
  
  // 팀명 매핑
  const getTeamName = (teamId: number): string => {
    switch (teamId) {
      case 1: return 'dev';
      case 2: return 'design';
      case 3: return 'marketing';
      case 4: return 'sales';
      default: return 'unknown';
    }
  };

  // 이벤트 제목 생성
  const getEventTitle = (schedule: Schedule): string => {
    // sch_title이 있으면 그대로 사용
    if (schedule.sch_title) {
      return schedule.sch_title;
    }
    
    // 없으면 타입으로 생성
    if (schedule.sch_type === 'vacation') {
      switch (schedule.sch_vacation_type) {
        case 'day': return '연차';
        case 'half': 
          // sch_vacation_time 필드로 오전/오후 구분
          return schedule.sch_vacation_time === 'morning' ? '오전 반차' : '오후 반차';
        case 'quarter': 
          // sch_vacation_time 필드로 오전/오후 구분
          return schedule.sch_vacation_time === 'morning' ? '오전 반반차' : '오후 반반차';
        case 'official': return '공가';
        default: return '휴가';
      }
    } else if (schedule.sch_type === 'event') {
      switch (schedule.sch_event_type) {
        case 'remote': return '재택';
        case 'field': return '외부 일정';
        case 'etc': return '기타';
        default: return '일정';
      }
    }
    return '일정';
  };

  return {
    title: getEventTitle(schedule), // sch_title 또는 타입으로 생성된 제목 ("연차", "재택" 등)
    start: startDate,
    end: endDate,
    allDay: schedule.sch_isAllday === 'Y',
    author: getUserName(), // user_name 표시
    description: schedule.sch_description || '',
    resource: {
      id: schedule.id, // DB의 실제 ID 추가
      seq: schedule.seq || 0,
      userId: schedule.user_id || '',
      teamId: schedule.team_id,
      teamName: getTeamName(schedule.team_id),
      schTitle: getEventTitle(schedule),
      schType: schedule.sch_type,
      schVacationType: schedule.sch_vacation_type || null,
      schEventType: schedule.sch_event_type || null,
      schSdate: schedule.sch_sdate,
      schStime: schedule.sch_stime,
      schEdate: schedule.sch_edate,
      schEtime: schedule.sch_etime,
      schIsAllday: schedule.sch_isAllday,
      schIsHoliday: 'N',
      schDescription: schedule.sch_description || '',
      schStatus: schedule.sch_status,
      schModifiedAt: schedule.sch_modified_at ? new Date(schedule.sch_modified_at) : (schedule.sch_created_at ? new Date(schedule.sch_created_at) : new Date()),
      schCreatedAt: schedule.sch_created_at ? new Date(schedule.sch_created_at) : new Date()
    }
  };
};

/**
 * 일정 등록을 위한 헬퍼 함수들
 */

/**
 * eventType에 따른 MySQL enum 값 매핑
 */
export const getSchType = (eventType: string): 'vacation' | 'event' => {
  if (['vacationDay', 'vacationHalfMorning', 'vacationHalfAfternoon', 'vacationQuarterMorning', 'vacationQuarterAfternoon', 'vacationOfficial'].includes(eventType)) {
    return 'vacation';
  }
  return 'event';
};

/**
 * eventType을 sch_vacation_type으로 변환
 */
export const getSchVacationType = (eventType: string): 'day' | 'half' | 'quarter' | 'official' | null => {
  switch (eventType) {
    case 'vacationDay':
      return 'day';
    case 'vacationOfficial':
      return 'official';
    case 'vacationHalfMorning':
    case 'vacationHalfAfternoon':
      return 'half';
    case 'vacationQuarterMorning':
    case 'vacationQuarterAfternoon':
      return 'quarter';
    default:
      return null;
  }
};

/**
 * eventType을 sch_vacation_time으로 변환
 */
export const getSchVacationTime = (eventType: string): 'morning' | 'afternoon' | null => {
  switch (eventType) {
    case 'vacationHalfMorning':
    case 'vacationQuarterMorning':
      return 'morning';
    case 'vacationHalfAfternoon':
    case 'vacationQuarterAfternoon':
      return 'afternoon';
    default:
      return null;
  }
};

/**
 * eventType을 sch_event_type으로 변환
 */
export const getSchEventType = (eventType: string): 'remote' | 'field' | 'etc' | null => {
  switch (eventType) {
    case 'eventRemote':
      return 'remote';
    case 'eventField':
      return 'field';
    case 'eventEtc':
      return 'etc';
    default:
      return null;
  }
};

/**
 * eventType을 일정 제목으로 변환
 */
export const getSchTitle = (eventType: string): string => {
  switch (eventType) {
    case 'vacationDay': return '연차';
    case 'vacationHalfMorning': return '오전 반차';
    case 'vacationHalfAfternoon': return '오후 반차';
    case 'vacationQuarterMorning': return '오전 반반차';
    case 'vacationQuarterAfternoon': return '오후 반반차';
    case 'vacationOfficial': return '공가';
    case 'eventRemote': return '재택';
    case 'eventField': return '외부 일정';
    case 'eventEtc': return '기타 일정';
    default: return '일정';
  }
};

/**
 * 휴가 사용일수 계산
 */
export const calculateVacationUsed = (
  eventType: string, 
  startDate: string, 
  endDate: string, 
  vacationDaysUsed?: number
): number => {
  const schType = getSchType(eventType);
  const schVacationType = getSchVacationType(eventType);
  
  if (schType !== 'vacation' || !schVacationType) return 0;
  
  // EventDialog에서 이미 계산된 값이 있으면 사용 (공휴일 제외된 값)
  if (vacationDaysUsed !== undefined && vacationDaysUsed > 0) {
    return vacationDaysUsed;
  }
  
  switch (schVacationType) {
    case 'day': {
      // 연차: 날짜 차이 계산 (종료일 - 시작일 + 1)
      // EventDialog에서 계산된 값이 없을 때만 여기서 계산
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    }
    case 'half':
      return 0.5;
    case 'quarter':
      return 0.25;
    case 'official':
      return 0;
    default:
      return 0;
  }
};

/**
 * 시간 계산 함수
 */
export interface TimeCalculationResult {
  stime: string;
  etime: string;
}

export const calculateTimes = (
  schVacationType: 'day' | 'half' | 'quarter' | 'official' | null,
  eventData: {
    allDay?: boolean;
    startTime?: string;
    endTime?: string;
  }
): TimeCalculationResult => {
  // 연차 또는 공가인 경우: 고정 시간 (9:30 ~ 18:30)
  if (schVacationType === 'day' || schVacationType === 'official') {
    return {
      stime: '09:30:00',
      etime: '18:30:00'
    };
  }
  
  // 반차 또는 반반차인 경우: 선택한 시간 기준으로 계산
  if (schVacationType === 'half' || schVacationType === 'quarter') {
    if (!eventData.startTime) {
      return {
        stime: '00:00:00',
        etime: '00:00:00'
      };
    }
    
    const selectedTime = eventData.startTime; // "HH:mm" 형식
    const [hour, minute] = selectedTime.split(':').map(Number);
    
    // 종료 시간 계산 (반차: +4시간, 반반차: +2시간)
    const addHours = schVacationType === 'half' ? 4 : 2;
    let endHour = hour + addHours;
    let endMinute = minute;
    
    // 24시간 넘어가는 경우 처리
    if (endHour >= 24) {
      endHour = endHour - 24;
    }
    
    return {
      stime: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`,
      etime: `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}:00`
    };
  }
  
  // 일반 이벤트인 경우
  return {
    stime: eventData.allDay ? '00:00:00' : `${eventData.startTime}:00`,
    etime: eventData.allDay ? '23:59:59' : `${eventData.endTime}:00`
  };
};


// 대시보드 내 캘린더 컬러 매핑
export const getBadgeColor = (schLabel: string): string => {
  const label = schLabel.toLowerCase();
  
  if (label.includes('반반차')) {
    return 'before:bg-[color:var(--color-primary-purple-500)]';
  }
  if (label.includes('연차')) {
    return 'before:bg-[color:var(--color-primary-blue-500)]';
  }
  if (label.includes('반차')) {
    return 'before:bg-[color:var(--color-primary-pink-500)]';
  }
  if (label.includes('공가')) {
    return 'before:bg-[color:var(--color-red-600)]';
  }
  if (label.includes('외부 일정')) {
    return 'before:bg-[color:var(--color-primary-orange-500)]';
  }
  // 기타 (기본값)
  return 'before:bg-[color:var(--color-gray-500)]';
};
