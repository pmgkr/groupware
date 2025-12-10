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
