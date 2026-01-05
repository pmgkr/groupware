import { http } from '@/lib/http';

/* 추가근무 내역 */
  export type MyOvertimeSummary ={
    total: number;
    page: number;
    size: number;
    pages: number;
  }
  export type MyOvertimeItem = {
    id: number;
    user_id: string;
    user_name: string;
    team_id: number;
    ot_type: string;
    ot_date: string;
    ot_stime: string | null;
    ot_etime: string | null;
    ot_hours: string;
    ot_food: string | null;
    ot_trans: string | null;
    ot_reward: string;
    ot_client: string;
    ot_description: string;
    ot_status: string;
    ot_created_at: string;
    ot_modified_at: string;
  }
  export async function MyOvertimeHistory(page: number, size: number, vyear: number = new Date().getFullYear(), user_id: string = ''): Promise<{ total: number; page: number; size: number; pages: number; items: MyOvertimeItem[] }> {
    const queryParams = new URLSearchParams();
    queryParams.append('page', page.toString());
    queryParams.append('size', size.toString());
    queryParams.append('vyear', vyear.toString()); // 항상 vyear 전달
    if (user_id) queryParams.append('user_id', user_id);
    
    const res = await http<{ total: number; page: number; size: number; pages: number; items: MyOvertimeItem[] }>(`/mypage/overtime?${queryParams.toString()}`, { method: 'GET' });
    return res;
  }