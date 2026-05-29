// 📦 프로젝트 비용 API
import { http } from '@/lib/http';
import { httpFile } from '@/lib/httpFile';
import { cleanParams } from '@/utils';
import type { pExpenseViewDTO, pExpenseItemDTO } from '@/api/project/expense';

// 어드민 프로젝트 비용 목록 조회
export interface ExpenseListParams {
  team_id?: number; // 팀 아이디
  page?: number;
  size?: number; // 비용 항목 가져올 rows 수, default는 15, select로 30, 50, 100 rows 지원 예정
  year?: string;
  type?: string;
  method?: string;
  attach?: string;
  status?: string; // default는 'Confirmed'
  ddate?: 'Y' | 'N'; // 'Y'면 지급예정일자 ddate에 값이 있는 row만, 'N'이면 ddate에 값이 없는 row만 default는 전체 row
  sdate?: string; // 작성일 시작일
  edate?: string; // 작성일 종료일
  q?: string; // 검색 Input 키워드 비용 제목 (el_title) or 작성자 (user_nm) 입력
}

// 어드민 프로젝트 비용 목록 리스폰 타입
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
  add_info?: addInfoDTO[];
};

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

// 어드민 > 프로젝트 비용 전체 리스트 리스폰 (Excel 다운로드용)
export interface AdminExpenseExcelResponse {
  header: ExpenseListItems;
  items: pExpenseItemDTO[];
}

// 어드민 > 프로젝트 비용 목록 가져오기
export async function getAdminExpenseList(params: ExpenseListParams) {
  const clean = cleanParams(params);

  // 쿼리스트링으로 변환
  const query = new URLSearchParams(clean as Record<string, string>).toString();
  const res = await http<{ items: ExpenseListItems[]; total: number }>(`/admin/pexpense/list?${query}`, { method: 'GET' });

  return res;
}

export async function getAdminExpenseAllList(params: ExpenseListParams) {
  const clean = cleanParams(params);

  const query = new URLSearchParams(clean as Record<string, string>).toString();
  const res = await http<{ items: ExpenseListItems[]; total: number }>(`/admin/pexpense/list?${query}`, { method: 'GET' });

  return res;
}

// 어드민 > 프로젝트 비용 조회
export async function getAdminExpenseView(exp_id: string | undefined): Promise<pExpenseViewDTO> {
  if (!exp_id) throw new Error('expid가 필요합니다.');
  return http<pExpenseViewDTO>(`/admin/pexpense/info/${exp_id}`, { method: 'GET' });
}

// 어드민 > 프로젝트 비용 승인하기 (Completed 처리)
export async function confirmExpense(payload: { seqs: number[] }): Promise<{ updated_count: number; ok: boolean }> {
  const res = http<{ updated_count: number; ok: boolean }>(`/admin/pexpense/confirm/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return res;
}

// 어드민 > 프로젝트 비용 반려처리
export async function rejectExpense(payload: { seq: number; reason?: string }): Promise<{ seq: number; status: string }> {
  const res = http<{ seq: number; status: string }>(`/admin/pexpense/reject/`, { method: 'PATCH', body: JSON.stringify(payload) });

  return res;
}

// 어드민 > 프로젝트 비용 지급예정일 세팅
export async function setDdate(
  payload: {
    seq: number;
    ddate: Date;
  }[]
): Promise<{ updatedCount: number; rows: [{ seq: number; ddate: string }] }> {
  const res = http<{ updatedCount: number; rows: [{ seq: number; ddate: string }] }>(`/admin/pexpense/set/ddate`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return res;
}

// 어드민 > 프로젝트 비용 PDF 다운로드
export async function getPDFDownload(seq: number): Promise<Response> {
  if (!seq) throw new Error('seq가 필요합니다.');

  const res = await httpFile(`/admin/pexpense/pdf/${seq}`, {
    method: 'GET',
    headers: {
      Accept: 'application/zip',
    },
  });

  return res;
}

// 어드민 > 선택한 프로젝트 비용 PDF 다운로드
export async function getMultiPDFDownload(seqs: number[]) {
  if (!seqs.length) throw new Error('비용이 선택되지 않았습니다.');

  const seqParam = seqs.join(',');

  const res = await httpFile(`/admin/pexpense/download?seqs=${seqParam}`, {
    method: 'GET',
    headers: {
      Accept: 'application/zip',
    },
  });

  return res.blob();
}

// 어드민 > 프로젝트 비용 엑셀 다운로드 전체 데이터 가져오기
export async function getAdminExpenseExcel(params: ExpenseListParams) {
  const clean = cleanParams(params);

  // 쿼리스트링으로 변환
  const query = new URLSearchParams(clean as Record<string, string>).toString();
  const res = await http<{ items: AdminExpenseExcelResponse[]; total: number }>(`/admin/pexpense/list/excel?${query}`, {
    method: 'GET',
  });

  return res;
}

// 어드민 > 프로젝트 비용 C-Box (EXP# 아이디 입력)
export interface ExpenseCBoxItem {
  seq: number;
  exp_id: string;
  project_id: string;
  user_id: string;
  user_nm: string;
  el_title: string;
}

export type ExpenseCBoxRes = {
  ok: boolean;
  items: ExpenseCBoxItem[];
};

export async function sendExpenseToCBox(payload: { expIds: string[] }): Promise<ExpenseCBoxRes> {
  const res = http<ExpenseCBoxRes>(`/admin/pexpense/cbox`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return res;
}

// 프로젝트 비용 SAP 상태로 업데이트
export async function updateSAP(payload: { seqs: number[] }) {
  const res = http<{ updated_count: number; ok: boolean }>(`/admin/pexpense/sap/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return res;
}
