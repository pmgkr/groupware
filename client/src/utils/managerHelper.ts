import { getTeamList, type Team } from '@/api/common/team';

export type ManagerInfo = { id: string | null; name: string };

/**
 * 팀 ID로 팀장을 조회
 * - manager_id -> manage_id 우선 순서
 * - team_id가 없거나 매칭 실패 시 { id: null, name: '' } 반환
 */
export async function findManager(teamId?: number | null): Promise<ManagerInfo> {
  if (teamId == null) return { id: null, name: '' };

  const teams: Team[] = await getTeamList();
  const matched = teams.find((t) => Number(t.team_id) === Number(teamId));

  const managerId = (matched as any)?.manager_id ?? (matched as any)?.manage_id ?? null;
  const managerName = matched?.manager_name || '';

  return { id: managerId ? String(managerId) : null, name: managerName };
}

