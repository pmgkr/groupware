import React, { useState, useMemo, useEffect } from 'react';
import dayjs from 'dayjs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@components/ui/dialog';
import Overview from '@components/working/Overview';
import Table from '@components/working/table';
import { workingApi } from '@/api/working';
import type { WorkData } from '@/types/working';
import { getWeekStartDate, getWeekEndDate } from '@/utils/dateHelper';
import { calculateWeeklyStats } from '@/utils/workingStatsHelper';
import { convertApiDataToWorkData } from '@/services/workingDataConverter';

interface WorkingDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  weekStartDate: Date;
}

export default function WorkingDetailDialog({ 
  isOpen, 
  onClose, 
  userId, 
  userName,
  weekStartDate 
}: WorkingDetailDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<WorkData[]>([]);

  // API에서 해당 직원의 근태 로그 데이터 가져오기
  const loadWorkLogs = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const startDate = weekStartDate;
      const endDate = getWeekEndDate(weekStartDate);
      
      const sdate = dayjs(startDate).format('YYYY-MM-DD');
      const edate = dayjs(endDate).format('YYYY-MM-DD');
      
      // 근태 로그와 초과근무 목록 병렬로 가져오기
      const [workLogResponse, overtimeResponse] = await Promise.all([
        workingApi.getWorkLogs({
          search_id: userId,
          sdate,
          edate,
        }),
        workingApi.getOvertimeList({
          page: 1,
          size: 100,
        })
      ]);
      
      // API 데이터를 WorkData 형식으로 변환
      const apiData = await convertApiDataToWorkData(
        workLogResponse.wlog || [], 
        workLogResponse.vacation || [], 
        overtimeResponse.items?.filter(ot => ot.user_id === userId) || [],
        weekStartDate,
        userId
      );
      setData(apiData);
    } catch (error) {
      console.error('근태 로그 로드 실패:', error);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 다이얼로그가 열릴 때 데이터 로드
  useEffect(() => {
    if (isOpen && userId) {
      loadWorkLogs();
    }
  }, [isOpen, userId, weekStartDate]);

  // 주간 근무시간 통계 계산
  const weeklyStats = useMemo(() => calculateWeeklyStats(data), [data]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[90vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{userName}님의 출퇴근관리</DialogTitle>
          <DialogDescription>
            {dayjs(weekStartDate).format('YYYY년 MM월 DD일')} - {dayjs(getWeekEndDate(weekStartDate)).format('MM월 DD일')} 주간 근태 현황
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500">데이터를 불러오는 중</p>
            </div>
          ) : (
            <>
              <Overview
               weeklyStats={weeklyStats}
               />
              <Table 
                data={data}
                onDataRefresh={loadWorkLogs}
                readOnly={true}
              />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

