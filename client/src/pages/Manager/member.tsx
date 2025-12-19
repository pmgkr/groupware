import { useEffect, useMemo, useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { getMemberList } from '@/api';
import MemberList from '@/components/ui/memberList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Member() {
  const { user_level, team_id } = useUser();
  const [members, setMembers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'Enable' | 'Disable'>('Enable');

  // 매니저만 접근
  if (user_level !== 'manager') return null;

  useEffect(() => {
    if (!team_id) return;
    getMemberList(team_id).then(setMembers);
  }, [team_id]);

  // 탭 기준 상태 필터
  const filteredMembers = useMemo(() => {
    const status = activeTab === 'Enable' ? 'active' : 'unactive';
    return members.filter((m) => m.user_status === status);
  }, [members, activeTab]);

  return (
    <div>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'Enable' | 'Disable')} className="gap-0">
        <div className="border-b border-gray-300 pb-5">
          <TabsList>
            <TabsTrigger value="Enable">Enable</TabsTrigger>
            <TabsTrigger value="Disable">Disable</TabsTrigger>
          </TabsList>
        </div>

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
