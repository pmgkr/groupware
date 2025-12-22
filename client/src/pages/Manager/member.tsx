import { useEffect, useMemo, useState } from 'react';
import { useUser } from '@/hooks/useUser';
import MemberList from '@/components/ui/memberList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getManagerMemberList } from '@/api/manager/member';

export default function Member() {
  const { user_level, team_id } = useUser();
  const [members, setMembers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'Enable' | 'Disable'>('Enable');

  // 매니저만 접근
  if (user_level !== 'manager') return null;

  useEffect(() => {
    if (!team_id) return;

    getManagerMemberList({
      team_id,
    }).then(setMembers);
  }, [team_id]);

  // 탭 + 팀 조합 필터
  const filteredMembers = useMemo(() => {
    if (activeTab === 'Enable') {
      return members.filter((m) => m.user_status === 'active');
    }

    // Disable 탭
    return members.filter((m) => m.user_status === 'inactive' || m.user_status === 'suspended');
  }, [members, activeTab]);

  const refreshMembers = async () => {
    if (!team_id) return;

    const list = await getManagerMemberList({
      team_id,
    });
    setMembers(list);
  };

  return (
    <div>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'Enable' | 'Disable')} className="gap-0">
        <div className="border-b border-gray-300 pb-5">
          <TabsList>
            <TabsTrigger value="Enable">사용중</TabsTrigger>
            <TabsTrigger value="Disable">비활성화</TabsTrigger>
          </TabsList>
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
