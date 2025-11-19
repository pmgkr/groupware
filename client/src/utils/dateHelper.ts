/**
 * 주의 시작일 계산 (월요일부터 시작)
 */
export const getWeekStartDate = (date: Date): Date => {
  const startDate = new Date(date);
  const day = startDate.getDay();
  // 일요일(0)인 경우 -6, 월요일(1)인 경우 -0, 화요일(2)인 경우 -1, ...
  const daysToSubtract = day === 0 ? 6 : day - 1;
  startDate.setDate(startDate.getDate() - daysToSubtract);
  return startDate;
};

/**
 * 주의 종료일 계산 (일요일)
 */
export const getWeekEndDate = (weekStartDate: Date): Date => {
  const endDate = new Date(weekStartDate);
  endDate.setDate(endDate.getDate() + 6);
  return endDate;
};

/**
 * ISO 주차 번호 계산 (월요일 기준)
 */
export const getWeekNumber = (date: Date): { year: number; week: number } => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { year: d.getUTCFullYear(), week: weekNo };
};

