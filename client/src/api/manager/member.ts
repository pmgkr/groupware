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
