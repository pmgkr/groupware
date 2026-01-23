import { http } from '@/lib/http';

export interface Member {
  user_id: string;
  user_name: string;
  user_name_en?: string;
  team_name: string;
  phone?: string;
  emergency_phone?: string;
  job_role?: string;
  user_level: 'admin' | 'manager' | 'user';
  branch?: string;
  address?: string;
  profile_image?: string;
  user_status: 'active' | 'inactive' | 'suspended';
}

export interface MyTeam {
  team_id: number;
  team_name: string;
  level: number;
}

export async function getMyTeams(): Promise<{ items: MyTeam[] }> {
  return await http('/manager/myteam', { method: 'GET' });
}

export async function getMembersByTeams(teamIds: number[]) {
  const results = await Promise.all(teamIds.map((team_id) => getManagerMemberList({ team_id })));

  // 2차원 배열 → 1차원
  const merged = results.flat();

  // 혹시 중복 유저가 있을 경우 대비
  const unique = Array.from(new Map(merged.map((m) => [m.user_id, m])).values());

  return unique;
}

export async function getManagerMemberList(params?: { team_id?: number; q?: string }): Promise<Member[]> {
  const searchParams = new URLSearchParams();

  if (params?.team_id) {
    searchParams.append('team_id', String(params.team_id));
  }

  if (params?.q) {
    searchParams.append('q', params.q);
  }

  const url = `/user/common/memberlist${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  return await http<Member[]>(url, { method: 'GET' });
}

// 매니저 구성원 상태 변경
export async function updateMemberStatus(params: { user_id: string; status: 'active' | 'inactive' | 'suspended' }) {
  console.log('[updateMemberStatus] payload:', params);
  return await http('/manager/member/status', {
    method: 'PATCH',
    body: JSON.stringify(params),
  });
}
