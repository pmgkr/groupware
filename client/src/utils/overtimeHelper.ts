import type { WorkData } from '@/types/working';
import type { ClientList } from '@/api/common/project';

/**
 * 초과근무 타입 결정
 */
export const determineOvertimeType = (
  dayOfWeek: string,
  isHoliday: boolean,
  workType: string
): 'weekday' | 'saturday' | 'sunday' | 'holiday' => {
  if (isHoliday || workType === '공휴일') {
    return 'holiday';
  }
  if (dayOfWeek === '토') {
    return 'saturday';
  }
  if (dayOfWeek === '일') {
    return 'sunday';
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

/**
 * OT 시간(소수 시간)을 계산한다.
 * - 주말/공휴일: 출퇴근 시/분을 그대로 사용(24~30시는 다음날 기준)
 * - 평일: 입력된 시간/분 필드(overtimeHours/Minutes) 기반
 *   (평일은 시작 시간이 없으므로 미리 계산된 값이 있을 때만 사용)
 */
export const calculateOvertimeHours = (
  selectedDay: WorkData,
  formData: OvertimeFormData
): string => {
  const isWeekendOrHol = isWeekendOrHoliday(
    selectedDay.dayOfWeek,
    selectedDay.isHoliday || false,
    selectedDay.workType
  );

  if (!isWeekendOrHol) {
    const baseHours = Number(formData.overtimeHours || 0);
    const baseMinutes = Number(formData.overtimeMinutes || 0);
    const total = baseHours + baseMinutes / 60;
    return isNaN(total) ? '0' : applyBreakTime(total).toFixed(2);
  }

  const toMinutes = (hourStr: string, minuteStr: string): number | null => {
    const h = Number(hourStr);
    const m = Number(minuteStr);
    if (isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
  };

  const startMinutes = toMinutes(
    formData.expectedStartTime,
    formData.expectedStartTimeMinute
  );
  const endMinutes = toMinutes(
    formData.expectedEndTime,
    formData.expectedEndMinute
  );

  if (startMinutes == null || endMinutes == null) return '0';

  const diff = endMinutes - startMinutes;
  if (diff <= 0) return '0';

  const totalHours = diff / 60;
  return applyBreakTime(totalHours).toFixed(2);
};

/**
 * 4시간마다 30분 휴게시간을 차감한다.
 *  - 4시간 미만: 차감 없음
 *  - 4~7:59 -> 30분, 8~11:59 -> 60분, 12~15:59 -> 90분 ...
 */
const applyBreakTime = (totalHours: number): number => {
  if (isNaN(totalHours) || totalHours <= 0) return 0;
  const breakBlocks = Math.floor(totalHours / 4); // 4시간마다 1블록
  const breakHours = breakBlocks * 0.5; // 블록당 30분
  const net = totalHours - breakHours;
  return net > 0 ? net : 0;
};

export const buildOvertimeApiParams = (
  selectedDay: WorkData,
  formData: OvertimeFormData,
  clientList: ClientList[] = []
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
  
  // clientName이 cl_seq(숫자)인 경우 클라이언트 이름으로 변환
  let clientName = formData.clientName || '';
  if (clientName && clientList.length > 0) {
    const clientSeq = parseInt(clientName, 10);
    if (!isNaN(clientSeq)) {
      const client = clientList.find(c => c.cl_seq === clientSeq);
      if (client) {
        clientName = client.cl_name;
      }
    }
  }
  
  // 기본 필수 필드
  const apiParams: OvertimeApiParams = {
    ot_type: otType,
    ot_date: formattedDate,
    ot_client: clientName,
    ot_description: formData.workDescription || '',
  };

  // weekday일 때: 예상 퇴근 시간, 식대, 교통비만 추가
  if (otType === 'weekday') {
    // weekday일 때는 ot_stime을 null로 전송
    apiParams.ot_stime = null as any;
    // expectedEndTime과 expectedEndMinute가 비어있지 않은 경우에만 처리
    if (formData.expectedEndTime && formData.expectedEndMinute) {
      const hour = formData.expectedEndTime.padStart(2, '0');
      const minute = formData.expectedEndMinute.padStart(2, '0');
      apiParams.ot_etime = `${hour}:${minute}:00`;
    }
    apiParams.ot_food = formData.mealAllowance === 'yes' ? 'Y' : 'N';
    apiParams.ot_trans = formData.transportationAllowance === 'yes' ? 'Y' : 'N';
  }

  // 주말 또는 공휴일인 경우: 출근/퇴근 시간, OT 시간, 보상 지급방식 추가
  if (isWeekendOrHol) {
    // 출근 시간
    if (formData.expectedStartTime && formData.expectedStartTimeMinute) {
      const startHour = parseInt(formData.expectedStartTime) || 0;
      const startMinute = formData.expectedStartTimeMinute.padStart(2, '0');
      const hour = startHour >= 24 ? String(startHour - 24).padStart(2, '0') : String(startHour).padStart(2, '0');
      apiParams.ot_stime = `${hour}:${startMinute}:00`;
    }
    
    // 퇴근 시간
    if (formData.expectedEndTime && formData.expectedEndMinute) {
      const endHour = parseInt(formData.expectedEndTime) || 0;
      const endMinute = formData.expectedEndMinute.padStart(2, '0');
      const hour = endHour >= 24 ? String(endHour - 24).padStart(2, '0') : String(endHour).padStart(2, '0');
      apiParams.ot_etime = `${hour}:${endMinute}:00`;
    }
    
    // 프론트에서 계산한 OT 시간 전송
    apiParams.ot_hours = calculateOvertimeHours(selectedDay, formData);
    
    // 보상 지급방식
    apiParams.ot_reward = convertRewardType(formData.overtimeType);
  }

  return apiParams;
};

