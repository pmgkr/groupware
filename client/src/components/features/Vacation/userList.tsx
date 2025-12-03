import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
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
  plusDays?: number; // 추가된 일수 (+20일)
  minusDays?: number; // 차감된 일수 (-20일)
}

export interface UserListItem {
  id: string;
  profile_image: string;
  department: string;
  name: string;
  hireDate: string;
  CountFromHireDate: string;
  availableVacationDays: number; // 사용가능 휴가일수
  totalVacationDays: VacationDayInfo; // 총 휴가일수
  currentYearVacation: VacationDayInfo; // 기본연차
  carryOverVacation: VacationDayInfo; // 이월연차
  specialVacation: VacationDayInfo; // 특별대휴
  officialVacation: VacationDayInfo; // 공가
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
  
  // 데이터 상태
  const [displayData, setDisplayData] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<Array<{ team_id: number; team_name: string }>>([]);

  // 다이얼로그 상태
  const [isGrantDialogOpen, setIsGrantDialogOpen] = useState(false);
  const [selectedUserName, setSelectedUserName] = useState<string>('');

  // 다이얼로그 열기
  const handleOpenGrantDialog = (userName: string) => {
    setSelectedUserName(userName);
    setIsGrantDialogOpen(true);
  };

  // 다이얼로그 닫기
  const handleCloseGrantDialog = () => {
    setIsGrantDialogOpen(false);
    setSelectedUserName('');
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

  // 휴가 목록 로드
  useEffect(() => {
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
          
          // 잔여 휴가 계산 (기본연차 + 이월연차 + 특별대휴 - 공가)
          const totalGiven = (item.v_current || 0) + (item.v_carryover || 0) + (item.v_comp || 0);
          const totalUsed = item.v_official || 0;
          const availableDays = totalGiven - totalUsed;
          
          // 총 휴가일수 (주어진 휴가 - 사용한 휴가)
          const totalPlus = totalGiven;
          const totalMinus = totalUsed;
          
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
            availableVacationDays: availableDays,
            totalVacationDays: {
              plusDays: totalPlus,
              minusDays: totalMinus
            },
            currentYearVacation: {
              plusDays: item.v_current || 0,
              minusDays: 0
            },
            carryOverVacation: {
              plusDays: item.v_carryover || 0,
              minusDays: 0
            },
            specialVacation: {
              plusDays: item.v_comp || 0,
              minusDays: 0
            },
            officialVacation: {
              plusDays: 0,
              minusDays: item.v_official || 0
            }
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

    loadVacationList();
  }, [year, teamIds, userIds, teams]);

  // 배지 렌더링 함수

  // 배지 렌더링 함수
  const renderVacationResultBadge = (info: VacationDayInfo) => {
    return (
      <div className="inline-flex items-center gap-1 flex-wrap justify-center flex-col">
        <Badge 
          variant="default"
          size="table"
        >
          {info.plusDays}일
        </Badge>
      </div>
    );
  };


  const renderVacationBadge = (info: VacationDayInfo) => {
    return (
      <div className="inline-flex items-center gap-1 flex-wrap justify-center flex-col">
        {info.plusDays !== undefined && (
          <Badge 
            variant="outline"
            size="table"
          >
            {info.plusDays}일
          </Badge>
        )}
        {info.minusDays !== undefined && (
          <Badge 
            variant="destructive"
            size="table"
          >
            {info.minusDays}일
          </Badge>
        )}
      </div>
    );
  };


  const renderVacationDetailBadge = (info: VacationDayInfo) => {
    return (
      <div className="inline-flex items-center gap-1 flex-wrap justify-center flex-col">
        {info.plusDays !== undefined && (
          <Badge 
            variant="secondary"
            size="table"
          >
            {info.plusDays}일
          </Badge>
        )}
        {info.minusDays !== undefined && (
          <Badge 
            variant="grayish"
            size="table"
          >
            {info.minusDays}일
          </Badge>
        )}
      </div>
    );
  };

  const renderVacatioOfficialBadge = (info: VacationDayInfo) => {
    return (
      <div className="inline-flex items-center gap-1 flex-wrap justify-center flex-col">
        {info.minusDays !== undefined && (
          <Badge 
            variant="grayish"
            size="table"
          >
            -{info.minusDays}일
          </Badge>
        )}
      </div>
    );
  };

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
                  <p>총 사용휴가에 포함되지 않음</p>
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
            <TableCell className="h-100 text-gray-500 text-center" colSpan={10}>
              로딩 중...
            </TableCell>
          </TableRow>
        ) : displayData.length === 0 ? (
          <TableRow>
            <TableCell className="h-100 text-gray-500 text-center" colSpan={10}>
              휴가 데이터가 없습니다.
            </TableCell>
          </TableRow>
        ) : (
          displayData.map((item) => (
            <TableRow 
              key={item.id} 
              className="[&_td]:text-[13px] cursor-pointer hover:bg-gray-50"
              onClick={(e) => handleRowClick(item.id, e)}
            >
              <TableCell className="text-center p-0">{item.department}</TableCell>
              <TableCell className="p-2.5 px-5 text-center">
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
              <TableCell className="p-2.5 px-5 text-center">
                <div className="flex flex-col gap-1">
                  {renderVacationDetailBadge(item.currentYearVacation)}
                </div>
              </TableCell>
              <TableCell className="p-2.5 px-5 text-center">
                <div className="flex flex-col gap-1">
                  {renderVacationDetailBadge(item.carryOverVacation)}
                </div>
              </TableCell>
              <TableCell className="p-2.5 px-5 text-center">
                <div className="flex flex-col gap-1">
                  {renderVacationDetailBadge(item.specialVacation)}
                </div>
              </TableCell>
              <TableCell className="p-2.5 px-5 text-center">
                <div className="flex flex-col gap-1">
                  {renderVacatioOfficialBadge(item.officialVacation)}
                </div>
              </TableCell>
              <TableCell className="p-2.5 px-5 text-center">
                <div className="flex flex-col gap-1">
                  {renderVacationDetailBadge({ plusDays: item.totalVacationDays.plusDays })}
                  {renderVacationDetailBadge({ minusDays: item.totalVacationDays.minusDays })}
                </div>
              </TableCell>
              <TableCell className="text-center p-0">{renderVacationResultBadge({ plusDays: item.availableVacationDays, minusDays: 0 })}</TableCell>
              <TableCell className="p-2.5 px-5 text-center">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleOpenGrantDialog(item.name)}
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
        userName={selectedUserName}
      />
    </Table>
  );
}
