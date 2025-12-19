import { http } from '@/lib/http';
import type { Schedule } from '@/api/calendar';

// 팀원 휴가 현황 조회 응답 타입
export interface ManagerVacationListResponse {
  ok: boolean;
  total: number;
  page: number;
  size: number;
  list: Array<{
    id: number | null;
    user_id: string;
    va_year: string;
    va_used: number;
    va_current: number;
    va_carryover: number;
    va_comp: number;
    va_long: number;
    user_name: string;
    team_id: number;
    user_status: string;
    hire_date: string | null;
    profile_image?: string | null;
    v_carryover: number;
    v_long: number;
    v_comp: number;
    v_current: number;
    v_official: number;
    daycount: number;
  }>;
}

// 팀원 휴가 상세 조회 응답 타입
export interface ManagerVacationInfoResponse {
  ok: boolean;
  header: any;
  body: any[];
  footer: {
    total: number;
    page: number;
    size: number;
  };
}

// 매니저-취소 요청 승인 (휴가 취소 승인 처리, sch_status를 N으로 변경)
// 취소 요청한 휴가 → 승인 (sch_status='N')
// - google_calendar_idx 값이 있을 경우 캘린더 삭제
// - sch_vacation_used 값이 있을 경우, users_vacations 복원
export const managerVacationCancelApi = {
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

// 매니저 전용 휴가 현황/상세 조회
export const managerVacationApi = {
  // 팀원 휴가 현황 목록
  getVacationList: async (year?: number, teamIds?: number[], page: number = 1, size: number = 100): Promise<ManagerVacationListResponse> => {
    const params = new URLSearchParams();
    if (year) params.append('year', String(year));
    if (teamIds && teamIds.length > 0) params.append('team_id', teamIds.join(','));
    params.append('page', String(page));
    params.append('size', String(size));

    return await http<ManagerVacationListResponse>(`/manager/vacation/list?${params.toString()}`, {
      method: 'GET',
    });
  },

  // 팀원 휴가 상세
  getVacationInfo: async (user_id: string, year?: number, page: number = 1, size: number = 20): Promise<ManagerVacationInfoResponse> => {
    const params = new URLSearchParams();
    params.append('user_id', user_id);
    if (year) params.append('year', String(year));
    params.append('page', String(page));
    params.append('size', String(size));

    return await http<ManagerVacationInfoResponse>(`/manager/vacation/info?${params.toString()}`, {
      method: 'GET',
    });
  },
};

