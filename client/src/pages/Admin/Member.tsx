import { useEffect, useMemo, useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { getMemberList, getTeamList } from '@/api';
import MemberList from '@/components/ui/memberList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Member() {
  const { user_level } = useUser();

  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | undefined>();
  const [members, setMembers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'Enable' | 'Disable'>('Enable');

  // 어드민만 접근
  if (user_level !== 'admin') return null;

  // 팀 목록
  useEffect(() => {
    getTeamList().then(setTeams);
  }, []);

  // 팀 선택에 따른 멤버 조회 (서버 필터)
  useEffect(() => {
    getMemberList(selectedTeamId).then(setMembers);
  }, [selectedTeamId]);

  // 탭 + 팀 조합 필터
  const filteredMembers = useMemo(() => {
    const status = activeTab === 'Enable' ? 'active' : 'unactive';
    return members.filter((m) => m.user_status === status);
  }, [members, activeTab]);

  return (
    <div>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'Enable' | 'Disable')}>
        <div className="flex items-center gap-3 border-b border-gray-300 pb-5">
          {/* 상태 탭 */}
          <TabsList>
            <TabsTrigger value="Enable">Enable</TabsTrigger>
            <TabsTrigger value="Disable">Disable</TabsTrigger>
          </TabsList>

          {/* 팀 선택 */}
          <div className="flex items-center gap-x-2 before:mr-3 before:ml-3 before:inline-flex before:h-7 before:w-[1px] before:bg-gray-300">
            <Select
              value={selectedTeamId?.toString() ?? 'all'}
              onValueChange={(v) => setSelectedTeamId(v === 'all' ? undefined : Number(v))}>
              <SelectTrigger className="w-[200px]" size="sm">
                <SelectValue placeholder="팀 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-gray" size="sm">
                  전체
                </SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.team_id} value={team.team_id.toString()} size="sm">
                    {team.team_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Enable */}
        <TabsContent value="Enable" className="w-full">
          {filteredMembers.length === 0 ? (
            <div className="mt-20 text-center text-[13px] text-gray-400">해당 구성원이 없습니다.</div>
          ) : (
            <div className="mt-8 grid grid-cols-4 gap-5">
              {filteredMembers.map((member) => (
                <MemberList key={member.user_id} member={member} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Disable */}
        <TabsContent value="Disable" className="w-full">
          {filteredMembers.length === 0 ? (
            <div className="mt-20 text-center text-[13px] text-gray-400">해당 구성원이 없습니다.</div>
          ) : (
            <div className="mt-8 grid grid-cols-4 gap-5">
              {filteredMembers.map((member) => (
                <MemberList key={member.user_id} member={member} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
