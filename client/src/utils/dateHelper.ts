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

