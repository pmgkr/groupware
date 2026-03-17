// src/components/calendar/viewMobile.tsx
import { useMemo, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { DayPicker } from '@components/daypicker';
import { Badge } from '@components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getProfileImageUrl, getAvatarFallback } from '@/utils';
import { getBadgeColor } from '@/utils/calendarHelper';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/utils/calendarHelper';
import { getCachedHolidays } from '@/services/holidayApi';
import type { Holiday } from '@/types/holiday';

// 캘린더 배지 목록
const calendarBadges = ['연차', '반차', '반반차', '공가', '외부 일정', '재택'];

interface CalendarViewMobileProps {
  events: CalendarEvent[];
  currentDate: Date;
  onDateChange?: (date: Date) => void;
  onSelectEvent?: (event: CalendarEvent) => void;
}

export default function CalendarViewMobile({ events, currentDate, onDateChange, onSelectEvent }: CalendarViewMobileProps) {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [holidayCache, setHolidayCache] = useState<Map<string, boolean>>(new Map());

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
      yearHolidays.forEach((holiday) => {
        const dateKey = holiday.locdate.toString();
        newHolidayCache.set(dateKey, true);
      });

      setHolidayCache(newHolidayCache);
    } catch (error) {
      console.error('공휴일 불러오기 실패:', error);
    }
  };

  // 날짜 선택 핸들러
  const handleDateSelect = (date: Date | undefined) => {
    if (date && onDateChange) {
      onDateChange(date);
    }
  };

  // 선택된 날짜의 이벤트 필터링 (currentDate 사용)
  // 여러 날에 걸친 이벤트도 포함하도록 시작일과 종료일 사이에 있는지 확인
  const calendarData = useMemo(() => {
    const selectedDateStr = format(currentDate, 'yyyy-MM-dd');
    const selectedDate = new Date(selectedDateStr);
    selectedDate.setHours(0, 0, 0, 0);

    return events.filter((event) => {
      const eventStart = new Date(event.start);
      eventStart.setHours(0, 0, 0, 0);

      const eventEnd = new Date(event.end);
      eventEnd.setHours(23, 59, 59, 999);

      // 선택된 날짜가 이벤트의 시작일과 종료일 사이에 있는지 확인
      return selectedDate >= eventStart && selectedDate <= eventEnd;
    });
  }, [events, currentDate]);

  // 날짜별 클래스 지정 (주말/공휴일)
  const modifiers = useMemo(() => {
    const holidayDates: Date[] = [];
    holidays.forEach((holiday) => {
      const dateStr = holiday.locdate.toString();
      const year = parseInt(dateStr.substring(0, 4));
      const month = parseInt(dateStr.substring(4, 6)) - 1;
      const day = parseInt(dateStr.substring(6, 8));
      holidayDates.push(new Date(year, month, day));
    });

    return {
      weekend: (date: Date) => date.getDay() === 6, // 토요일
      holiday: (date: Date) => {
        const dayOfWeek = date.getDay();
        const dateString = format(date, 'yyyyMMdd');
        const isHoliday = holidayCache.get(dateString) || false;
        return isHoliday || dayOfWeek === 0; // 공휴일 또는 일요일
      },
    };
  }, [holidays, holidayCache]);

  const modifiersClassNames = {
    weekend: 'text-blue-600',
    holiday: 'day-holiday',
  };

  // 일정 클릭 핸들러
  const handleCalendarClick = (event: CalendarEvent) => {
    if (onSelectEvent) {
      onSelectEvent(event);
    }
  };

  return (
    <>
      <div className="shrink-0">
        <DayPicker
          mode="single"
          variant="dashboard"
          month={currentDate}
          selected={currentDate}
          onSelect={handleDateSelect}
          className="gap-0 max-md:p-0 [&_.rdp-weekday]:text-gray-500"
          modifiers={modifiers}
          modifiersClassNames={modifiersClassNames}
          components={{
            Nav: () => <div className="hidden" />,
            MonthCaption: () => <div className="hidden" />,
          }}
        />
      </div>
      <ul className="flex shrink-0 flex-wrap items-center justify-end gap-x-1.5 px-4 py-2 max-md:gap-0! max-md:px-0! max-md:py-3">
        {calendarBadges.map((label) => (
          <li key={label}>
            <Badge variant="dot" className={getBadgeColor(label)}>
              {label}
            </Badge>
          </li>
        ))}
      </ul>
      <div className="min-h-0 flex-1 overflow-y-auto rounded-xl p-4 max-2xl:p-2 max-md:px-0!">
        <ul className="grid grid-cols-3 gap-2 gap-y-4 px-3 max-2xl:grid-cols-2 max-2xl:gap-x-1 max-2xl:gap-y-2 max-md:grid-cols-4!">
          {calendarData.length === 0 ? (
            <li className="col-span-full text-center">
              <span className="text-base text-gray-500">등록된 일정이 없습니다.</span>
            </li>
          ) : (
            calendarData.map((event, index) => (
              <li
                key={`${event.resource?.userId || ''}-${event.title}-${index}`}
                className={`flex items-center gap-x-2 rounded-md p-1 transition-colors ${
                  event.title === '생일' ? '' : 'cursor-pointer hover:bg-gray-50'
                }`}
                onClick={event.title === '생일' ? undefined : () => handleCalendarClick(event)}>
                <Avatar className="hidden">
                  <AvatarImage src={getProfileImageUrl(undefined)} alt={event.author} />
                  <AvatarFallback>{getAvatarFallback(event.resource?.userId || '')}</AvatarFallback>
                </Avatar>
                <div className="max-md:text- flex flex-col text-base">
                  <strong className="leading-[1.2] max-md:text-sm">{event.author}</strong>
                  {event.title === '생일' ? (
                    <Badge
                      variant="dot"
                      className="rounded-none border-none p-0 before:mr-0.5 before:h-auto before:w-auto before:rounded-none before:bg-transparent before:content-['🎂']">
                      <span className="text-[11px] max-md:text-xs">{event.title}</span>
                    </Badge>
                  ) : (
                    <Badge variant="dot" className={`rounded-none border-none p-0 ${getBadgeColor(event.title)}`}>
                      <span className="text-[11px] max-md:text-xs">{event.title}</span>
                    </Badge>
                  )}
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </>
  );
}
