import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SettingsIcon, InfoIcon } from 'lucide-react';
import GrantDialog from './grantDialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { adminVacationApi, type VacationItem } from '@/api/admin/vacation';
import { getTeams } from '@/api/admin/teams';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getAvatarFallback } from '@/utils';

/* ===========================================================
    타입 정의
=========================================================== */

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
  va_current: string;
  va_carryover: string;
  va_comp: string;
  va_long: string;
};

interface UserListProps {
  year?: number;
  teamIds?: number[];
  userIds?: string[];
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
      휴가 목록 로딩
  ========================================================== */
  const loadingRef = useRef(false);
  
  // teamIds와 userIds를 문자열로 변환하여 안정적인 의존성 생성 (원본 배열 변경 방지)
  const teamIdsKey = useMemo(() => [...teamIds].sort((a, b) => a - b).join(','), [teamIds]);
  const userIdsKey = useMemo(() => [...userIds].sort().join(','), [userIds]);
  
  const loadVacationList = useCallback(async () => {
    // 이미 로딩 중이면 중복 호출 방지
    if (loadingRef.current) return;
    
    loadingRef.current = true;
    setLoading(true);

    try {
      const currentYear = year || new Date().getFullYear();
      
      // 팀 목록 가져오기 (teams는 클로저로 최신 값 참조)
      let teamsData = teams;
      if (teamsData.length === 0) {
        try {
          const teamList = await getTeams({});
          teamsData = teamList.map((t) => ({
            team_id: t.team_id,
            team_name: t.team_name
          }));
          // teams가 비어있을 때만 업데이트 (이미 로드된 경우 재호출 방지)
          setTeams(prevTeams => {
            if (prevTeams.length > 0) return prevTeams;
            return teamsData;
          });
        } catch (e) {
          console.error("팀 목록 로드 실패:", e);
        }
      }

      // 모든 데이터를 가져오기 위해 size=100으로 요청
      const response = await adminVacationApi.getVacationList(currentYear, undefined, undefined, 100);

      let filteredItems = response.rows;
      
      // 전체 데이터가 100개를 초과하는 경우 추가 페이지 로드
      if (response.total > 100) {
        const totalPages = Math.ceil(response.total / 100);
        const additionalRequests = [];
        
        for (let page = 2; page <= totalPages; page++) {
          additionalRequests.push(
            adminVacationApi.getVacationList(currentYear, undefined, page, 100)
          );
        }
        
        const additionalResponses = await Promise.all(additionalRequests);
        additionalResponses.forEach(res => {
          filteredItems = [...filteredItems, ...res.rows];
        });
      }

      if (teamIds.length > 0) {
        filteredItems = filteredItems.filter(i => teamIds.includes(i.team_id));
      }
      if (userIds.length > 0) {
        filteredItems = filteredItems.filter(i => userIds.includes(i.user_id));
      }

      const converted = filteredItems.map((item) => {
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

        const profileImageName = item.profile_image && typeof item.profile_image === 'string' 
          ? item.profile_image.trim() 
          : null;
        
        return {
          id: item.user_id,
          profile_image: profileImageName,
          department: team?.team_name || "",
          name: item.user_name,
          hireDate: formattedHireDate,
          CountFromHireDate: countFromHireDate,
          va_current: item.va_current,
          va_carryover: item.va_carryover,
          va_comp: item.va_comp,
          va_long: item.va_long
        };
      });

      setDisplayData(converted);
    } catch (e) {
      console.error("휴가 목록 로드 실패:", e);
      setDisplayData([]);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [year, teamIdsKey, userIdsKey]);

  useEffect(() => {
    // 초기 마운트 시 또는 의존성이 변경될 때만 호출
    loadVacationList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, teamIdsKey, userIdsKey]);

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
          <TableHead className="w-[10%] text-center">휴가관리</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={8} className="text-center">로딩 중…</TableCell>
          </TableRow>
        ) : displayData.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="text-center">데이터 없음</TableCell>
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
                <Badge variant="secondary" size="table">
                  {item.va_current}일
                </Badge>
              </TableCell>

              {/* 이월 */}
              <TableCell className="text-center">
                <Badge variant="secondary" size="table">{item.va_carryover}일</Badge>
              </TableCell>

              {/* 특별 */}
              <TableCell className="text-center">
                <Badge variant="secondary" size="table">{item.va_comp}일</Badge>
              </TableCell>

              {/* 공가 (근속휴가) */}
              <TableCell className="text-center">
                <Badge variant="secondary" size="table">{item.va_long}일</Badge>
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
