import { http } from '@/lib/http';
import type { Schedule } from '@/api/calendar';

// 매니저-취소 요청 승인 (휴가 취소 승인 처리, sch_status를 N으로 변경)
// 취소 요청한 휴가 → 승인 (sch_status='N')
// - google_calendar_idx 값이 있을 경우 캘린더 삭제
// - sch_vacation_used 값이 있을 경우, users_vacations 복원
export const managerVacationApi = {
  approveScheduleCancel: async (id: number): Promise<{
    result: {
      updatedId: number;
      old: Schedule;
      refunded: boolean; // users_vacations 복원 여부
    };
  }> => {
    const response = await http<{
      result: {
        updatedId: number;
        old: Schedule;
        refunded: boolean;
      };
    }>(`/manager/schedule/cancel/${id}`, {
      method: 'POST'
    });
    return response;
  },
};

