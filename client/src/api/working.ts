import { http } from '@/lib/http';

// 근태 로그 타입 정의
export interface WorkLog {
  wlog_id?: number;
  user_id?: string;
  wlog_date?: string;
  wlog_checkin?: string;
  wlog_checkout?: string;
  wlog_workhours?: number;
  wlog_status?: string;
  wlog_created_at?: string;
  wlog_modified_at?: string;
}

export interface Vacation {
  // vacation 타입 정의 (필요시 추가)
  [key: string]: any;
}

export interface WorkLogResponse {
  wlog: WorkLog[];
  vacation: Vacation[];
}

// 근태 로그 조회 파라미터
export interface WorkLogQueryParams {
  search_id?: string;
  sdate: string;
  edate: string;
}

// 근태 로그 API
export const workingApi = {
  // 근태 로그 조회
  getWorkLogs: async (params: WorkLogQueryParams): Promise<WorkLogResponse> => {
    const queryParams = new URLSearchParams();
    
    if (params.search_id) queryParams.append('search_id', params.search_id);
    queryParams.append('sdate', params.sdate);
    queryParams.append('edate', params.edate);

    const response = await http<WorkLogResponse>(`/user/wlog/list?${queryParams.toString()}`);
    return response;
  },
};

