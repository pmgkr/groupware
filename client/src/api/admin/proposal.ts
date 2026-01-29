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

// 회계 담당자용 상태 매핑 - 전체 결재 흐름 표시
function financeDisplayState(item: any) {
  const managerState = (item.manager_state || '').trim();
  const financeState = (item.finance_state || '').trim();
  const gmState = (item.gm_state || '').trim();

  // 반려 상태 체크
  if (managerState === '반려' || financeState === '반려' || gmState === '반려') {
    return '반려';
  }

  // 팀장 단계
  if (managerState === '대기') return '팀장대기';
  if (managerState === '완료' && financeState === '대기') return '회계대기';

  // 회계 완료 후
  if (managerState === '완료' && financeState === '완료') {
    if (gmState === '대기') return 'GM대기';
    if (gmState === '완료') return '승인완료';
  }

  return '팀장완료';
}

// GM용 상태 매핑 - 전체 결재 흐름 표시
function gmDisplayState(item: any) {
  const managerState = (item.manager_state || '').trim();
  const financeState = (item.finance_state || '').trim();
  const gmState = (item.gm_state || '').trim();

  // 반려 상태 체크
  if (managerState === '반려' || financeState === '반려' || gmState === '반려') {
    return '반려';
  }

  // 팀장 단계
  if (managerState === '대기') return '팀장대기';

  // 회계 단계
  if (managerState === '완료' && financeState === '대기') return '회계대기';
  if (managerState === '완료' && financeState === '완료' && gmState === '대기') return 'GM대기';

  // GM 완료
  if (managerState === '완료' && financeState === '완료' && gmState === '완료') return '승인완료';

  return '팀장완료';
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

  // status 그대로 서버로 전달
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

    approval_manager_display_state: '', // 어드민에서는 사용 안함
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
