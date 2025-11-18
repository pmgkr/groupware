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
};

// 프로젝트 리스트 조회용 타입
export type ProjectListItem = {
  project_id: string;
  project_title: string;
  project_year: string;
  project_brand: string;
  project_cate: string;
  project_sdate: string;
  project_edate: string;
  client_id: number;
  client_nm: string;
  owner_id: string;
  owner_nm: string;
  team_id: number;
  team_name: string;
  project_status: string;
  manager_name: string;
};

// 프로젝트 리스트 조회용 파라미터 타입
export type ProjectListParams = {
  page?: number;
  size?: number;
  year?: string; // 콤마 구분 다중값
  type?: string; // mine or others
  team_id?: string; // 콤마 구분 다중값
  client_id?: string; // 콤마 구분 다중값
  project_brand?: string; // PMG or MCS
  project_category?: string;
  project_status?: string;
  s?: string; // 제목 검색 키워드
  tagged?: 'Y' | 'N' | string;
};

// 프로젝트 생성 전송용 데이터타입
export interface projectCreatePayload {
  project_year: string;
  project_brand: string;
  project_cate: string | string[];
  client_id: number;
  project_title: string;
  members: {
    user_id: string;
    user_nm: string;
    user_type: 'owner' | 'member' | string;
  }[];
  project_sdate: string | null;
  project_edate: string | null;
  remark?: string | null;
}

// 프로젝트 생성 응답 타입
export interface projectCreateResponse {
  ok: boolean;
  project_id: string;
}

// 프로젝트 상세 응답 타입
export interface ProjectViewDTO {
  project_id: string;
  project_title: string;
  project_year: string;
  project_brand: string;
  project_cate: string[];
  project_sdate: string;
  project_edate: string;
  client_id: number;
  client_nm: string;
  owner_id: string;
  owner_nm: string;
  team_id: number;
  team_name: string;
  project_status: string;
}

// 프로젝트 멤버 타입
export type projectMemberDTO = {
  seq: number;
  user_id: string;
  user_nm: string;
  user_type: 'owner' | 'member' | string;
  profile_image?: string;
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
  uploaded_at: string; // 업로드 일시 (ISO)
}

export interface ExpenseItemBase {
  ei_title: string;
  ei_type: string;
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
  project_id: string;
  el_type: string[] | string | null;
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
  exp_id: string;
  list_seq: number;
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
export interface ExpenseHeaderDTO extends ExpenseHeaderBase {
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

export interface ExpenseItemDTO extends Omit<ExpenseItemBase, 'attachments'> {
  seq: number;
  exp_id: string;
  attachments: ExpenseAttachmentDTO[];
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

// 즐겨찾기 리스트
export const getBookmarkList = async () => {
  const res = await http<{ project_id: string }[]>('/user/project/bookmark/list', { method: 'GET' });
  return res;
};

// 즐겨찾기 추가
export const addBookmark = async (projectId: string) => {
  return await http(`/user/project/bookmark/add/${projectId}`, { method: 'GET' });
};

// 즐겨찾기 삭제
export const removeBookmark = async (projectId: string) => {
  return await http(`/user/project/bookmark/remove/${projectId}`, { method: 'GET' });
};

// 프로젝트 리스트 가져오기
export async function getProjectList(params: ProjectListParams) {
  const clean = cleanParams(params);

  // 쿼리스트링으로 변환
  const query = new URLSearchParams(clean as Record<string, string>).toString();
  const res = await http<{ items: ProjectListItem[]; total: number }>(`/user/project/list?${query}`, { method: 'GET' });

  return res;
}

// 프로젝트 생성하기
export async function projectCreate(payload: projectCreatePayload) {
  return http<projectCreateResponse>(`/user/project/create`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// 프로젝트 상세보기 (오버뷰)
export async function getProjectView(projectId: string | undefined) {
  if (!projectId) throw new Error('projectId가 필요합니다.');

  return http<ProjectViewDTO>(`/user/project/info/${projectId}`, { method: 'GET' });
}

// 프로젝트 멤버 리스트
export async function getProjectMember(projectId: string | undefined) {
  if (!projectId) throw new Error('projectId가 필요합니다.');

  return http<projectMemberDTO[]>(`/user/project/member/${projectId}`, { method: 'GET' });
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
export async function getProjectExpenseView(expid: string | undefined): Promise<ExpenseViewDTO> {
  if (!expid) throw new Error('expid가 필요합니다.');
  return http<ExpenseViewDTO>(`/user/pexpense/info/${expid}`, { method: 'GET' });
}

// 프로젝트비용 작성하기
export async function projectExpenseRegister(payload: ExpenseRegisterPayload) {
  return http<ExpenseRegisterResponse>(`/user/pexpense/register`, {
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
