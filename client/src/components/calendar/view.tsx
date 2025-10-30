// src/components/calendar/view.tsx
import React, { useEffect, useState } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import type { View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "../../assets/scss/calendar.scss";
import { ko } from "date-fns/locale/ko";
import { getCachedHolidays } from "@/services/holidayApi";
import type { Holiday } from "@/types/holiday";

const locales = { ko };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });


// 날짜 헤더 커스텀 (주말/공휴일 클래스 추가)
const DateHeader = ({
  label,
  date,
  holidays,
}: {
  label: string;
  date: Date;
  holidays: Holiday[];
}) => {
  const dateString = format(date, "yyyyMMdd");
  const holiday = holidays.find((h) => h.locdate.toString() === dateString);

  const dayOfWeek = date.getDay();
  const classes: string[] = ["day-number"];
  if (dayOfWeek === 6) classes.push("day-weekend");
  if (holiday || dayOfWeek === 0) classes.push("day-holiday");

  return (
    <>
      <span className={classes.join(" ")}>{label}</span>
      {holiday && <div className="holiday-title">{holiday.dateName}</div>}
    </>
  );
};


// 이벤트 렌더링링
const EventComponent = ({ event }: { event: any }) => (
  <div className={`event-item ${getEventStyleClass(event.title)}`}>
    <div className="event-title">{event.title}</div>
    <div className="event-author">{event.author}</div>
  </div>
);

// 이벤트 스타일 클래스
const getEventStyleClass = (title: string) => {
  if (title.includes("연차")) return "event-vacation";
  if (title.includes("오전 반차") || title.includes("오후 반차")) return "event-half-day";
  if (title.includes("오전 반반차") || title.includes("오후 반반차"))
    return "event-half-half-day";
  if (title.includes("외부 일정")) return "event-external";
  return "event-default";
};

// rbc-day-bg 에 붙는 클래스 (배경색상 커스텀용용)
const dayPropGetter = (date: Date, holidayCache: Map<string, boolean>) => {
  const dayOfWeek = date.getDay();
  const dateString = format(date, "yyyyMMdd");
  const isHoliday = holidayCache.get(dateString) || false;

  let className = "";
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    className += " rbc-weekend";
  }
  if (isHoliday) {
    className += " rbc-holiday";
  }

  return { className: className.trim() };
};

interface CalendarViewProps {
  events: any[];
  currentDate: Date;
  currentView: View;
  onNavigate?: (newDate: Date, view: string, action: string) => void;
  onViewChange?: (newView: View) => void;
  onSelectEvent?: (event: any) => void;
}

export default function CalendarView({
  events,
  currentDate,
  currentView,
  onNavigate,
  onViewChange,
  onSelectEvent,
}: CalendarViewProps) {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [holidayCache, setHolidayCache] = useState<Map<string, boolean>>(new Map());
  const [holidayNameCache, setHolidayNameCache] = useState<Map<string, string>>(new Map());

  // 연도별 공휴일 불러오기
  useEffect(() => {
    if (currentDate) {
      const year = currentDate.getFullYear();
      loadHolidays(year);
    }
  }, [currentDate]);

  const loadHolidays = async (year: number) => {
    try {
      const yearHolidays = await getCachedHolidays(year);
      setHolidays(yearHolidays);

      const newHolidayCache = new Map<string, boolean>();
      const newHolidayNameCache = new Map<string, string>();

      yearHolidays.forEach((holiday) => {
        const dateKey = holiday.locdate.toString();
        newHolidayCache.set(dateKey, true);
        newHolidayNameCache.set(dateKey, holiday.dateName);
      });

      setHolidayCache(newHolidayCache);
      setHolidayNameCache(newHolidayNameCache);
    } catch (error) {
      console.error("공휴일 불러오기 실패:", error);
    }
  };

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
          month: { dateHeader: (props) => <DateHeader {...props} holidays={holidays} /> },
          event: EventComponent,
        }}
        dayPropGetter={(date) => dayPropGetter(date, holidayCache)}
        onNavigate={onNavigate}
        onView={onViewChange}
        onSelectEvent={onSelectEvent}
        defaultView="month"
        views={["month", "week", "day", "agenda"]}
        step={60}
        timeslots={1}
        // selectable
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
