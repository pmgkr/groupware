// client/src/components/calendar/calendar.tsx
import { useState } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format } from "date-fns/format";
import { parse } from "date-fns/parse";
import { startOfWeek } from "date-fns/startOfWeek";
import { getDay } from "date-fns/getDay";
import "react-big-calendar/lib/css/react-big-calendar.css"; 
import "../../assets/scss/calendar.scss"; // 커스텀 SCSS 적용

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

const events = [
  {
    title: "회의",
    start: new Date(2025, 7, 28, 10, 0),
    end: new Date(2025, 7, 28, 11, 0),
  },
  {
    title: "프로젝트 마감",
    start: new Date(2025, 7, 30, 9, 0),
    end: new Date(2025, 7, 30, 10, 0),
  },
];

export default function CustomCalendar() {
  const [myEvents] = useState(events);

  return (
    <div className="p-4">
      <Calendar
        localizer={localizer}
        events={myEvents}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 600 }}
        className="bg-gray-50 border border-gray-200 rounded-lg"
      />
    </div>
  );
}
