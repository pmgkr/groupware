import { http } from '@/lib/http';

export interface Team {
  team_id: number;
  team_name: string;
  parent_id: number;
  manager_name: string;
  manage_id: number | null;
  manager_id: number | null;
  level: number;
  order: number;
}

export async function getTeamList(): Promise<Team[]> {
  const res = await http<Team[]>('/user/common/teamlist', { method: 'GET' });
  return res;
}

export interface MemberListParams {
  team_id?: number;
  status?: string;
  role?: string;
  q?: string;
}

export async function getMemberList(params?: number | MemberListParams) {
  const searchParams = new URLSearchParams();
  if (typeof params === 'number') {
    searchParams.append('team_id', params.toString());
  } else if (params) {
    if (params.team_id) searchParams.append('team_id', params.team_id.toString());
    if (params.status) searchParams.append('status', params.status);
    if (params.role) searchParams.append('role', params.role);
    if (params.q) searchParams.append('q', params.q);
  }
  const url = `/user/common/memberlist${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  return await http<any[]>(url, { method: 'GET' });
}
