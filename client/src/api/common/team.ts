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
export async function getMemberList() {
  return await http<any[]>('/user/common/memberlist', { method: 'GET' });
}
