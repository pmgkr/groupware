// client/src/components/calendar/calendar.tsx
import { useState, useEffect } from "react";
import type { View } from "react-big-calendar";
import { parse } from "date-fns/parse";
import CustomToolbar from "./toolbar";
import CalendarView from "./view";
import EventDialog from "./EventDialog";

// 셀렉트 옵션 타입 정의
interface SelectOption {
  value: string;
  label: string;
}

interface SelectConfig {
  id: string;
  placeholder: string;
  options: SelectOption[];
  value?: string[];
  autoSize?: boolean;
  maxCount?: number;
  searchable?: boolean;
  hideSelectAll?: boolean;
}

// 이벤트 타입 정의
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

// 이벤트 제목 매핑 함수 타입
type EventTitleMapper = (eventType: string) => string;

// 이벤트 필터링 함수 타입
type EventFilter = (events: CalendarEvent[], selectConfigs: SelectConfig[]) => CalendarEvent[];

// 캘린더 컴포넌트 Props 타입
interface CustomCalendarProps {
  initialEvents?: CalendarEvent[];
  selectConfigs?: SelectConfig[];
  eventTitleMapper?: EventTitleMapper;
  eventFilter?: EventFilter;
  defaultView?: View;
  defaultDate?: Date;
  onSaveEvent?: (eventData: any) => Promise<boolean>;
  onDateChange?: (date: Date) => void;
}

// 기본 이벤트 제목 매핑 함수
const defaultEventTitleMapper: EventTitleMapper = (eventType: string) => {
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

// 기본 셀렉트 설정
const defaultSelectConfigs: SelectConfig[] = [
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

// 기본 이벤트 필터링 함수
const defaultEventFilter: EventFilter = (events, selectConfigs) => {
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

export default function CustomCalendar({
  initialEvents = [],
  selectConfigs = defaultSelectConfigs,
  eventTitleMapper = defaultEventTitleMapper,
  eventFilter = defaultEventFilter,
  defaultView = 'month',
  defaultDate = new Date(),
  onSaveEvent,
  onDateChange
}: CustomCalendarProps) {
  const [myEvents, setMyEvents] = useState<CalendarEvent[]>(initialEvents);
  const [currentDate, setCurrentDate] = useState(defaultDate);
  const [currentView, setCurrentView] = useState<View>(defaultView);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  
  // 셀렉트 옵션 설정 => 툴바에 반영됨
  const [selectConfigsState, setSelectConfigsState] = useState<SelectConfig[]>(selectConfigs);

  // initialEvents가 변경되면 myEvents 업데이트
  useEffect(() => {
    setMyEvents(initialEvents);
  }, [initialEvents]);

  // 이벤트 필터링 로직
  const filteredEvents = eventFilter(myEvents, selectConfigsState);

  const handleNavigate = (action: 'PREV' | 'NEXT' | 'TODAY') => {
    let newDate = new Date(currentDate);
    
    switch (action) {
      case 'PREV':
        if (currentView === 'month') {
          newDate.setMonth(newDate.getMonth() - 1);
        } else if (currentView === 'week') {
          newDate.setDate(newDate.getDate() - 7);
        } else {
          newDate.setDate(newDate.getDate() - 1);
        }
        break;
      case 'NEXT':
        if (currentView === 'month') {
          newDate.setMonth(newDate.getMonth() + 1);
        } else if (currentView === 'week') {
          newDate.setDate(newDate.getDate() + 7);
        } else {
          newDate.setDate(newDate.getDate() + 1);
        }
        break;
      case 'TODAY':
        newDate = new Date();
        break;
    }
    
    setCurrentDate(newDate);
    // 부모 컴포넌트에 날짜 변경 알림
    if (onDateChange) {
      onDateChange(newDate);
    }
  };

  const handleViewChange = (view: View) => {
    setCurrentView(view);
  };

  // 셀렉트 값 변경 핸들러
  const handleSelectChange = (selectId: string, value: string[]) => {
    setSelectConfigsState(prev => 
      prev.map(config => 
        config.id === selectId 
          ? { ...config, value }
          : config
      )
    );
  };

  // 일정 등록 Dialog 핸들러
  const handleAddEvent = () => {
    setIsEventDialogOpen(true);
  };

  const handleCloseEventDialog = () => {
    setIsEventDialogOpen(false);
  };

  const handleSaveEvent = async (eventData: any) => {
    // 부모 컴포넌트의 onSaveEvent가 있으면 호출
    if (onSaveEvent) {
      const success = await onSaveEvent(eventData);
      if (success) {
        // 성공 시 다이얼로그 닫기
        setIsEventDialogOpen(false);
      }
      return;
    }

    // onSaveEvent가 없으면 기본 동작 (로컬 상태에만 추가)
    // eventType에 따른 MySQL enum 값 매핑
    const getSchType = (eventType: string) => {
      if (['eventVacation', 'eventHalfDayMorning', 'eventHalfDayAfternoon', 'eventQuarter', 'eventOfficialLeave'].includes(eventType)) {
        return 'vacation';
      }
      return 'event';
    };

    const getSchVacationType = (eventType: string): string | null => {
      switch (eventType) {
        case 'eventVacation':
        case 'eventOfficialLeave':
          return 'day';
        case 'eventHalfDayMorning':
        case 'eventHalfDayAfternoon':
          return 'half';
        case 'eventQuarter':
          return 'quarter';
        default:
          return null;
      }
    };

    const getSchEventType = (eventType: string) => {
      switch (eventType) {
        case 'eventRemote':
          return 'remote';
        case 'eventField':
          return 'field';
        default:
          return 'etc';
      }
    };

    const getEventTitle = eventTitleMapper;

    // 새로운 이벤트 생성 (MySQL 테이블 구조에 맞춤)
    const newEvent = {
      title: getEventTitle(eventData.eventType),
      start: parse(`${eventData.startDate} ${eventData.allDay ? '00:00' : eventData.startTime}`, "yyyy-MM-dd HH:mm", new Date()),
      end: parse(`${eventData.endDate} ${eventData.allDay ? '23:59' : eventData.endTime}`, "yyyy-MM-dd HH:mm", new Date()),
      allDay: eventData.allDay,
      author: eventData.author,
      description: eventData.description,
      resource: {
        seq: Date.now(), // 임시 ID (실제로는 DB에서 생성)
        userId: "ec1f6076-9fcc-48c6-b0e9-e39dbc29557x", // 실제로는 로그인한 사용자 ID
        teamId: 1, // 실제로는 사용자의 팀 ID
        schTitle: getEventTitle(eventData.eventType),
        schType: getSchType(eventData.eventType),
        schVacationType: getSchVacationType(eventData.eventType),
        schEventType: getSchEventType(eventData.eventType),
        schSdate: eventData.startDate,
        schStime: eventData.startTime || "00:00:00",
        schEdate: eventData.endDate,
        schEtime: eventData.endTime || "23:59:00",
        schIsAllday: eventData.allDay ? "Y" : "N",
        schIsHoliday: "N",
        schDescription: eventData.description || "",
        schStatus: "Y",
        schModifiedAt: new Date(),
        schCreatedAt: new Date()
      }
    };

    // 이벤트 목록에 추가
    setMyEvents(prev => [...prev, newEvent as any]);
    setIsEventDialogOpen(false);
  };

  return (
    <div className="calendar-container w-full bg-white">
      <CustomToolbar
        onNavigate={handleNavigate}
        onView={handleViewChange}
        currentView={currentView}
        currentDate={currentDate}
        selectConfigs={selectConfigsState}
        onSelectChange={handleSelectChange}
        onAddEvent={handleAddEvent}
      />
      <CalendarView
        events={filteredEvents}
        currentDate={currentDate}
        currentView={currentView}
        onNavigate={(newDate, view, action) => {
          setCurrentDate(newDate);
          setCurrentView(view as View);
        }}
        onViewChange={handleViewChange}
      />
      
      {/* 일정 등록 Dialog */}
      <EventDialog
        isOpen={isEventDialogOpen}
        onClose={handleCloseEventDialog}
        onSave={handleSaveEvent}
        selectedDate={currentDate}
      />
    </div>
  );
}
