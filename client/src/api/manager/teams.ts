// src/api/manager/teams.ts
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

export type TeamResponse = {
  items: TeamDto[];
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

export type TeamParams = {
  level?: number | null;
  tlevel?: number | null;
  q?: string;
};

export async function getTeams(params: TeamParams = {}): Promise<TeamDto[]> {
  const search = new URLSearchParams();
  if (params.tlevel !== undefined && params.tlevel !== null) {
    search.set('tlevel', String(params.tlevel));
  }
  if (params.q) {
    search.set('q', params.q);
  }
  const qs = search.toString();
  const path = `/manager/myteam${qs ? `?${qs}` : ''}`;

  const response = await http<TeamResponse>(path, { method: 'GET' });
  return response.items;
}
