import { useState } from 'react';
import dayjs from 'dayjs';
import { Button } from '@components/ui/button';
import { Checkbox } from '@components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import WorkHoursBar from '@components/ui/WorkHoursBar';
import WorkingDetailDialog from './WorkingDetailDialog';

export interface DayWorkInfo {
  workType: string;
  startTime?: string;
  endTime?: string;
  totalTime: string;
}

export interface WorkingListItem {
  id: string;
  department: string;
  name: string;
  workResult: string;
  weeklyTotal: string;
  monday: DayWorkInfo;
  tuesday: DayWorkInfo;
  wednesday: DayWorkInfo;
  thursday: DayWorkInfo;
  friday: DayWorkInfo;
  saturday: DayWorkInfo;
  sunday: DayWorkInfo;
  note?: string;
}

export interface WorkingListProps {
  data?: WorkingListItem[];
  loading?: boolean;
  weekStartDate?: Date;
}

export default function WorkingList({ 
  data = [], 
  loading = false,
  weekStartDate
}: WorkingListProps) {
  // 체크박스 state
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [checkAll, setCheckAll] = useState(false);
  
  // 상세보기 다이얼로그 state
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);

  // 각 요일의 날짜 계산
  const getDayDate = (dayIndex: number) => {
    if (!weekStartDate) return '';
    return dayjs(weekStartDate).add(dayIndex, 'day').format('MM/DD');
  };

  // 전체 선택
  const handleCheckAll = (checked: boolean) => {
    setCheckAll(checked);
    setCheckedItems(checked ? data.map((item) => item.id) : []);
  };

  // 개별 선택
  const handleCheckItem = (id: string, checked: boolean) => {
    setCheckedItems((prev) => (checked ? [...prev, id] : prev.filter((i) => i !== id)));
  };

  // 상세보기 버튼 클릭
  const handleViewDetail = (userId: string, userName: string) => {
    setSelectedUser({ id: userId, name: userName });
    setIsDetailDialogOpen(true);
  };

  // 다이얼로그 닫기
  const handleCloseDetailDialog = () => {
    setIsDetailDialogOpen(false);
    setSelectedUser(null);
  };

  // 주간 누적 시간을 숫자로 변환 (예: "40h 30m" → 40.5)
  const parseWeeklyTotal = (weeklyTotal: string): number => {
    const match = weeklyTotal.match(/(\d+)h\s*(\d+)m/);
    if (!match) return 0;
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    return hours + minutes / 60;
  };

  // 근무 타입 색상 함수
  const getWorkTypeColor = (workType: string) => {
    switch (workType) {
      case "-": return "bg-gray-50 text-gray-400";
      case "일반근무": return "bg-gray-300 text-gray-900";
      case "연차": return "bg-primary-blue-150 text-primary-blue";
      case "오전반차": return "bg-primary-purple-100 text-primary-pink-500";
      case "오전반반차": return "bg-primary-purple-100 text-primary-purple-500";
      case "오후반차": return "bg-primary-purple-100 text-primary-pink-500";
      case "오후반반차": return "bg-primary-purple-100 text-primary-purple-500";
      case "외부근무": return "bg-primary-yellow-150 text-primary-orange-600";
      case "재택근무": return "bg-gray-300 text-gray-900";
      case "공가": return "bg-red-100 text-red-600";
      case "공휴일": return "bg-red-200 text-red-700";
      default: return "bg-primary-gray-100 text-primary-gray";
    }
  };

  // 요일별 근무 정보 포맷팅
  const formatDayWork = (dayInfo: DayWorkInfo) => {
    // 근무 타입이 없으면 전부 "-"로 표시 (3줄)
    if (dayInfo.workType === '-') {
      return (
        <div className="flex flex-col gap-1">
          <span className="text-gray-400">-</span>
          <span className="text-gray-400">-</span>
          <span className="text-gray-400">-</span>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-1">
        <span className={`inline-flex self-center px-2 py-0.5 text-xs font-semibold rounded-full ${getWorkTypeColor(dayInfo.workType)}`}>
          {dayInfo.workType}
        </span>
        <span className="text-sm font-medium">{dayInfo.totalTime}</span>
        <span className="text-xs text-gray-600">
          {dayInfo.startTime ? `${dayInfo.startTime} - ${dayInfo.endTime ? ` ${dayInfo.endTime}` : '진행중'}` : '-'}
        </span>
      </div>
    );
  };

  return (
    <>
      <Table variant="primary" align="center" className="table-fixed">
        <TableHeader>
          <TableRow className="[&_th]:text-[13px] [&_th]:font-medium">
            <TableHead className="w-[3%] px-0">
              <Checkbox
                id="chk_all"
                className="mx-auto flex size-4 items-center justify-center bg-white leading-none"
                checked={checkAll}
                onCheckedChange={(v) => handleCheckAll(!!v)}
              />
            </TableHead>
            <TableHead className="w-[10%]">이름</TableHead>
            <TableHead className="w-[15%]">주간 누적시간</TableHead>
            <TableHead className="w-[8%]">
              <div className="flex flex-col">
                <span className="text-sm text-gray-800">{getDayDate(0)}(월)</span>
              </div>
            </TableHead>
            <TableHead className="w-[8%]">
              <div className="flex flex-col">
                <span className="text-sm text-gray-800">{getDayDate(1)}(화)</span>
              </div>
            </TableHead>
            <TableHead className="w-[8%]">
              <div className="flex flex-col">
                <span className="text-sm text-gray-800">{getDayDate(2)}(수)</span>
              </div>
            </TableHead>
            <TableHead className="w-[8%]">
              <div className="flex flex-col">
                <span className="text-sm text-gray-800">{getDayDate(3)}(목)</span>
              </div>
            </TableHead>
            <TableHead className="w-[8%]">
              <div className="flex flex-col">
                <span className="text-sm text-gray-800">{getDayDate(4)}(금)</span>
              </div>
            </TableHead>
            <TableHead className="w-[8%]">
              <div className="flex flex-col">
                <span className="text-sm text-gray-800">{getDayDate(5)}(토)</span>
              </div>
            </TableHead>
            <TableHead className="w-[8%]">
              <div className="flex flex-col">
                <span className="text-sm text-gray-800">{getDayDate(6)}(일)</span>
              </div>
            </TableHead>
            <TableHead className="w-[8%]">자세히 보기</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
        {loading ? (
          <TableRow>
            <TableCell className="h-100 text-gray-500" colSpan={11}>
              근태 데이터 불러오는 중
            </TableCell>
          </TableRow>
        ) : data.length === 0 ? (
          <TableRow>
            <TableCell className="h-100 text-gray-500" colSpan={11}>
              근태 데이터가 없습니다.
            </TableCell>
          </TableRow>
        ) : (
            data.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="px-0">
                  <Checkbox
                    className="mx-auto flex size-4 items-center justify-center bg-white leading-none"
                    checked={checkedItems.includes(item.id)}
                    onCheckedChange={(v) => handleCheckItem(item.id, !!v)}
                  />
                </TableCell>
                {/* <TableCell>{item.department}</TableCell> */}
                <TableCell>{item.name}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium">{item.weeklyTotal}</span>
                    <WorkHoursBar hours={parseWeeklyTotal(item.weeklyTotal)} className="w-full" />
                  </div>
                </TableCell>
                <TableCell>{formatDayWork(item.monday)}</TableCell>
                <TableCell>{formatDayWork(item.tuesday)}</TableCell>
                <TableCell>{formatDayWork(item.wednesday)}</TableCell>
                <TableCell>{formatDayWork(item.thursday)}</TableCell>
                <TableCell>{formatDayWork(item.friday)}</TableCell>
                <TableCell>{formatDayWork(item.saturday)}</TableCell>
                <TableCell>{formatDayWork(item.sunday)}</TableCell>
                <TableCell>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleViewDetail(item.id, item.name)}
                  >
                    보기
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      
      {/* 상세보기 다이얼로그 */}
      {selectedUser && weekStartDate && (
        <WorkingDetailDialog
          isOpen={isDetailDialogOpen}
          onClose={handleCloseDetailDialog}
          userId={selectedUser.id}
          userName={selectedUser.name}
          weekStartDate={weekStartDate}
        />
      )}
    </>
  );
}
