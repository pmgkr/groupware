// client/src/components/calendar/calendar.tsx
import { useState } from "react";
import type { View } from "react-big-calendar";
import { parse } from "date-fns/parse";
import CustomToolbar from "./toolbar";
import CalendarView from "./view";

const events = [
  {
    title: "연차",
    start: parse("2025-08-10 10:00", "yyyy-MM-dd HH:mm", new Date()),
    end: parse("2025-09-28 11:00", "yyyy-MM-dd HH:mm", new Date()),
    author: "이연상",
    description: "연차입니다.",
  },
  {
    title: "연차",
    start: parse("2025-09-01 10:00", "yyyy-MM-dd HH:mm", new Date()),
    end: parse("2025-09-05 11:00", "yyyy-MM-dd HH:mm", new Date()),
    author: "이연상",
    description: "연차입니다.",
  },
  {
    title: "오전 반차",
    start: parse("2025-09-02-09:00", "yyyy-MM-dd HH:mm", new Date()),
    end: parse("2025-09-02 10:00", "yyyy-MM-dd HH:mm", new Date()),
    author: "이연상",
    description: "오전 반차입니다.",
  },
  {
    title: "오후 반차",
    start: parse("2025-09-02 13:00", "yyyy-MM-dd HH:mm", new Date()),
    end: parse("2025-09-02 14:00", "yyyy-MM-dd HH:mm", new Date()),
    author: "이연상",
    description: "오후 반차입니다.",
  },
  {
    title: "오후 반차",
    start: parse("2025-09-02 13:00", "yyyy-MM-dd HH:mm", new Date()),
    end: parse("2025-09-02 14:00", "yyyy-MM-dd HH:mm", new Date()),
    author: "이연상",
    description: "오후 반차입니다.",
  },
  {
    title: "오후 반차",
    start: parse("2025-09-02 09:00", "yyyy-MM-dd HH:mm", new Date()),
    end: parse("2025-09-02 10:00", "yyyy-MM-dd HH:mm", new Date()),
    author: "이연상",
    description: "오후 반차입니다.",
  },
  {
    title: "오전 반반차",
    start: parse("2025-09-02 09:00", "yyyy-MM-dd HH:mm", new Date()),
    end: parse("2025-09-02 10:00", "yyyy-MM-dd HH:mm", new Date()),
    author: "이연상",
    description: "오전 반반차입니다.",
  },
  {
    title: "오전 반반차",
    start: parse("2025-09-02 09:00", "yyyy-MM-dd HH:mm", new Date()),
    end: parse("2025-09-02 10:00", "yyyy-MM-dd HH:mm", new Date()),
    author: "이연상",
    description: "오전 반반차입니다.",
  },
  {
    title: "외부 일정",
    start: parse("2025-08-30 09:00", "yyyy-MM-dd HH:mm", new Date()),
    end: parse("2025-09-01 10:00", "yyyy-MM-dd HH:mm", new Date()),
    author: "이연상",
    description: "외부 일정입니다.",
  },
  {
    title: "외부 일정",
    start: parse("2025-09-20 09:00", "yyyy-MM-dd HH:mm", new Date()),
    end: parse("2025-09-21 10:00", "yyyy-MM-dd HH:mm", new Date()),
    author: "이연상",
    description: "외부 일정입니다.",
  },
];

export default function CustomCalendar() {
  const [myEvents] = useState(events);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<View>('month');

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

  return (
    <div className="calendar-container w-full bg-white">
      <CustomToolbar
        onNavigate={handleNavigate}
        onView={handleViewChange}
        currentView={currentView}
        currentDate={currentDate}
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
    </div>
  );
}
