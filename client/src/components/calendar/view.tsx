// src/components/calendar/view.tsx
import React, { useEffect, useState } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import type { View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "../../assets/scss/calendar.scss";
import { ko } from "date-fns/locale/ko";
import { getCachedHolidays, isHolidayCached, getHolidayNameCached } from "@/services/holidayApi"
import type { Holiday } from "@/types/holiday"

const locales = { ko };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

// 날짜 헤더 영역 커스텀
const DateHeader = ({ label, date, holidays }: { label: string; date: Date; holidays: Holiday[] }) => {
  // 날짜를 yyyyMMdd 형식으로 변환하여 공휴일 확인
  const dateString = format(date, "yyyyMMdd");
  const holiday = holidays.find((h) => h.locdate.toString() === dateString);
  
  return (
    <>
      <span className="day-number">{label}</span>
      {holiday && <div className="holiday-title">{holiday.dateName}</div>}
    </>
  );
};

// 이벤트 영역 커스텀
const EventComponent = ({ event }: { event: any }) => (
  <div className={`event-item ${getEventStyleClass(event.title)}`}>
    <div className="event-title">{event.title}</div>
    <div className="event-author">{event.author}</div>
  </div>
);

// 휴가 종류에 따라 클래스 부여
const getEventStyleClass = (title: string) => {
  if (title.includes("연차")) return "event-vacation";
  if (title.includes("오전 반차") || title.includes("오후 반차")) return "event-half-day";
  if (title.includes("오전 반반차") || title.includes("오후 반반차")) return "event-half-half-day";
  if (title.includes("외부 일정")) return "event-external";
  return "event-default";
};

// 주말 클래스 부여
const dayPropGetter = (date: Date) => {
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6 ? { className: "rbc-weekend" } : {};
};

interface CalendarViewProps {
  events: any[];
  currentDate: Date;
  currentView: View;
  onNavigate?: (newDate: Date, view: string, action: string) => void;
  onViewChange?: (newView: View) => void;
}

export default function CalendarView({ events, currentDate, currentView, onNavigate, onViewChange }: CalendarViewProps) {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [holidayCache, setHolidayCache] = useState<Map<string, boolean>>(new Map());
  const [holidayNameCache, setHolidayNameCache] = useState<Map<string, string>>(new Map());

  // 연도별 공휴일 불러오기
  useEffect(() => {
    if (currentDate) {
      const year = currentDate.getFullYear();
      console.log('공휴일 로딩 시작, 연도:', year);
      loadHolidays(year);
    }
  }, [currentDate]);

  const loadHolidays = async (year: number) => {
    try {
      console.log('공휴일 API 호출 시작, 연도:', year);
      const yearHolidays = await getCachedHolidays(year);
      console.log('받아온 공휴일 데이터:', yearHolidays);
      setHolidays(yearHolidays);
      
      // 캐시 초기화
      const newHolidayCache = new Map<string, boolean>();
      const newHolidayNameCache = new Map<string, string>();
      
      yearHolidays.forEach(holiday => {
        // locdate를 사용하여 캐시 키 생성
        const dateKey = holiday.locdate.toString();
        newHolidayCache.set(dateKey, true);
        newHolidayNameCache.set(dateKey, holiday.dateName);
        console.log('캐시에 추가:', dateKey, holiday.dateName);
      });
      
      console.log('공휴일 캐시 설정 완료:', newHolidayCache.size, '개');
      setHolidayCache(newHolidayCache);
      setHolidayNameCache(newHolidayNameCache);
    } catch (error) {
      console.error('공휴일 정보를 로드하는 중 오류가 발생했습니다:', error);
    }
  };

  // 특정 날짜가 공휴일인지 확인
  const isHoliday = (date: Date): boolean => {
    const dateString = format(date, 'yyyyMMdd');
    const result = holidayCache.get(dateString) || false;
    console.log('공휴일 확인:', format(date, 'yyyy-MM-dd'), '결과:', result, '캐시 크기:', holidayCache.size);
    return result;
  };

  // 공휴일 이름 가져오기
  const getHolidayName = (date: Date): string | null => {
    const dateString = format(date, 'yyyyMMdd');
    return holidayNameCache.get(dateString) || null;
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
        dayPropGetter={dayPropGetter}
        onNavigate={onNavigate}
        onView={onViewChange}
        defaultView="month"
        views={["month", "week", "day"]}
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
