// api/admin/proposal.ts
import { http } from '@/lib/http';
import type { ReportCard, ReportInfoResponse } from '../expense/proposal';

export interface AdminReportCard extends ReportCard {
  manager_state: string;
  finance_state: string;
  gm_state: string;
  approval_manager_display_state?: string;
  approval_finance_display_state?: string;
  approval_gm_display_state?: string;
}

function managerDisplayState(item: any) {
  const state = (item.manager_state || '').trim();

  if (state === '반려') return '반려';
  if (state === '대기') return '팀장대기';
  if (state === '완료') return '팀장완료';

  return '';
}

function financeDisplayState(item: any) {
  // 회계는 팀장 승인 이후에만 의미 있음
  if (item.manager_state !== '완료') return '';

  const state = (item.finance_state || '').trim();

  if (state === '반려') return '반려';
  if (state === '대기') return '회계대기';
  if (state === '완료') return '회계완료';

  return '';
}
function gmDisplayState(item: any) {
  // GM은 팀장 & 회계가 모두 완료된 후에만 유효한 단계!
  if (item.manager_state !== '완료') return '';
  if (item.finance_state !== '완료') return '';

  const state = (item.gm_state || '').trim();

  if (state === '반려') return '반려';
  if (state === '대기') return 'GM대기';
  if (state === '완료') return '승인완료';

  return '';
}

export async function getReportListAdmin(params: {
  page: number;
  size: number;
  status?: 'finance' | 'gm' | 'rejected' | 'completed';
  q?: string;
}): Promise<AdminReportCard[]> {
  const queryParams = new URLSearchParams();

  queryParams.append('page', params.page.toString());
  queryParams.append('size', params.size.toString());

  // 🔥 status 그대로 서버로 전달
  if (params.status) queryParams.append('status', params.status);
  if (params.q) queryParams.append('q', params.q);

  const res = await http<any>(`/admin/report/list?${queryParams.toString()}`, {
    method: 'GET',
  });

  const rawItems = res.items ?? [];

  return rawItems.map((item: any) => ({
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

    approval_manager_display_state: managerDisplayState(item),
    approval_finance_display_state: financeDisplayState(item),
    approval_gm_display_state: gmDisplayState(item),
  }));
}

// 상세
export const getReportInfoAdmin = async (rp_seq: string): Promise<ReportInfoResponse> => {
  return await http(`/admin/report/info/${rp_seq}`, {
    method: 'GET',
  });
};

// 승인
export async function approveReport(seq: number[]) {
  return await http(`/admin/report/confirm`, {
    method: 'POST',
    body: JSON.stringify({ seq }),
  });
}

// 반려
export async function rejectReport(seq: number[]) {
  return await http(`/admin/report/reject`, {
    method: 'POST',
    body: JSON.stringify({ seq }),
  });
}
