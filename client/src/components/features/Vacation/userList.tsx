import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SettingsIcon, InfoIcon } from 'lucide-react';
import GrantDialog from './grantDialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { adminVacationApi, type VacationItem, type VacationLogItem } from '@/api/admin/vacation';
import { getTeams } from '@/api/admin/teams';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getAvatarFallback } from '@/utils';

/* ===========================================================
    타입 정의
=========================================================== */

type VacationLog = {
  v_type: string;
  v_count: number;
  [key: string]: any;
};

type Team = {
  team_id: number;
  team_name: string;
};

type DisplayDataItem = {
  id: string;
  profile_image: string | null;
  department: string;
  name: string;
  hireDate: string;
  CountFromHireDate: string;
  currentYearVacation: { plusDays: number; minusDays: number };
  carryOverVacation: { plusDays: number; minusDays: number };
  specialVacation: { plusDays: number; minusDays: number };
  officialVacation: { plusDays: number; minusDays: number };
  totalVacationDays: { plusDays: number; minusDays: number };
  availableVacationDays: number;
};

interface UserListProps {
  year?: number;
  teamIds?: number[];
  userIds?: string[];
}

/* ===========================================================
    휴가 계산 함수들 (부호 복구 필수 적용)
=========================================================== */

// 특정 유형만 계산
function calcVacationByType(logs: VacationLog[], type: string) {
  let grant = 0;
  let used = 0;

  logs.forEach((log: VacationLog) => {
    if (log.v_type !== type) return;

    if (log.v_count < 0) grant += -log.v_count; // 부여
    else used += log.v_count; // 사용
  });

  return {
    plusDays: grant,
    minusDays: -used,
  };
}

// 공가 계산
function calcOfficial(logs: VacationLog[]) {
  let grant = 0;
  let used = 0;

  logs.forEach((log: VacationLog) => {
    if (log.v_type !== "official") return;

    if (log.v_count < 0) grant += -log.v_count;
    else used += log.v_count;
  });

  return {
    plusDays: grant,
    minusDays: -used
  };
}

// 기본연차(current + 사용종류)
function calcCurrentYear(logs: VacationLog[]) {
  let grant = 0;
  let used = 0;

  logs.forEach((log: VacationLog) => {
    if (["current", "day", "half", "quater", "cancel"].includes(log.v_type)) {
      if (log.v_count < 0) grant += -log.v_count;
      else used += log.v_count;
    }
  });

  return {
    plusDays: grant,
    minusDays: -used,
    available: grant - used,
  };
}

// 전체 휴가 계산 종합
function calcAllVacationTypes(logs: VacationLog[]) {
  const current = calcCurrentYear(logs);
  const carry = calcVacationByType(logs, "carryover");
  const special = calcVacationByType(logs, "comp");
  const official = calcOfficial(logs);

  const totalPlus = current.plusDays + carry.plusDays + special.plusDays;
  const totalMinus = current.minusDays + carry.minusDays + special.minusDays;

  const available =
    current.available +
    carry.plusDays +
    special.plusDays +
    (carry.minusDays + special.minusDays);

  return {
    current,
    carry,
    special,
    official,
    total: {
      plusDays: totalPlus,
      minusDays: totalMinus
    },
    available
  };
}

/* ===========================================================
    컴포넌트 시작
=========================================================== */

export default function UserList({ year, teamIds = [], userIds = [] }: UserListProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isDetailPage = location.pathname.includes('/vacation/user/');

  const [displayData, setDisplayData] = useState<DisplayDataItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);

  const [isGrantDialogOpen, setIsGrantDialogOpen] = useState(false);
  const [selectedUserName, setSelectedUserName] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');

  const handleOpenGrantDialog = (userId: string, userName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setIsGrantDialogOpen(true);
  };

  const handleCloseGrantDialog = () => {
    setIsGrantDialogOpen(false);
    setSelectedUserName('');
    setSelectedUserId('');
  };

  const handleRowClick = (userId: string, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    navigate(`/admin/vacation/user/${userId}`);
  };

  /* 팀 목록 로드 */
  useEffect(() => {
    const loadTeams = async () => {
      try {
        const teamList = await getTeams({});
        setTeams(teamList.map((t) => ({
          team_id: t.team_id,
          team_name: t.team_name
        })));
      } catch (e) {
        console.error("팀 목록 로드 실패:", e);
      }
    };
    loadTeams();
  }, []);

  /* ===========================================================
      휴가 목록 + 로그 병렬 로딩
  ========================================================== */
  const loadVacationList = async () => {
    setLoading(true);

    try {
      const currentYear = year || new Date().getFullYear();
      
      // 팀 목록이 없으면 먼저 로드
      let teamsData = teams;
      if (teamsData.length === 0) {
        try {
          const teamList = await getTeams({});
          teamsData = teamList.map((t) => ({
            team_id: t.team_id,
            team_name: t.team_name
          }));
          setTeams(teamsData);
        } catch (e) {
          console.error("팀 목록 로드 실패:", e);
        }
      }

      const response = await adminVacationApi.getVacationList(currentYear);

      let filteredItems = response.rows;

      if (teamIds.length > 0) {
        filteredItems = filteredItems.filter(i => teamIds.includes(i.team_id));
      }
      if (userIds.length > 0) {
        filteredItems = filteredItems.filter(i => userIds.includes(i.user_id));
      }

      // 모든 유저 로그 병렬 호출 (일부 실패해도 계속 진행)
      const detailResults = await Promise.allSettled(
        filteredItems.map(item =>
          adminVacationApi.getVacationInfo(item.user_id, currentYear)
        )
      );

      const converted = filteredItems.map((item, idx) => {
        const result = detailResults[idx];
        
        // 성공한 경우에만 데이터 사용, 실패한 경우 빈 배열
        let detail = null;
        if (result.status === 'fulfilled') {
          detail = result.value;
        } else {
          // 에러가 발생해도 사용자 정보는 표시
          console.warn(`휴가 정보 로드 실패 (${item.user_name}):`, result.reason?.message || result.reason);
        }

        // 🚨 서버에서 v_count 를 반대로 보내므로 다시 돌려줘야 함!!
        const logs: VacationLog[] = (detail?.body ?? []).map((log: VacationLogItem) => ({
          ...log,
          v_count: Number(log.v_count) * -1,  // 핵심 수정!!
        }));

        const calc = calcAllVacationTypes(logs);
        const team = teamsData.find(t => t.team_id === item.team_id);

        // 입사일 계산
        let formattedHireDate = "";
        let countFromHireDate = "";

        if (item.hire_date) {
          const hire = new Date(item.hire_date);
          const today = new Date();
          const diff = Math.floor((today.getTime() - hire.getTime()) / 86400000);

          formattedHireDate = `${hire.getFullYear()}-${String(hire.getMonth() + 1).padStart(2, "0")}-${String(hire.getDate()).padStart(2, "0")}`;
          countFromHireDate = `${diff}일`;
        }

        // 프로필 이미지 파일명 확인 및 정리 (공백 제거, null 체크)
        const profileImageName = item.profile_image && typeof item.profile_image === 'string' 
          ? item.profile_image.trim() 
          : null;
        
        return {
          id: item.user_id,
          profile_image: profileImageName, // 원본 파일명만 저장

          department: team?.team_name || "",
          name: item.user_name,
          hireDate: formattedHireDate,
          CountFromHireDate: countFromHireDate,

          currentYearVacation: {
            plusDays: calc.current.plusDays,
            minusDays: calc.current.minusDays
          },

          carryOverVacation: {
            plusDays: calc.carry.plusDays,
            minusDays: calc.carry.minusDays
          },

          specialVacation: {
            plusDays: calc.special.plusDays,
            minusDays: calc.special.minusDays
          },

          officialVacation: {
            plusDays: calc.official.plusDays,
            minusDays: calc.official.minusDays
          },

          totalVacationDays: {
            plusDays: calc.total.plusDays,
            minusDays: calc.total.minusDays
          },

          availableVacationDays: calc.available
        };
      });

      setDisplayData(converted);
    } catch (e) {
      console.error("휴가 목록 로드 실패:", e);
      setDisplayData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // teams가 로드된 후에 실행되도록 함
    if (teams.length > 0 || year || teamIds.length > 0 || userIds.length > 0) {
      loadVacationList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, teamIds, userIds, isDetailPage, teams]);

  /* ===========================================================
      렌더링
  ========================================================== */
  return (
    <Table variant="primary" align="center" className="table-fixed">
      <TableHeader>
        <TableRow>
          <TableHead className="w-[8%] text-center">부서</TableHead>
          <TableHead className="w-[10%] text-center">이름</TableHead>
          <TableHead className="w-[15%] text-center">입사일</TableHead>
          <TableHead className="w-[10%] text-center">기본연차</TableHead>
          <TableHead className="w-[10%] text-center">
            <div className="flex items-center justify-center gap-1">
              이월연차
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="w-3 h-3 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>당해 4월 소멸됨</TooltipContent>
              </Tooltip>
            </div>
          </TableHead>

          <TableHead className="w-[10%] text-center">
            <div className="flex items-center justify-center gap-1">
              특별대휴
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="w-3 h-3 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>토요일 근무 보상휴가</TooltipContent>
              </Tooltip>
            </div>
          </TableHead>

          <TableHead className="w-[10%] text-center">
            <div className="flex items-center justify-center gap-1">
              공가
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="w-3 h-3 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>총 휴가일수, 누적 휴가일수에 포함 안됨</TooltipContent>
              </Tooltip>
            </div>
          </TableHead>

          <TableHead className="w-[10%] text-center">누적 휴가일수</TableHead>
          <TableHead className="w-[10%] text-center">총 잔여 휴가일수</TableHead>
          <TableHead className="w-[10%] text-center">휴가관리</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={10} className="text-center">로딩 중…</TableCell>
          </TableRow>
        ) : displayData.length === 0 ? (
          <TableRow>
            <TableCell colSpan={10} className="text-center">데이터 없음</TableCell>
          </TableRow>
        ) : (
          displayData.map(item => (
            <TableRow
              key={item.id}
              className="cursor-pointer hover:bg-gray-200"
              onClick={(e) => handleRowClick(item.id, e)}
            >
              <TableCell className="text-center">{item.department}</TableCell>

              <TableCell className="text-center">
                <div className="flex items-center gap-2 justify-center">
                  <Avatar className="w-10 h-10">
                    <AvatarImage 
                      src={item.profile_image 
                        ? (() => {
                            const baseUrl = import.meta.env.VITE_API_ORIGIN || "https://gbend.cafe24.com";
                            const imagePath = item.profile_image.startsWith('/') 
                              ? item.profile_image.slice(1) 
                              : item.profile_image;
                            return `${baseUrl}/uploads/mypage/${imagePath}`;
                          })()
                        : undefined
                      } 
                    />
                    <AvatarFallback>{getAvatarFallback(item.id)}</AvatarFallback>
                  </Avatar>
                  {item.name}
                </div>
              </TableCell>

              <TableCell className="text-center">
                <div className="flex flex-col items-center">
                  <span>{item.hireDate}</span>
                  <span className="text-xs text-gray-500">{item.CountFromHireDate}</span>
                </div>
              </TableCell>

              {/* 기본연차 */}
              <TableCell className="text-center">
              <div className="flex flex-col items-center gap-1">
                  <Badge variant="secondary" size="table">
                    {item.currentYearVacation.plusDays}일
                  </Badge>
                  <Badge variant="grayish" size="table">
                    {item.currentYearVacation.minusDays}일
                  </Badge>
                </div>
              </TableCell>

              {/* 이월 */}
              <TableCell className="text-center">
                <div className="flex flex-col items-center gap-1">
                  <Badge variant="secondary" size="table">{item.carryOverVacation.plusDays}일</Badge>
                  <Badge variant="grayish" size="table">{item.carryOverVacation.minusDays}일</Badge>
                </div>
              </TableCell>

              {/* 특별 */}
              <TableCell className="text-center">
                <div className="flex flex-col items-center gap-1">
                  <Badge variant="secondary" size="table">{item.specialVacation.plusDays}일</Badge>
                  <Badge variant="grayish" size="table">{item.specialVacation.minusDays}일</Badge>
                </div>
              </TableCell>

              {/* 공가 */}
              <TableCell className="text-center">
                <div className="flex flex-col items-center gap-1">
                  <Badge variant="secondary" size="table">{item.officialVacation.plusDays}일</Badge>
                  <Badge variant="grayish" size="table">{item.officialVacation.minusDays}일</Badge>
                </div>
              </TableCell>

              {/* 누적 */}
              <TableCell className="text-center">
                <div className="flex flex-col items-center gap-1">
                  <Badge variant="secondary" size="table">{item.totalVacationDays.plusDays}일</Badge>
                  <Badge variant="grayish" size="table">{item.totalVacationDays.minusDays}일</Badge>
                </div>
              </TableCell>

              {/* 잔여 */}
              <TableCell className="text-center">
                  <Badge variant="default" size="table">{item.availableVacationDays}일</Badge>
              </TableCell>

              <TableCell className="text-center">
                <Button size="sm" variant="outline"
                  onClick={() => handleOpenGrantDialog(item.id, item.name)}
                >
                  <SettingsIcon className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>

      <GrantDialog
        isOpen={isGrantDialogOpen}
        onClose={handleCloseGrantDialog}
        userId={selectedUserId}
        userName={selectedUserName}
        onSuccess={() => {
          handleCloseGrantDialog();
          loadVacationList();
        }}
      />

    </Table>
  );
}
