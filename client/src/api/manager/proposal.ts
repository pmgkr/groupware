// api/manager/proposal.ts
import { http } from '@/lib/http';
import type { ReportCard, ReportInfoResponse } from '../expense/proposal';

export interface ManagerReportCard extends ReportCard {
  manager_state: string;
  finance_state: string;
  gm_state: string;
  approval_manager_display_state?: string;
  approval_finance_display_state?: string;
  approval_gm_display_state?: string;
}

// 매니저 전용 상태 매핑 - 전체 결재 흐름 표시
function mapManagerDisplayState(item: any) {
  const managerState = (item.manager_state || '').trim();
  const financeState = (item.finance_state || '').trim();
  const gmState = (item.gm_state || '').trim();

  // 반려 상태 체크 (어느 단계에서든 반려되면 반려 표시)
  if (managerState === '반려' || financeState === '반려' || gmState === '반려') {
    return '반려';
  }

  // 팀장 단계
  if (managerState === '대기') return '팀장대기';

  // 팀장 완료 후 단계들
  if (managerState === '완료') {
    if (financeState === '대기') return '회계대기';
    if (financeState === '완료') {
      if (gmState === '대기') return 'GM대기';
      if (gmState === '완료') return '승인완료';
    }
  }

  return '팀장완료'; // 기본값
}

// flag 파라미터를 쿼리스트링으로 전달
export async function getReportListManager(flag: '대기' | '완료' | '반려', type: 'project' | 'non_project'): Promise<ManagerReportCard[]> {
  const url = `/manager/report/list?size=100000&flag=${flag}&type=${type}`;

  const res = await http<any>(url, {
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
