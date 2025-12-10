import { http } from '@/lib/http';
import { cleanParams } from '@/utils';

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

// 견적서 > 매칭된 프로젝트 비용 리스트 가져오기
export type EstExpenseItemResponse = {
  pseq: number;
  list_seq: number;
  exp_id: string;
  ei_type: string;
  ei_title: string;
  ei_pdate: string;
  ei_amount: number;
  ei_tax: number;
  ei_total: number;
  alloc_amount: number;
};

export async function getEstExpenseItem(ei_seq: number) {
  if (!ei_seq) throw new Error('비용 항목 번호가 필요합니다.');

  return http<EstExpenseItemResponse[]>(`/user/estimate/pexp_match/${ei_seq}`, { method: 'GET' });
}

// 프로젝트 비용 매칭을 위한 견적서 정보 가져오기
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
