// 📦 일반비용 (Non-Expense) API
import { http } from '@/lib/http';
import type { addInfoDTO } from '../project';
import type { ExpenseType, BankList } from '@/api/common/types';

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
  cdate?: string | null;
  remark: string;
  add_info?: addInfoDTO[];
};

// ------------------------------
// 공통 Header / Item 구조
// ------------------------------
// (1) ExpenseRegister에서 사용하는 증빙자료 타입 정의
export interface ExpenseAttachment {
  filename: string;
  original: string;
  url?: string;
}

// (2) ExpenseView에서 Response로 받는 증빙자료 타입 정의
export interface ExpenseAttachmentDTO {
  seq: number; // 첨부파일 PK
  ei_seq: number; // 연결된 item의 seq
  ea_fname: string; // 원본 파일명
  ea_sname: string; // 서버 저장 파일명
  ea_url: string; // 파일 URL
  uploaded_at: string; // 업로드 일시 (ISO)
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
  expense_add_info?: addInfoDTO[];
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
  ok: boolean;
  docs?: {
    results: {
      el_type: string;
      exp_id: string;
      list_seq: number;
      item_seqs: number[];
      totals: {
        amount: number;
        tax: number;
        total: number;
      };
      count_items: number;
    }[];
    inserted: {
      list_count: number;
      item_count: number;
    };
  };
}

// 외주용역비 및 접대비 유형 생성
export interface ainfoCreatePayload {
  exp_idx: number;
  exp_kind_idx: number;
  tax_type?: string;
  work_term?: string;
  work_day?: string;
  h_name?: string;
  h_ssn?: string;
  h_tel?: string;
  h_addr?: string;
  ent_member?: string;
  ent_reason?: string;
}

export interface ainfoCreateResponse {
  seq: number;
  exp_idx: number;
  exp_kind_idx: number;
  tax_type?: string;
  work_term?: string;
  work_day?: string;
  h_name?: string;
  h_ssn?: string;
  h_tel?: string;
  h_addr?: string;
  ent_member?: string;
  ent_reason?: string;
  user_id: string;
  wdate: string;
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
  cdate?: string | null;
  rejected_by?: string | null;
}

export interface ExpenseItemDTO extends Omit<ExpenseItemBase, 'attachments'> {
  seq: number;
  ei_type: string;
  exp_id: string;
  attachments: ExpenseAttachmentDTO[];
  rp_title: string;
}

export interface ExpenseLogDTO {
  idx: number;
  seq: number;
  user_nm: string;
  exp_status: string;
  remark?: string | null;
  url: string;
  log_date: string;
}

export interface ExpenseViewDTO {
  header: ExpenseHeaderDTO;
  items: ExpenseItemDTO[];
  logs: ExpenseLogDTO[];
}

// ------------------------------
// 수정하기 (Update)
// ------------------------------
export interface ExpenseEditPayload {
  header: ExpenseHeaderBase;
  items: {
    ei_title: string;
    ei_pdate: string;
    ei_number?: string | null;
    ei_amount: number;
    ei_tax: number;
    ei_total: number;
    pro_id?: number | null;
    attachments?: ExpenseAttachment[];
  }[];
}

export interface ExpenseEditResponse {
  ok: boolean;
  updated: {
    itemCount: number;
    item_seqs: number[];
    requested: number[];
  };
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

// 임시저장 비용 청구
export async function claimTempExpense(payload: { seqs: number[] }): Promise<{ ok: boolean }> {
  const res = http<{ ok: boolean }>(`/user/nexpense/claim/`, { method: 'POST', body: JSON.stringify(payload) });

  return res;
}

// 임시저장 비용 삭제처리
export async function deleteTempExpense(payload: { seqs: number[] }): Promise<{ ok: boolean }> {
  const res = http<{ ok: boolean }>(`/user/nexpense/delete/`, { method: 'POST', body: JSON.stringify(payload) });

  return res;
}

// 일반비용 상세보기
export async function getExpenseView(expid: string | undefined): Promise<ExpenseViewDTO> {
  if (!expid) throw new Error('expid가 필요합니다.');
  return http<ExpenseViewDTO>(`/user/nexpense/${expid}`, { method: 'GET' });
}

// 일반비용 작성하기
export async function expenseRegister(payload: ExpenseRegisterPayload) {
  return http<ExpenseRegisterResponse>(`/user/nexpense/register`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// 일반비용 수정하기
export async function expenseUpdate(expid: string, payload: ExpenseEditPayload) {
  return http<ExpenseEditResponse>(`/user/nexpense/update/${expid}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// 일반비용 증빙자료 삭제
export async function delExpenseAttachment(seq: number): Promise<void> {
  return http<void>(`/user/nexpense/update/attachment/delete/${seq}`, { method: 'DELETE' });
}

export async function ainfoCreate(payload: ainfoCreatePayload) {
  return http<ainfoCreateResponse>(`/user/nexpense/ainfo/create`, { method: 'POST', body: JSON.stringify(payload) });
}
