import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SettingsIcon, InfoIcon } from 'lucide-react';
import GrantDialog from './grantDialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { adminVacationApi } from '@/api/admin/vacation';
import { managerVacationApi } from '@/api/manager/vacation';
import { getTeams } from '@/api/admin/teams';
import { getTeams as getManagerTeams } from '@/api/manager/teams';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getAvatarFallback, SortIcon, getProfileImageUrl } from '@/utils';
import { useIsMobileViewport } from '@/hooks/useViewport';

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
  va_current: string;
  va_carryover: string;
  va_comp: string;
  va_long: string;
  daycount: number;
};

interface UserListProps {
  year?: number;
  teamIds?: number[];
  userIds?: string[];
  onGrantSuccess?: () => void;
}

/* ===========================================================
    컴포넌트 시작
=========================================================== */

export default function UserList({ year, teamIds = [], userIds = [], onGrantSuccess }: UserListProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isDetailPage = location.pathname.includes('/vacation/user/');
  const isMobile = useIsMobileViewport();
  const [displayData, setDisplayData] = useState<DisplayDataItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [sortState, setSortState] = useState<{ key: string; order: 'asc' | 'desc' } | null>(null);

  const isManagerPage = location.pathname.startsWith('/manager');
  const columnCount = isManagerPage ? 7 : 8;

  const [isGrantDialogOpen, setIsGrantDialogOpen] = useState(false);
  const [selectedUserName, setSelectedUserName] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');

  const handleOpenGrantDialog = (userId: string, userName: string) => {
    if (isManagerPage) return;
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
    if ((e.target as HTMLElement).closest('button')) return;
    // manager 페이지에서도 동일 컴포넌트를 사용하므로 경로를 현재 path 기반으로 분기
    const basePath = location.pathname.startsWith('/manager') ? '/manager' : '/admin';
    navigate(`${basePath}/vacation/user/${userId}`);
  };

  // 팀 목록 로드 여부 추적 ref
  const teamsLoadedRef = useRef(false);

  /* 팀 목록 로드 */
  useEffect(() => {
    if (teamsLoadedRef.current) return;

    const loadTeams = async () => {
      try {
        const teamList = isManagerPage ? await getManagerTeams({}) : await getTeams({});
        setTeams(
          teamList.map((t) => ({
            team_id: t.team_id,
            team_name: t.team_name,
          }))
        );
        teamsLoadedRef.current = true;
      } catch (e) {
        console.error('팀 목록 로드 실패:', e);
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
      if (teamsData.length === 0 && !teamsLoadedRef.current) {
        try {
          const teamList = isManagerPage ? await getManagerTeams({}) : await getTeams({});
          teamsData = teamList.map((t) => ({
            team_id: t.team_id,
            team_name: t.team_name,
          }));
          // teams가 비어있을 때만 업데이트 (이미 로드된 경우 재호출 방지)
          setTeams((prevTeams) => {
            if (prevTeams.length > 0) return prevTeams;
            teamsLoadedRef.current = true;
            return teamsData;
          });
        } catch (e) {
          console.error('팀 목록 로드 실패:', e);
        }
      }

      let filteredItems: any[] = [];

      if (isManagerPage) {
        // 매니저 API: 페이지 기반 -> 모든 페이지 로드
        const myTeamIds = teamsData.map((t) => t.team_id).filter((id) => id != null);
        const managerTeamIds = teamIds.length ? teamIds : myTeamIds;
        const first = await managerVacationApi.getVacationList(currentYear, managerTeamIds.length ? managerTeamIds : undefined, 1, 100);
        filteredItems = first.list || [];

        if (first.total > first.size) {
          const totalPages = Math.ceil(first.total / first.size);
          const requests = [];
          for (let p = 2; p <= totalPages; p++) {
            requests.push(
              managerVacationApi.getVacationList(currentYear, managerTeamIds.length ? managerTeamIds : undefined, p, first.size)
            );
          }
          const responses = await Promise.all(requests);
          responses.forEach((res) => {
            filteredItems = [...filteredItems, ...(res.list || [])];
          });
        }
      } else {
        // 관리자 API
        const response = await adminVacationApi.getVacationList(currentYear, undefined, undefined, 100);
        filteredItems = response.rows;

        // 전체 데이터가 100개를 초과하는 경우 추가 페이지 로드
        if (response.total > 100) {
          const totalPages = Math.ceil(response.total / 100);
          const additionalRequests = [];

          for (let page = 2; page <= totalPages; page++) {
            additionalRequests.push(adminVacationApi.getVacationList(currentYear, undefined, page, 100));
          }

          const additionalResponses = await Promise.all(additionalRequests);
          additionalResponses.forEach((res) => {
            filteredItems = [...filteredItems, ...res.rows];
          });
        }
      }

      if (teamIds.length > 0) {
        filteredItems = filteredItems.filter((i) => teamIds.includes(i.team_id));
      }
      if (userIds.length > 0) {
        filteredItems = filteredItems.filter((i) => userIds.includes(i.user_id));
      }

      const converted = filteredItems.map((item) => {
        const team = teamsData.find((t) => t.team_id === item.team_id);

        // 입사일 포맷팅
        let formattedHireDate = '';
        if (item.hire_date) {
          const hire = new Date(item.hire_date);
          formattedHireDate = `${hire.getFullYear()}-${String(hire.getMonth() + 1).padStart(2, '0')}-${String(hire.getDate()).padStart(2, '0')}`;
        }

        const profileImageName = item.profile_image && typeof item.profile_image === 'string' ? item.profile_image.trim() : null;

        return {
          id: item.user_id,
          profile_image: profileImageName,
          department: team?.team_name || '',
          name: item.user_name,
          hireDate: formattedHireDate,
          va_current: item.va_current,
          va_carryover: item.va_carryover,
          va_comp: item.va_comp,
          va_long: item.va_long,
          daycount: (item as any).daycount || 0,
        };
      });

      // 부서 → 이름 순 정렬
      converted.sort((a, b) => {
        const depA = a.department || '';
        const depB = b.department || '';
        const depDiff = depA.localeCompare(depB, 'ko');
        if (depDiff !== 0) return depDiff;
        return (a.name || '').localeCompare(b.name || '', 'ko');
      });

      setDisplayData(converted);
    } catch (e) {
      console.error('휴가 목록 로드 실패:', e);
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
  const parseNumeric = (val: string) => {
    const n = Number(val);
    return Number.isNaN(n) ? Number.NEGATIVE_INFINITY : n;
  };

  const parseHireDate = (val: string) => {
    if (!val) return Number.POSITIVE_INFINITY;
    const t = new Date(val).getTime();
    return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
  };

  const getSortValue = (item: DisplayDataItem, key: string) => {
    switch (key) {
      case 'hireDate':
        return parseHireDate(item.hireDate);
      case 'va_current':
        return parseNumeric(item.va_current);
      case 'va_carryover':
        return parseNumeric(item.va_carryover);
      case 'va_comp':
        return parseNumeric(item.va_comp);
      case 'va_long':
        return parseNumeric(item.va_long);
      default:
        return 0;
    }
  };

  const sortedDisplayData = useMemo(() => {
    if (!sortState) return displayData;
    const cloned = [...displayData];
    cloned.sort((a, b) => {
      const diff = getSortValue(a, sortState.key) - getSortValue(b, sortState.key);
      return sortState.order === 'asc' ? diff : -diff;
    });
    return cloned;
  }, [displayData, sortState]);

  const toggleSort = (key: string) => {
    setSortState((prev) => {
      if (!prev || prev.key !== key) return { key, order: 'desc' };
      if (prev.order === 'desc') return { key, order: 'asc' };
      return null;
    });
  };

  return (
    <Table variant="primary" align="center" className="table-fixed">
      <TableHeader>
        <TableRow className="[&_th]:text-[13px] [&_th]:font-medium">
          <TableHead className="w-[8%] p-2 text-center max-md:hidden max-md:px-0.5 max-md:text-sm!">부서</TableHead>
          <TableHead className="w-[12%] p-2 text-center max-md:w-[20%] max-md:px-0.5 max-md:text-sm!">이름</TableHead>
          <TableHead className="w-[15%] p-2 text-center max-md:hidden max-md:px-0.5 max-md:text-sm!">
            <div className="flex items-center justify-center gap-1">
              <span className="text-[13px]">입사일</span>
              <Button
                type="button"
                variant="svgIcon"
                size="icon"
                className="p-0"
                aria-label="입사일 정렬"
                onClick={() => toggleSort('hireDate')}>
                <SortIcon order={sortState?.key === 'hireDate' ? sortState.order : undefined} />
              </Button>
            </div>
          </TableHead>
          <TableHead className="w-[15%] p-2 text-center max-md:w-[30%] max-md:px-0.5 max-md:text-sm!">
            <div className="flex items-center justify-center gap-1 max-md:gap-0!">
              <span className="text-[13px] max-md:text-sm!">
                <span className="max-md:hidden">잔여</span>기본연차
              </span>
              {!isMobile && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="h-3 w-3 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>당해 지급 연차 + 주말&공휴일 보상휴가</TooltipContent>
                </Tooltip>
              )}
              {!isMobile && (
                <Button
                  type="button"
                  variant="svgIcon"
                  size="icon"
                  className="p-0"
                  aria-label="기본연차 정렬"
                  onClick={() => toggleSort('va_current')}>
                  <SortIcon order={sortState?.key === 'va_current' ? sortState.order : undefined} />
                </Button>
              )}
            </div>
          </TableHead>
          <TableHead className="w-[15%] p-2 text-center max-md:w-[30%] max-md:px-0.5 max-md:text-sm!">
            <div className="flex items-center justify-center gap-1">
              <span className="text-[13px] max-md:text-sm!">
                <span className="max-md:hidden">잔여</span>이월연차
              </span>
              {!isMobile && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="h-3 w-3 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>당해 4월 소멸됨</TooltipContent>
                </Tooltip>
              )}
              {!isMobile && (
                <Button
                  type="button"
                  variant="svgIcon"
                  size="icon"
                  className="p-0"
                  aria-label="이월연차 정렬"
                  onClick={() => toggleSort('va_carryover')}>
                  <SortIcon order={sortState?.key === 'va_carryover' ? sortState.order : undefined} />
                </Button>
              )}
            </div>
          </TableHead>

          <TableHead className="w-[15%] p-2 text-center max-md:w-[30%] max-md:px-0.5 max-md:text-sm!">
            <div className="flex items-center justify-center gap-1">
              <span className="text-[13px] max-md:text-sm!">
                <span className="max-md:hidden">잔여</span>특별대휴
              </span>
              {!isMobile && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="h-3 w-3 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>토요일 근무 보상휴가</TooltipContent>
                </Tooltip>
              )}
              {!isMobile && (
                <Button
                  type="button"
                  variant="svgIcon"
                  size="icon"
                  className="p-0"
                  aria-label="특별대휴 정렬"
                  onClick={() => toggleSort('va_comp')}>
                  <SortIcon order={sortState?.key === 'va_comp' ? sortState.order : undefined} />
                </Button>
              )}
            </div>
          </TableHead>

          <TableHead className="hidden w-[10%] p-2 text-center max-md:px-0.5 max-md:text-sm!">
            <div className="flex items-center justify-center gap-1">
              <span className="text-[13px]">
                <span className="max-md:hidden">잔여</span>공가
              </span>
              {!isMobile && (
                <Button
                  type="button"
                  variant="svgIcon"
                  size="icon"
                  className="p-0"
                  aria-label="공가 정렬"
                  onClick={() => toggleSort('va_long')}>
                  <SortIcon order={sortState?.key === 'va_long' ? sortState.order : undefined} />
                </Button>
              )}
            </div>
          </TableHead>
          {!isManagerPage && (
            <TableHead className="w-[20%] p-2 text-center max-md:w-[20%] max-md:px-0.5 max-md:text-sm!">휴가관리</TableHead>
          )}
        </TableRow>
      </TableHeader>

      <TableBody>
        {loading ? (
          <TableRow className="[&_td]:text-[13px]">
            <TableCell colSpan={columnCount} className="p-2 text-center max-md:px-0.5">
              로딩 중…
            </TableCell>
          </TableRow>
        ) : sortedDisplayData.length === 0 ? (
          <TableRow className="[&_td]:text-[13px]">
            <TableCell colSpan={columnCount} className="p-2 text-center max-md:px-0.5">
              데이터 없음
            </TableCell>
          </TableRow>
        ) : (
          sortedDisplayData.map((item) => (
            <TableRow
              key={item.id}
              className="cursor-pointer hover:bg-gray-200 [&_td]:text-[13px]"
              onClick={(e) => handleRowClick(item.id, e)}>
              <TableCell className="p-2 text-center max-md:hidden max-md:px-0.5">{item.department}</TableCell>

              <TableCell className="p-2 text-center max-md:px-0.5">
                <div className="flex items-center justify-center gap-2">
                  <Avatar className="h-8 w-8 max-md:hidden">
                    {item.profile_image && <AvatarImage src={getProfileImageUrl(item.profile_image)} alt={item.name} />}
                    <AvatarFallback>{getAvatarFallback(item.id)}</AvatarFallback>
                  </Avatar>
                  {item.name}
                </div>
              </TableCell>

              <TableCell className="p-2 text-center max-md:hidden max-md:px-0.5">
                <div className="flex items-center justify-center gap-1">
                  <span className="text-sm">{item.hireDate}</span>
                  <span className="text-xs text-gray-500">({item.daycount}일)</span>
                </div>
              </TableCell>

              {/* 기본연차 */}
              <TableCell className="p-2 text-center max-md:px-0.5">
                <Badge
                  variant={Number(item.va_current) < 0 ? 'lightpink2' : Number(item.va_current) === 0 ? 'grayish' : 'secondary'}
                  size="table">
                  {item.va_current}일
                </Badge>
              </TableCell>

              {/* 이월 */}
              <TableCell className="p-2 text-center max-md:px-0.5">
                <Badge
                  variant={Number(item.va_carryover) < 0 ? 'lightpink2' : Number(item.va_carryover) === 0 ? 'grayish' : 'secondary'}
                  size="table">
                  {item.va_carryover}일
                </Badge>
              </TableCell>

              {/* 특별 */}
              <TableCell className="p-2 text-center max-md:px-0.5">
                <Badge
                  variant={Number(item.va_comp) < 0 ? 'lightpink2' : Number(item.va_comp) === 0 ? 'grayish' : 'secondary'}
                  size="table">
                  {item.va_comp}일
                </Badge>
              </TableCell>

              {/* 공가 (근속휴가) */}
              <TableCell className="hidden p-2 text-center max-md:px-0.5">
                <Badge
                  variant={Number(item.va_long) < 0 ? 'lightpink2' : Number(item.va_long) === 0 ? 'grayish' : 'secondary'}
                  size="table">
                  {item.va_long}일
                </Badge>
              </TableCell>

              {!isManagerPage && (
                <TableCell className="p-2 text-center max-md:px-0.5">
                  <Button size="sm" variant="outline" onClick={() => handleOpenGrantDialog(item.id, item.name)}>
                    <SettingsIcon className="h-4 w-4" />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))
        )}
      </TableBody>

      {!isManagerPage && (
        <GrantDialog
          isOpen={isGrantDialogOpen}
          onClose={handleCloseGrantDialog}
          userId={selectedUserId}
          userName={selectedUserName}
          onSuccess={() => {
            handleCloseGrantDialog();
            loadVacationList();
            onGrantSuccess?.();
          }}
        />
      )}
    </Table>
  );
}
