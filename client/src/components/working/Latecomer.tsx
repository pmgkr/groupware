import { useState, useEffect, useMemo } from 'react';
import dayjs from 'dayjs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useWorkingData } from '@/hooks/useWorkingData';
import { getWeekStartDate } from '@/utils/dateHelper';
import { scheduleApi } from '@/api/calendar';
import { Badge } from '@/components/ui/badge';
import { getWorkTypeColor } from '@/utils/workTypeHelper';

export interface LatecomerItem {
  userId: string;
  userName: string;
  department: string;
  date: string;
  checkInTime: string;
  checkOutTime?: string;
  totalTime: string;
  workType: string;
  hasSchedule: boolean;
}

interface LatecomerProps {
  currentDate: Date;
  selectedTeamIds: number[];
  page?: 'admin' | 'manager';
}

export default function Latecomer({ currentDate, selectedTeamIds, page = 'admin' }: LatecomerProps) {
  const weekStartDate = useMemo(() => getWeekStartDate(currentDate), [currentDate]);
  const { workingList, loading } = useWorkingData({ weekStartDate, selectedTeamIds, page });
  
  const [latecomersByDate, setLatecomersByDate] = useState<Map<string, LatecomerItem[]>>(new Map());
  const [loadingLatecomers, setLoadingLatecomers] = useState(false);

  // 주간 날짜 배열 생성 (월요일 ~ 금요일)
  const weekDates = useMemo(() => {
    const dates: string[] = [];
    for (let i = 0; i < 5; i++) {
      const date = dayjs(weekStartDate).add(i, 'day');
      dates.push(date.format('YYYY-MM-DD'));
    }
    return dates;
  }, [weekStartDate]);

  // 지각자 계산
  useEffect(() => {
    const calculateLatecomers = async () => {
      if (loading || workingList.length === 0) {
        setLatecomersByDate(new Map());
        return;
      }

      setLoadingLatecomers(true);
      const latecomersMap = new Map<string, LatecomerItem[]>();

      try {
        // 사용자별 스케줄을 한 번에 조회 (성능 최적화)
        const userSchedulesMap = new Map<string, any[]>();
        const year = dayjs(weekStartDate).year();
        const month = dayjs(weekStartDate).month() + 1;

        // 모든 사용자의 스케줄을 병렬로 조회
        const schedulePromises = workingList.map(async (item) => {
          try {
            const scheduleResponse = await scheduleApi.getSchedules({
              year,
              month,
              user_id: item.id
            }) as any;

            const schedules = Array.isArray(scheduleResponse?.items) 
              ? scheduleResponse.items 
              : (scheduleResponse?.items?.items || []);

            // 승인된 일정만 필터링
            const activeSchedules = schedules.filter((sch: any) => 
              sch.sch_status === 'Y' || sch.sch_status === 'H'
            );

            userSchedulesMap.set(item.id, activeSchedules);
          } catch (error) {
            console.error(`사용자 ${item.id} 스케줄 조회 실패:`, error);
            userSchedulesMap.set(item.id, []);
          }
        });

        await Promise.all(schedulePromises);

        // 각 날짜별로 지각자 찾기
        for (const date of weekDates) {
          const dateLatecomers: LatecomerItem[] = [];

          for (const item of workingList) {
            // 해당 날짜의 근태 정보 가져오기
            const dayIndex = dayjs(date).diff(dayjs(weekStartDate), 'day');
            let dayInfo: any = null;

            switch (dayIndex) {
              case 0:
                dayInfo = item.monday;
                break;
              case 1:
                dayInfo = item.tuesday;
                break;
              case 2:
                dayInfo = item.wednesday;
                break;
              case 3:
                dayInfo = item.thursday;
                break;
              case 4:
                dayInfo = item.friday;
                break;
              case 5:
                dayInfo = item.saturday;
                break;
              case 6:
                dayInfo = item.sunday;
                break;
            }

            if (!dayInfo) continue;

            // 출근 시간이 있고, 근무 타입이 일반근무인 경우만 체크
            if (dayInfo.startTime && dayInfo.workType === '일반근무') {
              const checkInTime = dayInfo.startTime;
              
              // 시간 파싱 (HH:mm 또는 HH:mm:ss 형식)
              const timeMatch = checkInTime.match(/(\d{2}):(\d{2})/);
              if (!timeMatch) continue;

              const hours = parseInt(timeMatch[1], 10);
              const minutes = parseInt(timeMatch[2], 10);
              
              // 10시 이후 출근인지 확인 (10:00:01부터 지각)
              if (hours > 10 || (hours === 10 && minutes > 0)) {
                // 해당 날짜에 스케줄이 있는지 확인
                const schedules = userSchedulesMap.get(item.id) || [];
                const targetDate = dayjs(date).format('YYYY-MM-DD');
                
                const hasSchedule = schedules.some((sch: any) => {
                  const schStartDate = dayjs(sch.sch_sdate).format('YYYY-MM-DD');
                  const schEndDate = dayjs(sch.sch_edate).format('YYYY-MM-DD');
                  
                  // 해당 날짜가 일정 범위 내에 있는지 확인
                  return targetDate >= schStartDate && targetDate <= schEndDate;
                });

                // 스케줄이 없으면 지각으로 판단
                if (!hasSchedule) {
                  dateLatecomers.push({
                    userId: item.id,
                    userName: item.name,
                    department: item.department,
                    date,
                    checkInTime,
                    checkOutTime: dayInfo.endTime,
                    totalTime: dayInfo.totalTime,
                    workType: dayInfo.workType,
                    hasSchedule: false
                  });
                }
              }
            }
          }

          if (dateLatecomers.length > 0) {
            latecomersMap.set(date, dateLatecomers);
          }
        }
      } catch (error) {
        console.error('지각자 계산 실패:', error);
      } finally {
        setLoadingLatecomers(false);
        setLatecomersByDate(latecomersMap);
      }
    };

    calculateLatecomers();
  }, [workingList, weekDates, weekStartDate, loading]);

  // 날짜 포맷팅
  const formatDate = (dateStr: string) => {
    const date = dayjs(dateStr);
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    return `${date.format('MM/DD')}(${dayNames[date.day()]})`;
  };

  return (
    <div className="mb-5">
      {loading || loadingLatecomers ? (
        <div className="text-center py-8 text-gray-500">
          지각현황 데이터를 불러오는 중...
        </div>
      ) : latecomersByDate.size === 0 ? (
        <div className="text-center py-8 text-gray-500">
          지각자가 없습니다.
        </div>
      ) : (
        <div className="space-y-8">
          {weekDates.map((date) => {
            const latecomers = latecomersByDate.get(date) || [];
            if (latecomers.length === 0) return null;

            return (
              <div key={date} className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-base font-semibold text-gray-900">
                    {formatDate(date)}
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    {latecomers.length}명
                  </Badge>
                </div>
                <Table variant="primary" align="center" className="table-fixed">
                  <TableHeader>
                    <TableRow className="[&_th]:text-[13px] [&_th]:font-medium">
                      <TableHead className="w-[8%] text-center p-0">부서</TableHead>
                      <TableHead className="w-[10%]">이름</TableHead>
                      <TableHead className="w-[15%]">근무유형</TableHead>
                      <TableHead className="w-[13%]">출근시간</TableHead>
                      <TableHead className="w-[13%]">퇴근시간</TableHead>
                      <TableHead className="w-[13%]">총 근무시간</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {latecomers.map((latecomer) => (
                      <TableRow key={`${latecomer.userId}-${date}`} className="[&_td]:text-[13px]">
                        <TableCell className="text-center p-0">{latecomer.department}</TableCell>
                        <TableCell>{latecomer.userName}</TableCell>
                        <TableCell>
                          <span 
                            className={`inline-flex self-center px-2 py-0.5 text-xs font-semibold rounded-full ${getWorkTypeColor(latecomer.workType)}`}
                          >
                            {latecomer.workType}
                          </span>
                        </TableCell>
                        <TableCell className="text-red-600 font-medium">
                          {latecomer.checkInTime}
                        </TableCell>
                        <TableCell>
                          {latecomer.checkOutTime || '-'}
                        </TableCell>
                        <TableCell>
                          {latecomer.totalTime || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

