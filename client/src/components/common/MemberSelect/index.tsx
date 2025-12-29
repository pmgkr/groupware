import { useState, useEffect } from 'react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@components/ui/select';
import { MultiSelect, type MultiSelectOption } from '@components/multiselect/multi-select';
import { getTeamList, getMemberList, type Team } from '@/api';

export type Member = {
  user_id: string;
  user_name: string;
  user_type: string; // owner or member
  profile_image?: string;
};

type Props = {
  value?: Member[]; // 외부 제어형 (전체 선택값)
  onChange?: (selectedMembers: Member[]) => void;
  resetOnTeamChange?: boolean;
  currentUserId?: string; // 로그인한 사용자 아이디
  excludeUserIds?: string[]; // 제외하고 싶은 유저 아이디 배열
  mode?: 'single' | 'multiple'; // 단일 선택 or 다중 선택 모드
};

export function MemberSelect({
  value = [],
  onChange,
  resetOnTeamChange = false,
  currentUserId,
  excludeUserIds = [],
  mode = 'multiple',
}: Props) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<Member[]>([]); // 현재 선택된 팀의 멤버만
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // 팀 목록 불러오기
  useEffect(() => {
    const loadTeams = async () => {
      try {
        setLoadingTeams(true);
        const res = await getTeamList();
        setTeams(res);
      } catch (err) {
        console.error('팀 목록 불러오기 실패:', err);
      } finally {
        setLoadingTeams(false);
      }
    };
    loadTeams();
  }, []);

  // 팀 변경 시 멤버 목록 새로 로드
  useEffect(() => {
    if (!selectedTeam) {
      setMembers([]);
      return;
    }

    if (mode === 'single') {
      onChange?.([]);
      setSelectedIds([]);
    }

    const loadMembers = async () => {
      try {
        setLoadingMembers(true);
        const res = await getMemberList(selectedTeam);

        // 제외 대상 필터링
        const filtered = res.filter((m: any) => !isExcludedUser(String(m.user_id)));

        const normalized = filtered.map(
          (m: any): Member => ({
            user_id: m.user_id,
            user_name: m.user_name,
            profile_image: m.profile_image ?? undefined,
            user_type: 'member',
          })
        );

        setMembers(normalized);
      } catch (err) {
        console.error('멤버 목록 불러오기 실패:', err);
        setMembers([]);
      } finally {
        setLoadingMembers(false);
      }
    };

    loadMembers();
  }, [selectedTeam]);

  // 현재 팀에 해당하는 선택된 멤버 ID만 표시
  useEffect(() => {
    const idsInCurrentTeam = members.filter((m) => value.some((v) => v.user_id === m.user_id)).map((m) => String(m.user_id));
    setSelectedIds(idsInCurrentTeam);
  }, [value, members]);

  // MultiSelect 옵션 (현재 팀만 표시)
  const options: MultiSelectOption[] = members.map((m) => ({
    label: m.user_name,
    value: m.user_id,
  }));

  // 선택 변경 시, 외부 value에 반영
  const handleChange = (values: string[]) => {
    setSelectedIds(values);

    // 현재 팀에서 새로 선택된 멤버들
    const selectedInThisTeam = members.filter((m) => values.includes(String(m.user_id))).map((m) => ({ ...m, user_type: 'member' }));

    // 기존 선택(다른 팀 포함) + 현재 팀 선택 병합
    const withoutCurrentTeam = value.filter((v) => !members.some((m) => m.user_id === v.user_id));

    // owner 아이디가 중복으로 추가되지 않게끔 필터링
    const merged = [...withoutCurrentTeam, ...selectedInThisTeam]
      .filter((m, i, arr) => arr.findIndex((x) => x.user_id === m.user_id) === i)
      .filter((m) => !isExcludedUser(String(m.user_id)));

    onChange?.(merged);
  };

  const isExcludedUser = (userId: string) => {
    if (mode !== 'single' && currentUserId && String(userId) === String(currentUserId)) return true;
    if (excludeUserIds.includes(String(userId))) return true;
    return false;
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* 팀 선택 */}
      <div>
        <div className="mb-1 text-base font-medium">팀 선택</div>
        <Select
          onValueChange={(val) => setSelectedTeam(Number(val))}
          value={selectedTeam ? String(selectedTeam) : undefined}
          disabled={loadingTeams}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={loadingTeams ? '팀 불러오는 중...' : '팀을 선택하세요'} />
          </SelectTrigger>
          <SelectContent>
            {teams.map((team) => (
              <SelectItem key={team.team_id} value={String(team.team_id)}>
                {team.team_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 멤버 선택 */}
      <div>
        <div className="mb-1 text-base font-medium">멤버 선택</div>
        <MultiSelect
          className="w-full"
          simpleSelect
          modalPopover
          options={options}
          value={selectedIds}
          onValueChange={(values) => {
            if (mode === 'single') {
              // 항상 하나만 유지
              const next = values.slice(-1);
              handleChange(next);
            } else {
              handleChange(values);
            }
          }}
          maxCount={mode === 'single' ? 1 : 0}
          hideSelectAll={mode === 'single'}
          closeOnSelect={mode === 'single'}
          placeholder={loadingMembers ? '멤버 불러오는 중...' : members.length === 0 ? '등록된 멤버가 없습니다' : '멤버를 선택하세요'}
          disabled={loadingMembers || members.length === 0}
        />
      </div>
    </div>
  );
}
