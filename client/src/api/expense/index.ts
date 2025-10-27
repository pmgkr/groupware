// 📦 일반비용 (Non-Expense) API
import { http } from '@/lib/http';

// ------------------------------
// 공통 코드 타입
// ------------------------------
export type ExpenseType = {
  code: string;
};

export type BankList = {
  code: string;
  name: string;
};

// ------------------------------
// 리스트 조회용 타입
// ------------------------------
export interface ExpenseListParams {
  page?: number;
  size?: number;
  year?: string;
  type?: string;
  method?: string;
  attach?: string;
  status?: string;
}

export type ExpenseListItem = {
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
  remark: string;
};

// ------------------------------
// 공통 Header / Item 구조
// ------------------------------
export interface ExpenseAttachment {
  filename: string;
  original: string;
  url: string;
}

export interface ExpenseItemBase {
  ei_title: string;
  ei_pdate: string;
  ei_number?: string | null;
  ei_amount: number;
  ei_tax: number;
  ei_total: number;
  pro_id?: number | null;
  attachments?: ExpenseAttachment[];
}

export interface ExpenseHeaderBase {
  user_id: string;
  el_method: string;
  el_attach: string;
  el_deposit?: string | null;
  bank_account: string;
  bank_name: string;
  bank_code: string;
  account_name: string;
  remark?: string | null;
}

// ------------------------------
// 등록용 (Register)
// ------------------------------
export interface ExpenseRegisterPayload {
  header: ExpenseHeaderBase;
  items: ExpenseItemBase[];
}

export interface ExpenseRegisterResponse {
  success: boolean;
  message: string;
  data?: {
    el_id: number;
  };
}

// ------------------------------
// 상세보기용 (View)
// ------------------------------
export interface ExpenseHeaderDTO extends ExpenseHeaderBase {
  seq: number;
  exp_id: string;
  user_nm: string;
  manager_id: string;
  manager_nm: string;
  el_type: string;
  el_title: string;
  el_amount: number;
  el_tax: number;
  el_total: number;
  status: string;
  rej_reason?: string | null;
  wdate: string;
  ddate?: string | null;
  edate?: string | null;
}

export interface ExpenseItemDTO extends ExpenseItemBase {
  seq: number;
  exp_id: string;
}

export interface ExpenseViewDTO {
  header: ExpenseHeaderDTO;
  items: ExpenseItemDTO[];
}

// 은행리스트 가져오기
export async function getBankList(): Promise<BankList[]> {
  return http<BankList[]>(`/user/common/codeList?ctype=bank`, { method: 'GET' });
}

// 일반비용 유형 가져오기
export async function getExpenseType(type: string): Promise<ExpenseType[]> {
  return http<ExpenseType[]>(`/user/common/codeList?ctype=${type}`, { method: 'GET' });
}

// 일반비용 리스트 가져오기
export async function getExpenseLists(params: ExpenseListParams = {}): Promise<{
  items: ExpenseListItem[];
  total: number;
  page: number;
  size: number;
  pages: number;
}> {
  const { page = 1, size = 15, year, type, method, attach, status } = params;

  const query = new URLSearchParams();
  query.append('page', String(page));
  query.append('size', String(size));
  if (year) query.append('year', year);
  if (type) query.append('type', type);
  if (method) query.append('method', method);
  if (attach) query.append('attach', attach);
  if (status) query.append('status', status);

  const url = `/user/nexpense/list?${query.toString()}`;
  console.log('📡 GET:', url);

  return http<{
    items: ExpenseListItem[];
    total: number;
    page: number;
    size: number;
    pages: number;
  }>(url, { method: 'GET' });
}

// 일반비용 상세보기
export async function getExpenseView(expid: string | undefined): Promise<ExpenseViewDTO> {
  if (!expid) throw new Error('expid가 필요합니다.');
  const url = `/user/nexpense/${expid}`;
  console.log('📡 GET:', url);
  return http<ExpenseViewDTO>(url, { method: 'GET' });
}

// 일반비용 작성하기
export async function expenseRegister(payload: ExpenseRegisterPayload[]) {
  return http<ExpenseRegisterResponse>(`/user/nexpense/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}
