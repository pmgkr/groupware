import React from 'react';
import WorkHoursBar from "@components/ui/WorkHoursBar";

interface OverviewProps {
  weeklyStats?: {
    workHours: number;
    workMinutes: number;
    remainingHours: number;
    remainingMinutes: number;
    basicWorkHours: number;
    basicWorkMinutes: number;
    overtimeWorkHours: number;
    overtimeWorkMinutes: number;
  };
  className?: string;
}

export default function Overview({ weeklyStats, className }: OverviewProps) {
  return (
    <div className={`flex align-center justify-center border border-gray-300 p-7.5 max-md:flex-col max-md:p-0 max-md:border-0 ${className || ''}`}>
      <div className="flex flex-col gap-2 border-r border-gray-300 pr-10 mr-10 max-md:border-0 max-md:pr-0 max-md:mr-0">
        <div className="flex flex-col gap-0">
          <div className="flex items-center gap-1 ">
            <span className="text-gray-800 text-xl font-black max-md:text-base">주간누적</span>
            <span className="text-primary-blue-500 text-lg font-bold max-md:text-base">{weeklyStats?.workHours || 0}시간 {String(weeklyStats?.workMinutes || 0).padStart(2, '0')}분</span>
          </div>
          <p className="flex items-center gap-x-1 text-sm text-gray-700 max-md:text-xs">
            이번 주 근무 시간이 {weeklyStats?.remainingHours || 0}시간 {String(weeklyStats?.remainingMinutes || 0).padStart(2, '0')}분 남았어요.
          </p>
        </div>
        <WorkHoursBar 
          hours={(weeklyStats?.workHours || 0) + ((weeklyStats?.workMinutes || 0) / 60)} 
          className="w-[400px] max-[1441px]:w-[300px] max-md:w-full!" 
        />
      </div>
      <div className="flex flex-col justify-center border-r border-gray-300 pr-10 mr-10 w-[180px] max-md:hidden">
        <span className="text-gray-500 text-base">기본 근무시간</span>
        <div className="flex items-center gap-x-1">
          <span className="text-primary-blue-500 text-lg font-bold">
            {weeklyStats?.basicWorkHours || 0}시간 {String(weeklyStats?.basicWorkMinutes || 0).padStart(2, '0')}분
          </span>
          <span className="text-gray-500 text-sm font-medium">/ 40시간</span>
        </div>
      </div>
      <div className="flex flex-col justify-center border-r border-gray-300 pr-10 mr-10 w-[130px] max-md:hidden">
        <span className="text-gray-500 text-base">연장 근로시간</span>
        <div className="flex items-center gap-x-1">
          <span className="text-primary-orange-500 text-lg font-bold">
            {weeklyStats?.overtimeWorkHours || 0}시간 {String(weeklyStats?.overtimeWorkMinutes || 0).padStart(2, '0')}분
          </span>
        </div>
      </div>
      <div className="flex flex-col justify-center w-[100px] max-md:hidden">
        <span className="text-gray-500 text-base">총 근로시간</span>
        <div className="flex items-center gap-x-1">
          <span className="text-gray-500 text-lg font-bold">{weeklyStats?.workHours || 0}시간 {String(weeklyStats?.workMinutes || 0).padStart(2, '0')}분</span>
        </div>
      </div>
    </div>
  );
}

