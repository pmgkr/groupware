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

// 초과근무 신청 파라미터
export interface OvertimeRequestParams {
  ot_type: string;          // 초과근무 타입 ("weekday" - 평일, "saturday" - 토요일, "sunday" - 일요일, "holiday" - 공휴일)
  ot_date: string;          // 근무 날짜 (YYYY-MM-DD)
  ot_etime?: string;        // 예상 퇴근 시간 (HH:mm:ss) - 평일인 경우
  ot_hours?: string;        // 초과근무 시간 - 주말/공휴일인 경우
  ot_food?: string;         // 식대 사용 여부 (Y/N)
  ot_trans?: string;        // 교통비 사용 여부 (Y/N)
  ot_reward?: string;       // 보상 지급 방식 (special - 특별대휴, annual - 보상휴가, pay - 수당지급) - 주말/공휴일인 경우
  ot_client: string;        // 클라이언트명
  ot_description: string;   // 작업 내용
}

// 초과근무 목록 조회 파라미터
export interface OvertimeListParams {
  page?: number;
  size?: number;
  q?: string;
  user_id?: string;
}

// 관리자 초과근무 목록 조회 파라미터
export interface ManagerOvertimeListParams {
  team_id?: number;
  page?: number;
  size?: number;
  flag?: string;  // ot_status (H: 승인대기, T: 승인완료, N: 반려됨)
}

// 초과근무 항목
export interface OvertimeItem {
  id: number;
  user_id: string;
  user_name: string;
  team_id: number;
  ot_type: string;
  ot_date: string;
  ot_etime: string;
  ot_hours: string;
  ot_food: string;
  ot_trans: string;
  ot_reward: string;
  ot_client: string;
  ot_description: string;
  ot_status: string;  // "H" (승인대기), "T" (승인완료), "N" (반려됨)
  ot_created_at: string;
  ot_modified_at: string;
}

// 초과근무 목록 응답
export interface OvertimeListResponse {
  items: OvertimeItem[];
  total: number;
  page: number;
  size: number;
  pages: number;
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

  // 초과근무 신청
  requestOvertime: async (params: OvertimeRequestParams): Promise<any> => {
    const response = await http('/user/overtime/request', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return response;
  },

  // 초과근무 목록 조회
  getOvertimeList: async (params?: OvertimeListParams): Promise<OvertimeListResponse> => {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.size) queryParams.append('size', params.size.toString());
    if (params?.q) queryParams.append('q', params.q);
    if (params?.user_id) queryParams.append('user_id', params.user_id);

    const response = await http<OvertimeListResponse>(`/user/overtime/list?${queryParams.toString()}`);
    return response;
  },

  // 초과근무 취소 (본인 취소)
  cancelOvertime: async (id: number): Promise<any> => {
    const response = await http(`/user/overtime/cancel/${id}?id=${id}`);
    return response;
  },

  // 초과근무 승인 (관리자)
  approveOvertime: async (id: number): Promise<any> => {
    const response = await http('/manager/overtime/confirm', {
      method: 'POST',
      body: JSON.stringify({ ot_seq: id }),
    });
    return response;
  },

  // 초과근무 반려 (관리자)
  rejectOvertime: async (id: number, reason: string): Promise<any> => {
    const response = await http('/manager/overtime/reject', {
      method: 'POST',
      body: JSON.stringify({ ot_seq: id, reason }),
    });
    return response;
  },

  // 초과근무 상세 조회
  getOvertimeDetail: async (id: number): Promise<OvertimeItem> => {
    const response = await http<OvertimeItem>(`/user/overtime/${id}`);
    return response;
  },

  // 관리자 - 팀원 초과근무 목록 조회
  getManagerOvertimeList: async (params?: ManagerOvertimeListParams): Promise<OvertimeListResponse> => {
    const queryParams = new URLSearchParams();
    
    if (params?.team_id) queryParams.append('team_id', params.team_id.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.size) queryParams.append('size', params.size.toString());
    if (params?.flag) queryParams.append('flag', params.flag);

    const response = await http<OvertimeListResponse>(`/manager/overtime/list?${queryParams.toString()}`);
    return response;
  },

  // 관리자 - 초과근무 상세 조회 (로그 포함)
  getManagerOvertimeDetail: async (id: number): Promise<any> => {
    const response = await http<any>(`/manager/overtime/info/${id}`);
    return response;
  },
};

