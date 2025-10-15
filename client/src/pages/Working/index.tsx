import React, { useState, useMemo } from "react";
import dayjs from "dayjs";
import { Button } from "@components/ui/button";
import Toolbar from "@components/working/toolbar";
import Table from "@components/working/table";
import WorkHoursBar from "@components/ui/WorkHoursBar";
import { Badge } from "@components/ui/badge";
// 근무 데이터 타입 정의
interface WorkData {
  date: string;
  workType: "일반근무" | "외부근무" | "오전반차" | "오전반반차" | "오후반차" | "오후반반차";
  startTime: string;
  endTime: string;
  basicHours: number;
  basicMinutes: number;
  overtimeHours: number;
  overtimeMinutes: number;
  totalHours: number;
  totalMinutes: number;
  overtimeStatus: "신청하기" | "승인대기" | "승인완료" | "반려됨";
  dayOfWeek: string;
  rejectionDate?: string;
  rejectionReason?: string;
  // 신청 데이터 추가
  overtimeData?: {
    expectedEndTime: string;
    expectedEndMinute: string;
    mealAllowance: string;
    transportationAllowance: string;
    overtimeHours: string;
    overtimeType: string;
    clientName: string;
    workDescription: string;
  };
}

// 주차 계산 함수
const getWeekOfMonth = (date: Date) => {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const firstWeekday = firstDay.getDay();
  const dayOfMonth = date.getDate();
  
  const weekNumber = Math.ceil((dayOfMonth + firstWeekday) / 7);
  return weekNumber;
};

// 주차 이름 변환 함수
const getWeekName = (weekNumber: number) => {
  const weekNames = ['첫째', '둘째', '셋째', '넷째', '다섯째', '여섯째'];
  return weekNames[weekNumber - 1] || '첫째';
};

// 주간 샘플 데이터 생성 함수 (9월 22일-28일만 샘플 데이터)
const generateWeekData = (startDate: Date): WorkData[] => {
  const weekData: WorkData[] = [];
  const daysOfWeek = ['월', '화', '수', '목', '금', '토', '일'];
  
  // 9월 22일-28일 샘플 데이터 (2025년)
  const sampleDataMap: { [key: string]: Omit<WorkData, 'date' | 'dayOfWeek'> } = {
    '2025-09-29': { // 일요일
      workType: "오전반반차",
      startTime: "-",
      endTime: "-",
      basicHours: 0,
      basicMinutes: 0,
      overtimeHours: 0,
      overtimeMinutes: 0,
      totalHours: 0,
      totalMinutes: 0,
      overtimeStatus: "신청하기"
    },
    '2025-09-30': { // 월요일
      workType: "일반근무",
      startTime: "09:00",
      endTime: "18:00",
      basicHours: 8,
      basicMinutes: 0,
      overtimeHours: 0,
      overtimeMinutes: 0,
      totalHours: 8,
      totalMinutes: 0,
      overtimeStatus: "신청하기"
    },
    '2025-10-01': { // 화요일
      workType: "일반근무",
      startTime: "09:30",
      endTime: "18:40",
      basicHours: 8,
      basicMinutes: 0,
      overtimeHours: 1,
      overtimeMinutes: 10,
      totalHours: 9,
      totalMinutes: 10,
      overtimeStatus: "승인대기"
    },
    '2025-10-02': { // 수요일
      workType: "외부근무",
      startTime: "10:00",
      endTime: "17:00",
      basicHours: 7,
      basicMinutes: 0,
      overtimeHours: 0,
      overtimeMinutes: 0,
      totalHours: 7,
      totalMinutes: 0,
      overtimeStatus: "신청하기"
    },
    '2025-10-03': { // 목요일
      workType: "일반근무",
      startTime: "09:00",
      endTime: "20:00",
      basicHours: 8,
      basicMinutes: 0,
      overtimeHours: 3,
      overtimeMinutes: 0,
      totalHours: 11,
      totalMinutes: 0,
      overtimeStatus: "승인완료"
    },
    '2025-10-04': { // 금요일
      workType: "일반근무",
      startTime: "08:30",
      endTime: "17:30",
      basicHours: 8,
      basicMinutes: 0,
      overtimeHours: 1,
      overtimeMinutes: 0,
      totalHours: 9,
      totalMinutes: 0,
      overtimeStatus: "신청하기"
    },
    '2025-10-05': { // 토요일
      workType: "일반근무",
      startTime: "10:00",
      endTime: "16:00",
      basicHours: 6,
      basicMinutes: 0,
      overtimeHours: 0,
      overtimeMinutes: 0,
      totalHours: 6,
      totalMinutes: 0,
      overtimeStatus: "반려됨",
      rejectionDate: "2025-10-06",
      rejectionReason: "주말 근무는 사전 승인이 필요합니다. 담당자와 상의 후 재신청해주세요."
    }
  };
  
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    
    const dateString = dayjs(currentDate).format('YYYY-MM-DD');
    const dayOfWeek = daysOfWeek[i];
    
    // 데이터가 없는 경우
    const sampleData = sampleDataMap[dateString] || {
      workType: "" as const,
      startTime: "-",
      endTime: "-",
      basicHours: 0,
      basicMinutes: 0,
      overtimeHours: 0,
      overtimeMinutes: 0,
      totalHours: 0,
      totalMinutes: 0,
      overtimeStatus: "신청하기" as const,
      rejectionDate: undefined,
      rejectionReason: undefined
    };
    
    const workData: WorkData = {
      date: dateString,
      dayOfWeek: dayOfWeek,
      ...sampleData
    };
    
    weekData.push(workData);
  }
  
  return weekData;
};

export default function WorkHoursTable() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('table');
  
  // 현재 주의 시작일 계산 (월요일부터 시작)
  const getWeekStartDate = (date: Date) => {
    const startDate = new Date(date);
    const day = startDate.getDay();
    // 일요일(0)인 경우 -6, 월요일(1)인 경우 -0, 화요일(2)인 경우 -1, ...
    const daysToSubtract = day === 0 ? 6 : day - 1;
    startDate.setDate(startDate.getDate() - daysToSubtract);
    return startDate;
  };
  
  // 현재 주의 시작일을 메모이제이션
  const weekStartDate = useMemo(() => getWeekStartDate(currentDate), [currentDate]);
  const weekData = useMemo(() => generateWeekData(weekStartDate), [weekStartDate]);
  const [data, setData] = useState<WorkData[]>(() => weekData);
  
  // 헤더용 셀렉트 설정 (현재는 사용하지 않음)
  const selectConfigs: any[] = [];

  const handleOvertimeRequest = (index: number, overtimeData?: any) => {
    const newData = [...data];
    const currentStatus = newData[index].overtimeStatus;
    
    if (currentStatus === "신청하기" || currentStatus === "반려됨") {
      newData[index].overtimeStatus = "승인대기";
      // 신청 데이터 저장
      if (overtimeData) {
        newData[index].overtimeData = overtimeData;
      }
      // 재신청인 경우 반려 정보 초기화
      if (currentStatus === "반려됨") {
        newData[index].rejectionDate = undefined;
        newData[index].rejectionReason = undefined;
      }
    }
    setData(newData);
  };

  const handleOvertimeCancel = (index: number) => {
    const newData = [...data];
    if (newData[index].overtimeStatus === "승인대기") {
      newData[index].overtimeStatus = "신청하기";
      newData[index].overtimeHours = 0;
      newData[index].totalHours = newData[index].basicHours;
    }
    setData(newData);
  };

  const handleOvertimeReapply = (index: number) => {
    // 재신청하기 버튼 클릭 시에는 상태를 변경하지 않음
    // 실제 신청이 완료될 때만 상태가 변경됨
    console.log('재신청하기 버튼 클릭:', index);
  };

  // 헤더 관련 함수들
  const onNavigate = (action: 'PREV' | 'NEXT' | 'TODAY') => {
    const newDate = new Date(currentDate);
    switch (action) {
      case 'PREV':
        newDate.setDate(newDate.getDate() - 7); // 일주일 전으로
        break;
      case 'NEXT':
        newDate.setDate(newDate.getDate() + 7); // 일주일 후로
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
  };

  const onAddEvent = () => {
    console.log('근무 등록 클릭');
  };

  // 현재 주의 월/주차 표시 형식
  const formatWeekDisplay = (date: Date) => {
    const month = date.getMonth() + 1;
    const weekNumber = getWeekOfMonth(date);
    const weekName = getWeekName(weekNumber);
    return `${month}월 ${weekName}주`;
  };

  // currentDate가 변경될 때 data 업데이트
  React.useEffect(() => {
    setData(weekData);
  }, [currentDate]);

  // 주간 근무시간 통계 계산
  const weeklyStats = useMemo(() => {
    const totalBasicHours = weekData.reduce((sum, day) => sum + day.basicHours, 0);
    const totalBasicMinutes = weekData.reduce((sum, day) => sum + day.basicMinutes, 0);
    const totalOvertimeHours = weekData.reduce((sum, day) => sum + day.overtimeHours, 0);
    const totalOvertimeMinutes = weekData.reduce((sum, day) => sum + day.overtimeMinutes, 0);
    const totalWorkHours = weekData.reduce((sum, day) => sum + day.totalHours, 0);
    const totalWorkMinutes = weekData.reduce((sum, day) => sum + day.totalMinutes, 0);
    const vacationHours = weekData.filter(day => day.workType === "오전반차" || day.workType === "오후반차" || day.workType === "오전반반차" || day.workType === "오후반반차").length * 8; // 반차일은 8시간으로 계산
    const externalHours = weekData.filter(day => day.workType === "외부근무").reduce((sum, day) => sum + day.totalHours, 0);
    
    // 실제 시간과 분 계산
    const totalWorkMinutesAll = (totalWorkHours * 60) + (totalWorkMinutes || 0);
    const workHours = Math.floor(totalWorkMinutesAll / 60);
    const workMinutes = totalWorkMinutesAll % 60;
    
    const remainingMinutes = Math.max(0, (52 * 60) - totalWorkMinutesAll); // 52시간 = 3120분
    const remainingHours = Math.floor(remainingMinutes / 60);
    const remainingMins = remainingMinutes % 60;
    
    return {
      totalBasicHours,
      totalOvertimeHours,
      totalWorkHours,
      vacationHours,
      externalHours,
      workHours,
      workMinutes,
      remainingHours,
      remainingMinutes: remainingMins
    };
  }, [weekData]);

  return (
    <div>
      <Toolbar
        onNavigate={onNavigate}
        onView={onView}
        currentView={currentView}
        currentDate={currentDate}
        selectConfigs={selectConfigs}
        onSelectChange={onSelectChange}
        onAddEvent={onAddEvent}
        formatWeekDisplay={formatWeekDisplay}
        weeklyStats={weeklyStats}
      />

      <Table 
        data={data} 
        onOvertimeRequest={handleOvertimeRequest}
        onOvertimeCancel={handleOvertimeCancel}
        onOvertimeReapply={handleOvertimeReapply}
      />
    </div>
  );
}
