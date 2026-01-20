import { useEffect, useMemo, useState } from 'react';
import { useUser } from '@/hooks/useUser';
import MemberList from '@/components/ui/memberList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getManagerMemberList, getMembersByTeams, getMyTeams, type Member, type MyTeam } from '@/api/manager/member';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Member() {
  const { user_level, team_id: myTeamId } = useUser();
  const [teams, setTeams] = useState<MyTeam[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | undefined>();
  const [members, setMembers] = useState<Member[]>([]);
  const [activeTab, setActiveTab] = useState<'Enable' | 'Disable'>('Enable');

  useEffect(() => {
    getMyTeams().then((res) => {
      // 1️⃣ 내가 매니저인 팀이 있는 경우
      if (res.items.length > 0) {
        setTeams(res.items);

        setSelectedTeamId((prev) => prev ?? res.items[0].team_id);
        return;
      }

      // 2️⃣ 매니저 팀이 없는 admin → 본인 소속 팀 fallback
      if (user_level === 'admin' && myTeamId) {
        const fallbackTeam: MyTeam = {
          team_id: myTeamId,
          team_name: '내 팀',
          level: 0,
        };

        setTeams([fallbackTeam]);
        setSelectedTeamId(myTeamId);
      }
    });
  }, [user_level, myTeamId]);

  //멤버 조회
  useEffect(() => {
    if (!selectedTeamId) return;

    getManagerMemberList({
      team_id: selectedTeamId,
    }).then(setMembers);
  }, [selectedTeamId]);

  const showTeamSelect = user_level === 'admin' && teams.length > 1;

  // 탭 + 팀 조합 필터
  const filteredMembers = useMemo(() => {
    if (activeTab === 'Enable') {
      return members.filter((m) => m.user_status === 'active');
    }

    // Disable 탭
    return members.filter((m) => m.user_status === 'inactive' || m.user_status === 'suspended');
  }, [members, activeTab]);

  const refreshMembers = async () => {
    if (!selectedTeamId) return;

    setMembers(
      await getManagerMemberList({
        team_id: selectedTeamId,
      })
    );

    if (user_level === 'manager') {
      const res = await getMyTeams();
      const teamIds = res.items.map((t) => t.team_id);
      setMembers(await getMembersByTeams(teamIds));
    }
  };

  return (
    <div>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'Enable' | 'Disable')} className="gap-0">
        <div className="flex w-full items-center justify-between border-b border-gray-300 pb-5">
          <div className="flex items-center gap-3">
            <TabsList>
              <TabsTrigger value="Enable">사용중</TabsTrigger>
              <TabsTrigger value="Disable">비활성화</TabsTrigger>
            </TabsList>
            {/* 팀 선택 */}

            {showTeamSelect && (
              <div className="flex items-center gap-x-2 before:mr-3 before:ml-3 before:inline-flex before:h-7 before:w-[1px] before:bg-gray-300">
                <Select value={selectedTeamId?.toString()} onValueChange={(v) => setSelectedTeamId(Number(v))}>
                  <SelectTrigger className="w-[200px]" size="sm">
                    <SelectValue placeholder="팀 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.team_id} value={team.team_id.toString()} size="sm">
                        {team.team_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        <TabsContent value="Enable" className="w-full">
          {filteredMembers.length === 0 ? (
            <div className="mt-20 text-center text-[13px] text-gray-400">해당 구성원이 없습니다.</div>
          ) : (
            <div className="mt-8 grid grid-cols-4 gap-5">
              {filteredMembers.map((member) => (
                <MemberList key={member.user_id} member={member} onRefresh={refreshMembers} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="Disable" className="w-full">
          {filteredMembers.length === 0 ? (
            <div className="mt-20 text-center text-[13px] text-gray-400">해당 구성원이 없습니다.</div>
          ) : (
            <div className="mt-8 grid grid-cols-4 gap-5">
              {filteredMembers.map((member) => (
                <MemberList key={member.user_id} member={member} onRefresh={refreshMembers} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
