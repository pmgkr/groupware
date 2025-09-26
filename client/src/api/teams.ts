// src/api/teams.ts
import { http } from '@/lib/http';
export type TeamDto = { team_id: number; team_name: string };

export async function getTeams() {
  return http<TeamDto[]>('/teams', { method: 'GET' });
}
