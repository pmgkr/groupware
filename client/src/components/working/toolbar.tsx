import React from 'react';
import { Button } from "@components/ui/button";
import { MultiSelect } from "@components/multiselect/multi-select";
import  WorkHoursBar from "@components/ui/WorkHoursBar";
import { Badge } from "@components/ui/badge";


// 셀렉트 옵션 타입 정의
interface SelectOption {
  value: string;
  label: string;
}

interface SelectConfig {
  id: string;
  placeholder: string;
  options: SelectOption[];
  value?: string[];
  autoSize?: boolean;
  maxCount?: number;
  searchable?: boolean;
  hideSelectAll?: boolean;
}

interface ToolbarProps {
  onNavigate: (action: 'PREV' | 'NEXT' | 'TODAY') => void;
  onView: (view: string) => void;
  currentView: string;
  currentDate: Date;
  selectConfigs: SelectConfig[];
  onSelectChange: (selectId: string, value: string[]) => void;
  onAddEvent: () => void;
  formatWeekDisplay?: (date: Date) => string;
  weeklyStats?: {
    totalWorkHours: number;
    totalBasicHours: number;
    totalOvertimeHours: number;
    vacationHours: number;
    externalHours: number;
    workHours: number;
    workMinutes: number;
    remainingHours: number;
    remainingMinutes: number;
  };
}

export default function Toolbar({ 
  onNavigate, 
  onView, 
  currentView, 
  currentDate, 
  selectConfigs, 
  onSelectChange, 
  onAddEvent,
  formatWeekDisplay,
  weeklyStats
}: ToolbarProps) {
  const formatDate = (date: Date) => {
    if (formatWeekDisplay) {
      return formatWeekDisplay(date);
    }
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
    }).format(date);
  };

  return (
    <div className="flex items-center justify-between mb-5 relative">

      {/* 왼쪽: 네비게이션 버튼들 */}
      <div className="flex items-center gap-2">
        <div className="flex flex-col gap-2">
          <div className="flex gap-4">
            <div className="before:bg-primary flex items-center gap-x-1 text-sm text-gray-700 before:h-1.5 before:w-1.5 before:rounded-[50%]">
              <span>이번 주 근무시간</span>
              <strong className="text-gray-950">{weeklyStats?.workHours || 0}시간 {String(weeklyStats?.workMinutes || 0).padStart(2, '0')}분</strong>
            </div>
            <div className="flex items-center gap-x-1 text-sm text-gray-700 before:h-1.5 before:w-1.5 before:rounded-[50%] before:bg-gray-400">
              <span>잔여 근무시간</span>
              <strong className="text-gray-950">{weeklyStats?.remainingHours || 0}시간 {String(weeklyStats?.remainingMinutes || 0).padStart(2, '0')}분</strong>
            </div>
          </div>
          <WorkHoursBar 
            hours={weeklyStats?.totalWorkHours || 0} 
            className="w-[400px]" 
          />
        </div>

        {/* 중앙: 현재 날짜 표시 */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-5">
          <Button
            onClick={() => onNavigate('PREV')}
            variant="ghost"
            size="icon"
            className="p-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>

          <div className="text-xl font-semibold text-gray-950 px-2">
            {formatDate(currentDate)}
          </div>

          <Button
            onClick={() => onNavigate('NEXT')}
            variant="ghost"
            size="icon"
            className="p-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>
      </div>

      {/* 오른쪽: 뷰 변경 버튼들 */}
      <div className="flex items-center gap-1">
        <Button
          onClick={() => onNavigate('TODAY')}
          variant="outline"
          size="sm"
        >
          오늘
        </Button>
      </div>
    </div>
  );
}
