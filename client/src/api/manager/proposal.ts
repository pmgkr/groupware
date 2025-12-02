// expense/proposal
import { http } from '@/lib/http';
import type { ReportCard, ReportInfoResponse } from '../expense/proposal';

export interface ManagerReportCard extends ReportCard {
  manager_state: string;
  finance_state: string;
  gm_state: string;
  approval_display_state?: string; // 프론트에서 계산해서 넣는 값
}

export async function getReportListManager(): Promise<ManagerReportCard[]> {
  const res = await http<any>('/manager/report/list', { method: 'GET' });

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

    // 🔥 관리자 전용 상태값 추가
    manager_state: item.manager_state,
    finance_state: item.finance_state,
    gm_state: item.gm_state,
  }));
}

export const getReportInfoManager = async (rp_seq: string): Promise<ReportInfoResponse> => {
  return await http(`/manager/report/info/${rp_seq}`, {
    method: 'GET',
  });
};

// 기안서 승인
export async function approveReport(rp_seq: string, user_id: string) {
  return await http(`/manager/report/confirm`, {
    method: 'POST',
    body: JSON.stringify({ rp_seq, user_id }),
  });
}

// 기안서 반려
export async function rejectReport(rp_seq: string, user_id: string) {
  return await http(`/manager/report/reject`, {
    method: 'POST',
    body: JSON.stringify({ rp_seq, user_id }),
  });
}

//기안서 삭제
export async function deleteReport(rp_seq: string) {
  return await http(`/user/office/report/delete/${rp_seq}`, {
    method: 'DELETE',
  });
}
