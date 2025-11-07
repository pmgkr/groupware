// src/utils/date.ts
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

/* 
<사용 예시 - true>
const [selectDate, setSelectDate] = useState(formatKST(new Date(), true)); -> 2025-11-15 12:22:30
 <span>{formatKST(user?.birth_date)}</span> -> 2025-11-15

*/
