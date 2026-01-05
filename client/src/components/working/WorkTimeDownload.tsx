import { useMemo, useState } from 'react';
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
import type { WorkingListItem } from './list';
import { useAuth } from '@/contexts/AuthContext';
import { getWeekStartDate, getWeekNumber } from '@/utils/dateHelper';
import { convertApiDataToWorkData } from '@/services/workingDataConverter';
import { getTeams } from '@/api/admin/teams';
import { getTeams as getManagerTeams } from '@/api/manager/teams';
import { workingApi } from '@/api/working';
import * as XLSX from 'xlsx-js-style';

const parseDayKey = (key: string) => {
  const [y, m, d] = key.split('-').map((v) => Number(v));
  return new Date(y, (m || 1) - 1, d || 1);
};

interface WorkTimeDownloadProps {
  currentDate: Date;
  page?: 'manager' | 'admin';
  workingList?: WorkingListItem[];
  selectedTeamIds: number[];
}

export default function WorkTimeDownload({
  currentDate,
  page,
  workingList = [],
  selectedTeamIds,
}: WorkTimeDownloadProps) {
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

  const resolveTeamIdsToQuery = async () => {
    if (!page) return [null]; // 사용자(working) 페이지: 팀 구분 없이 단일 조회
    if (selectedTeamIds.length > 0) return selectedTeamIds;
    if (page === 'admin') return [null];

    try {
      const myTeams = await getManagerTeams({});
      const ids = myTeams.map((t: any) => t.team_id).filter((id: any) => id != null);
      if (ids.length > 0) return ids;
    } catch {
      // ignore
    }

    return user?.team_id ? [user.team_id] : [];
  };

  const resolveTeamNameMap = async () => {
    if (!page) return new Map<number, string>();
    const map = new Map<number, string>();
    try {
      const teamList = page === 'admin' ? await getTeams({}) : await getManagerTeams({});
      teamList.forEach((t: any) => {
        if (t.team_id != null && t.team_name) {
          map.set(Number(t.team_id), t.team_name);
        }
      });
    } catch {
      // ignore
    }
    return map;
  };

  const fetchWeekData = async (teamId: number | null, weekStart: Date) => {
    const { year, week } = getWeekNumber(weekStart);

    if (page === 'admin') {
      const adminResp = await (await import('@/api/manager/working')).managerWorkingApi.getAdminWorkLogsWeek({
        team_id: teamId ?? null,
        weekno: week,
        yearno: year,
      });
      return {
        wlog: adminResp.wlog || [],
        vacation: adminResp.vacation || [],
        event: adminResp.event || [],
      };
    }

    if (page === 'manager') {
      const resp = await (await import('@/api/manager/working')).managerWorkingApi.getManagerWorkLogsWeek({
        team_id: teamId ?? user?.team_id ?? 0,
        weekno: week,
        yearno: year,
      });
      return {
        wlog: resp.wlog || [],
        vacation: resp.vacation || [],
        event: resp.event || [],
      };
    }

    // 기본(사용자 /working) 페이지: 본인 주간 데이터
    const userResp = await workingApi.getWlogWeek({ weekno: week, yearno: year });
    return {
      wlog: userResp.wlog || [],
      vacation: userResp.vacation || [],
      event: userResp.event || [],
    };
  };

  const buildMonthSheetRows = async (monthIndex: number): Promise<{ rows: (string | number)[][]; dayKeys: string[] }> => {
    const year = currentDate.getFullYear();
    const monthStart = new Date(year, monthIndex, 1);
    const monthEnd = new Date(year, monthIndex + 1, 0);

    const teamIdsToQuery = await resolveTeamIdsToQuery();
    if (teamIdsToQuery.length === 0) return { rows: [['팀 정보가 없습니다.']], dayKeys: [] };

    const teamNameMap = await resolveTeamNameMap();

    type UserAccum = {
      id: string;
      name: string;
      teamId?: number | null;
      department?: string;
      cells: Record<string, string>;
    };
    const userMap = new Map<string, UserAccum>();

    // 화면 순서 유지용 기본 시드
    workingList.forEach((item) => {
      userMap.set(item.id, {
        id: item.id,
        name: item.name,
        department: item.department,
        teamId: undefined,
        cells: {},
      });
    });

    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const dayKeys = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    });

    for (const teamId of teamIdsToQuery) {
      let weekStart = getWeekStartDate(monthStart);
      while (weekStart <= monthEnd) {
        const weekData = await fetchWeekData(teamId, weekStart);

        const uniqueUsers = Array.from(
          new Map(
            [...(weekData.wlog || []), ...(weekData.vacation || []), ...(weekData.event || [])].map((w: any) => [
              w.user_id,
              { user_id: w.user_id, user_name: w.user_nm, team_id: w.team_id ?? teamId },
            ])
          ).values()
        );

        for (const userInfo of uniqueUsers) {
          const memberWlogs = (weekData.wlog || []).filter((w: any) => w.user_id === userInfo.user_id);
          const memberVacations = (weekData.vacation || []).filter((v: any) => v.user_id === userInfo.user_id);
          const memberEvents = (weekData.event || []).filter((e: any) => e.user_id === userInfo.user_id);

          const weekWorkData = await convertApiDataToWorkData(
            memberWlogs,
            [...memberVacations, ...memberEvents],
            [],
            new Date(weekStart),
            userInfo.user_id
          );

          weekWorkData
            .filter((d) => {
              const dDate = new Date(d.date);
              return dDate.getMonth() === monthIndex && dDate.getFullYear() === year;
            })
            .forEach((d) => {
              const accum =
                userMap.get(userInfo.user_id) || {
                  id: userInfo.user_id,
                  name: userInfo.user_name || userInfo.user_id,
                  teamId: userInfo.team_id ?? teamId,
                  department:
                    userInfo.team_id != null
                      ? teamNameMap.get(Number(userInfo.team_id)) || String(userInfo.team_id)
                      : undefined,
                  cells: {} as Record<string, string>,
                };

              const dept =
                accum.teamId != null
                  ? teamNameMap.get(Number(accum.teamId)) || String(accum.teamId)
                  : accum.department || '-';

              const timeRange =
                d.startTime && d.startTime !== '-'
                  ? `${d.startTime}${d.endTime && d.endTime !== '-' ? `-${d.endTime}` : ' - 진행중'}`
                  : '';
              const totalStr =
                d.totalHours != null && d.totalMinutes != null
                  ? `${d.totalHours}h ${d.totalMinutes}m`
                  : '';
              const holidayLabel = d.holidayName ? `[${d.holidayName}]` : '';

              const workTypeLine = d.holidayName
                ? holidayLabel
                : d.workType && d.workType !== '-'
                  ? d.workType
                  : '-';
              const timeLine = timeRange
                ? `${timeRange}${totalStr ? `(${totalStr})` : ''}`
                : totalStr;

              const cellParts = [workTypeLine, timeLine, d.holidayName ? holidayLabel : '']
                .map((v) => v || '')
                .filter((v) => v.trim() !== '')
                .join('\n');

              accum.department = dept;
              accum.cells[d.date] = cellParts || '-';

              userMap.set(userInfo.user_id, accum);
            });
        }

        const nextWeek = new Date(weekStart);
        nextWeek.setDate(weekStart.getDate() + 7);
        weekStart = nextWeek;
      }
    }

    const rows: (string | number)[][] = [];
    rows.push(['월', `${year}-${String(monthIndex + 1).padStart(2, '0')}`]);
    rows.push(['생성 시각', new Date().toLocaleString()]);
    rows.push([]);

    const dayHeaders = dayKeys.map((k) => {
      const d = parseDayKey(k);
      const dow = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${mm}-${dd}(${dow})`;
    });
    rows.push(['부서', '이름', ...dayHeaders]);

    if (userMap.size === 0) {
      rows.push(['데이터가 없습니다.']);
      return { rows, dayKeys };
    }

    const screenOrder = workingList.map((w) => w.id);
    const sortedUsers = Array.from(userMap.values()).sort((a, b) => {
      const idxA = screenOrder.indexOf(a.id);
      const idxB = screenOrder.indexOf(b.id);
      if (idxA !== -1 || idxB !== -1) {
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
      }
      const depA = (a.department || '').toString();
      const depB = (b.department || '').toString();
      if (depA !== depB) return depA.localeCompare(depB, 'ko');
      return a.name.localeCompare(b.name, 'ko');
    });

    sortedUsers.forEach((u) => {
      const row = [
        u.department || '-',
        u.name || '-',
        ...dayKeys.map((k) => u.cells[k] || '-'),
      ];
      rows.push(row);
    });

    return { rows, dayKeys };
  };

  const applySheetStyles = (worksheet: XLSX.WorkSheet, dayKeys: string[]) => {
    const encode = XLSX.utils.encode_cell;
    const headerRow = 3; // 0-based
    const range = worksheet['!ref'] ? XLSX.utils.decode_range(worksheet['!ref']) : null;
    if (!range) return;

    // 컬럼별 요일/색상 계산 (헤더 문자열 기준)
    const colColors: Record<number, string | null> = {};
    for (let c = 2; c <= range.e.c; c++) {
      const cell = worksheet[encode({ r: headerRow, c })];
      const text = cell?.v ? String(cell.v) : '';
      const dowChar = text.match(/\((.)\)/)?.[1];
      const dowIndex = ['일', '월', '화', '수', '목', '금', '토'].indexOf(dowChar || '');
      const fontColor = dowIndex === 0 ? 'FFFF3B30' : dowIndex === 6 ? 'FF0A84FF' : null;
      colColors[c] = fontColor;

      if (cell) {
        cell.s = {
          ...(cell.s || {}),
          font: { ...(cell.s?.font || {}), bold: true, sz: 9, ...(fontColor ? { color: { rgb: fontColor } } : {}) },
          alignment: { ...(cell.s?.alignment || {}), wrapText: true, vertical: 'top' },
        };
      }
    }

    for (let r = headerRow + 1; r <= range.e.r; r++) {
      for (let c = 2; c <= range.e.c; c++) {
        const cell = worksheet[encode({ r, c })];
        if (!cell) continue;

        let fontColor: string | null = null;
        if (typeof cell.v === 'string' && cell.v.includes('[')) {
          fontColor = 'FFFF3B30'; // 공휴일
        } else {
          fontColor = colColors[c] || null; // 요일 색상
        }

        cell.s = {
          ...(cell.s || {}),
          font: {
            ...(cell.s?.font || {}),
            sz: 9,
            ...(fontColor ? { color: { rgb: fontColor } } : {}),
          },
          alignment: { ...(cell.s?.alignment || {}), wrapText: true, vertical: 'top' },
        };
      }
    }

    // 컬럼 너비 설정: 부서/이름 조금 넓게, 날짜 컬럼 균일 적용
    const cols = [
      { wch: 14 }, // 부서
      { wch: 12 }, // 이름
      ...dayKeys.map(() => ({ wch: 16 })), // 날짜들
    ];
    worksheet['!cols'] = cols;

    // 행 높이 설정: 헤더 아래 데이터 행은 여유 있게
    const heightRange = worksheet['!ref'] ? XLSX.utils.decode_range(worksheet['!ref']) : null;
    if (heightRange) {
      const rows: XLSX.RowInfo[] = [];
      for (let r = 0; r <= heightRange.e.r; r++) {
        if (r <= headerRow) {
          rows.push({ hpt: 18 });
        } else {
          rows.push({ hpt: 30 });
        }
      }
      worksheet['!rows'] = rows;
    }
  };

  const downloadExcel = async () => {
    if (selectedMonths.length === 0) return;
    setIsDownloading(true);

    const workbook = XLSX.utils.book_new();
    for (const monthLabel of selectedMonths) {
      const monthIndex = Math.max(0, Math.min(11, parseInt(monthLabel.replace('월', ''), 10) - 1));
      const { rows, dayKeys } = await buildMonthSheetRows(monthIndex);
      const worksheet = XLSX.utils.aoa_to_sheet(rows);
      applySheetStyles(worksheet, dayKeys);
      XLSX.utils.book_append_sheet(workbook, worksheet, monthLabel);
    }

    XLSX.writeFile(workbook, `근무_${selectedMonths.join('_')}.xlsx`);
    setExcelDialogOpen(false);
    setSelectedMonths([]);
    setIsDownloading(false);
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
          <DialogTitle>근태 정보 Excel 다운로드</DialogTitle>
          <DialogDescription>
            선택한 월(1일~말일)의 근태 데이터가 각 시트별로 저장됩니다.
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

