// 근무 데이터 타입 정의
export interface WorkData {
  date: string;
  workType: "-" | "일반근무" | "외부근무" | "재택근무" | "연차" | "오전반차" | "오전반반차" | "오후반차" | "오후반반차" | "공가" | "공휴일";
  workTypes?: Array<{
    type: WorkData['workType'];
    createdAt: string; // 등록 시간
  }>; // 여러 workType이 있을 경우 배열로 저장 (+뱃지 표시용)
  startTime: string;
  endTime: string;
  basicHours: number;
  basicMinutes: number;
  overtimeHours: number;
  overtimeMinutes: number;
  totalHours: number;
  totalMinutes: number;
  overtimeStatus: "신청하기" | "승인대기" | "승인완료" | "반려됨";
  dayOfWeek: string;
  rejectionDate?: string;
  rejectionReason?: string;
  // 신청 데이터 추가
  overtimeData?: {
    expectedEndTime: string;
    expectedEndMinute: string;
    mealAllowance: string;
    transportationAllowance: string;
    overtimeHours: string;
    overtimeMinutes: string;
    overtimeType: string;
    clientName: string;
    workDescription: string;
  };
  overtimeId?: number; // 초과근무 ID
  isHoliday?: boolean; // 공휴일 여부
}

