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
  team_id: number;
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

// 지각자 조회 응답 타입
//wtype이 "-"이면 일반, "half" 이면 반차, "quarter"이면 반반차임
//stime이 "00:00:00" 인 데이터는 출근시간 태깅을 안한 사람
export interface LateComerResponse {
  ok: boolean;
  total?: number;
  startYMD?: string;
  endYMD?: string;
  result?: {
    tdate: string;
    items: LateComerResponseItems[];
  }[] | LateComerResponseItems[];
  items?: LateComerResponseItems[];
}
export interface LateComerResponseItems {
  tdate?: string;
  user_name: string;
  team_name: string;
  user_id: string;
  stime: string;
  etime: string;
  wmin: number;
  wtype: string;
  wkind: string;

}

export const adminWlogApi = {
  // 주간 근태 로그 조회 (team_id 없으면 전체)
  getWlogWeekList: async (team_id: number | null | undefined, weekno: number, yearno: number): Promise<WlogWeekListResponse> => {
    const queryParams = new URLSearchParams();
    if (team_id !== null && team_id !== undefined) {
      queryParams.append('team_id', team_id.toString());
    }
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
  },

  // 지각자 조회
  // team_id를 전달하지 않으면 전체 팀 대상으로 조회
  getWlogLateComer: async (team_id: number | undefined, weekno: number, yearno: number): Promise<LateComerResponse> => {
    const queryParams = new URLSearchParams();
    if (team_id !== undefined && team_id !== null) {
      queryParams.append('team_id', team_id.toString());
    }
    queryParams.append('weekno', weekno.toString());
    queryParams.append('yearno', yearno.toString());
    const response = await http<LateComerResponse>(`/admin/wlog/latecomer?${queryParams.toString()}`, {
      method: 'GET'
    });
    return response;
  },
};