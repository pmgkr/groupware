import React, { useState, useMemo, useEffect } from "react";
import dayjs from "dayjs";
import { Button } from "@components/ui/button";
import Toolbar from "@components/working/toolbar";
import Table from "@components/working/table";
import WorkHoursBar from "@components/ui/WorkHoursBar";
import { Badge } from "@components/ui/badge";
import Overview from "@components/working/Overview";
import { workingApi } from "@/api/working";
import { useAuth } from "@/contexts/AuthContext";

// 근무 데이터 타입 정의
interface WorkData {
  date: string;
  workType: "-" | "일반근무" | "외부근무" | "재택근무" | "연차" | "오전반차" | "오전반반차" | "오후반차" | "오후반반차" | "공가";
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
      workType: "일반근무" as const,
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
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('table');
  const [isLoading, setIsLoading] = useState(false);
  
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

  // 현재 주의 날짜 범위 표시 형식 (월요일 ~ 일요일)
  const formatWeekDisplay = (date: Date) => {
    // 해당 주의 월요일 구하기
    const dayOfWeek = date.getDay();
    const monday = new Date(date);
    // 일요일(0)인 경우 -6일, 나머지는 -(dayOfWeek-1)일
    const daysToMonday = dayOfWeek === 0 ? -6 : -(dayOfWeek - 1);
    monday.setDate(date.getDate() + daysToMonday);
    
    // 해당 주의 일요일 구하기 (월요일 + 6일)
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const day = d.getDate();
      return `${year}년 ${month}월 ${day}일`;
    };
    
    return `${formatDate(monday)} - ${formatDate(sunday)}`;
  };

  // API에서 근태 로그 데이터 가져오기
  const loadWorkLogs = async () => {
    if (!user?.user_id) return;
    
    setIsLoading(true);
    try {
      // 주의 시작일과 종료일 계산
      const startDate = weekStartDate;
      const endDate = new Date(weekStartDate);
      endDate.setDate(endDate.getDate() + 6);
      
      const sdate = dayjs(startDate).format('YYYY-MM-DD');
      const edate = dayjs(endDate).format('YYYY-MM-DD');
      
      const response = await workingApi.getWorkLogs({
        search_id: user.user_id,
        sdate,
        edate,
      });
      
      console.log('근태 로그 응답:', response);
      console.log('wlog 데이터:', response.wlog);
      console.log('vacation 데이터:', response.vacation);
      
      // vacation 배열의 첫 번째 항목 상세 확인
      if (response.vacation && response.vacation.length > 0) {
        console.log('vacation[0] 상세:', response.vacation[0]);
        console.log('vacation[0] 모든 키:', Object.keys(response.vacation[0]));
      }
      
      // API 데이터를 WorkData 형식으로 변환 (wlog와 vacation 모두 전달)
      const apiData = convertApiDataToWorkData(response.wlog, response.vacation, weekStartDate);
      setData(apiData);
    } catch (error) {
      console.error('근태 로그 로드 실패:', error);
      // 실패 시 샘플 데이터 사용
      setData(weekData);
    } finally {
      setIsLoading(false);
    }
  };
  
  // API 데이터를 WorkData 형식으로 변환하는 함수
  const convertApiDataToWorkData = (wlogs: any[], vacations: any[], startDate: Date): WorkData[] => {
    const daysOfWeek = ['월', '화', '수', '목', '금', '토', '일'];
    const weekData: WorkData[] = [];
    
    console.log('변환 시작 - wlogs:', wlogs);
    console.log('변환 시작 - vacations:', vacations);
    
    // vacation 타입을 workType으로 변환하는 헬퍼 함수
    const getWorkTypeFromVacation = (vacation: any, hasWlog: boolean): WorkData['workType'] => {
      console.log('vacation 데이터:', vacation);
      const kind = vacation.kind;
      const type = vacation.type;
      
      // kind가 없거나 "-"인 경우
      if (!kind || kind === '-') {
        // wlog도 없으면 "-", wlog가 있으면 "일반근무"
        return hasWlog ? '일반근무' : '-';
      }
      
      // 휴가 타입에 따른 분기
      if (kind === 'day') {
        // 연차 (하루 전체 휴가)
        return '연차';
      } else if (kind === 'half') {
        // 반차 (반일 휴가)
        if (type === 'morning') {
          return '오전반차';
        } else if (type === 'afternoon') {
          return '오후반차';
        } else {
          // type이 "-"이거나 없는 경우 기본값
          return '오전반차';
        }
      } else if (kind === 'quarter') {
        // 반반차 (4분의 1일 휴가)
        if (type === 'morning') {
          return '오전반반차';
        } else if (type === 'afternoon') {
          return '오후반반차';
        } else {
          return '오전반반차';
        }
      } else if (kind === 'official') {
        // 공가
        return '공가';
      } else if (kind === 'field') {
        // 외부근무
        return '외부근무';
      } else if (kind === 'remote') {
        // 재택근무
        return '재택근무';
      }
      
      // wlog가 있으면 일반근무, 없으면 "-"
      return hasWlog ? '일반근무' : '-';
    };
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateString = dayjs(currentDate).format('YYYY-MM-DD');
      const dayOfWeek = daysOfWeek[i];
      
      // 해당 날짜의 wlog와 vacation 찾기 (API 실제 필드명 사용)
      const wlog = wlogs.find((log: any) => log.tdate === dateString);
      
      // 해당 날짜의 모든 vacation 찾기 (같은 날에 여러 개 있을 수 있음)
      const vacationsForDate = vacations.filter((vac: any) => vac.tdate === dateString);
      
      console.log(`${dateString} - wlog:`, wlog, ', vacations:', vacationsForDate);
      
      // 우선순위가 가장 높은 vacation 선택
      // 우선순위: day > half > quarter > field > remote > official
      let vacation = null;
      if (vacationsForDate.length > 0) {
        const priorityOrder = ['day', 'half', 'quarter', 'field', 'remote', 'official'];
        for (const kind of priorityOrder) {
          const found = vacationsForDate.find((vac: any) => vac.kind === kind);
          if (found) {
            vacation = found;
            break;
          }
        }
        // 우선순위에 없는 kind가 있는 경우 첫 번째 것 사용
        if (!vacation) {
          vacation = vacationsForDate[0];
        }
      }
      
      // wlog 유무 확인
      const hasWlog = !!(wlog && wlog.stime);
      
      // 근무 구분 결정
      let workType: WorkData['workType'];
      if (vacation) {
        workType = getWorkTypeFromVacation(vacation, hasWlog);
      } else {
        // vacation이 없는 경우: wlog가 있으면 일반근무, 없으면 "-"
        workType = hasWlog ? '일반근무' : '-';
      }
      
      // 출근/퇴근 시간 (HH:mm:ss -> HH:mm 형식으로 변환)
      const formatTime = (time: string | null) => {
        if (!time || time === '-' || time === 'null') return '-';
        // HH:mm:ss 형식에서 HH:mm만 추출
        return time.substring(0, 5);
      };
      
      const startTime = formatTime(wlog?.stime || null);
      const endTime = formatTime(wlog?.etime || null);
      
      if (wlog && wlog.stime && wlog.etime) {
        // 실제 wlog 데이터가 있고 출퇴근 기록이 모두 있는 경우
        // wmin은 총 근무시간(분)이므로 휴게시간 1시간(60분)을 차감
        const totalWorkMinutes = (wlog.wmin || 0) - 60; // 점심시간 1시간 제외
        const hours = Math.floor(totalWorkMinutes / 60);
        const minutes = totalWorkMinutes % 60;
        
        // 기본 근무시간: 8시간 기준
        const basicHours = Math.min(hours, 8);
        const basicMinutes = hours < 8 ? minutes : 0;
        
        // 초과 근무시간 계산 (8시간 이상 근무한 경우)
        let overtimeHours = Math.max(0, hours - 8);
        let overtimeMinutes = hours >= 8 ? minutes : 0;
        
        // 연장근무 신청이 있고 식대를 사용한 경우 저녁시간 1시간(60분) 추가 차감
        // TODO: API에서 연장근무 신청 정보 및 식대 사용 여부 확인 필요
        // 예: if (overtimeData && overtimeData.mealAllowance === 'Y') { ... }
        
        weekData.push({
          date: dateString,
          dayOfWeek,
          workType,
          startTime,
          endTime,
          basicHours,
          basicMinutes,
          overtimeHours,
          overtimeMinutes,
          totalHours: hours,
          totalMinutes: minutes,
          overtimeStatus: "신청하기",
        });
      } else if (wlog && wlog.stime && !wlog.etime) {
        // 출근만 하고 퇴근 안한 경우
        weekData.push({
          date: dateString,
          dayOfWeek,
          workType,
          startTime,
          endTime: "-",
          basicHours: 0,
          basicMinutes: 0,
          overtimeHours: 0,
          overtimeMinutes: 0,
          totalHours: 0,
          totalMinutes: 0,
          overtimeStatus: "신청하기",
        });
      } else {
        // wlog 데이터가 없는 경우
        weekData.push({
          date: dateString,
          dayOfWeek,
          workType,
          startTime: "-",
          endTime: "-",
          basicHours: 0,
          basicMinutes: 0,
          overtimeHours: 0,
          overtimeMinutes: 0,
          totalHours: 0,
          totalMinutes: 0,
          overtimeStatus: "신청하기",
        });
      }
    }
    
    console.log('변환 결과:', weekData);
    return weekData;
  };
  
  // currentDate가 변경될 때 데이터 로드
  useEffect(() => {
    loadWorkLogs();
  }, [currentDate, weekStartDate, user?.user_id]);

  // 주간 근무시간 통계 계산 (실제 데이터 기준)
  const weeklyStats = useMemo(() => {
    const totalBasicHours = data.reduce((sum, day) => sum + day.basicHours, 0);
    const totalBasicMinutes = data.reduce((sum, day) => sum + day.basicMinutes, 0);
    const totalOvertimeHours = data.reduce((sum, day) => sum + day.overtimeHours, 0);
    const totalOvertimeMinutes = data.reduce((sum, day) => sum + day.overtimeMinutes, 0);
    const totalWorkHours = data.reduce((sum, day) => sum + day.totalHours, 0);
    const totalWorkMinutes = data.reduce((sum, day) => sum + day.totalMinutes, 0);
    
    // 휴가 시간 계산 (연차, 반차, 반반차 등)
    const vacationTypes = ["연차", "오전반차", "오후반차", "오전반반차", "오후반반차"];
    const vacationHours = data.filter(day => vacationTypes.includes(day.workType)).length * 8; // 휴가일은 8시간으로 계산
    
    // 외부근무/재택근무 시간 계산
    const externalHours = data.filter(day => day.workType === "외부근무" || day.workType === "재택근무").reduce((sum, day) => sum + day.totalHours, 0);
    
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
  }, [data]);

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
      />
      <Overview weeklyStats={weeklyStats} />
      <Table 
        data={data} 
        onOvertimeRequest={handleOvertimeRequest}
        onOvertimeCancel={handleOvertimeCancel}
        onOvertimeReapply={handleOvertimeReapply}
      />
    </div>
  );
}
