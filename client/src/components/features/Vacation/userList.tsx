import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlusIcon, MinusIcon, SettingsIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import GrantDialog from './grantDialog';


export interface VacationDayInfo {
  plusDays?: number; // 추가된 일수 (+20일)
  minusDays?: number; // 차감된 일수 (-20일)
}

export interface UserListItem {
  id: string;
  profile_image: string;
  department: string;
  name: string;
  availableVacationDays: number; // 사용가능 휴가일수
  totalVacationDays: VacationDayInfo; // 총 휴가일수
  currentYearVacation: VacationDayInfo; // 당해연차
  carryOverVacation: VacationDayInfo; // 이월연차
  specialVacation: VacationDayInfo; // 특별대휴
  officialVacation: VacationDayInfo; // 공가
}

export interface UserListProps {
  data?: UserListItem[];
}

export default function UserList({ 
  data = []
}: UserListProps) {
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

  // 하드코딩 데이터
  const hardcodedData: UserListItem[] = [
    {
      id: '1',
      profile_image: 'profile.jpg',
      department: 'CCP',
      name: '이연상',
      availableVacationDays: 5,
      totalVacationDays: {
        plusDays: 20,
        minusDays: 20
      },
      currentYearVacation: {
        plusDays: 20,
        minusDays: 20
      },
      carryOverVacation: {
        plusDays: 20,
        minusDays: 20
      },
      specialVacation: {
        plusDays: 20,
        minusDays: 20
      },
      officialVacation: {
        plusDays: 0,
        minusDays: 5
      }
    }
  ];

  // props로 받은 data가 있으면 사용하고, 없으면 하드코딩 데이터 사용
  const displayData = data.length > 0 ? data : hardcodedData;

  // 배지 렌더링 함수
  const renderVacationBadge = (info: VacationDayInfo) => {
    return (
      <div className="inline-flex items-center gap-1 flex-wrap justify-center flex-col">
        {info.plusDays !== undefined && (
          <Badge 
            variant="outline"
            size="table"
          >
            +{info.plusDays}일
          </Badge>
        )}
        {info.minusDays !== undefined && (
          <Badge 
            variant="destructive"
            size="table"
          >
            -{info.minusDays}일
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
            variant="outline"
            size="table"
            className="border-none"
          >
            +{info.plusDays}일
          </Badge>
        )}
        {info.minusDays !== undefined && (
          <Badge 
            variant="destructive"
            size="table"
            className="border-none"
          >
            -{info.minusDays}일
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
          <TableHead className="w-[20%] text-center">이름</TableHead>
          <TableHead className="w-[15%] text-center">총 휴가일수</TableHead>
          <TableHead className="w-[15%] text-center">당해연차</TableHead>
          <TableHead className="w-[15%] text-center">이월연차</TableHead>
          <TableHead className="w-[15%] text-center">특별대휴</TableHead>
          <TableHead className="w-[15%] text-center">공가</TableHead>
          <TableHead className="w-[15%] text-center">휴가관리</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {displayData.length === 0 ? (
          <TableRow>
            <TableCell className="h-100 text-gray-500" colSpan={5}>
              휴가 데이터가 없습니다.
            </TableCell>
          </TableRow>
        ) : (
          displayData.map((item) => (
            <TableRow key={item.id} className="[&_td]:text-[13px]">
              <TableCell className="text-center p-0">{item.department}</TableCell>
              <TableCell className="p-2.5 px-5 text-center">
                <div className="flex items-center gap-1">
                    <img src="https://gbend.cafe24.com/uploads/mypage/migx16tz_ebf4c4a682.webp?t=1764225227211" alt={item.name} className="w-10 h-10 rounded-full" />
                    <div className="inline-flex flex-wrap justify-start align-start text-left flex-col gap-0">
                        <span className="inline-flex px-2 text-base">{item.name}</span>
                        <span className="mt-0 inline-flex px-2 text-sm font-semibold relative text-green-500">
                            <span className="text-gray-700 font-normal">사용가능 휴가:&nbsp;</span>
                            {item.availableVacationDays}일
                        </span>
                    </div>
                </div>
              </TableCell>
              <TableCell className="p-2.5 px-5 text-center">
                <div className="flex flex-col gap-1">
                  {renderVacationBadge(item.totalVacationDays)}
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
