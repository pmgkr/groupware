import { http } from '@/lib/http';
import { cleanParams } from '@/utils';
import type { ExpenseType, BankList } from '@/api/common/types';

// ------------------------------
// 프로젝트 비용 조회용 타입
// ------------------------------
export type pExpenseListItem = {
  seq: number;
  exp_id: string;
  project_id: string;
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
  ddate?: string | null; // 지급 예정일자 (Finance)
  edate?: string | null; // 지급 완료일자 (Finance)
  cdate?: string | null; // 승인일자 (Manager)
  remark: string;
  is_estimate?: string; // 견적서 비용 or 견적서 외 비용
  alloc_status?: string; // 견적서 매칭 상태
  allocated_amount?: number; // 견적서 매칭 합계
  add_info?: addInfoDTO[];
};

export type projectExpenseParams = {
  project_id?: string;
  year?: string;
  type?: string;
  method?: string;
  attach?: string;
  status?: string;
  page?: number;
  size?: number;
  q?: string;
};

// 프로젝트 비용 리스트 Reponse
export type projectExpenseResponse = {
  items: pExpenseListItem[];
  total: number;
  page: number;
  size: number;
  pages: number;
};

// ------------------------------
// 공통 Header / Item 구조
// ------------------------------
// (1) ExpenseRegister에서 사용하는 증빙자료 타입 정의
export interface pExpenseAttachment {
  filename: string;
  original: string;
  url?: string;
}

// (2) ExpenseView에서 Response로 받는 증빙자료 타입 정의
export interface pExpenseAttachmentDTO {
  seq: number; // 첨부파일 PK
  ei_seq: number; // 연결된 item의 seq
  ea_fname: string; // 원본 파일명
  ea_sname: string; // 서버 저장 파일명
  ea_url: string;
  uploaded_at: string; // 업로드 일시 (ISO)
}

export interface pExpenseItemBase {
  ei_title: string;
  ei_type: string;
  ei_pdate: string;
  ei_number?: string | null;
  ei_amount: number;
  ei_tax: number;
  ei_total: number;
  pro_id?: number | null;
  is_estimate?: string;
  attachments?: pExpenseAttachment[];
  expense_add_info?: addInfoDTO[];
}

export interface pExpenseHeaderBase {
  user_id: string;
  project_id: string;
  el_type: string[] | string | null;
  el_title?: string | null;
  el_method: string;
  el_attach: string;
  el_deposit?: string | null;
  bank_account: string;
  bank_name: string;
  bank_code: string;
  account_name: string;
  remark?: string | null;
  is_estimate?: 'Y' | 'N';
}

// ------------------------------
// 등록용 (Register)
// ------------------------------
export interface pExpenseRegisterPayload {
  header: pExpenseHeaderBase;
  items: pExpenseItemBase[];
}

export interface pExpenseRegisterResponse {
  ok: boolean;
  exp_id: string;
  list_seq: number;
  item_seqs: number[];
  totals: {
    amount: number;
    tax: number;
    total: number;
  };
  count_items: number;
}

// ------------------------------
// 상세보기용 (View)
// ------------------------------
export interface pExpenseHeaderDTO extends pExpenseHeaderBase {
  seq: number;
  project_id: string;
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

export interface pExpenseItemDTO extends Omit<pExpenseItemBase, 'attachments'> {
  seq: number;
  exp_id: string;
  attachments: pExpenseAttachmentDTO[];
  rp_title: string;
}

export interface pExpenseLogDTO {
  idx: number;
  seq: number;
  user_nm: string;
  exp_status: string;
  remark?: string | null;
  url: string;
  log_date: string;
}

export interface pExpenseViewDTO {
  header: pExpenseHeaderDTO;
  items: pExpenseItemDTO[];
  logs: pExpenseLogDTO[];
}

// 프로젝트비용 유형 가져오기
export async function getProjectExpenseType(type: string): Promise<ExpenseType[]> {
  return http<ExpenseType[]>(`/user/common/codeList?ctype=${type}`, { method: 'GET' });
}

// 프로젝트비용 리스트
export async function getProjectExpense(params: projectExpenseParams) {
  const clean = cleanParams(params);

  // 쿼리스트링으로 변환
  const query = new URLSearchParams(clean as Record<string, string>).toString();
  const res = await http<projectExpenseResponse>(`/user/pexpense/list?${query}`, { method: 'GET' });

  return res;
}

// 프로젝트비용 상세보기
export async function getProjectExpenseView(exp_id: string | undefined): Promise<pExpenseViewDTO> {
  if (!exp_id) throw new Error('expid가 필요합니다.');
  return http<pExpenseViewDTO>(`/user/pexpense/info/${exp_id}`, { method: 'GET' });
}

// 프로젝트비용 작성하기
export async function projectExpenseRegister(payload: pExpenseRegisterPayload) {
  return http<pExpenseRegisterResponse>(`/user/pexpense/register`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// 프로젝트비용 삭제처리
export async function deleteProjectTempExpense(payload: { seqs: number[] }): Promise<{ ok: boolean }> {
  const res = http<{ ok: boolean }>(`/user/pexpense/delete/`, { method: 'POST', body: JSON.stringify(payload) });

  return res;
}

// 프로젝트비용 청구처리
export async function claimProjectTempExpense(payload: { seqs: number[] }): Promise<{ ok: boolean }> {
  const res = http<{ ok: boolean }>(`/user/pexpense/claim/`, { method: 'POST', body: JSON.stringify(payload) });

  return res;
}

export interface pExpenseEditPayload {
  header: pExpenseHeaderBase;
  items: {
    ei_type: string;
    ei_title: string;
    ei_pdate: string;
    ei_number?: string | null;
    ei_amount: number;
    ei_tax: number;
    ei_total: number;
    pro_id?: number | null;
    attachments?: pExpenseAttachment[];
  }[];
}

export interface pExpenseEditResponse {
  ok: boolean;
  updated: {
    itemCount: number;
    item_seqs: number[];
    requested: number[];
  };
}

// 프로젝트 비용 수정하기
export async function projectExpenseUpdate(expid: string, payload: pExpenseEditPayload) {
  return http<pExpenseEditResponse>(`/user/pexpense/update/${expid}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// 프로젝트 비용 증빙자료 삭제
export async function delProjectExpenseAttachment(seq: number): Promise<void> {
  return http<void>(`/user/pexpense/update/attachment/delete/${seq}`, { method: 'DELETE' });
}

// 외주용역비 및 접대비 유형 생성
export interface pInfoCreatePayload {
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

export interface pInfoUpdatePayload {
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
}

export interface addInfoDTO {
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

export async function pInfoCreate(payload: pInfoCreatePayload) {
  return http<addInfoDTO>(`/user/pexpense/ainfo/create`, { method: 'POST', body: JSON.stringify(payload) });
}

export async function pInfoUpdate(payload: pInfoUpdatePayload) {
  return http<addInfoDTO>(`/user/pexpense/ainfo/update`, { method: 'PATCH', body: JSON.stringify(payload) });
}
