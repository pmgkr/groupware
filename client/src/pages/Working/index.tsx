import React, { useState } from "react";
import dayjs from "dayjs";
import { Button } from "../../components/ui/button";
import Toolbar from "../../components/working/toolbar";
import Table from "../../components/working/table";

// 근무 데이터 타입 정의
interface WorkData {
  date: string;
  workType: "정상근무" | "외부근무" | "휴가";
  startTime: string;
  endTime: string;
  basicHours: number;
  overtimeHours: number;
  totalHours: number;
  overtimeStatus: "신청하기" | "승인대기" | "승인완료";
}

// 샘플 데이터
const workData: WorkData[] = [
  { 
    date: "2025-01-15", 
    workType: "정상근무", 
    startTime: "09:30", 
    endTime: "18:00", 
    basicHours: 8, 
    overtimeHours: 0, 
    totalHours: 8,
    overtimeStatus: "신청하기"
  },
  { 
    date: "2025-01-16", 
    workType: "외부근무", 
    startTime: "10:00", 
    endTime: "17:00", 
    basicHours: 7, 
    overtimeHours: 0, 
    totalHours: 7,
    overtimeStatus: "신청하기"
  },
  { 
    date: "2025-01-17", 
    workType: "정상근무", 
    startTime: "09:00", 
    endTime: "19:00", 
    basicHours: 8, 
    overtimeHours: 2, 
    totalHours: 10,
    overtimeStatus: "승인대기"
  },
  { 
    date: "2025-01-18", 
    workType: "휴가", 
    startTime: "-", 
    endTime: "-", 
    basicHours: 0, 
    overtimeHours: 0, 
    totalHours: 0,
    overtimeStatus: "신청하기"
  },
  { 
    date: "2025-01-19", 
    workType: "정상근무", 
    startTime: "09:30", 
    endTime: "20:00", 
    basicHours: 8, 
    overtimeHours: 2.5, 
    totalHours: 10.5,
    overtimeStatus: "승인완료"
  },
];

export default function WorkHoursTable() {
  const [data, setData] = useState<WorkData[]>(workData);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('table');
  
  // 헤더용 셀렉트 설정
  const selectConfigs = [
    {
      id: 'department',
      placeholder: '부서',
      options: [
        { value: 'dev', label: '개발팀' },
        { value: 'design', label: '디자인팀' },
        { value: 'marketing', label: '마케팅팀' }
      ],
      value: [],
      autoSize: true,
      maxCount: 3,
      searchable: true,
      hideSelectAll: false
    },
    {
      id: 'status',
      placeholder: '상태',
      options: [
        { value: 'normal', label: '정상근무' },
        { value: 'external', label: '외부근무' },
        { value: 'vacation', label: '휴가' }
      ],
      value: [],
      autoSize: true,
      maxCount: 2,
      searchable: false,
      hideSelectAll: true
    }
  ];

  const handleOvertimeRequest = (index: number) => {
    const newData = [...data];
    if (newData[index].overtimeStatus === "신청하기") {
      newData[index].overtimeStatus = "승인대기";
    }
    setData(newData);
  };

  // 헤더 관련 함수들
  const onNavigate = (action: 'PREV' | 'NEXT' | 'TODAY') => {
    const newDate = new Date(currentDate);
    switch (action) {
      case 'PREV':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      case 'NEXT':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case 'TODAY':
        newDate.setTime(Date.now());
        break;
    }
    setCurrentDate(newDate);
  };

  const onView = (view: string) => {
    setCurrentView(view);
  };

  const onSelectChange = (selectId: string, value: string[]) => {
    console.log(`${selectId} changed:`, value);
    // 여기서 필터링 로직 구현
  };

  const onAddEvent = () => {
    console.log('근무 등록 클릭');
    // 근무 등록 모달 또는 페이지로 이동
  };


  return (
    <div className="p-6">
      <Toolbar
        onNavigate={onNavigate}
        onView={onView}
        currentView={currentView}
        currentDate={currentDate}
        selectConfigs={selectConfigs}
        onSelectChange={onSelectChange}
        onAddEvent={onAddEvent}
      />

      <Table 
        data={data} 
        onOvertimeRequest={handleOvertimeRequest} 
      />
    </div>
  );
}
