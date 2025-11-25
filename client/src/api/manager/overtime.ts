import { http } from '@/lib/http';

// 추가근무 목록 조회 파라미터
export interface ManagerOvertimeListParams {
  team_id?: number;
  page?: number;
  size?: number;
  flag?: string;  // ot_status (H: 승인대기, T: 승인완료, Y: 리워드지급(최종승인), N: 취소완료)
}

// 관리자 추가근무 최종승인(리워드지급) 파라미터
export interface ManagerOvertimeRewardParams {
  ot_seq: number;
}

// 추가근무 항목
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
  ot_status: string;  // "H" (승인대기), "T" (승인완료), "N" (취소완료)
  ot_created_at: string;
  ot_modified_at: string;
}

// 추가근무 목록 응답
export interface OvertimeListResponse {
  items: OvertimeItem[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// 관리자 추가근무 API
export const managerOvertimeApi = {
  // 추가근무 승인 (관리자)
  approveOvertime: async (id: number): Promise<any> => {
    const response = await http('/manager/overtime/confirm', {
      method: 'POST',
      body: JSON.stringify({ ot_seq: id }),
    });
    return response;
  },

  // 추가근무 반려 (관리자)
  rejectOvertime: async (id: number, reason: string): Promise<any> => {
    const response = await http('/manager/overtime/reject', {
      method: 'POST',
      body: JSON.stringify({ ot_seq: id, reason }),
    });
    return response;
  },

  // 관리자 - 팀원 추가근무 목록 조회
  getManagerOvertimeList: async (params?: ManagerOvertimeListParams): Promise<OvertimeListResponse> => {
    const queryParams = new URLSearchParams();
    
    if (params?.team_id) queryParams.append('team_id', params.team_id.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.size) queryParams.append('size', params.size.toString());
    if (params?.flag) queryParams.append('flag', params.flag);

    const response = await http<OvertimeListResponse>(`/manager/overtime/list?${queryParams.toString()}`);
    return response;
  },

  // 관리자 - 추가근무 리워드 지급(최종승인)
  grantOvertimeReward: async (otSeq: number): Promise<any> => {
    const response = await http('/manager/overtime/confirm', {
      method: 'POST',
      body: JSON.stringify({ ot_seq: otSeq }),
    });
    return response;
  },

  // 관리자 - 보상요청 상태 승인(리워드 지급)
  confirmOvertimeCompensation: async (params: ManagerOvertimeRewardParams): Promise<any> => {
    const response = await http('/manager/overtime/confirm', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return response;
  },

  // 관리자 - 추가근무 상세 조회 (로그 포함)
  getManagerOvertimeDetail: async (id: number): Promise<any> => {
    const response = await http<any>(`/manager/overtime/info/${id}`);
    return response;
  },
};

