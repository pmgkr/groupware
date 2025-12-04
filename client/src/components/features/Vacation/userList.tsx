import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlusIcon, MinusIcon, SettingsIcon, InfoIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import GrantDialog from './grantDialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { adminVacationApi, type VacationItem } from '@/api/admin/vacation';
import { getTeams } from '@/api/teams';


export interface VacationDayInfo {
  plusDays?: number; // 추가된 일수
  minusDays?: number; // 차감된 일수
}

export interface UserListItem {
  id: string;
  profile_image: string;
  department: string;
  name: string;
  hireDate: string;
  CountFromHireDate: string;
  currentYearVacation: VacationDayInfo; // 기본연차
  carryOverVacation: VacationDayInfo; // 이월연차
  specialVacation: VacationDayInfo; // 특별대휴
  officialVacation: VacationDayInfo; // 공가
  totalVacationDays: VacationDayInfo; // 누적 휴가일수
  availableVacationDays: number; // 사용가능 휴가일수
}

export interface UserListProps {
  year?: number;
  teamIds?: number[];
  userIds?: string[];
}

export default function UserList({ 
  year,
  teamIds = [],
  userIds = []
}: UserListProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 상세 페이지인지 확인
  const isDetailPage = location.pathname.includes('/vacation/user/');
  
  // 데이터 상태
  const [displayData, setDisplayData] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<Array<{ team_id: number; team_name: string }>>([]);

  // 다이얼로그 상태
  const [isGrantDialogOpen, setIsGrantDialogOpen] = useState(false);
  const [selectedUserName, setSelectedUserName] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  // 다이얼로그 열기
  const handleOpenGrantDialog = (userId: string, userName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setIsGrantDialogOpen(true);
  };

  // 다이얼로그 닫기
  const handleCloseGrantDialog = () => {
    setIsGrantDialogOpen(false);
    setSelectedUserName('');
    setSelectedUserId('');
  };

  // 사용자 상세 페이지로 이동
  const handleRowClick = (userId: string, e: React.MouseEvent) => {
    // 버튼 클릭 시에는 이동하지 않음
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }    
    navigate(`/admin/vacation/user/${userId}`);
  };

  // 팀 목록 로드
  useEffect(() => {
    const loadTeams = async () => {
      try {
        const teamList = await getTeams({});
        setTeams(teamList.map(team => ({
          team_id: team.team_id,
          team_name: team.team_name
        })));
      } catch (error) {
        console.error('팀 목록 로드 실패:', error);
      }
    };
    loadTeams();
  }, []);

  // 휴가 목록 로드 함수
  const loadVacationList = async () => {
    setLoading(true);
    try {
      const currentYear = year || new Date().getFullYear();
      const response = await adminVacationApi.getVacationList(currentYear);
      
      // 필터링: 선택된 팀과 유저에 따라
      let filteredItems = response.rows;
      
      if (teamIds.length > 0) {
        filteredItems = filteredItems.filter(item => teamIds.includes(item.team_id));
      }
      
      if (userIds.length > 0) {
        filteredItems = filteredItems.filter(item => userIds.includes(item.user_id));
      }

      // VacationItem을 UserListItem으로 변환
      const convertedData: UserListItem[] = filteredItems.map(item => {
        const team = teams.find(t => t.team_id === item.team_id);
        
        // 입사일로부터 경과 일수 계산
        let countFromHireDate = '';
        let formattedHireDate = '';
        if (item.hire_date) {
          const hireDate = new Date(item.hire_date);
          const today = new Date();
          const diffTime = today.getTime() - hireDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          countFromHireDate = `${diffDays}일`;
          
          // 날짜를 YYYY-MM-DD 형식으로 포맷팅
          const year = hireDate.getFullYear();
          const month = String(hireDate.getMonth() + 1).padStart(2, '0');
          const day = String(hireDate.getDate()).padStart(2, '0');
          formattedHireDate = `${year}-${month}-${day}`;
        }
        
        // 프로필 이미지 URL 생성
        const profileImageUrl = item.profile_image 
          ? `${import.meta.env.VITE_API_ORIGIN || 'https://gbend.cafe24.com'}/uploads/mypage/${item.profile_image}`
          : '';
        
        return {
          id: item.user_id,
          profile_image: profileImageUrl,
          department: team?.team_name || '',
          name: item.user_name,
          hireDate: formattedHireDate || item.hire_date || '',
          CountFromHireDate: countFromHireDate,
          // 기본연차
          currentYearVacation: {
            plusDays: Number((Number(item.va_current) || 0) + (Number(item.v_current) || 0)) || 0,
            minusDays: Number(-(Number(item.v_current) || 0)) || 0
          },
          // 이월연차
          carryOverVacation: {
            plusDays: Number((Number(item.va_carryover) || 0) + (Number(item.v_carryover) || 0)) || 0,
            minusDays: Number(-(Number(item.v_carryover) || 0)) || 0
          },
          // 특별대휴
          specialVacation: {
            plusDays: Number((Number(item.va_comp) || 0) + (Number(item.v_comp) || 0)) || 0,
            minusDays: Number(-(Number(item.v_comp) || 0)) || 0
          },
          // 공가
          officialVacation: {
            plusDays: Number(Number(item.va_official) || 0) || 0,
            minusDays: Number(-(Number(item.v_official) || 0)) || 0
          },
          // 누적 휴가일수(공가제외)
          totalVacationDays: {
            plusDays: Number(
              ((Number(item.va_current) || 0) + (Number(item.v_current) || 0)) + // 기본연차
              ((Number(item.va_carryover) || 0) + (Number(item.v_carryover) || 0)) +  // 이월연차
              ((Number(item.va_comp) || 0) + (Number(item.v_comp) || 0)) // 특별대휴
            ) || 0,
            minusDays: Number(-((Number(item.v_current) || 0) + (Number(item.v_carryover) || 0) + (Number(item.v_comp) || 0))) || 0
          },
          // 총 잔여 휴가일수(공가 제외)
          availableVacationDays: Number(
            (((Number(item.va_current) || 0) + (Number(item.v_current) || 0)) + // 기본연차
             ((Number(item.va_carryover) || 0) + (Number(item.v_carryover) || 0)) + // 이월연차
             ((Number(item.va_comp) || 0) + (Number(item.v_comp) || 0))) - // 특별대휴
            ((Number(item.v_current) || 0) + (Number(item.v_carryover) || 0) + (Number(item.v_comp) || 0))
          ) || 0,

        };
      });
      
      setDisplayData(convertedData);
    } catch (error: any) {
      console.error('휴가 목록 로드 실패:', error);
      // 404 에러인 경우 서버 라우트가 없는 것으로 간주
      if (error?.status === 404 || error?.message?.includes('404') || error?.message?.includes('Not Found')) {
        console.warn('서버에 /admin/vacation/list 엔드포인트가 없습니다. 서버 측 라우트를 확인해주세요.');
      }
      setDisplayData([]);
    } finally {
      setLoading(false);
    }
  };

  // 휴가 목록 로드
  useEffect(() => {
    loadVacationList();
  }, [year, teamIds, userIds, teams, isDetailPage]);


  return (
    <Table variant="primary" align="center" className="table-fixed">
      <TableHeader>
        <TableRow className="[&_th]:text-[13px] [&_th]:font-medium">
          <TableHead className="w-[8%] text-center p-0">부서</TableHead>
          <TableHead className="w-[10%] text-center">이름</TableHead>
          <TableHead className="w-[15%] text-center">입사일</TableHead>
          <TableHead className="w-[10%] text-center">기본연차</TableHead>
          <TableHead className="w-[10%] text-center">
            <div className="flex items-center justify-center gap-1">
              <span>이월연차</span>
              <Tooltip> 
                <TooltipTrigger asChild>
                  <InfoIcon className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>당해 4월 소멸됨</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TableHead>
          <TableHead className="w-[10%] text-center">
            <div className="flex items-center justify-center gap-1">
              <span>특별대휴</span>
              <Tooltip> 
                <TooltipTrigger asChild>
                  <InfoIcon className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>토요일 근무에 대한 보상휴가</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TableHead>
          <TableHead className="w-[10%] text-center">
            <div className="flex items-center justify-center gap-1">
              <span>공가</span>
              <Tooltip> 
                <TooltipTrigger asChild>
                  <InfoIcon className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>누적, 총 휴가일수에 포함되지 않음</p>
                </TooltipContent>
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
            <TableCell className="h-15 text-gray-500 text-center" colSpan={10}>
              로딩 중
            </TableCell>
          </TableRow>
        ) : displayData.length === 0 ? (
          <TableRow>
            <TableCell className="h-15 text-gray-500 text-center" colSpan={10}>
              휴가 데이터가 없습니다.
            </TableCell>
          </TableRow>
        ) : (
          displayData.map((item) => (
            <TableRow 
              key={item.id} 
              className="[&_td]:text-[13px] cursor-pointer hover:bg-gray-200"
              onClick={(e) => handleRowClick(item.id, e)}
            >
              <TableCell className="text-center p-0">{item.department}</TableCell>
              <TableCell className="py-3 px-5 text-center">
                <div className="flex items-center gap-1">
                    <img 
                      src={item.profile_image || 'https://gbend.cafe24.com/uploads/mypage/migx16tz_ebf4c4a682.webp?t=1764225227211'} 
                      alt={item.name} 
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => {
                        // 이미지 로드 실패 시 기본 이미지로 대체
                        (e.target as HTMLImageElement).src = 'https://gbend.cafe24.com/uploads/mypage/migx16tz_ebf4c4a682.webp?t=1764225227211';
                      }}
                    />
                    <div className="inline-flex flex-wrap justify-start align-start text-left flex-col gap-0">
                        <span className="inline-flex px-2 text-base">{item.name}</span>
                    </div>
                </div>
              </TableCell>
              <TableCell className="text-center p-0">
                <div className="flex flex-col gap-0">
                  <span>{item.hireDate}</span>
                  <span className="text-sm text-gray-500">{item.CountFromHireDate}</span>
                </div>
              </TableCell>
              <TableCell className="py-3 px-5 text-center">
                <div className="inline-flex items-center gap-1 flex-wrap justify-center flex-col">
                  <Badge variant="secondary" size="table">
                    {item.currentYearVacation.plusDays || 0}일
                  </Badge>
                  <Badge variant="grayish" size="table">
                    {item.currentYearVacation.minusDays || 0}일
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="py-3 px-5 text-center">
                <div className="inline-flex items-center gap-1 flex-wrap justify-center flex-col">
                  <Badge variant="secondary" size="table">
                    {item.carryOverVacation.plusDays || 0}일
                  </Badge>
                  <Badge variant="grayish" size="table">
                    {item.carryOverVacation.minusDays || 0}일
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="py-3 px-5 text-center">
                <div className="inline-flex items-center gap-1 flex-wrap justify-center flex-col">
                  <Badge variant="secondary" size="table">
                    {item.specialVacation.plusDays || 0}일
                  </Badge>
                  <Badge variant="grayish" size="table">
                    {item.specialVacation.minusDays || 0}일
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="py-3 px-5 text-center">
                <div className="inline-flex items-center gap-1 flex-wrap justify-center flex-col">
                  <Badge variant="secondary" size="table">
                    {item.officialVacation.plusDays || 0}일
                  </Badge>
                  <Badge variant="grayish" size="table">
                    {item.officialVacation.minusDays || 0}일
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="py-3 px-5 text-center">
                <div className="inline-flex items-center gap-1 flex-wrap justify-center flex-col">
                  <Badge variant="secondary" size="table">
                    {item.totalVacationDays.plusDays || 0}일
                  </Badge>
                  <Badge variant="grayish" size="table">
                    {item.totalVacationDays.minusDays || 0}일
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="text-center p-0">
                <div className="inline-flex items-center gap-1 flex-wrap justify-center flex-col">
                  <Badge variant="default" size="table">
                    {item.availableVacationDays}일
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="py-3 px-5 text-center">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleOpenGrantDialog(item.id, item.name)}
                >
                  <SettingsIcon className="w-4 h-4"/>
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
      
      {/* 휴가 지급 다이얼로그 */}
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
