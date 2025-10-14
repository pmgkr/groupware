import CustomCalendar from '@/components/calendar/calendar';
import { parse } from "date-fns/parse";
import { useState, useEffect } from 'react';
import { scheduleApi } from '@/api/calendar';
import type { Schedule } from '@/api/calendar';
import { useAuth } from '@/contexts/AuthContext';

// 타입 정의 (캘린더 컴포넌트와 동일)
interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  author: string;
  description: string;
  resource: {
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

interface SelectConfig {
  id: string;
  placeholder: string;
  options: { value: string; label: string; }[];
  value?: string[];
  autoSize?: boolean;
  maxCount?: number;
  searchable?: boolean;
  hideSelectAll?: boolean;
}

// DB 데이터를 CalendarEvent로 변환하는 함수
const convertScheduleToEvent = (schedule: Schedule): CalendarEvent => {
  const startDate = parse(`${schedule.sch_sdate} ${schedule.sch_stime}`, "yyyy-MM-dd HH:mm:ss", new Date());
  const endDate = parse(`${schedule.sch_edate} ${schedule.sch_etime}`, "yyyy-MM-dd HH:mm:ss", new Date());
  
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
        case 'half': return schedule.sch_stime < '12:00:00' ? '오전 반차' : '오후 반차';
        case 'quarter': return '반반차';
        case 'official': return '공가';
        default: return '휴가';
      }
    } else if (schedule.sch_type === 'event') {
      switch (schedule.sch_event_type) {
        case 'remote': return '재택';
        case 'field': return '외부 일정';
        case 'etc': return '기타 일정';
        default: return '일정';
      }
    }
    return '일정';
  };

  return {
    title: getEventTitle(schedule),
    start: startDate,
    end: endDate,
    allDay: schedule.sch_isAllday === 'Y',
    author: schedule.user_id || '', // 프로덕션 서버에서는 조회 시 반환될 수 있음
    description: schedule.sch_description || '',
    resource: {
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

// 셀렉트 커스터마이징
const customSelectConfigs = [
  {
    id: 'team',
    placeholder: '팀 선택',
    options: [
      { value: 'team_dev', label: '개발팀' },
      { value: 'team_design', label: '디자인팀' },
      { value: 'team_marketing', label: '마케팅팀' },
      { value: 'team_sales', label: '영업팀' },
    ],
    value: [],
    autoSize: true,
    searchable: true,
    hideSelectAll: false,
    maxCount: 0
  },
  {
    id: 'type',
    placeholder: '타입 선택',
    options: [
      { value: 'type_vacation', label: '연차' },
      { value: 'type_halfday', label: '반차' },
      { value: 'type_quarter', label: '반반차' },
      { value: 'type_remote', label: '재택' },
      { value: 'type_field', label: '외부 일정' },
    ],
    value: [],
    autoSize: true,
    searchable: true,
    hideSelectAll: false,
    maxCount: 0,
  }
];

// 이벤트 제목 매핑 커스터마이징
const customEventTitleMapper = (eventType: string) => {
  switch (eventType) {
    case 'eventVacation':
      return '연차';
    case 'eventHalfDayMorning':
      return '오전 반차';
    case 'eventHalfDayAfternoon':
      return '오후 반차';
    case 'eventQuarter':
      return '반반차';
    case 'eventOfficialLeave':
      return '공가';
    case 'eventRemote':
      return '재택';
    case 'eventField':
      return '외부 일정';
    default:
      return '일정';
  }
};

// 이벤트 필터링 커스터마이징
const customEventFilter = (events: CalendarEvent[], selectConfigs: SelectConfig[]) => {
  let filteredEvents = [...events];
  
  // 팀 필터링
  const teamConfig = selectConfigs.find(config => config.id === 'team');
  if (teamConfig && teamConfig.value && teamConfig.value.length > 0) {
    filteredEvents = filteredEvents.filter(event => {
      return teamConfig.value?.some((selectedTeam: string) => {
        if (!event.resource.teamName) return false;
        switch (selectedTeam) {
          case 'team_dev':
            return event.resource.teamName === 'dev';
          case 'team_design':
            return event.resource.teamName === 'design';
          case 'team_marketing':
            return event.resource.teamName === 'marketing';
          case 'team_sales':
            return event.resource.teamName === 'sales';
          default:
            return false;
        }
      });
    });
  }
  
  // 타입 필터링 (휴가 타입)
  const typeConfig = selectConfigs.find(config => config.id === 'type');
  if (typeConfig && typeConfig.value && typeConfig.value.length > 0) {
    filteredEvents = filteredEvents.filter(event => {
      const eventType = event.resource.schType;
      const vacationType = event.resource.schVacationType;
      
      return typeConfig.value?.some((selectedType: string) => {
        switch (selectedType) {
          case 'type_vacation':
            return eventType === 'vacation' && vacationType === 'day';
          case 'type_halfday':
            return eventType === 'vacation' && vacationType === 'half';
          case 'type_quarter':
            return eventType === 'vacation' && vacationType === 'quarter';
          case 'type_remote':
            return eventType === 'event' && event.resource.schEventType === 'remote';
          case 'type_field':
            return eventType === 'event' && event.resource.schEventType === 'field';
          default:
            return false;
        }
      });
    });
  }
  
  return filteredEvents;
};

export default function Calendar() {
  const { user } = useAuth(); // 로그인한 사용자 정보
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  // 현재 날짜 기준으로 데이터 로드
  const loadEvents = async (date: Date = new Date()) => {
    try {
      setLoading(true);
      setError(null);
      
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      
      console.log('Loading events for:', { year, month });
      
      // 실제 API 호출
      console.log('Loading schedules from API...');
      const apiResponse = await scheduleApi.getSchedules({ year, month }) as any;
      console.log('API Response:', apiResponse);
      
      // API 응답에서 실제 스케줄 배열 추출
      const schedules = apiResponse.items?.items || [];
      console.log('Schedules array:', schedules);
      
      // null이 아닌 항목만 필터링하고 변환
      const calendarEvents = schedules
        .filter((schedule: any) => schedule !== null && schedule.sch_sdate)
        .map(convertScheduleToEvent);
      console.log('Calendar events converted:', calendarEvents);
      
      setEvents(calendarEvents);
    } catch (err) {
      console.error('Failed to load events:', err);
      console.error('Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        name: err instanceof Error ? err.name : undefined
      });
      setError(`일정을 불러오는데 실패했습니다: ${err instanceof Error ? err.message : 'Unknown error'}`);
      // 에러 시 빈 배열 사용
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // 일정 등록 핸들러
  const handleSaveEvent = async (eventData: any) => {
    try {
      console.log('Saving event:', eventData);
      
      // eventType에 따른 MySQL enum 값 매핑
      const getSchType = (eventType: string): 'vacation' | 'event' => {
        if (['eventVacation', 'eventHalfDayMorning', 'eventHalfDayAfternoon', 'eventQuarter', 'eventOfficialLeave'].includes(eventType)) {
          return 'vacation';
        }
        return 'event';
      };

      const getSchVacationType = (eventType: string): 'day' | 'half' | 'quarter' | 'official' | null => {
        switch (eventType) {
          case 'eventVacation':
            return 'day';
          case 'eventOfficialLeave':
            return 'official';
          case 'eventHalfDayMorning':
          case 'eventHalfDayAfternoon':
            return 'half';
          case 'eventQuarter':
            return 'quarter';
          default:
            return null;
        }
      };

      const getSchEventType = (eventType: string): 'remote' | 'field' | 'etc' | null => {
        switch (eventType) {
          case 'eventRemote':
            return 'remote';
          case 'eventField':
          case 'eventExternal': // 외부 일정도 field로 매핑
            return 'field';
          case 'eventEtc':
            return 'etc';
          default:
            return null;
        }
      };

      const schType = getSchType(eventData.eventType);
      const schVacationType = getSchVacationType(eventData.eventType);
      const schEventType = getSchEventType(eventData.eventType);

      // 로그인한 사용자 정보 확인
      if (!user?.user_id || !user?.team_id) {
        alert('사용자 정보를 불러올 수 없습니다. 다시 로그인해주세요.');
        return false;
      }

      // 일정 제목 생성
      const getSchTitle = (eventType: string): string => {
        switch (eventType) {
          case 'eventVacation': return '연차';
          case 'eventHalfDayMorning': return '오전 반차';
          case 'eventHalfDayAfternoon': return '오후 반차';
          case 'eventQuarter': return '반반차';
          case 'eventOfficialLeave': return '공가';
          case 'eventRemote': return '재택';
          case 'eventField':
          case 'eventExternal': return '외부 일정';
          case 'eventEtc': return '기타 일정';
          default: return '일정';
        }
      };

      // sch_year 계산 (시작 날짜의 연도)
      const schYear = new Date(eventData.startDate).getFullYear();

      // sch_vacation_used 계산
      const calculateVacationUsed = (eventType: string, startDate: string, endDate: string): number => {
        if (schType !== 'vacation' || !schVacationType) return 0;
        
        switch (schVacationType) {
          case 'day': {
            // 연차: 날짜 차이 계산 (종료일 - 시작일 + 1)
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

      // DB에 저장할 데이터 구조 - 프로덕션 서버 API에 맞춤
      const scheduleData: any = {
        team_id: user.team_id, // 프로덕션 서버 필수 (user_id는 JWT에서 자동 추출)
        sch_title: getSchTitle(eventData.eventType),
        sch_year: schYear, // 프로덕션 서버 필수
        sch_type: schType,
        sch_sdate: eventData.startDate,
        sch_stime: eventData.allDay ? '00:00:00' : `${eventData.startTime}:00`,
        sch_edate: eventData.endDate,
        sch_etime: eventData.allDay ? '23:59:59' : `${eventData.endTime}:00`,
        sch_isAllday: eventData.allDay ? 'Y' : 'N',
        sch_description: eventData.description || '',
        sch_status: 'Y'
      };

      // vacation 타입일 때만 vacation 관련 필드 추가
      if (schVacationType) {
        scheduleData.sch_vacation_type = schVacationType;
        scheduleData.sch_vacation_used = calculateVacationUsed(eventData.eventType, eventData.startDate, eventData.endDate);
      }

      // event 타입일 때만 event_type 추가
      if (schEventType) {
        scheduleData.sch_event_type = schEventType;
      }

      console.log('Schedule data to save:', scheduleData);
      console.log('Schedule data JSON:', JSON.stringify(scheduleData, null, 2));
      console.log('Event data received:', eventData);

      // API 호출하여 DB에 저장
      const result = await scheduleApi.createSchedule(scheduleData);
      console.log('Schedule created:', result);

      // 성공 시 현재 월의 데이터 다시 로드
      await loadEvents(currentDate);
      
      alert('일정이 성공적으로 등록되었습니다!');
      return true;
    } catch (err: any) {
      console.error('Failed to save event:', err);
      console.error('Error data:', err.data);
      console.error('Error message:', err.message);
      console.error('Error status:', err.status);
      
      // 서버 응답 메시지 확인
      let errorMessage = '일정 등록에 실패했습니다';
      if (err.message) {
        errorMessage += `\n에러: ${err.message}`;
      }
      if (err.data) {
        console.error('Server response data:', err.data);
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
      
      alert(errorMessage);
      return false;
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadEvents();
  }, []);

  // 로딩 중일 때
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">일정을 불러오는 중...</div>
      </div>
    );
  }

  // 에러 발생 시
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <CustomCalendar 
      initialEvents={events}
      selectConfigs={customSelectConfigs}
      eventTitleMapper={customEventTitleMapper}
      eventFilter={customEventFilter}
      defaultView="month"
      defaultDate={new Date()}
      onSaveEvent={handleSaveEvent}
      onDateChange={setCurrentDate}
    />
  );
} 