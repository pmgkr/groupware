import React, { useState } from "react";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import OvertimeDialog from "./OvertimeDialog";
import OvertimeViewDialog from "./OvertimeViewDialog";


// 근무 데이터 타입 정의
interface WorkData {
  date: string;
  workType: "정상근무" | "외부근무" | "휴가";
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
      case "정상근무": return "bg-primary-blue-150 text-primary-blue";
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
              항목
            </th>
            {data.map((row, index) => (
              <th key={index} className="px-6 py-3 text-center text-base font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex flex-col">
                  <span className="text-base font-semibold text-gray-700">{row.dayOfWeek}</span>
                  <span className="text-base text-gray-500">{dayjs(row.date).format("MM-DD")}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-gray-900 bg-gray-50">
              구분
            </td>
            {data.map((row, index) => (
              <td key={index} className="px-6 py-4 whitespace-nowrap text-center">
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
              <td key={index} className="px-6 py-4 whitespace-nowrap text-base text-gray-900 text-center">
                {row.startTime}
              </td>
            ))}
          </tr>
          <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-gray-900 bg-gray-50">
              퇴근시간
            </td>
            {data.map((row, index) => (
              <td key={index} className="px-6 py-4 whitespace-nowrap text-base text-gray-900 text-center">
                {row.endTime}
              </td>
            ))}
          </tr>
          <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-gray-900 bg-gray-50">
              기본근무시간<br/><small>휴게시간 1시간 제외</small>
            </td>
            {data.map((row, index) => (
              <td key={index} className="px-6 py-4 whitespace-nowrap text-base text-gray-900 text-center">
                {row.basicHours}시간
              </td>
            ))}
          </tr>
          <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-gray-900 bg-gray-50">
              연장근무시간<br/><small>휴게시간 1시간 제외</small>
            </td>
            {data.map((row, index) => (
              <td key={index} className="px-6 py-4 whitespace-nowrap text-base text-gray-900 text-center">
                {row.overtimeHours}시간
              </td>
            ))}
          </tr>
          <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-gray-900 bg-gray-50">
              총 근무시간
            </td>
            {data.map((row, index) => (
              <td key={index} className="px-6 py-4 whitespace-nowrap text-base font-medium text-gray-900 text-center">
                {row.totalHours}시간
              </td>
            ))}
          </tr>
          <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-gray-900 bg-gray-50">
              추가근무 신청
            </td>
            {data.map((row, index) => (
              <td key={index} className="px-6 py-4 whitespace-nowrap text-base text-gray-900 text-center">
                <Button
                  onClick={() => handleOvertimeClick(index)}
                  disabled={row.overtimeStatus === "승인완료"}
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
