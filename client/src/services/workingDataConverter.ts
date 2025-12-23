import dayjs from 'dayjs';
import type { WorkData } from '@/types/working';
import { isHolidayCached, getHolidayNameCached } from '@/services/holidayApi';

/**
 * ot_status를 overtimeStatus로 변환
 */
const getOvertimeStatus = (status: string): WorkData['overtimeStatus'] => {
  switch (status) {
    case 'H': return '승인대기';
    case 'T': return '승인완료';
    case 'Y': return '보상완료';
    case 'N': return '취소완료';
    default: return '신청하기';
  }
};

/**
 * 시간 문자열에서 시간/분 추출 (ISO 형식 또는 HH:mm:ss 형식)
 */
const extractTimeFromISO = (timeString: string): { hour: string; minute: string } => {
  if (!timeString) return { hour: '', minute: '' };
  
  // ISO 형식 (예: "2024-01-01T09:00:00" 또는 "2024-01-01T09:00:00Z")
  const isoMatch = timeString.match(/T(\d{2}):(\d{2})/);
  if (isoMatch) {
    return {
      hour: String(parseInt(isoMatch[1])),
      minute: String(parseInt(isoMatch[2]))
    };
  }
  
  // HH:mm:ss 형식 (예: "09:00:00")
  const timeMatch = timeString.match(/^(\d{2}):(\d{2})/);
  if (timeMatch) {
    return {
      hour: String(parseInt(timeMatch[1])),
      minute: String(parseInt(timeMatch[2]))
    };
  }
  
  return { hour: '', minute: '' };
};

/**
 * 휴가/이벤트 kind, time 보정
 */
const resolveVacationKind = (vacation: any): string => {
  const candidates = [
    vacation?.kind,
    vacation?.sch_vacation_type,
    vacation?.sch_event_type,
    vacation?.type,
  ];
  const found = candidates.find((k) => k && k !== '-');
  return found || '-';
};

const resolveVacationTime = (vacation: any): string | undefined => {
  return (
    vacation?.sch_vacation_time ||
    (vacation?.type === 'morning' || vacation?.type === 'afternoon' ? vacation.type : undefined)
  );
};

/**
 * vacation 타입을 workType으로 변환
 */
const getWorkTypeFromVacation = (vacation: any, hasWlog: boolean): WorkData['workType'] => {
  const rawKind = resolveVacationKind(vacation);
  const type = resolveVacationTime(vacation);

  // kind 정보가 없고 이벤트 타입만 내려오는 경우(type: remote/field 등) 처리
  const kind =
    rawKind === '-' && vacation?.type && vacation.type !== '-'
      ? vacation.type
      : rawKind;
  
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
  } else if (kind === 'field' || kind === 'etc') {
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
  const endTime = overtime.ot_etime ? extractTimeFromISO(overtime.ot_etime.toString()) : { hour: '', minute: '' };
  const startTime = overtime.ot_stime ? extractTimeFromISO(overtime.ot_stime.toString()) : { hour: '', minute: '' };
  
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
    expectedStartTime: startTime.hour,
    expectedStartTimeMinute: startTime.minute,
    expectedEndTime: endTime.hour,
    expectedEndMinute: endTime.minute,
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
    const found = vacationsForDate.find((vac: any) => resolveVacationKind(vac) === kind);
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
  // sch_status가 존재하면 승인완료(Y)만 사용, 없으면 그대로 유지
  const filteredVacations = (vacations || []).filter((vac: any) => {
    if (vac?.sch_status === undefined) return true;
    return vac.sch_status === 'Y';
  });
  
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    const dateString = dayjs(currentDate).format('YYYY-MM-DD');
    const dayOfWeek = daysOfWeek[i];
    
    // 공휴일 여부 확인 및 공휴일 이름 가져오기
    const isHoliday = await isHolidayCached(currentDate);
    const holidayName = isHoliday ? await getHolidayNameCached(currentDate) : null;
    
    // 해당 날짜의 데이터 찾기
    const wlog = wlogs.find((log: any) => log.tdate === dateString);
    const vacationsForDate = filteredVacations.filter((vac: any) => vac.tdate === dateString);
    const overtime = overtimes.find((ot: any) => {
      const otDate = dayjs(ot.ot_date).format('YYYY-MM-DD');
      return otDate === dateString && ot.user_id === userId;
    });
    
    // wlog 유무 확인
    const hasWlog = !!(wlog && wlog.stime);
    
    // 모든 vacations를 workType으로 변환하여 배열로 저장
    const workTypesArray: Array<{ type: WorkData['workType']; createdAt: string }> = [];
    
    // vacations를 created_at 기준으로 정렬 (최신순)
    const sortedVacations = [...vacationsForDate].sort((a, b) => {
      // sch_created_at, created_at, 또는 기타 날짜 필드 확인
      const dateA = a.sch_created_at 
        ? new Date(a.sch_created_at).getTime() 
        : (a.created_at ? new Date(a.created_at).getTime() : (a.va_created_at ? new Date(a.va_created_at).getTime() : 0));
      const dateB = b.sch_created_at 
        ? new Date(b.sch_created_at).getTime() 
        : (b.created_at ? new Date(b.created_at).getTime() : (b.va_created_at ? new Date(b.va_created_at).getTime() : 0));
      return dateB - dateA; // 내림차순 (최신이 먼저)
    });
    
    // 각 vacation을 workType으로 변환
    sortedVacations.forEach((vacation) => {
      const workType = getWorkTypeFromVacation(vacation, hasWlog);
      // sch_created_at, created_at, 또는 기타 날짜 필드 확인
      const createdAt = vacation.sch_created_at 
        || vacation.created_at 
        || vacation.va_created_at
        || new Date().toISOString();
      workTypesArray.push({ type: workType, createdAt });
    });
    
    // 실제 이벤트가 있는지 확인 (kind가 있고 '-'가 아닌 경우)
    const hasRealEvent = sortedVacations.some((vacation) => {
      const kind = resolveVacationKind(vacation);
      return kind && kind !== '-';
    });
    
    // 다른 이벤트가 없을 때만 일반근무 추가 (공휴일은 별도 배지로 표시)
    if (!hasRealEvent && hasWlog) {
      const wlogCreatedAt = wlog?.wlog_created_at || new Date().toISOString();
      workTypesArray.push({ type: '일반근무', createdAt: wlogCreatedAt });
    }
    
    // wlog도 없고 vacation도 없는 경우 "-" 추가
    if (vacationsForDate.length === 0 && !hasWlog) {
      workTypesArray.push({ type: '-', createdAt: new Date().toISOString() });
    }
    
    // 최종적으로 created_at 기준으로 다시 정렬 (최신순)
    workTypesArray.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA; // 내림차순 (최신이 먼저)
    });
    
    // 우선순위 vacation 선택 (기존 로직 유지)
    const vacation = selectPriorityVacation(vacationsForDate);
    
    // 근무 구분 결정 (공휴일은 별도 배지로 표시하므로 workType에는 '일반근무'로 설정)
    let workType: WorkData['workType'];
    if (vacation) {
      workType = getWorkTypeFromVacation(vacation, hasWlog);
    } else {
      if (hasWlog) {
        workType = '일반근무'; // 공휴일이어도 workType은 일반근무로 설정
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
        workTypes: workTypesArray.length > 0 ? workTypesArray : undefined,
        startTime,
        endTime,
        ...workHours,
        overtimeStatus,
        overtimeData,
        overtimeId: overtime?.id,
        isHoliday,
        holidayName,
      });
    } else if (wlog && wlog.stime && !wlog.etime) {
      // 출근만 하고 퇴근 안한 경우
      weekData.push({
        date: dateString,
        dayOfWeek,
        workType,
        workTypes: workTypesArray.length > 0 ? workTypesArray : undefined,
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
        holidayName,
      });
    } else {
      // wlog 데이터가 없는 경우
      weekData.push({
        date: dateString,
        dayOfWeek,
        workType,
        workTypes: workTypesArray.length > 0 ? workTypesArray : undefined,
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
        holidayName,
      });
    }
  }
  
  return weekData;
};

