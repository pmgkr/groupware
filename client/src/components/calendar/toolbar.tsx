// client/src/components/calendar/toolbar.tsx
import React from 'react';
import type { View } from "react-big-calendar";
import { Button } from "../ui/button";

interface ToolbarProps {
  onNavigate: (action: 'PREV' | 'NEXT' | 'TODAY') => void;
  onView: (view: View) => void;
  currentView: View;
  currentDate: Date;
}

export default function CustomToolbar({ onNavigate, onView, currentView, currentDate }: ToolbarProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
    }).format(date);
  };

  return (
    <div className="flex items-center justify-between mb-5 relative">
      {/* 왼쪽: 네비게이션 버튼들 */}
      <div className="flex items-center gap-2">
        <Button
          onClick={() => onNavigate('TODAY')}
          variant="outline"
          size="sm"
        >
          오늘
        </Button>

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
          onClick={() => onView('month')}
          variant={currentView === 'month' ? 'default' : 'outline'}
          size="sm"
        >
          월간
        </Button>
        <Button
          onClick={() => onView('week')}
          variant={currentView === 'week' ? 'default' : 'outline'}
          size="sm"
        >
          주간
        </Button>
        <Button
          onClick={() => onView('day')}
          variant={currentView === 'day' ? 'default' : 'outline'}
          size="sm"
        >
          일간
        </Button>
      </div>
    </div>
  );
} 