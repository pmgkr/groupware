// client/src/components/calendar/calendar.tsx
import { useState, useEffect, useMemo } from "react";
import type { View } from "react-big-calendar";
import { parse } from "date-fns/parse";
import CustomToolbar from "./toolbar";
import CalendarView from "./view";
import EventDialog from "./EventDialog";
import EventViewDialog from "./EventViewDialog";
import type { CalendarEvent } from '@/utils/calendarHelper';
import type { SelectConfig, EventTitleMapper, EventFilter } from './config';
import { defaultSelectConfigs, defaultEventTitleMapper, defaultEventFilter } from './config';

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
  const [isEventViewDialogOpen, setIsEventViewDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  
  // 셀렉트 옵션 설정 => 툴바에 반영됨
  const [selectConfigsState, setSelectConfigsState] = useState<SelectConfig[]>(selectConfigs);
  
  // 팀 필터링 state
  const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>([]);

  // initialEvents가 변경되면 myEvents 업데이트
  useEffect(() => {
    setMyEvents(initialEvents);
  }, [initialEvents]);

  // 이벤트 필터링 로직 (기존 필터 + 팀 필터)
  const filteredEvents = useMemo(() => {
    // 기존 필터 적용
    let filtered = eventFilter(myEvents, selectConfigsState);
    
    // 팀 필터 적용
    if (selectedTeamIds.length > 0) {
      filtered = filtered.filter(event => 
        selectedTeamIds.includes(event.resource.teamId)
      );
    }
    
    return filtered;
  }, [myEvents, selectConfigsState, selectedTeamIds, eventFilter]);

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

  // 팀 선택 핸들러
  const handleTeamSelect = (teamIds: number[]) => {
    setSelectedTeamIds(teamIds);
  };

  // 일정 등록 Dialog 핸들러
  const handleAddEvent = () => {
    setIsEventDialogOpen(true);
  };

  const handleCloseEventDialog = () => {
    setIsEventDialogOpen(false);
  };

  // 이벤트 클릭 핸들러
  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEventViewDialogOpen(true);
  };

  // 이벤트 뷰 다이얼로그 닫기
  const handleCloseEventViewDialog = () => {
    setIsEventViewDialogOpen(false);
    setSelectedEvent(null);
  };

  // 사용자가 취소 신청하는 핸들러
  const handleRequestCancelEvent = async () => {
    if (!selectedEvent) {
      throw new Error('선택된 일정이 없습니다.');
    }
    
    // resource가 없으면 에러
    if (!selectedEvent.resource) {
      throw new Error('일정 정보를 찾을 수 없습니다.');
    }
    
    // id로만 이벤트를 찾음 (seq는 사용하지 않음)
    const eventId = selectedEvent.resource.id;
    
    if (!eventId) {
      throw new Error('일정 ID를 찾을 수 없습니다.');
    }

    const { scheduleApi } = await import('@/api/calendar');
    
    // 등록 완료 상태 → 취소 신청 (H로 변경)
    await scheduleApi.updateScheduleStatus(eventId, 'H');
    
    // 다이얼로그 닫기
    handleCloseEventViewDialog();
    
    // 부모 컴포넌트에 날짜 변경 알림하여 데이터 새로고침
    if (onDateChange) {
      onDateChange(currentDate);
    }
  };

  // 매니저가 취소 승인하는 핸들러
  const handleApproveCancelEvent = async () => {
    if (!selectedEvent) {
      throw new Error('선택된 일정이 없습니다.');
    }
    
    // resource가 없으면 에러
    if (!selectedEvent.resource) {
      throw new Error('일정 정보를 찾을 수 없습니다.');
    }
    
    // id로만 이벤트를 찾음 (seq는 사용하지 않음)
    const eventId = selectedEvent.resource.id;
    
    if (!eventId) {
      throw new Error('일정 ID를 찾을 수 없습니다.');
    }

    const { scheduleApi } = await import('@/api/calendar');
    
    // 취소 요청됨 상태 → 취소 완료 (관리자 API 사용)
    await scheduleApi.approveScheduleCancel(eventId);
    
    // 다이얼로그 닫기
    handleCloseEventViewDialog();
    
    // 부모 컴포넌트에 날짜 변경 알림하여 데이터 새로고침
    if (onDateChange) {
      onDateChange(currentDate);
    }
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
      if (['vacationDay', 'vacationHalfMorning', 'vacationHalfAfternoon', 'vacationQuarterMorning', 'vacationQuarterAfternoon', 'vacationOfficial'].includes(eventType)) {
        return 'vacation';
      }
      return 'event';
    };

    const getSchVacationType = (eventType: string): string | null => {
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

    const getSchEventType = (eventType: string) => {
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
        id: undefined, // DB에서 생성된 후에야 id를 받을 수 있음
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
        onTeamSelect={handleTeamSelect}
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
        onSelectEvent={handleSelectEvent}
      />
      
      {/* 일정 등록 Dialog */}
      <EventDialog
        isOpen={isEventDialogOpen}
        onClose={handleCloseEventDialog}
        onSave={handleSaveEvent}
        selectedDate={currentDate}
      />

      {/* 일정 상세 보기 Dialog */}
      <EventViewDialog
        isOpen={isEventViewDialogOpen}
        onClose={handleCloseEventViewDialog}
        onRequestCancel={handleRequestCancelEvent}
        onApproveCancel={handleApproveCancelEvent}
        selectedEvent={selectedEvent ? {
          id: selectedEvent.resource.id?.toString() || selectedEvent.resource.seq?.toString() || '0',
          title: selectedEvent.title,
          description: selectedEvent.description,
          startDate: selectedEvent.resource.schSdate,
          endDate: selectedEvent.resource.schEdate,
          startTime: selectedEvent.resource.schStime,
          endTime: selectedEvent.resource.schEtime,
          allDay: selectedEvent.resource.schIsAllday === 'Y',
          category: selectedEvent.resource.schType,
          eventType: selectedEvent.resource.schVacationType 
            ? `event${selectedEvent.resource.schVacationType.charAt(0).toUpperCase() + selectedEvent.resource.schVacationType.slice(1)}`
            : selectedEvent.resource.schEventType
            ? `event${selectedEvent.resource.schEventType.charAt(0).toUpperCase() + selectedEvent.resource.schEventType.slice(1)}`
            : 'event',
          author: selectedEvent.author,
          userId: selectedEvent.resource.userId,
          teamId: selectedEvent.resource.teamId,
          status: selectedEvent.resource.schStatus === 'Y' 
            ? "등록 완료" 
            : selectedEvent.resource.schStatus === 'H' 
            ? "취소 요청됨" 
            : "취소 완료",
          cancelRequestDate: selectedEvent.resource.schStatus === 'H' ? selectedEvent.resource.schModifiedAt?.toString() : undefined,
          createdAt: selectedEvent.resource.schCreatedAt?.toString()
        } : undefined}
      />
    </div>
  );
}
