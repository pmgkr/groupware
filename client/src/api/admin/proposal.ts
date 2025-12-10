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
  if (state === '완료') return '팀장결재완료';

  return '';
}

export async function getReportListManager(params: {
  page: number;
  size: number;
  type?: string;
  q?: string;
}): Promise<ManagerReportCard[]> {
  const queryParams = new URLSearchParams();
  queryParams.append('page', '1');
  queryParams.append('size', params.size.toString());
  if (params.type) queryParams.append('type', params.type);
  if (params.q) queryParams.append('q', params.q);

  const res = await http<any>(`/manager/report/list?${queryParams.toString()}`, {
    method: 'GET',
  });

  const rawItems = res.items ?? [];

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
