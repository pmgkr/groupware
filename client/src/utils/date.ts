// src/utils/date.ts
import { format } from 'date-fns';

export function formatKST(dateString?: string | Date | null, withOutTime = false): string {
  if (!dateString) return '';

  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  /* return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`; */
  return withOutTime ? `${year}-${month}-${day}` : `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export function formatDate(d?: string | Date | null) {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  return format(date, 'yyyy-MM-dd');
}

/* 
<사용 예시 - true>
const [selectDate, setSelectDate] = useState(formatKST(new Date(), true)); -> 2025-11-15 12:22:30
 <span>{formatKST(user?.birth_date)}</span> -> 2025-11-15

*/

/**
 * 시간 문자열에서 HH:mm 추출 (ISO timestamp 또는 HH:mm:ss -> HH:mm)
 * @param timeStr - ISO 형식 시간 문자열 또는 HH:mm:ss 형식 문자열
 * @returns HH:mm 형식의 시간 문자열 또는 '-'
 */
export function formatTime(timeStr: string | null): string {
  if (!timeStr) return '-';

  // ISO 형식 (1970-01-01T09:58:23.000Z)인 경우
  if (timeStr.includes('T')) {
    const timePart = timeStr.split('T')[1];
    const parts = timePart.split(':');
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}`;
    }
    return timePart.split('.')[0].substring(0, 5);
  }

  // HH:mm:ss 형식인 경우
  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]}`;
  }

  return timeStr;
}

/**
 * 분을 시간과 분으로 변환
 * @param totalMinutes - 총 분 수
 * @returns 시간과 분을 포함한 객체
 */
export function formatMinutes(totalMinutes: number): { hours: number; minutes: number } {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return { hours, minutes };
}

/**
 * 시간 문자열을 분 단위로 변환 (대시보드 내 미팅룸 정렬용)
 * @param timeStr - ISO 형식 시간 문자열 또는 HH:mm:ss 형식 문자열
 * @returns 분 단위 숫자
 */
export function timeToMinutes(timeStr: string | null): number {
  if (!timeStr) return 0;

  // ISO 형식인 경우 (1970-01-01T09:00:00.000Z)
  if (timeStr.includes('T')) {
    const date = new Date(timeStr);
    return date.getHours() * 60 + date.getMinutes();
  }

  // HH:mm:ss 또는 HH:mm 형식인 경우
  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    return hours * 60 + minutes;
  }

  return 0;
}
