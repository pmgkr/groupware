import type { WorkData } from '@/types/working';

/**
 * 초과근무 타입 결정
 */
export const determineOvertimeType = (
  dayOfWeek: string,
  isHoliday: boolean,
  workType: string
): 'weekday' | 'saturday' | 'sunday' | 'holiday' => {
  if (dayOfWeek === '토') {
    return 'saturday';
  }
  if (dayOfWeek === '일') {
    return 'sunday';
  }
  if (isHoliday || workType === '공휴일') {
    return 'holiday';
  }
  return 'weekday';
};

/**
 * 주말 또는 공휴일 여부 확인
 */
export const isWeekendOrHoliday = (
  dayOfWeek: string,
  isHoliday: boolean,
  workType: string
): boolean => {
  return dayOfWeek === '토' || dayOfWeek === '일' || isHoliday || workType === '공휴일';
};

/**
 * 보상 타입 변환 (UI -> API)
 */
export const convertRewardType = (
  overtimeType: string
): 'special' | 'annual' | 'pay' | '' => {
  switch (overtimeType) {
    case 'special_vacation':
      return 'special'; // 특별대휴
    case 'compensation_vacation':
      return 'annual'; // 보상휴가
    case 'event':
      return 'pay'; // 수당지급
    default:
      return '';
  }
};

/**
 * 초과근무 신청 데이터를 API 파라미터로 변환
 */
export interface OvertimeFormData {
  expectedStartTime: string;
  expectedStartTimeMinute: string;
  expectedEndTime: string;
  expectedEndMinute: string;
  mealAllowance: string;
  transportationAllowance: string;
  overtimeHours: string;
  overtimeMinutes: string;
  overtimeType: string;
  clientName: string;
  workDescription: string;
}

export interface OvertimeApiParams {
  ot_type: string;
  ot_date: string;
  ot_client: string;
  ot_description: string;
  ot_stime?: string;
  ot_etime?: string;
  ot_food?: string;
  ot_trans?: string;
  ot_hours?: string;
  ot_reward?: string;
}

export const buildOvertimeApiParams = (
  selectedDay: WorkData,
  formData: OvertimeFormData
): OvertimeApiParams => {
  const otType = determineOvertimeType(
    selectedDay.dayOfWeek,
    selectedDay.isHoliday || false,
    selectedDay.workType
  );

  const isWeekendOrHol = isWeekendOrHoliday(
    selectedDay.dayOfWeek,
    selectedDay.isHoliday || false,
    selectedDay.workType
  );

  // 날짜를 YYYY-MM-DD 형식으로 변환 (ISO 형식인 경우 처리)
  let formattedDate = selectedDay.date;
  if (formattedDate.includes('T')) {
    // ISO 형식인 경우 YYYY-MM-DD로 변환
    formattedDate = formattedDate.split('T')[0];
  }
  
  // 기본 필수 필드
  const apiParams: OvertimeApiParams = {
    ot_type: otType,
    ot_date: formattedDate,
    ot_client: formData.clientName || '',
    ot_description: formData.workDescription || '',
  };

  // 평일인 경우: 예상 퇴근 시간, 식대, 교통비만 추가
  if (!isWeekendOrHol) {
    // expectedEndTime과 expectedEndMinute가 비어있지 않은 경우에만 처리
    if (formData.expectedEndTime && formData.expectedEndMinute) {
      const hour = formData.expectedEndTime.padStart(2, '0');
      const minute = formData.expectedEndMinute.padStart(2, '0');
      apiParams.ot_stime = `${hour}:${minute}:00`;
      apiParams.ot_etime = `${hour}:${minute}:00`;
    }
    apiParams.ot_food = formData.mealAllowance === 'yes' ? 'Y' : 'N';
    apiParams.ot_trans = formData.transportationAllowance === 'yes' ? 'Y' : 'N';
  }

  // 주말 또는 공휴일인 경우: 출근 시간, 퇴근 시간, 보상 지급방식 추가
  if (isWeekendOrHol) {
    // 출근 시간 설정
    if (formData.expectedStartTime && formData.expectedStartTimeMinute) {
      const startHour = formData.expectedStartTime.padStart(2, '0');
      const startMinute = formData.expectedStartTimeMinute.padStart(2, '0');
      apiParams.ot_stime = `${startHour}:${startMinute}:00`;
    }
    
    // 퇴근 시간 설정
    if (formData.expectedEndTime && formData.expectedEndMinute) {
      const endHour = formData.expectedEndTime.padStart(2, '0');
      const endMinute = formData.expectedEndMinute.padStart(2, '0');
      apiParams.ot_etime = `${endHour}:${endMinute}:00`;
    }
    
    // 출근 시간과 퇴근 시간을 기반으로 근무 시간 자동 계산
    if (formData.expectedStartTime && formData.expectedStartTimeMinute && 
        formData.expectedEndTime && formData.expectedEndMinute) {
      const startHour = parseInt(formData.expectedStartTime) || 0;
      const startMinute = parseInt(formData.expectedStartTimeMinute) || 0;
      const endHour = parseInt(formData.expectedEndTime) || 0;
      const endMinute = parseInt(formData.expectedEndMinute) || 0;
      
      // 시간을 분 단위로 변환
      const startTotalMinutes = startHour * 60 + startMinute;
      let endTotalMinutes = endHour * 60 + endMinute;
      
      // 24시를 넘어가는 경우 처리 (예: 23시 출근, 02시 퇴근)
      if (endTotalMinutes < startTotalMinutes) {
        endTotalMinutes += 24 * 60; // 다음 날로 넘어감
      }
      
      // 근무 시간 계산 (분 단위)
      const workMinutes = endTotalMinutes - startTotalMinutes;
      
      // 시간으로 변환 (소수점 형태)
      const workHours = workMinutes / 60;
      
      // 최소 0.5시간 이상이어야 함
      if (workHours > 0) {
        apiParams.ot_hours = workHours.toString();
      }
    }
    
    // 보상 지급방식
    apiParams.ot_reward = convertRewardType(formData.overtimeType);
  }

  return apiParams;
};

