import CustomCalendar from '@/components/calendar/calendar';
import { parse } from "date-fns/parse";

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

// 커스터마이징된 이벤트 데이터
const customEvents = [
  {
    title: "연차",
    start: parse("2025-08-20 10:00", "yyyy-MM-dd HH:mm", new Date()),
    end: parse("2025-09-05 11:00", "yyyy-MM-dd HH:mm", new Date()),
    allDay: true,
    author: "이연상",
    description: "연차입니다.",
      resource: {
        seq: 1,
        userId: "ec1f6076-9fcc-48c6-b0e9-e39dbc29557x",
        teamId: 1,
        teamName: "dev",
        schTitle: "연차",
      schType: "vacation",
      schVacationType: "day" as string | null,
      schEventType: null,
      schSdate: "2025-08-20",
      schStime: "10:00:00",
      schEdate: "2025-09-05", 
      schEtime: "11:00:00",
      schIsAllday: "Y",
      schIsHoliday: "N",
      schDescription: "연차입니다.",
      schStatus: "Y",
      schModifiedAt: new Date(),
      schCreatedAt: new Date()
    }
  },
  {
    title: "오전 반차",
    start: parse("2025-09-02 09:00", "yyyy-MM-dd HH:mm", new Date()),
    end: parse("2025-09-02 13:00", "yyyy-MM-dd HH:mm", new Date()),
    allDay: false,
    author: "이동훈",
    description: "오전 반차입니다.",
      resource: {
        seq: 2,
        userId: "ec1f6076-9fcc-48c6-b0e9-e39dbc29557y",
        teamId: 2,
        teamName: "design",
        schTitle: "오전 반차",
      schType: "vacation",
      schVacationType: "half" as string | null,
      schEventType: null,
      schSdate: "2025-09-02",
      schStime: "09:00:00",
      schEdate: "2025-09-02",
      schEtime: "13:00:00",
      schIsAllday: "N",
      schIsHoliday: "N",
      schDescription: "오전 반차입니다.",
      schStatus: "Y",
      schModifiedAt: new Date(),
      schCreatedAt: new Date()
    }
  },
  {
    title: "오전 반반차",
    start: parse("2025-09-03 09:00", "yyyy-MM-dd HH:mm", new Date()),
    end: parse("2025-09-03 10:00", "yyyy-MM-dd HH:mm", new Date()),
    allDay: false,
    author: "이동훈",
    description: "오전 반반차입니다.",
      resource: {
        seq: 3,
        userId: "ec1f6076-9fcc-48c6-b0e9-e39dbc29557z",
        teamId: 3,
        teamName: "design",
        schTitle: "오전 반반차",
      schType: "vacation",
      schVacationType: "quarter" as string | null,
      schEventType: null,
      schSdate: "2025-09-03",
      schStime: "09:00:00",
      schEdate: "2025-09-03",
      schEtime: "10:00:00",
      schIsAllday: "N",
      schIsHoliday: "N",
      schDescription: "오전 반반차입니다.",
      schStatus: "Y",
      schModifiedAt: new Date(),
      schCreatedAt: new Date()
    }
  },
  {
    title: "오후 반차",
    start: parse("2025-09-04 13:00", "yyyy-MM-dd HH:mm", new Date()),
    end: parse("2025-09-04 18:00", "yyyy-MM-dd HH:mm", new Date()),
    allDay: false,
    author: "이동훈",
    description: "오후 반차입니다.",
      resource: {
        seq: 4,
        userId: "ec1f6076-9fcc-48c6-b0e9-e39dbc29557a",
        teamId: 1,
        teamName: "design",
        schTitle: "오후 반차",
      schType: "vacation",
      schVacationType: "half" as string | null,
      schEventType: null,
      schSdate: "2025-09-04",
      schStime: "13:00:00",
      schEdate: "2025-09-04",
      schEtime: "18:00:00",
      schIsAllday: "N",
      schIsHoliday: "N",
      schDescription: "오후 반차입니다.",
      schStatus: "Y",
      schModifiedAt: new Date(),
      schCreatedAt: new Date()
    }
  },
  {
    title: "외부 일정",
    start: parse("2025-08-30 09:00", "yyyy-MM-dd HH:mm", new Date()),
    end: parse("2025-09-01 10:00", "yyyy-MM-dd HH:mm", new Date()), 
    allDay: true,
    author: "이연상",
    description: "외부 일정입니다.",
    resource: {
      seq: 4,
      userId: "ec1f6076-9fcc-48c6-b0e9-e39dbc29557x",
      teamId: 1,
      schTitle: "외부 일정",
      schType: "event",
      schVacationType: null,
      schEventType: "field" as string | null,
      schSdate: "2025-08-30",
      schStime: "09:00:00",
      schEdate: "2025-09-01",
      schEtime: "10:00:00",
      schIsAllday: "Y",
      schIsHoliday: "N",
      schDescription: "외부 일정입니다.",
      schStatus: "Y",
      schModifiedAt: new Date(),
      schCreatedAt: new Date()
    }
  },
  {
    title: "외부 일정",
    start: parse("2025-09-20 09:00", "yyyy-MM-dd HH:mm", new Date()),
    end: parse("2025-09-21 10:00", "yyyy-MM-dd HH:mm", new Date()),
    allDay: true,
    author: "이연상",
    description: "외부 일정입니다.",
      resource: {
        seq: 5,
        userId: "ec1f6076-9fcc-48c6-b0e9-e39dbc29557x",
        teamId: 1,
        teamName: "dev",
        schTitle: "외부 일정",
      schType: "event",
      schVacationType: null,
      schEventType: "field" as string | null,
      schSdate: "2025-09-20",
      schStime: "09:00:00",
      schEdate: "2025-09-21",
      schEtime: "10:00:00",
      schIsAllday: "Y",
      schIsHoliday: "N",
      schDescription: "외부 일정입니다.",
      schStatus: "Y",
      schModifiedAt: new Date(),
      schCreatedAt: new Date()
    }
  },
  {
    title: "외부 일정",
    start: parse("2025-09-03 09:00", "yyyy-MM-dd HH:mm", new Date()),
    end: parse("2025-09-03 10:00", "yyyy-MM-dd HH:mm", new Date()), 
    allDay: true,
    author: "이연상",
    description: "외부 일정입니다.",
      resource: {
        seq: 6,
        userId: "ec1f6076-9fcc-48c6-b0e9-e39dbc29557x",
        teamId: 1,
        teamName: "dev",
        schTitle: "외부 일정",
      schType: "event",
      schVacationType: null,
      schEventType: "field" as string | null,
      schSdate: "2025-09-03",
      schStime: "09:00:00",
      schEdate: "2025-09-03",
      schEtime: "10:00:00",
      schIsAllday: "Y",
      schIsHoliday: "N",
      schDescription: "외부 일정입니다.",
      schStatus: "Y",
      schModifiedAt: new Date(),
      schCreatedAt: new Date()
    }
  },
];

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
  return (
    <CustomCalendar 
      initialEvents={customEvents}
      selectConfigs={customSelectConfigs}
      eventTitleMapper={customEventTitleMapper}
      eventFilter={customEventFilter}
      defaultView="month"
      defaultDate={new Date()}
    />
  );
} 