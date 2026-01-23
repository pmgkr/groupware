import React, { useState } from "react";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipIcon } from "@/components/ui/tooltip";
import OvertimeDialog from "./OvertimeDialog";
import OvertimeViewDialog from "./OvertimeViewDialog";
import type { WorkData } from "@/types/working";
import { workingApi } from "@/api/working";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { getWorkTypeColor } from "@/utils/workTypeHelper";
import { useIsMobileViewport } from "@/hooks/useViewport";
import { Icons } from "@components/icons";

// 오늘 날짜 확인 함수
const isToday = (date: string) => {
  return dayjs(date).isSame(dayjs(), 'day');
};

interface TableProps {
  data: WorkData[];
  onDataRefresh: () => Promise<void>;
  readOnly?: boolean;
}

export default function Table({ data, onDataRefresh, readOnly = false }: TableProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);


  const getOvertimeButtonVariant = (status: string) => {
    switch (status) {
      case "신청하기": return "default";
      case "승인대기": return "secondary";
      case "승인완료": return "outline";
      case "보상완료": return "outline";
      case "취소완료": return "destructive";
      default: return "secondary";
    }
  };

  const handleOvertimeClick = (index: number) => {
    setSelectedIndex(index);
    const workData = data[index];
    
    if (workData.overtimeStatus === "신청하기") {
      setDialogOpen(true);
    } else if (
      workData.overtimeStatus === "승인대기" ||
      workData.overtimeStatus === "승인완료" ||
      workData.overtimeStatus === "취소완료" ||
      workData.overtimeStatus === "보상완료"
    ) {
      setViewDialogOpen(true);
    }
  };

  const handleOvertimeSave = async (overtimeData: any) => {
    // OvertimeDialog에서 모든 처리를 완료했으므로, 데이터만 새로고침
    await onDataRefresh();
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedIndex(null);
  };

  const handleViewDialogClose = () => {
    setViewDialogOpen(false);
    setSelectedIndex(null);
  };

  const handleOvertimeCancel = async () => {
    if (selectedIndex === null) return;
    
    const selectedDay = data[selectedIndex];
    
    if (!selectedDay.overtimeId) {
      throw new Error('연장근무 ID를 찾을 수 없습니다.');
    }
    
    if (selectedDay.overtimeStatus !== "승인대기") {
      throw new Error('승인대기 상태의 연장근무만 취소할 수 있습니다.');
    }
    
    try {
      await workingApi.cancelOvertime(selectedDay.overtimeId);
      
      // 성공 시 데이터 다시 로드
      await onDataRefresh();
      
      setViewDialogOpen(false);
      setSelectedIndex(null);
    } catch (error: any) {
      console.error('연장근무 취소 실패:', error);
      throw error;
    }
  };

  const handleOvertimeReapply = () => {
    // 재신청하기: ViewDialog 닫고 신청 Dialog 열기
    setViewDialogOpen(false);
    setDialogOpen(true);
  };

  const isMobile = useIsMobileViewport();

  // 모바일 버전 렌더링 (카드 형식)
  if (isMobile) {
    return (
      <div className="mt-5 -ml-5 w-[calc(100%+var(--spacing)*10)] space-y-4 bg-gray-200 p-5 mb-[-20px]!">
        {data.map((row, index) => {
          const getDayColor = (dayOfWeek: string, holidayName?: string) => {
            if (holidayName) return 'text-red-600';
            if (dayOfWeek === '토') return 'text-blue-600';
            if (dayOfWeek === '일') return 'text-red-600';
            return 'text-gray-800';
          };

          const hasMultipleWorkTypes = row.workTypes && row.workTypes.length > 1;
          const latestWorkType = hasMultipleWorkTypes ? row.workTypes![0] : null;
          const otherWorkTypes = hasMultipleWorkTypes ? row.workTypes!.slice(1) : [];

          const isHolidayOrWeekend =
            row.holidayName != null ||
            row.isHoliday === true ||
            row.dayOfWeek === '토' ||
            row.dayOfWeek === '일' ||
            row.workType === '공휴일';

          let displayWorkType: string =
            hasMultipleWorkTypes ? latestWorkType!.type : row.workType;

          const isApprovedOrPaid =
            row.overtimeStatus === '승인완료' ||
            row.overtimeStatus === '보상완료';

          if (isApprovedOrPaid) {
            displayWorkType = isHolidayOrWeekend ? '휴일근무' : '연장근무';
          }

          return (
            <div
              key={index}
              className={`bg-white border border-gray-300 rounded-md p-4 ${isToday(row.date) ? 'bg-primary-blue-50 border-primary-blue-200' : ''}`}>
              {/* 날짜 헤더 */}
              <div className="flex justify-between items-center mb-1 pb-2 border-b border-gray-200">
                <p className={`text-base font-semibold ${getDayColor(row.dayOfWeek, row.holidayName ?? undefined)}`}>
                  {dayjs(row.date).format("MM월 DD일")} <span>{row.dayOfWeek}요일</span>
                  {row.holidayName && <span className="ml-2">{row.holidayName}</span>}
                </p>
                <span className={`inline-flex px-3 py-1 text-[11px] font-semibold rounded-full ${getWorkTypeColor(displayWorkType)}`}>
                  {displayWorkType}
                </span>
              </div>

              {/* 구분 */}
              <div className="mb-3">
                <div className="flex items-center gap-1 flex-wrap">
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
                            {row.workTypes!.map((wt, idx) => (
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
              </div>

              <div className="flex items-center justify-center gap-x-10 mb-3 bg-gray-100 p-2 rounded-base">
                <div className="align-center flex flex-col justify-center text-center">
                  <p className="text-sm text-gray-500">출근시간</p>
                  <p className={`text-base font-medium ${row.workType === '-' ? 'text-gray-400' : 'text-gray-800'}`}>
                    {row.workType === '-' ? '-' : row.startTime}
                  </p>
                </div>
                <Icons.arrowRightCustom />
                <div className="align-center flex flex-col justify-center text-center">
                  <p className="text-sm text-gray-500">퇴근시간</p>
                  <p className={`text-base font-medium ${row.workType === '-' ? 'text-gray-400' : 'text-gray-800'}`}>
                    {row.workType === '-' ? '-' : row.endTime}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                {/* 기본근무시간 */}
                <div className="flex flex-col align-center text-center">
                  <div className="text-sm text-gray-500 mb-1">기본근무시간</div>
                  <p className={`text-sm ${row.workType === '-' ? 'text-gray-400' : 'text-gray-900'}`}>
                    {row.workType === '-' ? '-' : `${row.basicHours}시간 ${String(row.basicMinutes || 0).padStart(2, '0')}분`}
                  </p>
                </div>

                {/* 연장근무시간 */}
                <div className="flex flex-col align-center text-center">
                  <div className="text-sm text-gray-500 mb-1">연장근무시간</div>
                  <p className={`text-sm ${row.workType === '-' ? 'text-gray-400' : 'text-gray-900'}`}>
                    {row.workType === '-' ? '-' : `${row.overtimeHours}시간 ${String(row.overtimeMinutes || 0).padStart(2, '0')}분`}
                  </p>
                </div>

                {/* 총 근무시간 */}
                <div className="flex flex-col align-center text-center">
                  <div className="text-sm text-gray-500 mb-1">총 근무시간</div>
                  <p className={`text-sm ${row.workType === '-' ? 'text-gray-400 font-normal' : 'text-gray-900 font-bold'}`}>
                    {row.workType === '-' ? '-' : `${row.totalHours}시간 ${String(row.totalMinutes || 0).padStart(2, '0')}분`}
                  </p>
                </div>
              </div>

              {/* 연장근무 신청 */}
              {!readOnly && (
                <div>
                  <Button
                    onClick={() => handleOvertimeClick(index)}
                    disabled={false}
                    variant={getOvertimeButtonVariant(row.overtimeStatus)}
                    size="default"
                    className="w-full">
                    연장근무 {row.overtimeStatus}
                  </Button>
                </div>
              )}
            </div>
          );
        })}

        <OvertimeDialog
          isOpen={dialogOpen}
          onClose={handleDialogClose}
          onSave={handleOvertimeSave}
          selectedDay={selectedIndex !== null ? data[selectedIndex] : undefined}
        />

        <OvertimeViewDialog
          isOpen={viewDialogOpen}
          onClose={handleViewDialogClose}
          onCancel={handleOvertimeCancel}
          onReapply={handleOvertimeReapply}
          selectedDay={selectedIndex !== null ? data[selectedIndex] : undefined}
          selectedIndex={selectedIndex || undefined}
        />
      </div>
    );
  }

  // 데스크톱 버전 렌더링 (기존 테이블 형식)
  return (
    <div className="overflow-x-auto mt-10">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-[13px] font-medium text-gray-500 uppercase">
              {/* 항목 */}
            </th>
            {data.map((row, index) => {
              const getDayColor = (dayOfWeek: string, holidayName?: string) => {
                if (holidayName) return 'text-red-600';
                if (dayOfWeek === '토') return 'text-blue-600';
                if (dayOfWeek === '일') return 'text-red-600';
                return 'text-gray-800';
              };
              
              return (
                <th key={index} className={`w-[185px] px-6 py-3 text-center text-[13px] font-medium text-gray-500 uppercase ${isToday(row.date) ? 'bg-primary-blue-50' : ''}`}>
                  <div className="flex flex-col">
                    <p className={`flex flex-col items-center text-[13px] ${getDayColor(row.dayOfWeek, row.holidayName ?? undefined)}`}>
                      {row.holidayName
                        ? `${dayjs(row.date).format("MM/DD")} ${row.holidayName}`
                        : dayjs(row.date).format("MM/DD")}
                      <span className={`font-semibold ${getDayColor(row.dayOfWeek, row.holidayName ?? undefined)}`}>{row.dayOfWeek}요일</span>
                    </p>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-[13px] font-medium text-gray-900 bg-gray-50">
              구분
            </td>
            {data.map((row, index) => {
              // workTypes 배열이 있고 여러 개인 경우
              const hasMultipleWorkTypes = row.workTypes && row.workTypes.length > 1;
              const latestWorkType = hasMultipleWorkTypes ? row.workTypes![0] : null;
              const otherWorkTypes = hasMultipleWorkTypes ? row.workTypes!.slice(1) : [];
              
              const isHolidayOrWeekend =
                row.holidayName != null ||
                row.isHoliday === true ||
                row.dayOfWeek === '토' ||
                row.dayOfWeek === '일' ||
                row.workType === '공휴일';

              let displayWorkType: string =
                hasMultipleWorkTypes ? latestWorkType!.type : row.workType;

              const isApprovedOrPaid =
                row.overtimeStatus === '승인완료' ||
                row.overtimeStatus === '보상완료';

              if (isApprovedOrPaid) {
                displayWorkType = isHolidayOrWeekend ? '휴일근무' : '연장근무';
              }
              
              return (
                <td key={index} className={`h-[65px] px-6 py-4 whitespace-nowrap text-center ${isToday(row.date) ? 'bg-primary-blue-50' : ''}`}>
                  <div className="inline-flex items-center gap-1 flex-wrap justify-center">
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getWorkTypeColor(displayWorkType)}`}>
                      {displayWorkType}
                    </span>
                    {/* 이벤트가 여러개일 때 이벤트 목록 툴팁 노출 */}
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
                              {row.workTypes!.map((wt, idx) => (
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
                </td>
              );
            })}
          </tr>
          <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-[13px] font-medium text-gray-900 bg-gray-50 max-md:sticky max-md:left-0 max-md:z-10 max-md:px-3 max-md:py-3 max-md:text-[11px]">
              <div className="flex items-center gap-1">
                <span>출근시간</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="inline-flex items-center">
                      <TooltipIcon />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>09:30부터 근무 시간 인정</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </td>
            {data.map((row, index) => {
              return (
                <td key={index} className={`px-6 py-4 whitespace-nowrap text-[13px] ${row.workType === '-' ? 'text-gray-400' : 'text-gray-900'} text-center ${isToday(row.date) ? 'bg-primary-blue-50' : ''} max-md:px-3 max-md:py-3 max-md:text-[11px]`}>
                  {row.workType === '-' ? '-' : row.startTime}
                </td>
              );
            })}
          </tr>
          <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-[13px] font-medium text-gray-900 bg-gray-50 max-md:sticky max-md:left-0 max-md:z-10 max-md:px-3 max-md:py-3 max-md:text-[11px]">
              퇴근시간
            </td>
            {data.map((row, index) => {
              return (
                <td key={index} className={`px-6 py-4 whitespace-nowrap text-[13px] ${row.workType === '-' ? 'text-gray-400' : 'text-gray-900'} text-center ${isToday(row.date) ? 'bg-primary-blue-50' : ''} max-md:px-3 max-md:py-3 max-md:text-[11px]`}>
                  {row.workType === '-' ? '-' : row.endTime}
                </td>
              );
            })}
          </tr>
          <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-[13px] font-medium text-gray-900 bg-gray-50 max-md:sticky max-md:left-0 max-md:z-10 max-md:px-3 max-md:py-3 max-md:text-[11px]">
              <div className="flex items-center gap-1">
                <span>기본근무시간</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="inline-flex items-center">
                      <TooltipIcon />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      평일 휴게시간은 근무시간에서 제외 (12:00-13:00)<br />
                      주말, 공휴일 휴게시간은 주간/야간/휴일 여부와 무관하게 ‘총 근로시간’을 기준으로 결정됨
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </td>
            {data.map((row, index) => (
              <td key={index} className={`px-6 py-4 whitespace-nowrap text-[13px] ${row.workType === '-' ? 'text-gray-400' : 'text-gray-900'} text-center ${isToday(row.date) ? 'bg-primary-blue-50' : ''} max-md:px-3 max-md:py-3 max-md:text-[11px]`}>
                {row.workType === '-' ? '-' : `${row.basicHours}시간 ${String(row.basicMinutes || 0).padStart(2, '0')}분`}
              </td>
            ))}
          </tr>
          <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-[13px] font-medium text-gray-900 bg-gray-50 max-md:sticky max-md:left-0 max-md:z-10 max-md:px-3 max-md:py-3 max-md:text-[11px]">
              <div className="flex items-center gap-1">
                <span>연장근무시간</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="inline-flex items-center">
                      <TooltipIcon />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>식대 사용시 휴게시간 1시간 제외</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </td>
            {data.map((row, index) => (
              <td key={index} className={`px-6 py-4 whitespace-nowrap text-[13px] ${row.workType === '-' ? 'text-gray-400' : 'text-gray-900'} text-center ${isToday(row.date) ? 'bg-primary-blue-50' : ''}`}>
                {row.workType === '-' ? '-' : `${row.overtimeHours}시간 ${String(row.overtimeMinutes || 0).padStart(2, '0')}분`}
              </td>
            ))}
          </tr>
          <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-[13px] font-bold text-gray-900 bg-gray-50">
              총 근무시간
            </td>
            {data.map((row, index) => {
              return (
                <td key={index} className={`px-6 py-4 whitespace-nowrap text-[13px] ${row.workType === '-' ? 'text-gray-400 font-normal' : 'text-gray-900 font-bold'} text-center ${isToday(row.date) ? 'bg-primary-blue-50' : ''}`}>
                  {row.workType === '-' ? '-' : `${row.totalHours}시간 ${String(row.totalMinutes || 0).padStart(2, '0')}분`}
                </td>
              );
            })}
          </tr>
          {!readOnly && (
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-[13px] font-medium text-gray-900 bg-gray-50">
                연장근무 신청
              </td>
              {data.map((row, index) => (
                <td key={index} className={`px-6 py-4 whitespace-nowrap text-[13px] text-gray-900 text-center ${isToday(row.date) ? 'bg-primary-blue-50' : ''}`}>
                  <Button
                    onClick={() => handleOvertimeClick(index)}
                    disabled={false}
                    variant={getOvertimeButtonVariant(row.overtimeStatus)}
                    size="sm"
                    className="text-[13px] w-[80px]">
                    {row.overtimeStatus}
                  </Button>
                </td>
              ))}
            </tr>
          )}
        </tbody>
      </table>
      
      <OvertimeDialog
        isOpen={dialogOpen}
        onClose={handleDialogClose}
        onSave={handleOvertimeSave}
        selectedDay={selectedIndex !== null ? data[selectedIndex] : undefined}
      />
      
      <OvertimeViewDialog
        isOpen={viewDialogOpen}
        onClose={handleViewDialogClose}
        onCancel={handleOvertimeCancel}
        onReapply={handleOvertimeReapply}
        selectedDay={selectedIndex !== null ? data[selectedIndex] : undefined}
        selectedIndex={selectedIndex || undefined}
      />
    </div>
  );
}
