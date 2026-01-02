import { useState, useMemo, useEffect } from 'react';
import { getMyVacation, type MyVacationInfo } from '@/api/common/vacation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { InfoIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getAvatarFallback } from '@/utils';

interface OverviewProps {
  year: string;
}

export default function Overview({ 
  year
}: OverviewProps) {
  const { user } = useAuth();
  const [selectedYearSummary, setSelectedYearSummary] = useState<MyVacationInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // 입사일 포맷팅 및 근속일수 계산
  const hireInfo = useMemo(() => {
    if (!user?.hire_date) return { date: '-', days: 0 };
    const hire = new Date(user.hire_date);
    const dateStr = `${hire.getFullYear()}-${String(hire.getMonth() + 1).padStart(2, "0")}-${String(hire.getDate()).padStart(2, "0")}`;
    
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - hire.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return { date: dateStr, days: diffDays };
  }, [user?.hire_date]);

  // 선택된 연도의 휴가 요약 데이터 가져오기
  useEffect(() => {
    const loadVacationSummary = async () => {
      setLoading(true);
      try {
        const vyear = parseInt(year);
        const response = await getMyVacation(vyear);
        
        // summary 배열에서 선택된 연도 정보 찾기
        const yearSummary = response.summary.find(info => info.va_year === vyear);
        setSelectedYearSummary(yearSummary || null);
      } catch (error) {
        console.error('휴가 요약 정보를 불러오는데 실패했습니다:', error);
        setSelectedYearSummary(null);
      } finally {
        setLoading(false);
      }
    };

    loadVacationSummary();
  }, [year]);

  return (
    <div className="w-full flex flex-col mb-8">
      <Table variant="primary" align="center" className="table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[12%] text-center">이름</TableHead>
            <TableHead className="w-[18%] text-center">입사일</TableHead>
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
            <TableHead className="w-[12%] text-center">총 사용휴가일수</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          <TableRow>
            <TableCell className="text-center">
              <div className="flex items-center gap-2 justify-center">
                <Avatar className="w-8 h-8">
                  {user?.profile_image && (
                    <AvatarImage
                      src={`${import.meta.env.VITE_API_ORIGIN}/uploads/mypage/${user.profile_image}`}
                      alt={user?.user_name}
                    />
                  )}
                  <AvatarFallback>{getAvatarFallback(user?.user_id || '')}</AvatarFallback>
                </Avatar>
                {user?.user_name}
              </div>
            </TableCell>
            <TableCell className="text-center">
              <div className="flex items-center justify-center gap-1">
                <span className="text-sm">{hireInfo.date}</span>
                <span className="text-xs text-gray-500">({hireInfo.days}일)</span>
              </div>
            </TableCell>
            <TableCell className="text-center">
              <Badge variant={Number(selectedYearSummary?.va_current) < 0 ? "lightpink2" : Number(selectedYearSummary?.va_current) === 0 ? "grayish" : "secondary"} size="table">
                {loading ? '-' : `${selectedYearSummary?.va_current || '0'}일`}
              </Badge>
            </TableCell>
            <TableCell className="text-center">
              <Badge variant={Number(selectedYearSummary?.va_carryover) < 0 ? "lightpink2" : Number(selectedYearSummary?.va_carryover) === 0 ? "grayish" : "secondary"} size="table">
                {loading ? '-' : `${selectedYearSummary?.va_carryover || '0'}일`}
              </Badge>
            </TableCell>
            <TableCell className="text-center">
              <Badge variant={Number(selectedYearSummary?.va_comp) < 0 ? "lightpink2" : Number(selectedYearSummary?.va_comp) === 0 ? "grayish" : "secondary"} size="table">
                {loading ? '-' : `${selectedYearSummary?.va_comp || '0'}일`}
              </Badge>
            </TableCell>
            <TableCell className="text-center">
              <Badge variant={Number(selectedYearSummary?.va_long) < 0 ? "lightpink2" : Number(selectedYearSummary?.va_long) === 0 ? "grayish" : "secondary"} size="table">
                {loading ? '-' : `${selectedYearSummary?.va_long || '0'}일`}
              </Badge>
            </TableCell>
            <TableCell className="text-center">
              <Badge variant="outline" size="table">
                {loading ? '-' : `${selectedYearSummary?.va_used || '0'}일`}
              </Badge>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

