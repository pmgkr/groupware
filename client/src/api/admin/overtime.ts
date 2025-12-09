import { http } from '@/lib/http';


export interface overtimeItem {
  id: number;
  user_id: string;
  user_name: string;
  team_id: number;
  ot_type: string;
  ot_date: string;
  ot_stime: string | null;
  ot_etime: string;
  ot_hours: string;
  ot_food: string;
  ot_trans: string;
  ot_reward: string;
  ot_client: string;
  ot_description: string;
  ot_status: string;
  ot_created_at: string;
  ot_modified_at: string;
}

export interface overtimeList {
    items: overtimeItem[];
    total: number;
    page: number;
    size: number;
    pages: number;
}

// 초과근무 승인
export interface overtimeApprove {
  ot_seq: number;
}

// 초과근무 반려
export interface overtimeReject {
  ot_seq: number;
}

export interface overtimeInfo {
  info: null;
  logs: overtimeLog[];
}

export interface overtimeLog {
  idx: number;
  ot_seq: number;
  user_name: string;
  ot_status: string;
  wdate: string;
  remark: string;
}

// 초과근무 HR 승인(지급) 목록, 상태값 Y
export interface overtimeRewardList {
  items: overtimeItem[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// 초과근무 승인 응답
export interface overtimeApproveResponse {
  id: number;
  ot_date: string;
  user_id: string;
  user_name: string;
  ot_status: string;
  ot_type: string;
  ot_stime: string;
  ot_etime: string;
  ot_reward: string;
  ot_hours: string;
}

// 초과근무 반려 응답
export interface overtimeRejectResponse {
  id: number;
  ot_date: string;
  user_name: string;
  ot_status: string;
}



export const adminOvertimeApi = {
  getOvertimeList: async (team_id: number, page: number, size: number, flag: string): Promise<overtimeList> => {
    const queryParams = new URLSearchParams();
    queryParams.append('team_id', team_id.toString());
    queryParams.append('page', page.toString());
    queryParams.append('size', size.toString());
    queryParams.append('flag', flag);
    const response = await http<overtimeList>(`/admin/overtime/list?${queryParams.toString()}`);
    return response;
  },

  getOvertimeDetail: async (id: number): Promise<overtimeInfo> => {
    const response = await http<overtimeInfo>(`/admin/overtime/info/${id}`);
    return response;
  },

  approveOvertime: async (ot_seq: number): Promise<overtimeApproveResponse> => {
    const response = await http<overtimeApproveResponse>(`/admin/overtime/approve`, {
      method: 'POST',
      body: JSON.stringify({ ot_seq }),
    });
    return response;
  },

  rejectOvertime: async (ot_seq: number): Promise<overtimeRejectResponse> => {
    const response = await http<overtimeRejectResponse>(`/admin/overtime/reject`, {
      method: 'POST',
      body: JSON.stringify({ ot_seq }),
    });
    return response;
  },

  getOvertimeRewardList: async (team_id: number, page: number, size: number): Promise<overtimeRewardList> => {
    const queryParams = new URLSearchParams();
    queryParams.append('team_id', team_id.toString());
    queryParams.append('page', page.toString());
    queryParams.append('size', size.toString());
    const response = await http<overtimeRewardList>(`/admin/overtime/reward?${queryParams.toString()}`);
    return response;
  },
};