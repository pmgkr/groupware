// src/api/admin/teams.ts
import { http } from '@/lib/http';

export type TeamDto = {
  team_id: number;
  parent_id: number | null;
  team_name: string;
  team_alias: string;
  level: number;
  order: number;
  manager_id: string | null;
  manager_name: string | null;
};

// 팀 목록 응답 타입
export type TeamListResponse = {
  list: TeamDto[];
  total: number;
  page: number;
  size: number;
  pages: number;
};

// 팀 정보 응답 타입
export type TeamInfoResponse = {
  info: TeamDto;
  parent: TeamDto | null;
};

// MyTeamItem 타입 (기존 호환성을 위해 유지)
export type MyTeamItem = {
  seq: number;
  manager_id: string;
  manager_name: string;
  team_id: number;
  team_name: string;
  parent_id?: number;
  level?: number;
};

// 팀 목록 조회 파라미터
export type TeamListParams = {
  size?: number;
  page?: number;
  q?: string;
};

// 팀 정보 조회 파라미터
export type TeamInfoParams = {
  team_id: number;
};

// 팀 정보 수정 요청 타입
export type TeamEditRequest = {
  team_name: string;
  team_alias: string;
  manager_id: string;
  manager_name: string;
};

// 팀 목록 조회
export async function getTeams(params: TeamListParams = {}): Promise<TeamDto[]> {
  const search = new URLSearchParams();
  if (params.size !== undefined) {
    search.set('size', String(params.size));
  }
  if (params.page !== undefined) {
    search.set('page', String(params.page));
  }
  if (params.q) {
    search.set('q', params.q);
  }
  const qs = search.toString();
  const path = `/admin/team/list${qs ? `?${qs}` : ''}`;

  const response = await http<TeamListResponse>(path, { method: 'GET' });
  return response.list;
}

// 팀 정보 조회
export async function getTeamInfo(params: TeamInfoParams): Promise<TeamInfoResponse> {
  const search = new URLSearchParams();
  search.set('team_id', String(params.team_id));
  const path = `/admin/team/info?${search.toString()}`;

  return await http<TeamInfoResponse>(path, { method: 'GET' });
}

// 팀 정보 수정
export async function editTeam(team_id: number, data: TeamEditRequest): Promise<void> {
  const search = new URLSearchParams();
  search.set('team_id', String(team_id));
  const path = `/admin/team/edit?${search.toString()}`;

  await http(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}
