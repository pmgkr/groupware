// /api/expense/index.ts
// 일반 비용 (Non-Expense) API
import { http } from '@/lib/http';

export type ExpenseType = {
  code: string;
};

export type BankList = {
  code: string;
  name: string;
};

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

// 상단 header 정보
export interface ExpenseHeader {
  user_id: string;
  el_method: string; // 결제수단 (예: PMG)
  el_attach: string; // 증빙자료 여부
  el_deposit?: string | null; // 입금예정일
  bank_account: string;
  bank_name: string;
  bank_code: string;
  account_name: string;
  remark?: string | null; // 비고
}

// 개별 항목 (items)
export interface ExpenseItem {
  el_type: string; // 비용 유형
  ei_title: string; // 가맹점명
  ei_pdate: string; // 매입일자 (YYYY-MM-DD)
  ei_number?: string | null; // 영수증 승인번호
  ei_amount: number; // 공급가액
  ei_tax: number; // 세금
  ei_total: number; // 합계
  pro_id?: number | null; // 프로젝트 ID (없으면 null 허용 가능)
  attachments?: ExpenseAttachment[]; // 증빙자료
}

// 첨부파일
export interface ExpenseAttachment {
  filename: string; // 파일 원본명
  url: string;
}

// 전체 요청 payload
export interface ExpenseRegisterPayload {
  header: ExpenseHeader;
  items: ExpenseItem[];
}

// 응답 타입
export interface ExpenseRegisterResponse {
  success: boolean;
  message: string;
  data?: {
    el_id: number;
  };
}

export async function getBankList(): Promise<BankList[]> {
  // 은행리스트 가져오기
  return http<BankList[]>(`/user/common/codeList?ctype=bank`, { method: 'GET' });
}

export async function getExpenseType(type: string): Promise<ExpenseType[]> {
  // 일반비용 유형 가져오기
  return http<ExpenseType[]>(`/user/common/codeList?ctype=${type}`, { method: 'GET' });
}

export async function getExpenseLists(params: ExpenseListParams = {}): Promise<{
  items: ExpenseListItem[];
  total: number;
  page: number;
  size: number;
  pages: number;
}> {
  const { page = 1, size = 15, year, type, method, attach, status } = params;

  // 쿼리스트링 자동 생성
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

  // 일반비용 리스트 가져오기
  return http<{
    items: ExpenseListItem[];
    total: number;
    page: number;
    size: number;
    pages: number;
  }>(url, { method: 'GET' });
}

export async function expenseRegister(payload: ExpenseRegisterPayload) {
  // 일반비용 작성하기 API
  return http<ExpenseRegisterResponse>(`/user/nexpense/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}
