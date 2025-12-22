import dayjs from 'dayjs';

// YYYY-MM-DD (~HH:mm) 또는 YYYY-MM-DD - YYYY-MM-DD 형식
export const getDateRangeTextSimple = (startDateStr?: string, endDateStr?: string, allDay?: boolean) => {
  if (!startDateStr || !endDateStr) return '';

  const startDate = dayjs(startDateStr);
  const endDate = dayjs(endDateStr);

  // 여러일 이벤트
  if (allDay) {
    if (startDate.isSame(endDate, 'day')) {
      return startDate.format('YYYY-MM-DD');
    }
    return `${startDate.format('YYYY-MM-DD')} - ${endDate.format('YYYY-MM-DD')}`;
  }

  // 당일 이벤트
  if (startDate.isSame(endDate, 'day')) {
    return `${startDate.format('YYYY-MM-DD')}`;
  }
  return `${startDate.format('YYYY-MM-DD')}`;
};

// YYYY년 MM월 DD일 ddd요일 (~HH:mm) 포맷
export const getDateRangeTextFull = (startDateStr?: string, endDateStr?: string, startTime?: string, endTime?: string, allDay?: boolean) => {
  if (!startDateStr || !endDateStr) return '';

  const startDate = dayjs(startDateStr);
  const endDate = dayjs(endDateStr);

  const formatTime = (time?: string) => (time ? time.substring(0, 5) : '');

  // 여러일 이벤트
  if (allDay) {
    if (startDate.isSame(endDate, 'day')) {
      return startDate.format('YYYY년 MM월 DD일 ddd요일');
    }
    return `${startDate.format('YYYY년 MM월 DD일 ddd요일')} - ${endDate.format('YYYY년 MM월 DD일 ddd요일')}`;
  }

  // 시간 포함
  if (startDate.isSame(endDate, 'day')) {
    return `${startDate.format('YYYY년 MM월 DD일 ddd요일')} ${formatTime(startTime)} - ${formatTime(endTime)}`;
  }
  return `${startDate.format('YYYY년 MM월 DD일 ddd요일')} ${formatTime(startTime)} - ${endDate.format('YYYY년 MM월 DD일 ddd요일')} ${formatTime(endTime)}`;
};

