import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getWeekNumber } from '@/utils/dateHelper';
import { Badge } from '@/components/ui/badge';
import { getWorkTypeColor } from '@/utils/workTypeHelper';
import { adminWlogApi, type LateComerResponse, type LateComerResponseItems } from '@/api/admin/wlog';
import { useAuth } from '@/contexts/AuthContext';

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
  const mapWorkType = (wtype?: string): { label: string; colorKey: string } => {
    const code = (wtype || '').trim().toLowerCase();

    switch (code) {
      case 'half':
        // 반차 (오전/오후 정보는 latecomer 응답에 없으므로 그냥 "반차"로 표기)
        return { label: '반차', colorKey: '오전반차' };
      case 'quarter':
        // 근태상세/휴가 화면과 동일하게 quarter -> 반반차
        return { label: '반반차', colorKey: '오전반반차' };
      case '-':
      case '':
        return { label: '일반근무', colorKey: '일반근무' };
      default:
        // 혹시 모르는 기타 코드(day, official 등)는 원본 그대로 표시, 색상은 기본값
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
          const mapped = mapWorkType(item.wtype);
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
                            className={`inline-flex self-center px-2 py-0.5 text-xs font-semibold rounded-full ${getWorkTypeColor(latecomer.workTypeColorKey)}`}
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

