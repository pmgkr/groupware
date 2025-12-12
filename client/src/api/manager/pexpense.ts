// 📦 프로젝트 비용 API
import { http } from '@/lib/http';
import { cleanParams } from '@/utils';
import type { pExpenseViewDTO } from '@/api/project/expense';

// 매니저 프로젝트 비용 목록 팀별 조회
export interface ExpenseListParams {
  page?: number;
  size?: number;
  year?: string;
  type?: string;
  method?: string;
  attach?: string;
  status?: string;
}

// 매니저 프로젝트 비용 목록 리스폰 타입
export type ExpenseListItems = {
  seq: number;
  exp_id: string;
  project_id: string;
  user_id: string;
  user_nm: string;
  manager_id: string;
  manager_nm: string;
  team_id: number;
  team_name: string;
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
  reg_year: string;
  rejected_by?: string | null;
  alloc_status: string; // 매칭 상태
  match_count?: number | null; // 매칭된 항목 갯수
  allocated_amount?: number; //매칭된 비용 합계
  is_estimate: 'Y' | 'N'; // 견적서 비용 체크
};

// 매니저 > 프로젝트 비용 목록 가져오기
export async function getManagerExpenseList(params: ExpenseListParams) {
  const clean = cleanParams(params);

  // 쿼리스트링으로 변환
  const query = new URLSearchParams(clean as Record<string, string>).toString();
  const res = await http<{ items: ExpenseListItems[]; total: number }>(`/manager/pexpense/listAll?${query}`, { method: 'GET' });

  return res;
}

// 매니저 > 프로젝트 비용 목록 가져오기
export async function getManagerExpenseMine(params: ExpenseListParams) {
  const clean = cleanParams(params);

  // 쿼리스트링으로 변환
  const query = new URLSearchParams(clean as Record<string, string>).toString();
  const res = await http<{ items: ExpenseListItems[]; total: number }>(`/manager/pexpense/list?${query}`, { method: 'GET' });

  return res;
}

// 매니저 > 프로젝트 비용 조회
export async function getManagerExpenseView(exp_id: string | undefined): Promise<pExpenseViewDTO> {
  if (!exp_id) throw new Error('expid가 필요합니다.');
  return http<pExpenseViewDTO>(`/user/pexpense/info/${exp_id}`, { method: 'GET' });
}

// 매니저 > 프로젝트 비용 승인하기
export async function confirmExpense(payload: { seqs: number[] }): Promise<{ updated_count: number; ok: boolean }> {
  const res = http<{ updated_count: number; ok: boolean }>(`/manager/pexpense/confirm/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return res;
}

// 매니저 > 프로젝트 비용 반려처리
export async function rejectExpense(payload: { seq: number; reason?: string }): Promise<{ seq: number; status: string }> {
  const res = http<{ seq: number; status: string }>(`/manager/pexpense/reject/`, { method: 'PATCH', body: JSON.stringify(payload) });

  return res;
}
