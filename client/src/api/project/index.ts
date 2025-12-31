import { http } from '@/lib/http';
import { cleanParams } from '@/utils';
export * from './estimate';
export * from './expense';
export * from './invoice';

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
  members?: {
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
  project_year?: string;
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
  est_amount?: string;
  est_budget?: string;
}

// 프로젝트 멤버 타입
export type ProjectMemberDTO = {
  seq: number;
  user_id: string;
  user_nm: string;
  user_type: 'owner' | 'member' | string;
  profile_image?: string;
};

export type ProjectLogs = {
  seq: number;
  project_id: string;
  user_id: string;
  user_nm: string;
  pl_type: string;
  pl_remark: string;
  pl_date: string;
};

export type projectSummary = {
  est_amount: number; // 견적서 총액
  est_budget: number; // 견적서 가용예산
  exp_amount: number; // 지출 비용 합계
  inv_amount: number; // 인보이스 공급가액
  inv_total: number; // 인보이스 토탈
  netprofit: number; // 순이익
  GPM: number;
};

export type ProjectExpenseData = {
  type: string;
  amount: number;
  tax: number;
  total: number;
};

export type ProjectExpenseType = {
  est_amount: number;
  est_tax: number;
  est_total: number;
  non_amount: number;
  non_tax: number;
  non_total: number;
};

export interface projectOverview {
  info: ProjectViewDTO;
  logs: ProjectLogs[];
  members: ProjectMemberDTO[];
  summary: projectSummary[];
  expense_data: ProjectExpenseData[];
  expense_type: ProjectExpenseType;
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

  return http<projectOverview>(`/user/project/overview/${projectId}`, { method: 'GET' });
}

// 프로젝트 조회 (프로젝트 정보만)
export async function getProjectInfo(projectId: string | undefined) {
  if (!projectId) throw new Error('projectId가 필요합니다.');

  return http<ProjectViewDTO>(`/user/project/info/${projectId}`, { method: 'GET' });
}

// 프로젝트 멤버 리스트
export async function getProjectMember(projectId: string | undefined) {
  if (!projectId) throw new Error('projectId가 필요합니다.');

  return http<ProjectMemberDTO[]>(`/user/project/member/${projectId}`, { method: 'GET' });
}

export type ProjectMemberUpdatePayload = {
  owner?: {
    user_id: string;
    user_nm: string;
  };
  member_add?: {
    user_id: string;
    user_nm: string;
  }[];
  member_remove?: {
    user_id: string;
  }[];
};

// 프로젝트 멤버 업데이트
export async function updateProjectMember(projectId: string, payload: ProjectMemberUpdatePayload) {
  if (!projectId) throw new Error('projectId가 필요합니다.');

  return http<{ ok: boolean }>(`/user/project/member/update/${projectId}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// 프로젝트 로그 조회
export async function getProjectLogs(projectId: string | undefined) {
  if (!projectId) throw new Error('projectId가 필요합니다.');

  return http<ProjectLogs[]>(`/user/project/log/${projectId}`, { method: 'GET' });
}

// 프로젝트 상태 변경
export async function ProjectStatusChange(projectId: string | undefined, status: string) {
  if (!projectId) throw new Error('projectId가 필요합니다.');

  return http<{ ok: boolean }>(`/user/project/status?project_id=${projectId}&project_status=${status}`, { method: 'GET' });
}

// 프로젝트 정보 업데이트
export async function projectUpdate(projectId: string | undefined, payload: projectCreatePayload) {
  if (!projectId) throw new Error('projectId가 필요합니다.');

  return http<any>(`/user/project/update/${projectId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
