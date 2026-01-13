import { useState, useMemo } from 'react';
import { Button } from '@components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@components/ui/dialog';
import { RadioButton, RadioGroup } from '@components/ui/radioButton';
import dayjs from 'dayjs';
import { getWeekNumber, getWeekStartDate } from '@/utils/dateHelper';
import { adminWlogApi, type LateComerResponse, type LateComerResponseItems } from '@/api/admin/wlog';
import { useAuth } from '@/contexts/AuthContext';
import * as XLSX from 'xlsx-js-style';
import type { LatecomerItem } from './Latecomer';

interface LateTimeDownloadProps {
  currentDate: Date;
  page?: 'manager' | 'admin';
  selectedTeamIds: number[];
}

export default function LateTimeDownload({
  currentDate,
  page,
  selectedTeamIds,
}: LateTimeDownloadProps) {
  const { user } = useAuth();
  const [isExcelDialogOpen, setExcelDialogOpen] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);

  const monthOptions = useMemo(() => Array.from({ length: 12 }, (_, idx) => `${idx + 1}월`), []);

  const toggleMonthSelection = (monthLabel: string) => {
    setSelectedMonths((prev) => {
      const alreadySelected = prev.includes(monthLabel);
      if (alreadySelected) {
        return prev.filter((m) => m !== monthLabel);
      }
      return [...prev, monthLabel];
    });
  };

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

  // wtype 코드 -> 표시 텍스트 매핑
  const mapWorkType = (wtype?: string, wkind?: string): string => {
    const code = (wtype || '').trim().toLowerCase();
    const rawKind = (wkind || '').trim().toLowerCase();

    // wkind 영문 값을 한글로 변환
    let kind = '';
    if (rawKind === 'morning') kind = '오전';
    else if (rawKind === 'afternoon') kind = '오후';
    else kind = rawKind;

    // 변형 코드 포괄 매핑
    if (code.includes('quarter')) {
      const displayKind = kind || '오전';
      return `${displayKind}반반차`;
    }
    if (code.includes('half')) {
      const displayKind = kind || '오전';
      return `${displayKind}반차`;
    }

    switch (code) {
      case '-':
      case '':
        return '일반근무';
      default:
        return wtype || '-';
    }
  };

  // 지각 데이터 가져오기 (특정 주차)
  const fetchLatecomerDataForWeek = async (
    weekStart: Date,
    teamIdsToQuery: (number | undefined)[]
  ): Promise<Map<string, LatecomerItem[]>> => {
    const latecomersMap = new Map<string, LatecomerItem[]>();
    const { year, week } = getWeekNumber(weekStart);

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

      const displayWorkType = mapWorkType(item.wtype, item.wkind);

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
        workTypeColorKey: displayWorkType,
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

    return latecomersMap;
  };

  // 조회 대상 팀 결정
  const resolveTeamIdsToQuery = (): (number | undefined)[] => {
    if (selectedTeamIds.length > 0) {
      return selectedTeamIds;
    } else if (page === 'admin') {
      return [undefined];
    } else {
      const teamId = user?.team_id ?? undefined;
      if (!teamId) {
        return [];
      }
      return [teamId];
    }
  };

  // 월별 지각 데이터 가져오기
  const fetchLatecomerDataForMonth = async (monthIndex: number): Promise<Map<string, LatecomerItem[]>> => {
    const year = currentDate.getFullYear();
    const monthStart = new Date(year, monthIndex, 1);
    const monthEnd = new Date(year, monthIndex + 1, 0);

    const teamIdsToQuery = resolveTeamIdsToQuery();
    if (teamIdsToQuery.length === 0) {
      return new Map();
    }

    const allLatecomersMap = new Map<string, LatecomerItem[]>();

    // 해당 월에 포함된 모든 주차 순회
    let weekStart = getWeekStartDate(monthStart);
    while (weekStart <= monthEnd) {
      const weekData = await fetchLatecomerDataForWeek(weekStart, teamIdsToQuery);

      // 주차 데이터를 전체 맵에 병합
      for (const [date, latecomers] of weekData.entries()) {
        const dateObj = dayjs(date);
        // 해당 월에 포함된 날짜만 추가
        if (dateObj.month() === monthIndex && dateObj.year() === year) {
          const existing = allLatecomersMap.get(date) || [];
          allLatecomersMap.set(date, [...existing, ...latecomers]);
        }
      }

      // 다음 주로 이동
      const nextWeek = new Date(weekStart);
      nextWeek.setDate(weekStart.getDate() + 7);
      weekStart = nextWeek;
    }

    return allLatecomersMap;
  };

  // 날짜 포맷팅
  const formatDate = (dateStr: string) => {
    const date = dayjs(dateStr);
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    return `${date.format('YYYY-MM-DD')} (${dayNames[date.day()]})`;
  };

  // 시트 생성
  const buildMonthSheet = (latecomersByDate: Map<string, LatecomerItem[]>, monthLabel: string) => {
    const rows: (string | number)[][] = [];

    // 헤더
    rows.push([`지각 현황 - ${monthLabel}`]);
    rows.push(['생성 시각', new Date().toLocaleString('ko-KR')]);
    rows.push([]);
    rows.push(['날짜', '부서', '이름', '근무유형', '출근시간', '퇴근시간', '총 근무시간']);

    // 데이터
    const sortedDates = Array.from(latecomersByDate.keys()).sort();
    for (const date of sortedDates) {
      const latecomers = latecomersByDate.get(date) || [];
      for (const latecomer of latecomers) {
        rows.push([
          formatDate(date),
          latecomer.department,
          latecomer.userName,
          latecomer.workType,
          latecomer.checkInTime,
          latecomer.checkOutTime || '-',
          latecomer.totalTime || '-',
        ]);
      }
    }

    const worksheet = XLSX.utils.aoa_to_sheet(rows);

    // 스타일 적용
    const encode = XLSX.utils.encode_cell;
    const range = worksheet['!ref'] ? XLSX.utils.decode_range(worksheet['!ref']) : null;

    if (range) {
      // 타이틀 행 스타일
      for (let c = 0; c <= range.e.c; c++) {
        const cell = worksheet[encode({ r: 0, c })];
        if (cell) {
          cell.s = {
            font: { bold: true, sz: 14 },
            alignment: { horizontal: 'center', vertical: 'center' },
          };
        }
      }

      // 헤더 행 스타일 (4번째 행, 0-based index 3)
      for (let c = 0; c <= range.e.c; c++) {
        const cell = worksheet[encode({ r: 3, c })];
        if (cell) {
          cell.s = {
            font: { bold: true, sz: 11 },
            alignment: { horizontal: 'center', vertical: 'center' },
            fill: { fgColor: { rgb: 'FFE0E0E0' } },
          };
        }
      }

      // 출근시간 컬럼 (5번째 컬럼, 0-based index 4) 빨간색
      for (let r = 4; r <= range.e.r; r++) {
        const cell = worksheet[encode({ r, c: 4 })];
        if (cell && typeof cell.v === 'string') {
          cell.s = {
            ...(cell.s || {}),
            font: { ...(cell.s?.font || {}), color: { rgb: 'FFFF0000' } },
          };
        }
      }
    }

    // 컬럼 너비 설정
    worksheet['!cols'] = [
      { wch: 18 }, // 날짜
      { wch: 15 }, // 부서
      { wch: 12 }, // 이름
      { wch: 15 }, // 근무유형
      { wch: 15 }, // 출근시간
      { wch: 15 }, // 퇴근시간
      { wch: 15 }, // 총 근무시간
    ];

    // 행 높이 설정
    if (range) {
      const rowHeights: XLSX.RowInfo[] = [];
      for (let r = 0; r <= range.e.r; r++) {
        if (r === 0) {
          rowHeights.push({ hpt: 25 }); // 타이틀
        } else if (r === 3) {
          rowHeights.push({ hpt: 20 }); // 헤더
        } else {
          rowHeights.push({ hpt: 18 }); // 데이터
        }
      }
      worksheet['!rows'] = rowHeights;
    }

    // 타이틀 병합
    if (range) {
      worksheet['!merges'] = [
        {
          s: { r: 0, c: 0 },
          e: { r: 0, c: range.e.c },
        },
      ];
    }

    return worksheet;
  };

  // 엑셀 다운로드
  const downloadExcel = async () => {
    if (selectedMonths.length === 0) return;
    setIsDownloading(true);

    try {
      const workbook = XLSX.utils.book_new();

      for (const monthLabel of selectedMonths) {
        const monthIndex = Math.max(0, Math.min(11, parseInt(monthLabel.replace('월', ''), 10) - 1));
        const latecomersByDate = await fetchLatecomerDataForMonth(monthIndex);

        if (latecomersByDate.size === 0) {
          // 데이터가 없는 월도 빈 시트로 추가
          const emptyRows: (string | number)[][] = [
            [`지각 현황 - ${monthLabel}`],
            ['생성 시각', new Date().toLocaleString('ko-KR')],
            [],
            ['날짜', '부서', '이름', '근무유형', '출근시간', '퇴근시간', '총 근무시간'],
            ['데이터가 없습니다.'],
          ];
          const worksheet = XLSX.utils.aoa_to_sheet(emptyRows);
          XLSX.utils.book_append_sheet(workbook, worksheet, monthLabel);
          continue;
        }

        const worksheet = buildMonthSheet(latecomersByDate, monthLabel);
        XLSX.utils.book_append_sheet(workbook, worksheet, monthLabel);
      }

      // 파일명 생성
      const filename = `지각현황_${selectedMonths.join('_')}.xlsx`;

      XLSX.writeFile(workbook, filename);
      setExcelDialogOpen(false);
      setSelectedMonths([]);
    } catch (error) {
      console.error('엑셀 다운로드 중 오류:', error);
      alert('엑셀 다운로드에 실패했습니다.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog
      open={isExcelDialogOpen}
      onOpenChange={(open) => {
        setExcelDialogOpen(open);
        if (!open) setSelectedMonths([]);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          Excel 다운로드
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>지각 현황 Excel 다운로드</DialogTitle>
          <DialogDescription>
            선택한 월(1일~말일)의 지각 데이터가 각 시트별로 저장됩니다.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-4 gap-2">
          {monthOptions.map((month) => {
            const isSelected = selectedMonths.includes(month);
            return (
              <RadioGroup key={month} value={isSelected ? month : ''}>
                <RadioButton
                  value={month}
                  label={month}
                  variant="dynamic"
                  size="md"
                  iconHide
                  className="justify-center flex-1 w-full"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleMonthSelection(month);
                  }}
                />
              </RadioGroup>
            );
          })}
        </div>
        <div className="flex justify-end items-center pt-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setExcelDialogOpen(false)}>
              취소
            </Button>
            <Button size="sm" onClick={downloadExcel} disabled={selectedMonths.length === 0 || isDownloading}>
              {isDownloading ? '다운로드 중...' : '다운로드하기'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

