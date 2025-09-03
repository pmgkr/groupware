// client/src/components/calendar/calendar.tsx
import { useState } from "react";
import type { View } from "react-big-calendar";
import { parse } from "date-fns/parse";
import CustomToolbar from "./toolbar";
import CalendarView from "./view";

// 셀렉트 옵션 타입 정의
interface SelectOption {
  value: string;
  label: string;
}

interface SelectConfig {
  id: string;
  placeholder: string;
  options: SelectOption[];
  value?: string;
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
      userId:"ec1f6076-9fcc-48c6-b0e9-e39dbc29557x",
      eventType:"eventVacation" 
    }
  },
  {
    title: "연차",
    start: parse("2025-09-01 10:00", "yyyy-MM-dd HH:mm", new Date()),
    end: parse("2025-09-05 11:00", "yyyy-MM-dd HH:mm", new Date()),
    allDay: true,
    author: "이연상",
    description: "연차입니다.",
    resource: {
      userId:"ec1f6076-9fcc-48c6-b0e9-e39dbc29557x",
      eventType:"eventVacation" 
    }
  },
  {
    title: "오전 반차",
    start: parse("2025-09-02-09:00", "yyyy-MM-dd HH:mm", new Date()),
    end: parse("2025-09-02 10:00", "yyyy-MM-dd HH:mm", new Date()),
    allDay: true,
    author: "이연상",
    description: "오전 반차입니다.",
    resource: {
      userId:"ec1f6076-9fcc-48c6-b0e9-e39dbc29557x",
      eventType:"eventHalfDay" 
    }
  },
  {
    title: "오후 반차",
    start: parse("2025-09-02 13:00", "yyyy-MM-dd HH:mm", new Date()),
    end: parse("2025-09-02 14:00", "yyyy-MM-dd HH:mm", new Date()),
    allDay: true,
    author: "이연상",
    description: "오후 반차입니다.",
    resource: {
      userId:"ec1f6076-9fcc-48c6-b0e9-e39dbc29557x",
      eventType:"eventHalfDay" 
    }
  },
  {
    title: "오후 반차",
    start: parse("2025-09-02 13:00", "yyyy-MM-dd HH:mm", new Date()),
    end: parse("2025-09-02 14:00", "yyyy-MM-dd HH:mm", new Date()),
    allDay: true,
    author: "이연상",
    description: "오후 반차입니다.",
    resource: {
      userId:"ec1f6076-9fcc-48c6-b0e9-e39dbc29557x",
      eventType:"eventHalfDay" 
    }
  },
  {
    title: "오후 반차",
    start: parse("2025-09-02 09:00", "yyyy-MM-dd HH:mm", new Date()),
    end: parse("2025-09-02 10:00", "yyyy-MM-dd HH:mm", new Date()),
    allDay: true,
    author: "이연상",
    description: "오후 반차입니다.",
    resource: {
      userId:"ec1f6076-9fcc-48c6-b0e9-e39dbc29557x",
      eventType:"eventHalfDay" 
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
      userId:"ec1f6076-9fcc-48c6-b0e9-e39dbc29557x",
      eventType:"eventHalfHalfDay" 
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
      userId:"ec1f6076-9fcc-48c6-b0e9-e39dbc29557x",
      eventType:"eventHalfHalfDay" 
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
      userId:"ec1f6076-9fcc-48c6-b0e9-e39dbc29557x",
      eventType:"eventExternal" 
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
      userId:"ec1f6076-9fcc-48c6-b0e9-e39dbc29557x",
      eventType:"eventExternal" 
    }
  },
];

export default function CustomCalendar() {
  const [myEvents] = useState(events);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<View>('month');
  
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
      value: ''
    },
    {
      id: 'employee',
      placeholder: '직원 선택',
      options: [
        { value: 'emp_001', label: '이연상' },
        { value: 'emp_002', label: '이연상' },
        { value: 'emp_003', label: '이연상' },
        { value: 'emp_004', label: '이연상' },
      ],
      value: ''
    },
    {
      id: 'type',
      placeholder: '타입 선택',
      options: [
        { value: 'type_vacation', label: '연차' },
        { value: 'type_halfday', label: '반차' },
        { value: 'type_halfhalfday', label: '반반차' },
        { value: 'type_external', label: '외부일정' },
      ],
      value: ''
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
  const handleSelectChange = (selectId: string, value: string) => {
    setSelectConfigs(prev => 
      prev.map(config => 
        config.id === selectId 
          ? { ...config, value }
          : config
      )
    );
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
