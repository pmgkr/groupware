import { http } from '@/lib/http';

export interface Team {
  team_id: number;
  team_name: string;
  level: number;
  parent_id: number;
  manager_name: string;
}

export async function getTeamList(): Promise<Team[]> {
  const res = await http<Team[]>('/user/common/teamlist', { method: 'GET' });
  return res;
}
export async function getMemberList(team_id?: number) {
  const params = new URLSearchParams();
  if (team_id) {
    params.append('team_id', team_id.toString());
  }
  const url = `/user/common/memberlist${params.toString() ? `?${params.toString()}` : ''}`;
  return await http<any[]>(url, { method: 'GET' });
}
