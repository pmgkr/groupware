import { http } from '@/lib/http';


export interface VacationList {
    ok: boolean;
    total: number;
    page: number;
    size: number;
    rows: VacationItem[];
    filter: filters;
}

export interface VacationItem {
    id: number;
    user_id: string;
    va_year: number;
    va_current: number;
    va_carryover: number;
    va_comp: number;
    va_long: number;
    va_used?: string; // 사용한 휴가일수
    user_name: string;
    team_id: number;
    user_status: string;
    hire_date: string;
    v_current: number; // 기본연차
    v_carryover: number; //이월연차
    v_comp: number;  // 특별대휴
    v_official: number; // 공가
    v_long: number; // 근속휴가
}

export interface VacationLogItem {
    idx: number;
    sch_id: number;
    user_id: string;
    v_year: string;
    v_type: string;
    v_count: number;
    sdate: string;
    edate: string;
    remark: string;
    wdate: string;
}

export interface VacationInfoResponse {
    ok: boolean;
    header: VacationItem;
    body: VacationLogItem[];
    footer: {
        total: number;
        page: number;
        size: number;
    };
}

export interface filters {
    year: number;
    team_ids: number[];
}



export const adminVacationApi = {
  getVacationList: async (year?: number, team_id?: number, page?: number, size?: number): Promise<VacationList> => {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (team_id) params.append('team_id', team_id.toString());
    if (page) params.append('page', page.toString());
    if (size) params.append('size', size.toString());
    
    const url = `/admin/vacation/list${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await http<VacationList>(url, {
      method: 'GET'
    });
    return response;
  },
  getVacationInfo: async (user_id: string, year:number, page?:number, size?:number): Promise<VacationInfoResponse> => {
    const params = new URLSearchParams();
    params.append('user_id', user_id);
    params.append('year', year.toString());
    if (page) params.append('page', page.toString());
    if (size) params.append('size', size.toString());
    
    const response = await http<VacationInfoResponse>(`/admin/vacation/info?${params.toString()}`, {
      method: 'GET'
    });
    return response;
  },
  grantVacation: async (user_id: string, year:number, page:number, size:number): Promise<any> => {
    const response = await http<any>(`/admin/vacation/grant/${user_id}?year=${year}&page=${page}&size=${size}`, {
      method: 'POST',
      body: JSON.stringify({ year, page, size })
    });
    return response;
  },
};