// client/src/components/calendar/view.tsx
import React from 'react';
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import type { View } from "react-big-calendar";
import { format } from "date-fns/format";
import { parse } from "date-fns/parse";
import { startOfWeek } from "date-fns/startOfWeek";
import { getDay } from "date-fns/getDay";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "../../assets/scss/calendar.scss";

// locales 설정 (date-fns)
import { ko } from "date-fns/locale/ko";

const locales = {
  "ko": ko,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// 이벤트 타입별 스타일 클래스
const getEventStyleClass = (title: string) => {
  if (title.includes("연차")) return "event-vacation";
  if (title.includes("오전 반차")) return "event-half-day";
  if (title.includes("오후 반차")) return "event-half-day";
  if (title.includes("오전 반반차")) return "event-half-half-day";
  if (title.includes("오후 반반차")) return "event-half-half-day";
  if (title.includes("외부 일정")) return "event-external";
  return "event-default";
};

// 커스텀 이벤트 컴포넌트
const EventComponent = ({ event }: { event: any }) => (
  <div className={`event-item ${getEventStyleClass(event.title)}`}>
    <div className="event-title">{event.title}</div>
    <div className="event-author">{event.author}</div>
  </div>
);

// 주말 날짜에 클래스 추가
const dayPropGetter = (date: Date) => {
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  
  if (isWeekend) {
    return {
      className: 'rbc-weekend'
    };
  }
  return {};
};

interface CalendarViewProps {
  events: any[];
  currentDate: Date;
  currentView: View;
  onNavigate?: (newDate: Date, view: string, action: string) => void;
  onViewChange?: (newView: View) => void;
}

export default function CalendarView({ 
  events, 
  currentDate, 
  currentView,
  onNavigate, 
  onViewChange 
}: CalendarViewProps) {
  return (
    <div className="view-container">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        date={currentDate}
        view={currentView}
        style={{ height: "50vw" }}
        components={{
          event: EventComponent,
        }}
        dayPropGetter={dayPropGetter}
        onNavigate={onNavigate}
        onView={onViewChange}
        defaultView="month"
        views={['month', 'week', 'day']}
        step={60}
        timeslots={1}
        selectable
        popup
        toolbar={false}
        tooltipAccessor={(event) => event.title}
        messages={{
          next: "다음",
          previous: "이전",
          today: "오늘",
          month: "월",
          week: "주",
          day: "일",
          noEventsInRange: "이 기간에 이벤트가 없습니다.",
        }}
      />
    </div>
  );
} 