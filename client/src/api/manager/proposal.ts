// api/manager/proposal.ts
import { http } from '@/lib/http';
import type { ReportCard, ReportInfoResponse } from '../expense/proposal';

export interface ManagerReportCard extends ReportCard {
  manager_state: string;
  finance_state: string;
  gm_state: string;
  approval_manager_display_state?: string;
}

// 🔥 매니저 전용 상태 매핑
function mapManagerDisplayState(item: any) {
  const state = (item.manager_state || '').trim();

  if (state === '반려') return '반려';
  if (state === '대기') return '팀장대기';
  if (state === '완료') return '팀장완료';

  return '';
}

// 🔥 수정: flag 파라미터를 쿼리스트링으로 전달
export async function getReportListManager(flag: '대기' | '완료' | '반려' = '대기'): Promise<ManagerReportCard[]> {
  const url = `/manager/report/list?size=100000&flag=${flag}`;

  const res = await http<any>(url, {
    method: 'GET',
  });

  const rawItems = res.items ?? [];

  console.log('🔍 API Response:', {
    flag,
    totalItems: rawItems.length,
    allManagerStates: rawItems.map((item: any) => item.manager_state),
    sample: rawItems.slice(0, 5).map((item: any) => ({
      id: item.rp_seq,
      title: item.rp_title,
      manager_state: item.manager_state,
      state: item.rp_state,
    })),
  });

  return rawItems.map((item: any) => {
    const display = mapManagerDisplayState(item);

    return {
      id: item.rp_seq,
      report_num: item.rp_expense_no ?? '',
      category: item.rp_category,
      title: item.rp_title,
      state: item.rp_state,
      date: item.rp_date,
      price: item.rp_cost,
      team: item.team_name,
      user: item.rp_user_name,
      user_id: item.rp_user_id,
      expense_no: item.rp_expense_no,
      manager_state: item.manager_state,
      finance_state: item.finance_state,
      gm_state: item.gm_state,
      approval_manager_display_state: display,
    };
  });
}

// 상세
export const getReportInfoManager = async (rp_seq: string): Promise<ReportInfoResponse> => {
  return await http(`/manager/report/info/${rp_seq}`, {
    method: 'GET',
  });
};

// 승인
export async function approveReport(rp_seq: string, user_id: string) {
  return await http(`/manager/report/confirm`, {
    method: 'POST',
    body: JSON.stringify({ rp_seq, user_id }),
  });
}

// 반려
export async function rejectReport(rp_seq: string, user_id: string) {
  return await http(`/manager/report/reject`, {
    method: 'POST',
    body: JSON.stringify({ rp_seq, user_id }),
  });
}
