import dayjs from 'dayjs';
import type { WorkData } from '@/types/working';
import { isHolidayCached } from '@/services/holidayApi';

/**
 * ot_status를 overtimeStatus로 변환
 */
const getOvertimeStatus = (status: string): WorkData['overtimeStatus'] => {
  switch (status) {
    case 'H': return '승인대기';
    case 'T': return '승인완료';
    case 'N': return '반려됨';
    default: return '신청하기';
  }
};

/**
 * ISO 시간 문자열에서 시간/분 추출
 */
const extractTimeFromISO = (isoString: string): { hour: string; minute: string } => {
  const match = isoString.match(/T(\d{2}):(\d{2})/);
  if (match) {
    return {
      hour: String(parseInt(match[1])),
      minute: String(parseInt(match[2]))
    };
  }
  return { hour: '', minute: '' };
};

/**
 * vacation 타입을 workType으로 변환
 */
const getWorkTypeFromVacation = (vacation: any, hasWlog: boolean): WorkData['workType'] => {
  const kind = vacation.kind;
  const type = vacation.type;
  
  // kind가 없거나 "-"인 경우
  if (!kind || kind === '-') {
    // wlog도 없으면 "-", wlog가 있으면 "일반근무"
    return hasWlog ? '일반근무' : '-';
  }
  
  // 휴가 타입에 따른 분기
  if (kind === 'day') {
    return '연차';
  } else if (kind === 'half') {
    if (type === 'morning') {
      return '오전반차';
    } else if (type === 'afternoon') {
      return '오후반차';
    } else {
      return '오전반차';
    }
  } else if (kind === 'quarter') {
    if (type === 'morning') {
      return '오전반반차';
    } else if (type === 'afternoon') {
      return '오후반반차';
    } else {
      return '오전반반차';
    }
  } else if (kind === 'official') {
    return '공가';
  } else if (kind === 'field') {
    return '외부근무';
  } else if (kind === 'remote') {
    return '재택근무';
  }
  
  // wlog가 있으면 일반근무, 없으면 "-"
  return hasWlog ? '일반근무' : '-';
};

/**
 * 출근/퇴근 시간 포맷 (HH:mm:ss -> HH:mm)
 */
const formatTime = (time: string | null): string => {
  if (!time || time === '-' || time === 'null') return '-';
  return time.substring(0, 5);
};

/**
 * 초과근무 신청 데이터 추출
 */
const extractOvertimeData = (overtime: any) => {
  const time = overtime.ot_etime ? extractTimeFromISO(overtime.ot_etime.toString()) : { hour: '', minute: '' };
  
  // ot_hours가 소수점 형태(예: "2.5")인 경우 시간과 분으로 분리
  let overtimeHours = '';
  let overtimeMinutes = '';
  if (overtime.ot_hours) {
    const totalHours = parseFloat(overtime.ot_hours);
    if (!isNaN(totalHours)) {
      overtimeHours = Math.floor(totalHours).toString();
      overtimeMinutes = Math.round((totalHours - Math.floor(totalHours)) * 60).toString();
    }
  }
  
  return {
    expectedEndTime: time.hour,
    expectedEndMinute: time.minute,
    mealAllowance: overtime.ot_food === 'Y' ? 'yes' : overtime.ot_food === 'N' ? 'no' : '',
    transportationAllowance: overtime.ot_trans === 'Y' ? 'yes' : overtime.ot_trans === 'N' ? 'no' : '',
    overtimeHours: overtimeHours,
    overtimeMinutes: overtimeMinutes,
    overtimeType: overtime.ot_reward === 'special' ? 'special_vacation' : 
                  overtime.ot_reward === 'annual' ? 'compensation_vacation' : 
                  overtime.ot_reward === 'pay' ? 'event' : '',
    clientName: overtime.ot_client || '',
    workDescription: overtime.ot_description || '',
  };
};

/**
 * 우선순위가 가장 높은 vacation 선택
 */
const selectPriorityVacation = (vacationsForDate: any[]): any | null => {
  if (vacationsForDate.length === 0) return null;
  
  const priorityOrder = ['day', 'half', 'quarter', 'field', 'remote', 'official'];
  for (const kind of priorityOrder) {
    const found = vacationsForDate.find((vac: any) => vac.kind === kind);
    if (found) return found;
  }
  
  return vacationsForDate[0];
};

/**
 * 근무시간 계산
 */
const calculateWorkHours = (wlog: any, overtime: any) => {
  // 출근 시간과 퇴근 시간 파싱
  const startTime = wlog.stime; // "HH:mm:ss" 형식
  const endTime = wlog.etime;   // "HH:mm:ss" 형식
  
  // 시간을 분 단위로 변환하는 함수
  const timeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  let startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  
  // 9시 30분 기준 (570분)
  const workStartThreshold = 9 * 60 + 30; // 570분
  
  // 출근 시간이 9시 30분 이전이면 9시 30분으로 조정
  if (startMinutes < workStartThreshold) {
    startMinutes = workStartThreshold;
  }
  
  // 점심시간 정의 (12시 ~ 13시)
  const lunchStart = 12 * 60; // 720분 (12:00)
  const lunchEnd = 13 * 60;   // 780분 (13:00)
  
  // 총 근무 시간 계산 (분 단위)
  let totalWorkMinutes = endMinutes - startMinutes;
  
  // 점심시간 제외 계산
  // 근무 시간이 점심시간(12시-13시)과 겹치는 경우 해당 시간을 제외
  let lunchMinutesToDeduct = 0;
  
  if (startMinutes < lunchEnd && endMinutes > lunchStart) {
    // 근무 시간과 점심시간이 겹치는 경우
    const overlapStart = Math.max(startMinutes, lunchStart);
    const overlapEnd = Math.min(endMinutes, lunchEnd);
    lunchMinutesToDeduct = overlapEnd - overlapStart;
  }
  
  totalWorkMinutes = Math.max(0, totalWorkMinutes - lunchMinutesToDeduct);
  
  const hours = Math.floor(totalWorkMinutes / 60);
  const minutes = totalWorkMinutes % 60;
  
  // 기본 근무시간: 8시간 기준
  const basicHours = Math.min(hours, 8);
  const basicMinutes = hours < 8 ? minutes : 0;
  
  // 초과 근무시간 계산 (8시간 이상 근무한 경우)
  let overtimeHours = Math.max(0, hours - 8);
  let overtimeMinutes = hours >= 8 ? minutes : 0;
  
  // 연장근무 신청이 있고 식대를 사용한 경우 저녁시간 1시간(60분) 추가 차감
  if (overtime && overtime.ot_food === 'Y' && overtimeHours > 0) {
    const totalOvertimeMinutes = (overtimeHours * 60) + overtimeMinutes - 60;
    overtimeHours = Math.max(0, Math.floor(totalOvertimeMinutes / 60));
    overtimeMinutes = Math.max(0, totalOvertimeMinutes % 60);
  }
  
  return {
    basicHours,
    basicMinutes,
    overtimeHours,
    overtimeMinutes,
    totalHours: hours,
    totalMinutes: minutes
  };
};

/**
 * API 데이터를 WorkData 형식으로 변환
 */
export const convertApiDataToWorkData = async (
  wlogs: any[], 
  vacations: any[], 
  overtimes: any[], 
  startDate: Date,
  userId?: string
): Promise<WorkData[]> => {
  const daysOfWeek = ['월', '화', '수', '목', '금', '토', '일'];
  const weekData: WorkData[] = [];
  
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    const dateString = dayjs(currentDate).format('YYYY-MM-DD');
    const dayOfWeek = daysOfWeek[i];
    
    // 공휴일 여부 확인
    const isHoliday = await isHolidayCached(currentDate);
    
    // 해당 날짜의 데이터 찾기
    const wlog = wlogs.find((log: any) => log.tdate === dateString);
    const vacationsForDate = vacations.filter((vac: any) => vac.tdate === dateString);
    const overtime = overtimes.find((ot: any) => {
      const otDate = dayjs(ot.ot_date).format('YYYY-MM-DD');
      return otDate === dateString && ot.user_id === userId && ot.ot_status !== 'N';
    });
    
    // 우선순위 vacation 선택
    const vacation = selectPriorityVacation(vacationsForDate);
    
    // wlog 유무 확인
    const hasWlog = !!(wlog && wlog.stime);
    
    // 근무 구분 결정
    let workType: WorkData['workType'];
    if (vacation) {
      workType = getWorkTypeFromVacation(vacation, hasWlog);
    } else {
      if (hasWlog && isHoliday) {
        workType = '공휴일';
      } else if (hasWlog) {
        workType = '일반근무';
      } else {
        workType = '-';
      }
    }
    
    const startTime = formatTime(wlog?.stime || null);
    const endTime = formatTime(wlog?.etime || null);
    const overtimeStatus = overtime ? getOvertimeStatus(overtime.ot_status) : '신청하기';
    const overtimeData = overtime ? extractOvertimeData(overtime) : undefined;
    
    // 근무시간 계산
    if (wlog && wlog.stime && wlog.etime) {
      const workHours = calculateWorkHours(wlog, overtime);
      
      weekData.push({
        date: dateString,
        dayOfWeek,
        workType,
        startTime,
        endTime,
        ...workHours,
        overtimeStatus,
        overtimeData,
        overtimeId: overtime?.id,
        isHoliday,
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
        overtimeStatus,
        overtimeData,
        overtimeId: overtime?.id,
        isHoliday,
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
        overtimeStatus,
        overtimeData,
        overtimeId: overtime?.id,
        isHoliday,
      });
    }
  }
  
  return weekData;
};

