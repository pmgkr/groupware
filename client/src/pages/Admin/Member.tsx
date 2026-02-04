import { useEffect, useMemo, useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { getMemberList, getTeamList } from '@/api';
import MemberList from '@/components/ui/memberList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getManagerMemberList } from '@/api/manager/member';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SearchGray } from '@/assets/images/icons';

export default function Member() {
  const { user_level } = useUser();

  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | undefined>();
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [members, setMembers] = useState<any[]>([]);
  const [keyword, setKeyword] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'Enable' | 'Disable'>('Enable');

  // 어드민만 접근
  if (user_level !== 'admin') return null;

  // 팀 목록
  useEffect(() => {
    getTeamList().then(setTeams);
  }, []);

  // 팀 선택에 따른 멤버 조회 (서버 필터)
  useEffect(() => {
    getManagerMemberList({
      team_id: selectedTeamId,
      role: selectedRole,
      q: keyword.trim() || undefined,
    }).then(setMembers);
  }, [selectedTeamId, keyword, selectedRole]);

  // 탭 + 팀 조합 필터
  const filteredMembers = useMemo(() => {
    if (activeTab === 'Enable') {
      return members.filter((m) => m.user_status === 'active');
    }

    // Disable 탭
    return members.filter((m) => m.user_status === 'inactive' || m.user_status === 'suspended');
  }, [members, activeTab]);

  const refreshMembers = async () => {
    const list = await getManagerMemberList({
      team_id: selectedTeamId,
      role: selectedRole,
      q: keyword.trim() || undefined,
    });
    setMembers(list);
  };

  const handleSearch = () => {
    setKeyword(searchQuery.trim());
  };

  return (
    <div>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'Enable' | 'Disable')}>
        <div className="flex w-full items-center justify-between border-b border-gray-300 pb-5">
          <div className="flex items-center gap-3">
            {/* 상태 탭 */}
            <TabsList>
              <TabsTrigger value="Enable">사용중</TabsTrigger>
              <TabsTrigger value="Disable">비활성화</TabsTrigger>
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
            <div className="flex items-center gap-x-2 before:mr-3 before:ml-3 before:inline-flex before:h-7 before:w-[1px] before:bg-gray-300">
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-[200px]" size="sm">
                  <SelectValue placeholder="권한 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-gray" size="sm">
                    전체
                  </SelectItem>
                  <SelectItem value="user" className="text-gray" size="sm">일반사용자</SelectItem>
                  <SelectItem value="manager" className="text-gray" size="sm">관리자(팀장)</SelectItem>
                  <SelectItem value="admin" className="text-gray" size="sm">최고관리자</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-x-2">
            <div className="relative w-[175px]">
              <Input
                className="h-[32px] px-4 [&]:bg-white"
                placeholder="검색어 입력"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button
                variant="svgIcon"
                size="icon"
                className="absolute top-4 right-2 h-4 w-4 -translate-y-1/2"
                aria-label="검색"
                onClick={handleSearch}>
                <SearchGray className="text-gray-400" />
              </Button>
            </div>
          </div>
        </div>

        {/* Enable */}
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

        {/* Disable */}
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
