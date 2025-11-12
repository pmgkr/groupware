// src/api/teams.ts
import { http } from '@/lib/http';
export type TeamDto = {
  team_id: number;
  parent_id: number | null;
  team_name: string;
  level: number;
  order: number;
  manage_id: number | null;
  manager_name: string | null;
};

export type TeamParams = {
  level?: number | null; // 안 보내면 전체 검색
  tlevel?: number | null; // 조회할 레벨
  parent_id?: number | null; // 부모 팀 ID
  q?: string; // 검색어 - 팀명, 팀장명
};

export async function getTeams(params: TeamParams = {}): Promise<TeamDto[]> {
  const search = new URLSearchParams();
  if (params.tlevel !== undefined && params.tlevel !== null) {
    search.set('tlevel', String(params.tlevel));
  }
  if (params.parent_id !== undefined && params.parent_id !== null) {
    search.set('parent_id', String(params.parent_id));
  }
  if (params.q) {
    search.set('q', params.q);
  }
  const qs = search.toString();
  // level 값이 있으면 /teams?level=... 없으면 /teams 호출
  const path = `/user/common/teamlist${qs ? `?${qs}` : ''}`;

  return http<TeamDto[]>(path, { method: 'GET' });
}
