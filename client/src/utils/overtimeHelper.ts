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

  // 기본 필수 필드
  const apiParams: OvertimeApiParams = {
    ot_type: otType,
    ot_date: selectedDay.date,
    ot_client: formData.clientName || '',
    ot_description: formData.workDescription || '',
  };

  // 평일인 경우: 예상 퇴근 시간, 식대, 교통비만 추가
  if (!isWeekendOrHol) {
    const hour = formData.expectedEndTime.padStart(2, '0');
    const minute = formData.expectedEndMinute.padStart(2, '0');
    apiParams.ot_stime = `${hour}:${minute}:00`;
    apiParams.ot_etime = `${hour}:${minute}:00`;
    apiParams.ot_food = formData.mealAllowance === 'yes' ? 'Y' : 'N';
    apiParams.ot_trans = formData.transportationAllowance === 'yes' ? 'Y' : 'N';
  }

  // 주말 또는 공휴일인 경우: 초과근무 시간, 보상 지급방식만 추가
  if (isWeekendOrHol) {
    // 시간과 분을 소수점 형태로 변환 (예: 2시간 30분 = "2.5")
    const hours = parseInt(formData.overtimeHours) || 0;
    const minutes = parseInt(formData.overtimeMinutes) || 0;
    const totalHours = hours + (minutes / 60);
    
    // 근무 시간이 0인 경우 에러 발생
    if (totalHours <= 0) {
      throw new Error('추가근무 시간을 입력해주세요.');
    }
    
    apiParams.ot_hours = totalHours.toString();
    
    // 토요일, 일요일, 공휴일인 경우 ot_stime, ot_etime을 00:00:00으로 설정
    apiParams.ot_stime = '00:00:00';
    apiParams.ot_etime = '00:00:00';
    
    // 보상 지급방식
    apiParams.ot_reward = convertRewardType(formData.overtimeType);
  }

  return apiParams;
};

