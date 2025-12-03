import { http } from '@/lib/http';


export type VacationDto = {
    team_id: number;
    parent_id: number | null;
    team_name: string;
    team_alias: string;
    level: number;
    order: number;
    manager_id: string | null;
    manager_name: string | null;
  };
  

export interface VacationList {
    total: number;
    page: number;
    size: number;
    rows: VacationItem[];
    filters: filters[];
}

export interface VacationItem {
    id: number;
    user_id: string;
    va_year: number;
    va_current: number;
    va_carryover: number;
    va_comp: number;
    va_long: number;
    user_name: string;
    team_id: number;
    user_status: string;
    hire_date: string;
    v_carryover: number;
    v_long: number;
    v_comp: number;
    v_currnet: number;
    v_official: number;
};

export interface filters {
    year: number;
    team_ids: number[];
}



export const adminVacationApi = {
  getVacationList: async (year?: number): Promise<VacationList> => {
    const response = await http<VacationList>(`/admin/vacation/list`, {
      method: 'POST',
      body: JSON.stringify({ year })
    });
    return response;
  },
  getVacationInfo: async (user_id: string, year:number, page:number, size:number): Promise<VacationItem> => {
    const response = await http<VacationItem>(`/admin/vacation/info/${user_id}?year=${year}&page=${page}&size=${size}`, {
      method: 'GET'
      body: JSON.stringify({ year, page, size })
    });
    return response;
  },
  grantVacation: async (user_id: string, year:number, page:number, size:number): Promise<any> => {
    const response = await http<any>(`/admin/vacation/grant/${user_id}?year=${year}&page=${page}&size=${size}`, {
      method: 'POST'
      body: JSON.stringify({ year, page, size })
    });
    return response;
  },
};