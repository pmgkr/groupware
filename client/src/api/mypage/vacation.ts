
import { http } from '@/lib/http';

/* 휴가 내역 */
export type MyVacationSummary = {
    id: number;
    va_year: number;
    va_used: number;
    va_current: number;
    va_carryover: number;
    va_comp: number;
    va_long: number;
  };
  
  export type MyVacationItem = {
    sch_id: number;
    v_year: string;
    v_type: string;
    v_count: number;
    sdate: string;
    edate: string;
    remark: string;
    wdate: string;
    sch_status?: string; // Y: 등록 완료, H: 취소 요청됨, N: 취소 완료
  };
  
  export async function MyVacationHistory(vyear: number): Promise<MyVacationItem[]> {
    const res = await http<{ summary: MyVacationSummary[]; lists: MyVacationItem[] }>(`/mypage/vacation?vyear=${vyear}`, { method: 'GET' });
    return res.lists || [];
  }
  