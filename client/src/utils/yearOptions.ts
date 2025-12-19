/**
 * 기준 연도(anchorYear)를 중심으로
 * - 시작: anchorYear - 1
 * - 종료: max(anchorYear + 1, currentYear + 1)
 * - 해가 바뀌면 미래 연도 누적됨 (2024, 2025, 2026, 2027 ...)
 */
export function getGrowingYears(anchorYear = 2025): string[] {
  const currentYear = new Date().getFullYear();

  const startYear = anchorYear - 1;
  const endYear = Math.max(anchorYear + 1, currentYear + 1);

  return Array.from({ length: endYear - startYear + 1 }, (_, i) => String(startYear + i));
}
