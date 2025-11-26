import type { WorkData } from '@/types/working';

export interface WeeklyStats {
  workHours: number;
  workMinutes: number;
  remainingHours: number;
  remainingMinutes: number;
  basicWorkHours: number;
  basicWorkMinutes: number;
  overtimeWorkHours: number;
  overtimeWorkMinutes: number;
}

/**
 * 주간 근무시간 통계 계산
 */
export const calculateWeeklyStats = (data: WorkData[]): WeeklyStats => {
  // 각 날짜의 시간과 분을 합산
  const totalBasicHours = data.reduce((sum, day) => sum + day.basicHours, 0);
  const totalBasicMinutes = data.reduce((sum, day) => sum + day.basicMinutes, 0);
  const totalOvertimeHours = data.reduce((sum, day) => sum + day.overtimeHours, 0);
  const totalOvertimeMinutes = data.reduce((sum, day) => sum + day.overtimeMinutes, 0);
  
  // 총 근무시간 계산 - 승인완료된 추가근무는 ot_hours 사용
  const totalWorkHours = data.reduce((sum, day) => {
    // 승인완료된 추가근무가 있으면 ot_hours 사용
    if (day.overtimeStatus === '승인완료' && day.overtimeData) {
      const overtimeHours = parseInt(day.overtimeData.overtimeHours || '0');
      return sum + overtimeHours;
    }
    return sum + day.totalHours;
  }, 0);
  
  const totalWorkMinutes = data.reduce((sum, day) => {
    // 승인완료된 추가근무가 있으면 ot_hours의 분 사용
    if (day.overtimeStatus === '승인완료' && day.overtimeData) {
      const overtimeMinutes = parseInt(day.overtimeData.overtimeMinutes || '0');
      return sum + overtimeMinutes;
    }
    return sum + (day.totalMinutes || 0);
  }, 0);
  
  // 총 근무시간 계산 (시간과 분 정규화)
  const totalWorkMinutesAll = (totalWorkHours * 60) + (totalWorkMinutes || 0);
  const workHours = Math.floor(totalWorkMinutesAll / 60);
  const workMinutes = totalWorkMinutesAll % 60;
  
  // 남은 시간 계산 (52시간 기준)
  const remainingMinutes = Math.max(0, (52 * 60) - totalWorkMinutesAll);
  const remainingHours = Math.floor(remainingMinutes / 60);
  const remainingMins = remainingMinutes % 60;
  
  // 기본 근무시간 합계 (시간과 분 정규화)
  const totalBasicMinutesAll = (totalBasicHours * 60) + totalBasicMinutes;
  const basicWorkHours = Math.floor(totalBasicMinutesAll / 60);
  const basicWorkMinutes = totalBasicMinutesAll % 60;
  
  // 연장 근무시간 합계 (시간과 분 정규화)
  const totalOvertimeMinutesAll = (totalOvertimeHours * 60) + totalOvertimeMinutes;
  const overtimeWorkHours = Math.floor(totalOvertimeMinutesAll / 60);
  const overtimeWorkMinutes = totalOvertimeMinutesAll % 60;
  
  return {
    workHours,
    workMinutes,
    remainingHours,
    remainingMinutes: remainingMins,
    basicWorkHours,
    basicWorkMinutes,
    overtimeWorkHours,
    overtimeWorkMinutes
  };
};

