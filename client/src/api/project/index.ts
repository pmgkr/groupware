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
  attachments?: pExpenseAttachment[];
}

export interface pExpenseHeaderBase {
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

// ------------------------------
// 견적서
// ------------------------------
export type projectEstimateParams = {
  project_id?: string;
  page?: number;
  size?: number;
};

export type EstimateListItem = {
  est_id: number;
  project_id: string;
  user_id: string;
  user_nm: string;
  est_title: string;
  est_amount: number;
  est_budget: number;
  est_valid: string;
  wdate: string;
  items_count?: number; // 해당 견적서에 등록된 항목 갯수
  evidences_count?: number; // 해당 견적서에 등록된 증빙자료 갯수
};

// 프로젝트 견적서 리스트 Reponse
export type projectEstimateResponse = {
  items: EstimateListItem[];
  total: number;
  page: number;
  size: number;
  pages: number;
};

// 프로젝트 견적서 작성 Payload
// 견적서 Header 타입
export interface EstimateHeader {
  project_id: string; // 프로젝트 ID
  est_title: string; // 견적서 제목
  est_valid: 'Y' | 'S'; // 신규(Y) / 추가(S)
}

// 견적서 Body 항목 타입
export interface EstimateItem {
  ei_type: string;
  ei_name: string;
  unit_price?: number;
  qty?: number;
  amount?: number;
  exp_cost?: number;
  ava_amount?: number;
  remark?: string;
  ei_order: number; // 배열의 순서
}

// 증빙 항목 타입 (footer)
export interface EstimateEvidenceItem {
  ee_fname: string;
  ee_sname: string;
  ee_size: number;
  ee_type: string;
  remark?: string;
}

// 전체 Payload 타입
export interface EstimatePayload {
  header: EstimateHeader;
  body: EstimateItem[];
  footer: EstimateEvidenceItem[];
}

// 견적서 작성 응답 타입
export interface EstimateRegisterResponse {
  ok: boolean;
  est_id: number;
  totals: {
    est_amount: number;
  };
  counts: {
    items: number;
    evidences: number;
    match_deleted: number;
  };
}

// ----------------------
// 견적서 조회용
// ----------------------
export interface EstimateHeaderView extends EstimateHeader {
  result: any;
  est_id: number;
  user_id: string;
  user_nm: string;
  est_amount: number;
  est_budget: number;
  exp_total?: number;
  wdate: string;
}

export interface EstimateItemsView extends EstimateItem {
  [x: string]: any;
  seq: number;
  est_id: number;
}

export interface EstimateEvidencesView extends EstimateEvidenceItem {
  seq: number;
  user_id: string;
  user_nm: string;
  uploaded_at: string;
}

export interface EstimateLogs {
  seq: number;
  user_id: string;
  user_nm: string;
  project_id: string;
  est_id: number;
  el_type: string;
  ei_seq?: number;
  ei_befre?: string;
  ei_after?: string;
  ei_message: string;
  created_at: string;
}

export interface EstimateViewDTO {
  header: EstimateHeaderView;
  items: EstimateItemsView[];
  evidences: EstimateEvidencesView[];
  logs: EstimateLogs[];
}

// EstimateRow Type
export type EstimateItemType = 'title' | 'item' | 'subtotal' | 'discount' | 'agency_fee' | 'grandtotal' | string;

export interface EstimateRow {
  seq?: number | null;
  ei_type: EstimateItemType;
  ei_name: string;
  unit_price: number | string;
  qty: number | string;
  amount: number | string;
  ava_amount?: number | string;
  exp_cost?: number | string;
  remark?: string;
  ei_order: number;
}

// Edit에서 보낼 Form의 Response Type
export interface EstimateEditForm {
  header: {
    est_title: string;
    project_id: string | undefined;
    user_id: string | undefined;
    user_nm: string | undefined;
  };
  items: EstimateRow[];
  removed_seq: number[];
  evidences: {
    ee_fname?: string;
    ee_sname?: string;
    ee_size?: number;
    ee_type?: string;
    remark?: string;
  }[];
}

// EstimateEdit Response DTO
// 개별 matched item 타입
// 견적서 매칭확인 Response Type
export interface EstimateMatchedItem {
  seq: number;
  target_seq: number;
  ei_name: string;
  alloc_amount?: number;
  ava_amount: number;
  pl_seq: number;
}

// 전체 Response DTO
export interface EstimateEditResponse {
  est_id: number; // 견적서 ID
  est_amount: number; // 수정 후 전체 견적 총 금액
  deleted_items: number[]; // 삭제된 estimate_item seq 목록
  inserted_items: number[]; // 새로 추가된 estimate_item seq 목록
  updated_items: number[]; // 수정된 estimate_item seq 목록
  matched_items: EstimateMatchedItem[]; // 매칭 영향 받은 항목들
}

// ------------------------------
// 프로젝트비용 > 견적서 API
// ------------------------------
export interface EstimateItemsMatch {
  seq: number; // pexpense_match.seq
  pl_seq: number; // pexpense_item.seq
  target_seq: number; // estimate_item.seq
  ei_name?: string; // 견적서 항목명
  ava_amount?: number; // 견적서 가용 금액
  alloc_amount: number; // 매칭된 금액
  wdate: string;
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

// 프로젝트비용 매칭을 위한 견적서 정보 가져오기
export async function getEstimateInfo(projectId: string | undefined) {
  if (!projectId) throw new Error('projectId가 필요합니다.');

  return http<EstimateHeaderView>(`/user/pexpense/estimate/list/${projectId}`, { method: 'GET' });
}

export async function getEstimateItemsInfo(est_id: number | undefined) {
  if (!est_id) throw new Error('견적서 ID가 필요합니다.');

  return http<{
    map(arg0: (item: any) => any): EstimateItemsView[];
    result: EstimateItemsView[];
  }>(`/user/pexpense/estimate/item/${est_id}`, { method: 'GET' });
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

// 프로젝트비용 > 견적서 매칭처리
export interface ExpenseEstimateMatchItem {
  seq: number;
  target_seq: number;
  alloc_amount: number;
}

export interface ExpenseEstimateMatchRequest {
  items: ExpenseEstimateMatchItem[];
}

export interface ExpenseEstimateMatchResponse {
  ok: boolean;
  results: Array<{
    seq: number;
    pl_seq: number;
    target_seq: number;
    alloc_amount: string;
  }>;
}

export interface EstimateItemsResetResponse {
  list: {
    ok: boolean;
    results: Array<{
      pl_seq: number;
      target_seq: number;
    }>;
  };
}

export async function expenseEstimateMatch(payload: ExpenseEstimateMatchRequest) {
  return http<ExpenseEstimateMatchResponse>(`/user/pexpense/estimate/match`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// 프로젝트비용 > 견적서 매칭 조회
export interface EstimateItemsMatchResponse {
  list: EstimateItemsMatch[];
}

export async function getExpenseMatchedItems(ei_seq: number | undefined) {
  if (!ei_seq) throw new Error('비용 항목 번호가 필요합니다.');

  return http<EstimateItemsMatchResponse>(`/user/pexpense/estimate/info/${ei_seq}`, { method: 'POST' });
}

// 프로젝트비용 > 견적서 매칭 리셋
export async function setExpenseMatchedReset(ei_seq: number | undefined) {
  if (!ei_seq) throw new Error('비용 항목 번호가 필요합니다.');

  return http<EstimateItemsResetResponse>(`/user/pexpense/estimate/reset/${ei_seq}`, { method: 'POST' });
}

// 견적서 리스트 조회
export async function getEstimateList(params: projectEstimateParams) {
  const clean = cleanParams(params);

  // 쿼리스트링으로 변환
  const query = new URLSearchParams(clean as Record<string, string>).toString();
  const res = await http<projectEstimateResponse>(`/user/estimate/list?${query}`, { method: 'GET' });

  return res;
}

// 견적서 작성하기
export async function estimateRegister(payload: EstimatePayload) {
  return http<EstimateRegisterResponse>(`/user/estimate/register`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getEstimateView(est_id: string | undefined) {
  if (!est_id) throw new Error('견적서 ID가 필요합니다.');

  return http<EstimateViewDTO>(`/user/estimate/detail?est_id=${est_id}`, { method: 'GET' });
}

// 견적서 수정하기
export async function estimateEdit(est_id: string | undefined, payload: EstimateEditForm) {
  if (!est_id) throw new Error('견적서 ID가 필요합니다.');

  return http<EstimateEditResponse>(`/user/estimate/edit/${est_id}`, { method: 'POST', body: JSON.stringify(payload) });
}
