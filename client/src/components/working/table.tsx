import React from "react";
import dayjs from "dayjs";
import { Button } from "../ui/button";

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
}

interface TableProps {
  data: WorkData[];
  onOvertimeRequest: (index: number) => void;
}

export default function Table({ data, onOvertimeRequest }: TableProps) {
  const getWorkTypeColor = (workType: string) => {
    switch (workType) {
      case "정상근무": return "bg-blue-100 text-blue-800";
      case "외부근무": return "bg-green-100 text-green-800";
      case "휴가": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
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

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              항목
            </th>
            {data.map((row, index) => (
              <th key={index} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                {dayjs(row.date).format("MM-DD")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">
              구분
            </td>
            {data.map((row, index) => (
              <td key={index} className="px-6 py-4 whitespace-nowrap text-center">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getWorkTypeColor(row.workType)}`}>
                  {row.workType}
                </span>
              </td>
            ))}
          </tr>
          <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">
              출근시간
            </td>
            {data.map((row, index) => (
              <td key={index} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                {row.startTime}
              </td>
            ))}
          </tr>
          <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">
              퇴근시간
            </td>
            {data.map((row, index) => (
              <td key={index} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                {row.endTime}
              </td>
            ))}
          </tr>
          <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">
              기본근무시간
            </td>
            {data.map((row, index) => (
              <td key={index} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                {row.basicHours}시간
              </td>
            ))}
          </tr>
          <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">
              연장근무시간
            </td>
            {data.map((row, index) => (
              <td key={index} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                {row.overtimeHours}시간
              </td>
            ))}
          </tr>
          <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">
              총 근무시간
            </td>
            {data.map((row, index) => (
              <td key={index} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                {row.totalHours}시간
              </td>
            ))}
          </tr>
          <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">
              추가근무 신청
            </td>
            {data.map((row, index) => (
              <td key={index} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                <Button
                  onClick={() => onOvertimeRequest(index)}
                  disabled={row.overtimeStatus === "승인완료"}
                  variant={getOvertimeButtonVariant(row.overtimeStatus)}
                  size="sm"
                  className="text-xs"
                >
                  {row.overtimeStatus}
                </Button>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
