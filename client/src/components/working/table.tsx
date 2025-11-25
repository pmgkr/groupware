import React, { useState } from "react";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipIcon } from "@/components/ui/tooltip";
import OvertimeDialog from "./OvertimeDialog";
import OvertimeViewDialog from "./OvertimeViewDialog";
import type { WorkData } from "@/types/working";
import { workingApi } from "@/api/working";
import { buildOvertimeApiParams } from "@/utils/overtimeHelper";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

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

  const getOvertimeButtonVariant = (status: string) => {
    switch (status) {
      case "신청하기": return "default";
      case "승인대기": return "secondary";
      case "승인완료": return "outline";
      case "취소완료": return "destructive";
      default: return "secondary";
    }
  };

  const handleOvertimeClick = (index: number) => {
    setSelectedIndex(index);
    const workData = data[index];
    
    if (workData.overtimeStatus === "신청하기") {
      setDialogOpen(true);
    } else if (workData.overtimeStatus === "승인대기" || workData.overtimeStatus === "승인완료" || workData.overtimeStatus === "취소완료") {
      setViewDialogOpen(true);
    }
  };

  const handleOvertimeSave = async (overtimeData: any) => {
    if (selectedIndex === null) return;
    
    const selectedDay = data[selectedIndex];
    const currentStatus = selectedDay.overtimeStatus;
    
    if (currentStatus === "신청하기" || currentStatus === "취소완료") {
      try {
        // 추가근무 API 파라미터 구성
        const apiParams = buildOvertimeApiParams(selectedDay, overtimeData);
        
        // API 호출
        await workingApi.requestOvertime(apiParams);
        
        // 성공 시 데이터 다시 로드
        await onDataRefresh();
        
        setDialogOpen(false);
        setSelectedIndex(null);
      } catch (error: any) {
        console.error('추가근무 신청 실패:', error);
        const errorMessage = error?.message || error?.response?.data?.message || '알 수 없는 오류가 발생했습니다.';
        alert(`추가근무 신청에 실패했습니다.\n오류: ${errorMessage}`);
      }
    }
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
      throw new Error('추가근무 ID를 찾을 수 없습니다.');
    }
    
    if (selectedDay.overtimeStatus !== "승인대기") {
      throw new Error('승인대기 상태의 추가근무만 취소할 수 있습니다.');
    }
    
    try {
      await workingApi.cancelOvertime(selectedDay.overtimeId);
      
      // 성공 시 데이터 다시 로드
      await onDataRefresh();
      
      setViewDialogOpen(false);
      setSelectedIndex(null);
    } catch (error: any) {
      console.error('추가근무 취소 실패:', error);
      throw error;
    }
  };

  const handleOvertimeReapply = () => {
    // 재신청하기: ViewDialog 닫고 신청 Dialog 열기
    setViewDialogOpen(false);
    setDialogOpen(true);
  };

  return (
    <div className="overflow-x-auto mt-10">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-[13px] font-medium text-gray-500 uppercase tracking-wider">
              {/* 항목 */}
            </th>
            {data.map((row, index) => {
              const getDayColor = (dayOfWeek: string) => {
                // if (dayOfWeek === '토') return 'text-primary-blue-500';
                // if (dayOfWeek === '일') return 'text-[var(--negative-base)]';
                return 'text-gray-800';
              };
              
              return (
                <th key={index} className={`w-[185px] px-6 py-3 text-center text-[13px] font-medium text-gray-500 uppercase tracking-wider ${isToday(row.date) ? 'bg-primary-blue-50' : ''}`}>
                  <div className="flex flex-col">
                    <span className="text-[13px] text-gray-800">{dayjs(row.date).format("MM/DD")}</span>
                    <span className={`text-[13px] font-semibold ${getDayColor(row.dayOfWeek)}`}>{row.dayOfWeek}요일</span>
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
              
              return (
                <td key={index} className={`h-[65px] px-6 py-4 whitespace-nowrap text-center ${isToday(row.date) ? 'bg-primary-blue-50' : ''}`}>
                  <div className="inline-flex items-center gap-1">
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getWorkTypeColor(hasMultipleWorkTypes ? latestWorkType!.type : row.workType)}`}>
                      {hasMultipleWorkTypes ? latestWorkType!.type : row.workType}
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
            <td className="px-6 py-4 whitespace-nowrap text-[13px] font-medium text-gray-900 bg-gray-50">
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
            {data.map((row, index) => (
              <td key={index} className={`px-6 py-4 whitespace-nowrap text-[13px] ${row.workType === '-' ? 'text-gray-400' : 'text-gray-900'} text-center ${isToday(row.date) ? 'bg-primary-blue-50' : ''}`}>
                {row.workType === '-' ? '-' : row.startTime}
              </td>
            ))}
          </tr>
          <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-[13px] font-medium text-gray-900 bg-gray-50">
              퇴근시간
            </td>
            {data.map((row, index) => (
              <td key={index} className={`px-6 py-4 whitespace-nowrap text-[13px] ${row.workType === '-' ? 'text-gray-400' : 'text-gray-900'} text-center ${isToday(row.date) ? 'bg-primary-blue-50' : ''}`}>
                {row.workType === '-' ? '-' : row.endTime}
              </td>
            ))}
          </tr>
          <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-[13px] font-medium text-gray-900 bg-gray-50">
              <div className="flex items-center gap-1">
                <span>기본근무시간</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="inline-flex items-center">
                      <TooltipIcon />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>휴게시간은 근무시간에서 제외 (12:00-13:00)</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </td>
            {data.map((row, index) => (
              <td key={index} className={`px-6 py-4 whitespace-nowrap text-[13px] ${row.workType === '-' ? 'text-gray-400' : 'text-gray-900'} text-center ${isToday(row.date) ? 'bg-primary-blue-50' : ''}`}>
                {row.workType === '-' ? '-' : `${row.basicHours}시간 ${String(row.basicMinutes || 0).padStart(2, '0')}분`}
              </td>
            ))}
          </tr>
          <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-[13px] font-medium text-gray-900 bg-gray-50">
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
            {data.map((row, index) => (
              <td key={index} className={`px-6 py-4 whitespace-nowrap text-[13px] ${row.workType === '-' ? 'text-gray-400 font-normal' : 'text-gray-900 font-bold'} text-center ${isToday(row.date) ? 'bg-primary-blue-50' : ''}`}>
                {row.workType === '-' ? '-' : `${row.totalHours}시간 ${String(row.totalMinutes || 0).padStart(2, '0')}분`}
              </td>
            ))}
          </tr>
          {!readOnly && (
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-[13px] font-medium text-gray-900 bg-gray-50">
                추가근무 신청
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
        selectedIndex={selectedIndex || undefined}
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
