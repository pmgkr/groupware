import { useEffect, useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { getMemberList } from '@/api';
import MemberList from '@/components/ui/memberList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Member() {
  const { user_level, team_id } = useUser();
  const [members, setMembers] = useState<any[]>([]);

  // 매니저만 접근
  if (user_level !== 'manager') return null;

  useEffect(() => {
    if (!team_id) return;

    // ✅ 내 team_id를 넘겨서 조회
    getMemberList(team_id).then(setMembers);
  }, [team_id]);

  return (
    <div>
      <Tabs>
        <Tabs className="" defaultValue="Enable">
          <TabsList>
            <TabsTrigger value="Enable">Enable</TabsTrigger>
            <TabsTrigger value="Disable">Disable</TabsTrigger>
          </TabsList>
          <TabsContent value="Enable" className="w-full">
            <div className="mt-3 grid grid-cols-4 gap-5">
              {members.map((member) => (
                <MemberList key={member.user_id} member={member} />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="Disable">Change your password here.</TabsContent>
        </Tabs>
      </Tabs>
    </div>
  );
}
