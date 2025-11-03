import type { WorkData } from '@/types/working';

export interface WeeklyStats {
  totalBasicHours: number;
  totalOvertimeHours: number;
  totalWorkHours: number;
  vacationHours: number;
  externalHours: number;
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
  
  // 기본 근무시간 합계 (시간과 분 정규화)
  const totalBasicMinutesAll = (totalBasicHours * 60) + totalBasicMinutes;
  const basicWorkHours = Math.floor(totalBasicMinutesAll / 60);
  const basicWorkMinutes = totalBasicMinutesAll % 60;
  
  // 연장 근무시간 합계 (시간과 분 정규화)
  const totalOvertimeMinutesAll = (totalOvertimeHours * 60) + totalOvertimeMinutes;
  const overtimeWorkHours = Math.floor(totalOvertimeMinutesAll / 60);
  const overtimeWorkMinutes = totalOvertimeMinutesAll % 60;
  
  return {
    totalBasicHours,
    totalOvertimeHours,
    totalWorkHours,
    vacationHours,
    externalHours,
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

