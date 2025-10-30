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
};

export async function getTeams(params: TeamParams = {}): Promise<TeamDto[]> {
  const search = new URLSearchParams();
  if (params.level !== undefined && params.level !== null) {
    search.set('level', String(params.level));
  }
  const qs = search.toString();
  // level 값이 있으면 /teams?level=... 없으면 /teams 호출
  const path = `/user/common/teamlist${qs ? `?${qs}` : ''}`;

  const res = await http<any>(path, { method: 'GET' });

  return http<TeamDto[]>(path, { method: 'GET' });
}
