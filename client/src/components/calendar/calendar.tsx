// client/src/components/calendar/calendar.tsx
import { useState } from "react";
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

const events = [
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
    title: "오전 반반차",
    start: parse("2025-09-02 09:00", "yyyy-MM-dd HH:mm", new Date()),
    end: parse("2025-09-02 10:00", "yyyy-MM-dd HH:mm", new Date()),
    allDay: true,
    author: "이연상",
    description: "오전 반반차입니다.",
    resource: {
      seq: 2,
      userId: "ec1f6076-9fcc-48c6-b0e9-e39dbc29557x",
      teamId: 1,
      schTitle: "오전 반반차",
      schType: "vacation",
      schVacationType: "quarter" as string | null,
      schEventType: null,
      schSdate: "2025-09-02",
      schStime: "09:00:00",
      schEdate: "2025-09-02",
      schEtime: "10:00:00",
      schIsAllday: "Y",
      schIsHoliday: "N",
      schDescription: "오전 반반차입니다.",
      schStatus: "Y",
      schModifiedAt: new Date(),
      schCreatedAt: new Date()
    }
  },
  {
    title: "오후 반반차",
    start: parse("2025-09-02 09:00", "yyyy-MM-dd HH:mm", new Date()),
    end: parse("2025-09-02 10:00", "yyyy-MM-dd HH:mm", new Date()),
    allDay: true,
    author: "이연상",
    description: "오후 반반차입니다.",
    resource: {
      seq: 3,
      userId: "ec1f6076-9fcc-48c6-b0e9-e39dbc29557x",
      teamId: 1,
      schTitle: "오후 반반차",
      schType: "vacation",
      schVacationType: "quarter" as string | null,
      schEventType: null,
      schSdate: "2025-09-02",
      schStime: "09:00:00",
      schEdate: "2025-09-02",
      schEtime: "10:00:00",
      schIsAllday: "Y",
      schIsHoliday: "N",
      schDescription: "오후 반반차입니다.",
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

export default function CustomCalendar() {
  const [myEvents, setMyEvents] = useState(events);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<View>('month');
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  
  // 셀렉트 옵션 설정 => 툴바에 반영됨
  const [selectConfigs, setSelectConfigs] = useState<SelectConfig[]>([
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
        { value: 'type_external', label: '외부일정' },
      ],
      value: [],
      autoSize: true,
      searchable: true,
      hideSelectAll: false,
      maxCount: 0,
    }
  ]);

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
  };

  const handleViewChange = (view: View) => {
    setCurrentView(view);
  };

  // 셀렉트 값 변경 핸들러
  const handleSelectChange = (selectId: string, value: string[]) => {
    setSelectConfigs(prev => 
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

  const handleSaveEvent = (eventData: any) => {
    // eventType에 따른 MySQL enum 값 매핑
    const getSchType = (eventType: string) => {
      if (['eventVacation', 'eventHalfDayMorning', 'eventHalfDayAfternoon', 'eventHalfHalfDayMorning', 'eventHalfHalfDayAfternoon', 'eventOfficialLeave'].includes(eventType)) {
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
        case 'eventHalfHalfDayMorning':
        case 'eventHalfHalfDayAfternoon':
          return 'quarter';
        default:
          return null;
      }
    };

    const getSchEventType = (eventType: string) => {
      switch (eventType) {
        case 'eventWorkFromHome':
          return 'remote';
        case 'eventExternal':
          return 'field';
        default:
          return 'etc';
      }
    };

    const getEventTitle = (eventType: string) => {
      switch (eventType) {
        case 'eventVacation':
          return '연차';
        case 'eventHalfDayMorning':
          return '오전 반차';
        case 'eventHalfDayAfternoon':
          return '오후 반차';
        case 'eventHalfHalfDayMorning':
          return '오전 반반차';
        case 'eventHalfHalfDayAfternoon':
          return '오후 반반차';
        case 'eventOfficialLeave':
          return '공가';
        case 'eventWorkFromHome':
          return '재택';
        case 'eventExternal':
          return '외부 일정';
        default:
          return '일정';
      }
    };

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
  };

  return (
    <div className="calendar-container w-full bg-white">
      <CustomToolbar
        onNavigate={handleNavigate}
        onView={handleViewChange}
        currentView={currentView}
        currentDate={currentDate}
        selectConfigs={selectConfigs}
        onSelectChange={handleSelectChange}
        onAddEvent={handleAddEvent}
      />
      <CalendarView
        events={myEvents}
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
