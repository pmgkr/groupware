import { http } from '@/lib/http';

// 마이페이지-휴가 요약 정보
export interface MyVacationInfo {
  id: number;
  va_year: number;
  va_used: string;
  va_current: string;
  va_carryover: string;
  va_comp: string;
  va_long: string;
}

// 마이페이지-휴가 내역 정보
export interface MyVacationList {
  sch_id: number;
  v_year: string;
  v_type: string;
  v_count: number;
  sdate: string;
  edate: string;
  remark: string;
  wdate: string;
}

// 마이페이지-휴가 조회 응답
export interface MyVacationResponse {
  summary: MyVacationInfo[];
  lists: MyVacationList[];
}

// 마이페이지-내 휴가 내역 조회
export async function getMyVacation(vyear?: number): Promise<MyVacationResponse> {
  const params = new URLSearchParams();
  if (vyear) {
    params.append('vyear', vyear.toString());
  }
  const url = `/mypage/vacation${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await http<MyVacationResponse>(url, { method: 'GET' });
  return res;
}
