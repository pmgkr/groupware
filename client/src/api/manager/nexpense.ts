// 📦 일반비용 (Non-Expense) API
import { http } from '@/lib/http';
import { cleanParams } from '@/utils';

// 매니저 일반비용 목록 팀별 조회
export interface ExpenseListParams {
  page?: number;
  size?: number;
  year?: string;
  type?: string;
  method?: string;
  attach?: string;
  status?: string;
}

// 매니저 일반비용 목록 리스폰 타입
export type ExpenseListItems = {
  seq: number;
  exp_id: string;
  user_id: string;
  user_nm: string;
  manager_id: string;
  manager_nm: string;
  el_type: string;
  el_title: string;
  el_method: string;
  el_attach: string;
  el_deposit?: string | null;
  bank_account: string;
  bank_name: string;
  bank_code: string;
  account_name: string;
  el_amount: number;
  el_tax: number;
  el_total: number;
  status: string;
  rej_reason?: string | null;
  wdate: string;
  ddate?: string | null;
  edate?: string | null;
  cdate?: string | null;
  remark: string;
  team_id: number;
  team_name: string;
  reg_year: string;
  rejected_by?: string | null;
};

// 매니저 > 일반 비용 목록 가져오기
export async function getManagerExpenseList(params: ExpenseListParams) {
  const clean = cleanParams(params);

  // 쿼리스트링으로 변환
  const query = new URLSearchParams(clean as Record<string, string>).toString();
  const res = await http<{ items: ExpenseListItems[]; total: number }>(`/manager/nexpense/listAll?${query}`, { method: 'GET' });

  return res;
}

// 매니저 > 일반 비용 목록 가져오기
export async function getManagerExpenseMine(params: ExpenseListParams) {
  const clean = cleanParams(params);

  // 쿼리스트링으로 변환
  const query = new URLSearchParams(clean as Record<string, string>).toString();
  const res = await http<{ items: ExpenseListItems[]; total: number }>(`/manager/nexpense/listmine?${query}`, { method: 'GET' });

  return res;
}

// 매니저 > 일반 비용 승인하기
export async function confirmExpense(payload: { seqs: number[] }): Promise<{ count: number; status: string }> {
  const res = http<{ count: number; status: string }>(`/manager/nexpense/confirm/`, { method: 'PATCH', body: JSON.stringify(payload) });

  return res;
}

// 매니저 > 일반 비용 반려처리
export async function rejectExpense(payload: { seq: number; reason?: string }): Promise<{ seq: number; status: string }> {
  const res = http<{ seq: number; status: string }>(`/manager/nexpense/reject/`, { method: 'PATCH', body: JSON.stringify(payload) });

  return res;
}
