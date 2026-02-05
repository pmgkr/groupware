import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getWeekNumber } from '@/utils/dateHelper';
import { Badge } from '@/components/ui/badge';
import { getWorkTypeColor } from '@/utils/workTypeHelper';
import { adminWlogApi, type LateComerResponse, type LateComerResponseItems } from '@/api/admin/wlog';
import { useAuth } from '@/contexts/AuthContext';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

export interface LatecomerItem {
  userId: string;
  userName: string;
  department: string;
  date: string;
  checkInTime: string;
  checkOutTime?: string;
  totalTime: string;
  workType: string;
  workTypeColorKey: string;
  workTypes?: Array<{ type: string }>;
  workKind?: string;
}

interface LatecomerProps {
  currentDate: Date;
  selectedTeamIds: number[];
  page?: 'admin' | 'manager';
}

export default function Latecomer({ currentDate, selectedTeamIds, page = 'admin' }: LatecomerProps) {
  const { user } = useAuth();

  const [latecomersByDate, setLatecomersByDate] = useState<Map<string, LatecomerItem[]>>(new Map());
  const [loadingLatecomers, setLoadingLatecomers] = useState(false);

  // 분(minute)를 "Xh Ym" 형식으로 변환
  const formatWorkMinutes = (wmin: number): string => {
    if (!wmin || wmin <= 0) return '-';
    const hours = Math.floor(wmin / 60);
    const minutes = wmin % 60;
    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    return parts.length > 0 ? parts.join(' ') : '-';
  };

  // wtype 코드 -> 표시 텍스트 및 색상 키 매핑
  const mapWorkType = (wtype?: string, wkind?: string): { label: string; colorKey: string } => {
    const code = (wtype || '').trim().toLowerCase();
    const rawKind = (wkind || '').trim().toLowerCase();

    // wkind 영문 값을 한글로 변환
    let kind = '';
    if (rawKind === 'morning') kind = '오전';
    else if (rawKind === 'afternoon') kind = '오후';
    else kind = rawKind;

    // 변형 코드 포괄 매핑
    if (code.includes('quarter')) {
      const displayKind = kind || '오전'; // 기본값 오전
      return { label: `${displayKind}반반차`, colorKey: `${displayKind}반반차` };
    }
    if (code.includes('half')) {
      const displayKind = kind || '오전'; // 기본값 오전
      return { label: `${displayKind}반차`, colorKey: `${displayKind}반차` };
    }

    switch (code) {
      case '-':
      case '':
        return { label: '일반근무', colorKey: '일반근무' };
      case 'field':
        return { label: '외부근무', colorKey: '외부근무' };
      case 'remote':
        return { label: '재택근무', colorKey: '재택근무' };
      default:
        // 기타 값은 원본 그대로 표시
        return { label: wtype || '-', colorKey: '-' };
    }
  };

  // 지각자 조회
  useEffect(() => {
    const loadLatecomers = async () => {
      setLoadingLatecomers(true);
      const latecomersMap = new Map<string, LatecomerItem[]>();

      try {
        const { year, week } = getWeekNumber(currentDate);

        // 조회 대상 팀 결정
        let teamIdsToQuery: (number | undefined)[] = [];

        if (selectedTeamIds.length > 0) {
          teamIdsToQuery = selectedTeamIds;
        } else if (page === 'admin') {
          // admin + 팀 미선택 시: 전체 팀 대상
          teamIdsToQuery = [undefined];
        } else {
          // manager 페이지: 로그인 사용자의 팀 기준
          const teamId = user?.team_id ?? undefined;
          if (!teamId) {
            setLatecomersByDate(new Map());
            return;
          }
          teamIdsToQuery = [teamId];
        }

        const responses = await Promise.all(
          teamIdsToQuery.map((teamId) =>
            adminWlogApi.getWlogLateComer(teamId, week, year).catch((err) => {
              console.error('지각자 조회 실패:', err);
              return null as LateComerResponse | null;
            })
          )
        );

        const pushItemToMap = (item: LateComerResponseItems & { tdate?: string }) => {
          const tdate = item.tdate || dayjs(item.stime).format('YYYY-MM-DD');
          if (!tdate) return;

          // 근무유형/근무시간 등 계산은 모두 백엔드에서 오므로
          // 프론트에서는 wtype과 wmin을 단순 매핑/포맷만 수행
          const mapped = mapWorkType(item.wtype, item.wkind);
          const displayWorkType = mapped.label;
          const colorKey = mapped.colorKey;

          const list = latecomersMap.get(tdate) ?? [];
          list.push({
            userId: item.user_id,
            userName: item.user_name,
            department: item.team_name,
            date: tdate,
            checkInTime: item.stime,
            checkOutTime: item.etime,
            totalTime: formatWorkMinutes(item.wmin),
            workType: displayWorkType,
            workTypeColorKey: colorKey,
            workKind: item.wkind,
          });
          latecomersMap.set(tdate, list);
        };

        for (const res of responses) {
          if (!res) continue;

          // 1) result: [{ tdate, items: LateComerResponseItems[] }]
          if (Array.isArray(res.result)) {
            const first = res.result[0] as any;

            if (first && Array.isArray(first.items)) {
              // 그룹 형태
              (res.result as any).forEach((group: { tdate: string; items: LateComerResponseItems[] }) => {
                group.items?.forEach((item) => pushItemToMap({ ...item, tdate: group.tdate }));
              });
            } else {
              // 평탄 배열
              (res.result as any).forEach((item: LateComerResponseItems & { tdate?: string }) => {
                pushItemToMap(item);
              });
            }
          }

          // 2) items: LateComerResponseItems[]
          if (Array.isArray(res.items)) {
            (res.items as any).forEach((item: LateComerResponseItems & { tdate?: string }) => {
              pushItemToMap(item);
            });
          }
        }
      } catch (error) {
        console.error('지각자 조회 중 오류:', error);
      } finally {
        setLoadingLatecomers(false);
        setLatecomersByDate(latecomersMap);
      }
    };

    loadLatecomers();
  }, [selectedTeamIds, currentDate, page, user?.team_id]);

  // 날짜 포맷팅
  const formatDate = (dateStr: string) => {
    const date = dayjs(dateStr);
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    return `${date.format('MM/DD')}(${dayNames[date.day()]})`;
  };

  return (
    <div className="mb-5">
      {loadingLatecomers ? (
        <div className="text-center py-8 text-gray-500">
          지각현황 데이터를 불러오는 중...
        </div>
      ) : latecomersByDate.size === 0 ? (
        <div className="text-center py-8 text-gray-500">
          지각자가 없습니다.
        </div>
      ) : (
        <div className="space-y-8">
          {Array.from(latecomersByDate.keys()).sort().map((date) => {
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
                      <TableHead className="w-[10%] max-md:px-1">이름</TableHead>
                      <TableHead className="w-[15%] max-md:px-1">근무유형</TableHead>
                      <TableHead className="w-[13%] max-md:px-1">출근시간</TableHead>
                      <TableHead className="w-[13%] max-md:px-1">퇴근시간</TableHead>
                      <TableHead className="w-[13%] max-md:hidden max-md:p-0">총 근무시간</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {latecomers.map((latecomer) => (
                      <TableRow key={`${latecomer.userId}-${date}`} className="[&_td]:text-[13px]">
                        <TableCell className="text-center p-0">{latecomer.department}</TableCell>
                        <TableCell className="max-md:px-1">{latecomer.userName}</TableCell>
                        <TableCell className="max-md:px-1">
                          {(() => {
                            const hasMultipleWorkTypes = latecomer.workTypes && latecomer.workTypes.length > 1;
                            const latestWorkType = hasMultipleWorkTypes ? latecomer.workTypes![0].type : null;
                            const otherWorkTypes = hasMultipleWorkTypes ? latecomer.workTypes!.slice(1) : [];
                            const displayWorkType = hasMultipleWorkTypes ? latestWorkType! : latecomer.workType;

                            return (
                              <div className="flex items-center gap-1 justify-center">
                                <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getWorkTypeColor(displayWorkType)}`}>
                                  {displayWorkType}
                                </span>
                                {hasMultipleWorkTypes && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Badge variant="grayish" className="px-1 py-0 text-xs cursor-pointer">
                                          +{otherWorkTypes.length}
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <div className="flex flex-col gap-1">
                                          {latecomer.workTypes!.map((wt, idx) => (
                                            <div key={idx} className="text-sm">
                                              {wt.type}
                                            </div>
                                          ))}
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                            );
                          })()}
                        </TableCell>
                        <TableCell className="text-red-600 max-md:px-1">
                          {latecomer.checkInTime}
                        </TableCell>
                        <TableCell className="max-md:px-1">
                          {latecomer.checkOutTime || '-'}
                        </TableCell>
                        <TableCell className="max-md:hidden">
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

