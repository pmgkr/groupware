import React, { useState } from "react";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipIcon } from "@/components/ui/tooltip";
import OvertimeDialog from "./OvertimeDialog";
import OvertimeViewDialog from "./OvertimeViewDialog";

// 오늘 날짜 확인 함수
const isToday = (date: string) => {
  return dayjs(date).isSame(dayjs(), 'day');
};


// 근무 데이터 타입 정의
interface WorkData {
  date: string;
  workType: "종일근무" | "외부근무" | "휴가";
  startTime: string;
  endTime: string;
  basicHours: number;
  overtimeHours: number;
  totalHours: number;
  overtimeStatus: "신청하기" | "승인대기" | "승인완료";
  dayOfWeek: string;
}

interface TableProps {
  data: WorkData[];
  onOvertimeRequest: (index: number) => void;
  onOvertimeCancel?: (index: number) => void;
}

export default function Table({ data, onOvertimeRequest, onOvertimeCancel }: TableProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const getWorkTypeColor = (workType: string) => {
    switch (workType) {
      case "종일근무": return "bg-primary-blue-150 text-primary-blue";
      case "오전반차": return "bg-primary-blue-150 text-primary-blue";
      case "오전반반차": return "bg-primary-blue-150 text-primary-blue";
      case "오후반차": return "bg-primary-blue-150 text-primary-blue";
      case "오후반반차": return "bg-primary-blue-150 text-primary-blue";
      case "외부근무": return "bg-primary-yellow-150 text-primary-orange-600";
      case "휴가": return "bg-primary-gray-100 text-primary-gray";
      default: return "bg-primary-gray-100 text-primary-gray";
    }
  };

  const getOvertimeButtonVariant = (status: string) => {
    switch (status) {
      case "신청하기": return "default";
      case "승인대기": return "secondary";
      case "승인완료": return "outline";
      case "반려됨": return "destructive";
      default: return "secondary";
    }
  };

  const handleOvertimeClick = (index: number) => {
    setSelectedIndex(index);
    const workData = data[index];
    
    if (workData.overtimeStatus === "신청하기") {
      setDialogOpen(true);
    } else if (workData.overtimeStatus === "승인대기" || workData.overtimeStatus === "승인완료") {
      setViewDialogOpen(true);
    }
  };

  const handleOvertimeSave = (overtimeData: any) => {
    if (selectedIndex !== null) {
      onOvertimeRequest(selectedIndex);
    }
    setDialogOpen(false);
    setSelectedIndex(null);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedIndex(null);
  };

  const handleViewDialogClose = () => {
    setViewDialogOpen(false);
    setSelectedIndex(null);
  };

  const handleOvertimeCancel = () => {
    if (selectedIndex !== null && onOvertimeCancel) {
      onOvertimeCancel(selectedIndex);
    }
    setViewDialogOpen(false);
    setSelectedIndex(null);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-base font-medium text-gray-500 uppercase tracking-wider">
              {/* 항목 */}
            </th>
            {data.map((row, index) => {
              const getDayColor = (dayOfWeek: string) => {
                // if (dayOfWeek === '토') return 'text-primary-blue-500';
                // if (dayOfWeek === '일') return 'text-[var(--negative-base)]';
                return 'text-gray-800';
              };
              
              return (
                <th key={index} className={`px-6 py-3 text-center text-base font-medium text-gray-500 uppercase tracking-wider ${isToday(row.date) ? 'bg-primary-blue-100' : ''}`}>
                  <div className="flex flex-col">
                    <span className={`text-base font-semibold ${getDayColor(row.dayOfWeek)}`}>{row.dayOfWeek}요일</span>
                    <span className="text-base text-gray-800">{dayjs(row.date).format("MM-DD")}</span>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-gray-900 bg-gray-50">
              구분
            </td>
            {data.map((row, index) => (
              <td key={index} className={`px-6 py-4 whitespace-nowrap text-center ${isToday(row.date) ? 'bg-primary-blue-100' : ''}`}>
                <span className={`inline-flex px-3 py-1 text-base font-semibold rounded-full ${getWorkTypeColor(row.workType)}`}>
                  {row.workType}
                </span>
              </td>
            ))}
          </tr>
          <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-gray-900 bg-gray-50">
              출근시간
            </td>
            {data.map((row, index) => (
              <td key={index} className={`px-6 py-4 whitespace-nowrap text-base text-gray-900 text-center ${isToday(row.date) ? 'bg-primary-blue-100' : ''}`}>
                {row.startTime}
              </td>
            ))}
          </tr>
          <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-gray-900 bg-gray-50">
              퇴근시간
            </td>
            {data.map((row, index) => (
              <td key={index} className={`px-6 py-4 whitespace-nowrap text-base text-gray-900 text-center ${isToday(row.date) ? 'bg-primary-blue-100' : ''}`}>
                {row.endTime}
              </td>
            ))}
          </tr>
          <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-gray-900 bg-gray-50">
              <div className="flex items-center gap-1">
                <span>기본근무시간</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="inline-flex items-center">
                      <TooltipIcon />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>휴게시간 1시간 제외</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </td>
            {data.map((row, index) => (
              <td key={index} className={`px-6 py-4 whitespace-nowrap text-base text-gray-900 text-center ${isToday(row.date) ? 'bg-primary-blue-100' : ''}`}>
                {row.basicHours}시간
              </td>
            ))}
          </tr>
          <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-gray-900 bg-gray-50">
              <div className="flex items-center gap-1">
                <span>연장근무시간</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="inline-flex items-center">
                      <TooltipIcon />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>휴게시간 1시간 제외</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </td>
            {data.map((row, index) => (
              <td key={index} className={`px-6 py-4 whitespace-nowrap text-base text-gray-900 text-center ${isToday(row.date) ? 'bg-primary-blue-100' : ''}`}>
                {row.overtimeHours}시간
              </td>
            ))}
          </tr>
          <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-base font-bold text-gray-900 bg-gray-50">
              총 근무시간
            </td>
            {data.map((row, index) => (
              <td key={index} className={`px-6 py-4 whitespace-nowrap text-base font-bold text-gray-900 text-center ${isToday(row.date) ? 'bg-primary-blue-100' : ''}`}>
                {row.totalHours}시간
              </td>
            ))}
          </tr>
          <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-gray-900 bg-gray-50">
              추가근무 신청
            </td>
            {data.map((row, index) => (
              <td key={index} className={`px-6 py-4 whitespace-nowrap text-base text-gray-900 text-center ${isToday(row.date) ? 'bg-primary-blue-100' : ''}`}>
                <Button
                  onClick={() => handleOvertimeClick(index)}
                  disabled={false}
                  variant={getOvertimeButtonVariant(row.overtimeStatus)}
                  size="default"
                  className="text-base">
                  {row.overtimeStatus}
                </Button>
              </td>
            ))}
          </tr>
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
        selectedDay={selectedIndex !== null ? data[selectedIndex] : undefined}
        selectedIndex={selectedIndex || undefined}
      />
    </div>
  );
}
