import type { CalendarEvent } from '@/utils/calendarHelper';

// 셀렉트 옵션 타입 정의
export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectConfig {
  id: string;
  placeholder: string;
  options: SelectOption[];
  value?: string[];
  autoSize?: boolean;
  maxCount?: number;
  searchable?: boolean;
  hideSelectAll?: boolean;
}

// 이벤트 제목 매핑 함수 타입
export type EventTitleMapper = (eventType: string) => string;

// 이벤트 필터링 함수 타입
export type EventFilter = (events: CalendarEvent[], selectConfigs: SelectConfig[]) => CalendarEvent[];

// 기본 이벤트 제목 매핑 함수
export const defaultEventTitleMapper: EventTitleMapper = (eventType: string) => {
  switch (eventType) {
    case 'vacationDay':
      return '연차';
    case 'vacationHalfMorning':
      return '오전 반차';
    case 'vacationHalfAfternoon':
      return '오후 반차';
    case 'vacationQuarterMorning':
      return '오전 반반차';
    case 'vacationQuarterAfternoon':
      return '오후 반반차';
    case 'vacationOfficial':
      return '공가';
    case 'eventRemote':
      return '재택';
    case 'eventField':
      return '외부 일정';
    default:
      return '일정';
  }
};

// 기본 셀렉트 설정
export const defaultSelectConfigs: SelectConfig[] = [
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
      { value: 'type_official', label: '공가' },
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

// 기본 이벤트 필터링 함수
export const defaultEventFilter: EventFilter = (events, selectConfigs) => {
  let filteredEvents = [...events];
  
  // 팀 필터링
  const teamConfig = selectConfigs.find(config => config.id === 'team');
  if (teamConfig && teamConfig.value && teamConfig.value.length > 0) {
    filteredEvents = filteredEvents.filter(event => {
      return teamConfig.value?.some(selectedTeam => {
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
      
      return typeConfig.value?.some(selectedType => {
        switch (selectedType) {
          case 'type_vacation':
            return eventType === 'vacation' && vacationType === 'day';
          case 'type_halfday':
            return eventType === 'vacation' && vacationType === 'half';
          case 'type_quarter':
            return eventType === 'vacation' && vacationType === 'quarter';
          case 'type_official':
            return eventType === 'vacation' && vacationType === 'official';
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

// 셀렉트 커스터마이징 (타입 선택만)
export const customSelectConfigs: SelectConfig[] = [
  {
    id: 'type',
    placeholder: '타입 선택',
    options: [
      { value: 'type_vacation', label: '연차' },
      { value: 'type_halfday', label: '반차' },
      { value: 'type_quarter', label: '반반차' },
      { value: 'type_official', label: '공가' },
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
export const customEventTitleMapper: EventTitleMapper = (eventType: string) => {
  switch (eventType) {
    case 'vacationDay':
      return '연차';
    case 'vacationHalfMorning':
      return '오전 반차';
    case 'vacationHalfAfternoon':
      return '오후 반차';
    case 'vacationQuarterMorning':
      return '오전 반반차';
    case 'vacationQuarterAfternoon':
      return '오후 반반차';
    case 'vacationOfficial':
      return '공가';
    case 'eventRemote':
      return '재택';
    case 'eventField':
      return '외부 일정';
    default:
      return '일정';
  }
};

// 이벤트 필터링 커스터마이징 (타입 필터만)
export const customEventFilter: EventFilter = (events: CalendarEvent[], selectConfigs: SelectConfig[]) => {
  let filteredEvents = [...events];
  
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
          case 'type_official':
            return eventType === 'vacation' && vacationType === 'official';
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

