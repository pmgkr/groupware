import { http } from '@/lib/http';

// Schedule 타입 정의
export interface Schedule {
  id: number;
  seq: number;
  user_id: string;
  team_id: number;
  sch_year: number;
  sch_type: 'vacation' | 'event';
  sch_vacation_type: 'day' | 'half' | 'quarter' | 'official' | null;
  sch_vacation_used: number;
  sch_event_type: 'remote' | 'field' | 'etc' | null;
  sch_sdate: string; // YYYY-MM-DD
  sch_stime: string; // HH:mm:ss
  sch_edate: string; // YYYY-MM-DD
  sch_etime: string; // HH:mm:ss
  sch_isAllday: 'Y' | 'N';
  sch_description: string;
  sch_status: 'Y' | 'H' | 'N';
  sch_created_at: string;
  sch_modified_at: string;
  google_calendar_idx: string | null;
}

// Schedule 조회 파라미터
export interface ScheduleQueryParams {
  year?: number;
  month?: number;
  team_id?: number;
  user_id?: string;
  sch_type?: 'vacation' | 'event';
  sch_status?: 'Y' | 'H' | 'N';
}

// Schedule API 함수들
export const scheduleApi = {
  // 모든 스케줄 조회
  getSchedules: async (params?: ScheduleQueryParams): Promise<Schedule[]> => {
    const queryParams = new URLSearchParams();
    
    if (params?.year) queryParams.append('year', params.year.toString());
    if (params?.month) queryParams.append('month', params.month.toString());
    if (params?.team_id) queryParams.append('team_id', params.team_id.toString());
    if (params?.user_id) queryParams.append('user_id', params.user_id);
    if (params?.sch_type) queryParams.append('sch_type', params.sch_type);
    if (params?.sch_status) queryParams.append('sch_status', params.sch_status);

    // 실제 API 엔드포인트 사용
    const yearMonth = `${params?.year || new Date().getFullYear()}-${String(params?.month || new Date().getMonth() + 1).padStart(2, '0')}`;
    const endpoint = `/user/schedule/${yearMonth}`;
    
    console.log(`Using endpoint: ${endpoint}`);
    const response = await http<Schedule[]>(endpoint);
    return response;
  },

  // 특정 스케줄 조회
  getSchedule: async (id: number): Promise<Schedule> => {
    const response = await http<Schedule>(`/user/schedule/content/${id}`);
    return response;
  },

  // 스케줄 생성
  createSchedule: async (schedule: Omit<Schedule, 'id' | 'sch_created_at' | 'sch_modified_at'>): Promise<Schedule> => {
    const response = await http<Schedule>('/user/schedule/register', {
      method: 'POST',
      body: JSON.stringify(schedule)
    });
    return response;
  },

  // 스케줄 수정
  updateSchedule: async (id: number, schedule: Partial<Schedule>): Promise<Schedule> => {
    const response = await http<Schedule>(`/user/schedule/patch/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(schedule)
    });
    return response;
  },

  // 스케줄 삭제
  deleteSchedule: async (id: number): Promise<void> => {
    await http(`/user/schedule/remove/${id}`, {
      method: 'DELETE'
    });
  },

  // 월별 스케줄 조회 (캘린더용)
  getMonthlySchedules: async (year: number, month: number, teamId?: number): Promise<Schedule[]> => {
    const params: ScheduleQueryParams = {
      year,
      month,
      sch_status: 'Y' // 활성 상태만 조회
    };
    
    if (teamId) {
      params.team_id = teamId;
    }

    return await scheduleApi.getSchedules(params);
  }
};
