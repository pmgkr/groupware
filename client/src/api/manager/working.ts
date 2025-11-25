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

// 관리자 근태 로그 주간 조회 파라미터
export interface ManagerWorkLogWeekParams {
  team_id: number;
  weekno: number;
  yearno: number;
}

// 관리자 근태 API
export const managerWorkingApi = {
  // 출퇴근 시간 수정/등록 (관리자)
  updateWorkTime: async (userId: string, date: string, startTime: string, endTime: string): Promise<any> => {
    // 시간 형식 변환: "HH:mm" -> "HH:mm:ss"
    const formatTime = (time: string) => {
      if (!time) return '';
      // 이미 초가 포함되어 있으면 그대로 반환
      if (time.length === 8) return time;
      // "HH:mm" 형식이면 ":00" 추가
      return `${time}:00`;
    };

    const response = await http('/manager/wlog/update', {
      method: 'POST',
      body: JSON.stringify({ 
        user_id: userId, 
        tdate: date,
        stime: formatTime(startTime), 
        etime: formatTime(endTime)
      }),
    });
    return response;
  },

  // 관리자 - 근태 로그 주간 조회
  getManagerWorkLogsWeek: async (params: ManagerWorkLogWeekParams): Promise<WorkLogResponse> => {
    const queryParams = new URLSearchParams();
    
    queryParams.append('team_id', params.team_id.toString());
    queryParams.append('weekno', params.weekno.toString());
    queryParams.append('yearno', params.yearno.toString());

    const url = `/manager/wlog/week?${queryParams.toString()}`;
    
    try {
      const response = await http<any>(url);
      
      // 응답 형식 확인 및 변환
      if (response && typeof response === 'object') {
        // 이미 WorkLogResponse 형식인 경우
        if (response.wlog !== undefined) {
          return {
            wlog: Array.isArray(response.wlog) ? response.wlog : [],
            vacation: Array.isArray(response.vacation) ? response.vacation : []
          };
        }
        // 다른 형식일 수 있으므로 그대로 반환 (호환성 유지)
        return response as WorkLogResponse;
      }
      
      return { wlog: [], vacation: [] };
    } catch (error) {
      throw error;
    }
  },

};

