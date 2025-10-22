import { http } from '@/lib/http';

// Schedule 타입 정의 - 프로덕션 서버 API 기준
export interface Schedule {
  id: number; // PK, auto increment
  seq?: number; // unique
  user_id?: string; // 조회 시에만 반환됨
  user_name?: string; // 사용자 이름 (조회 시 users 테이블 조인)
  team_id: number;
  sch_title: string; // 필수
  sch_year: number; // 필수
  sch_type: 'vacation' | 'event';
  sch_vacation_type?: 'day' | 'half' | 'quarter' | 'official' | null;
  sch_vacation_time?: 'morning' | 'afternoon' | null; // 반차/반반차의 오전/오후 구분
  sch_vacation_used?: number | null;
  sch_event_type?: 'remote' | 'field' | 'etc' | null;
  sch_sdate: string; // YYYY-MM-DD
  sch_stime: string; // HH:mm:ss
  sch_edate: string; // YYYY-MM-DD
  sch_etime: string; // HH:mm:ss
  sch_isAllday: 'Y' | 'N';
  sch_description?: string;
  sch_status: 'Y' | 'H' | 'N';
  sch_created_at?: string;
  sch_modified_at?: string | null;
  google_calendar_idx?: string | null;
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

  // 스케줄 생성 (id, seq, user_id, created_at, modified_at은 서버에서 자동 생성)
  createSchedule: async (schedule: Omit<Schedule, 'id' | 'seq' | 'user_id' | 'sch_created_at' | 'sch_modified_at' | 'google_calendar_idx'>): Promise<{ ok: boolean; id: number }> => {
    const response = await http<{ ok: boolean; id: number }>('/user/schedule/register', {
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

  // 스케줄 상태 변경 (취소 요청 등)
  updateScheduleStatus: async (id: number, status: 'Y' | 'H' | 'N'): Promise<{ ok: boolean; message?: string }> => {
    const response = await http<{ ok: boolean; message?: string }>(`/user/schedule/status/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ sch_status: status })
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
  },

  // 사용자 연차 정보 조회
  getUserVacations: async (userId: string, year: number): Promise<UserVacation> => {
    const response = await http<UserVacation>(`/user/vacations/${userId}/${year}`);
    return response;
  }
};

// 사용자 연차 정보 타입
export interface UserVacation {
  user_id: string;
  va_year: number;
  va_total: string;
  va_used: string;
  va_remaining: string;
}
