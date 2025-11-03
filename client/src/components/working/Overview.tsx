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
}

export default function Overview({ weeklyStats }: OverviewProps) {
  return (
    <div className="mt-15 flex align-center justify-center border border-gray-300 p-7.5">
      <div className="flex flex-col gap-2 border-r border-gray-300 pr-10 mr-10">
        <div className="flex flex-col gap-0">
          <div className="flex items-center gap-1 ">
            <span className="text-gray-800 text-xl font-black">주간누적</span>
            <span className="text-primary-blue-500 text-lg font-bold">{weeklyStats?.workHours || 0}시간 {String(weeklyStats?.workMinutes || 0).padStart(2, '0')}분</span>
          </div>
          <p className="flex items-center gap-x-1 text-sm text-gray-700">
            이번 주 근무 시간이 {weeklyStats?.remainingHours || 0}시간 {String(weeklyStats?.remainingMinutes || 0).padStart(2, '0')}분 남았어요.
          </p>
        </div>
        <WorkHoursBar 
          hours={(weeklyStats?.workHours || 0) + ((weeklyStats?.workMinutes || 0) / 60)} 
          className="w-[400px]" 
        />
      </div>
      <div className="flex flex-col justify-center border-r border-gray-300 pr-10 mr-10 w-[180px]">
        <span className="text-gray-500 text-base">기본 근무시간</span>
        <div className="flex items-center gap-x-1">
          <span className="text-primary-blue-500 text-lg font-bold">
            {weeklyStats?.basicWorkHours || 0}시간 {String(weeklyStats?.basicWorkMinutes || 0).padStart(2, '0')}분
          </span>
          <span className="text-gray-500 text-sm font-medium">/ 40시간</span>
        </div>
      </div>
      <div className="flex flex-col justify-center border-r border-gray-300 pr-10 mr-10 w-[130px]">
        <span className="text-gray-500 text-base">연장 근로시간</span>
        <div className="flex items-center gap-x-1">
          <span className="text-primary-orange-500 text-lg font-bold">
            {weeklyStats?.overtimeWorkHours || 0}시간 {String(weeklyStats?.overtimeWorkMinutes || 0).padStart(2, '0')}분
          </span>
        </div>
      </div>
      <div className="flex flex-col justify-center w-[100px]">
        <span className="text-gray-500 text-base">총 근로시간</span>
        <div className="flex items-center gap-x-1">
          <span className="text-gray-500 text-lg font-bold">{weeklyStats?.workHours || 0}시간 {String(weeklyStats?.workMinutes || 0).padStart(2, '0')}분</span>
        </div>
      </div>
    </div>
  );
}

