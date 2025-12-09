import { http } from '@/lib/http';

// 근태 로그 항목 타입
export interface WlogItem {
  user_id: string;
  user_nm: string;
  tdate: string;
  stime: string;
  etime: string;
  wmin: number;
  kind: string;
  type: string;
}

// 주간 근태 로그 조회 응답 타입
export interface WlogWeekListResponse {
  yearNo: number;
  weekNo: number;
  sdate: string;
  edate: string;
  wlog: WlogItem[];
  vacation: any[];
  team_id: string;
}

// 근태 로그 수정 요청 타입
export interface WlogUpdateRequest {
  user_id: string;
  tdate: string;
  stime: string;
  etime: string;
}

// 근태 로그 수정 응답 타입
export interface WlogUpdateResponse {
  result: string;
  user: string;
  date: string;
  started: string;
  ended: string;
}

export const adminWlogApi = {
  // 주간 근태 로그 조회
  getWlogWeekList: async (team_id: number, weekno: number, yearno: number): Promise<WlogWeekListResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('team_id', team_id.toString());
    queryParams.append('weekno', weekno.toString());
    queryParams.append('yearno', yearno.toString());
    const response = await http<WlogWeekListResponse>(`/admin/wlog/week?${queryParams.toString()}`, {
      method: 'GET'
    });
    return response;
  },
  
  // 근태 로그 수정/등록
  updateWlog: async (user_id: string, tdate: string, stime: string, etime: string): Promise<WlogUpdateResponse> => {
    // 시간 형식 변환: "HH:mm" -> "HH:mm:ss"
    const formatTime = (time: string) => {
      if (!time) return '';
      // 이미 초가 포함되어 있으면 그대로 반환
      if (time.length === 8) return time;
      // "HH:mm" 형식이면 ":00" 추가
      return `${time}:00`;
    };

    const response = await http<WlogUpdateResponse>(`/admin/wlog/update`, {
      method: 'POST',
      body: JSON.stringify({
        user_id,
        tdate,
        stime: formatTime(stime),
        etime: formatTime(etime)
      }),
    });
    return response;
  }
};