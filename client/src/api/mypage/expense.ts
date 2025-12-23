import { http } from '@/lib/http';
import { cleanParams } from '@/utils';

// ------------------------------
// 리스트 조회용 타입
// ------------------------------
export interface ExpenseListParams {
  flag: 'P' | 'N';
  page?: number;
  size?: number;
  year?: string;
  type?: string;
  status?: string;
  method?: string;
  q?: string;
}

interface BaseExpenseListResponse {
  flag: 'P' | 'N';
  status: string | null;
  year: string | null;
  keyword: string | null;
  page: number;
  size: number;
  total: number;
  pages: number;
}

export interface PExpenseItem {
  alloc_status: string;
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
  el_attach: 'Y' | 'N';
  el_deposit: string | null;

  bank_account: string;
  bank_name: string;
  bank_code: string;
  account_name: string;

  el_amount: number;
  el_tax: number;
  el_total: number;

  status: string;
  remark: string | null;

  wdate: string;
  ddate: string | null;
  edate: string | null;
  cdate: string | null;

  rej_reason: string | null;
  rejected_by: string | null;

  match_count: number;
  allocated_amount: number;

  reg_year: string;
  is_estimate: 'Y' | 'N';
}

export interface NExpenseItem {
  seq: number;
  exp_id: string;
  user_id: string;
  user_nm: string;
  manager_id: string;
  manager_nm: string;

  el_type: string;
  el_title: string;
  el_method: string;
  el_attach: 'Y' | 'N';
  el_deposit: string | null;

  bank_account: string;
  bank_name: string;
  bank_code: string;
  account_name: string;

  el_amount: number;
  el_tax: number;
  el_total: number;

  status: string;
  remark: string | null;

  wdate: string;
  ddate: string | null;
  edate: string | null;
  cdate: string | null;

  rej_reason: string | null;
  rejected_by: string | null;

  team_id: number;
  team_name: string;
  user_status: string;
  reg_year: string;
}

export interface ExpenseListP extends BaseExpenseListResponse {
  flag: 'P';
  list: PExpenseItem[];
}

export interface ExpenseListN extends BaseExpenseListResponse {
  flag: 'N';
  list: NExpenseItem[];
}

export type ExpenseListResponse = ExpenseListP | ExpenseListN;

// 프로젝트비용 리스트
export async function getExpenseMine(params: ExpenseListParams) {
  const clean = cleanParams(params);

  // 쿼리스트링으로 변환
  const query = new URLSearchParams(clean as Record<string, string>).toString();
  const res = await http<ExpenseListResponse>(`/mypage/expense?${query}`, { method: 'GET' });

  return res;
}
