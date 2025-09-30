import React from 'react';
import dayjs from 'dayjs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { Label } from '@components/ui/label';

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

interface OvertimeViewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel: () => void;
  selectedDay?: WorkData;
  selectedIndex?: number;
}

// 주말 여부 확인 함수
const isWeekend = (dayOfWeek: string) => {
  return dayOfWeek === '토' || dayOfWeek === '일';
};

export default function OvertimeViewDialog({ isOpen, onClose, onCancel, selectedDay, selectedIndex }: OvertimeViewDialogProps) {
  // 샘플 데이터
  const sampleOvertimeData = {
    expectedEndTime: "22",
    expectedEndMinute: "30",
    mealAllowance: "yes",
    transportationAllowance: "no",
    overtimeHours: "4",
    overtimeType: "special_vacation",
    clientName: "BAT",
    workDescription: "집에 가고싶다"
  };

  // selectedDay에서 상태 가져오기
  const status = selectedDay?.overtimeStatus || "신청하기";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>초과근무 신청 내역</DialogTitle>
          <DialogDescription>
            {selectedDay && (
              <>
                {dayjs(selectedDay.date).format('YYYY년 MM월 DD일')} {selectedDay.dayOfWeek}요일의 초과근무 신청 내역입니다.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* 평일 (월-금) 신청 내역 */}
          {selectedDay && !isWeekend(selectedDay.dayOfWeek) && (
            <>
              <div className="space-y-2">
                <Label htmlFor="expected-end-time">예상 퇴근 시간</Label>
                <div className="flex gap-2">
                  <div className="flex-1 px-4 py-2 border border-gray-300 rounded-md bg-gray-50">
                    <span className="text-base">
                      {sampleOvertimeData.expectedEndTime}시
                    </span>
                  </div>
                  <div className="flex-1 px-4 py-2 border border-gray-300 rounded-md bg-gray-50">
                    <span className="text-base">
                      {sampleOvertimeData.expectedEndMinute}분
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                <Label>식대 사용여부</Label>
                <div className="flex gap-4">
                  <div className={`px-4 py-2 rounded-md border ${
                    sampleOvertimeData.mealAllowance === 'yes' 
                      ? 'bg-primary-blue-100 border-primary-blue-300 text-primary-blue' 
                      : 'bg-gray-100 border-gray-300 text-gray-600'
                  }`}>
                    <span className="text-base font-medium">사용함</span>
                  </div>
                  <div className={`px-4 py-2 rounded-md border ${
                    sampleOvertimeData.mealAllowance === 'no' 
                      ? 'bg-primary-blue-100 border-primary-blue-300 text-primary-blue' 
                      : 'bg-gray-100 border-gray-300 text-gray-600'
                  }`}>
                    <span className="text-base font-medium">사용안함</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                <Label>교통비 사용여부</Label>
                <div className="flex gap-4">
                  <div className={`px-4 py-2 rounded-md border ${
                    sampleOvertimeData.transportationAllowance === 'yes' 
                      ? 'bg-primary-blue-100 border-primary-blue-300 text-primary-blue' 
                      : 'bg-gray-100 border-gray-300 text-gray-600'
                  }`}>
                    <span className="text-base font-medium">사용함</span>
                  </div>
                  <div className={`px-4 py-2 rounded-md border ${
                    sampleOvertimeData.transportationAllowance === 'no' 
                      ? 'bg-primary-blue-100 border-primary-blue-300 text-primary-blue' 
                      : 'bg-gray-100 border-gray-300 text-gray-600'
                  }`}>
                    <span className="text-base font-medium">사용안함</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 주말 (토, 일) 신청 내역 */}
          {selectedDay && isWeekend(selectedDay.dayOfWeek) && (
            <>
              <div className="space-y-2">
                <Label htmlFor="overtime-hours">초과근무 시간</Label>
                <div className="px-4 py-2 border border-gray-300 rounded-md bg-gray-50">
                  <span className="text-base">{sampleOvertimeData.overtimeHours}시간</span>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                <Label>보상 지급방식</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className={`px-4 py-2 rounded-md border ${
                    sampleOvertimeData.overtimeType === 'special_vacation' 
                      ? 'bg-primary-blue-100 border-primary-blue-300 text-primary-blue' 
                      : 'bg-gray-100 border-gray-300 text-gray-600'
                  }`}>
                    <span className="text-base font-medium">특별대휴</span>
                  </div>
                  <div className={`px-4 py-2 rounded-md border ${
                    sampleOvertimeData.overtimeType === 'compensation_vacation' 
                      ? 'bg-primary-blue-100 border-primary-blue-300 text-primary-blue' 
                      : 'bg-gray-100 border-gray-300 text-gray-600'
                  }`}>
                    <span className="text-base font-medium">보상휴가</span>
                  </div>
                  <div className={`px-4 py-2 rounded-md border ${
                    sampleOvertimeData.overtimeType === 'event' 
                      ? 'bg-primary-blue-100 border-primary-blue-300 text-primary-blue' 
                      : 'bg-gray-100 border-gray-300 text-gray-600'
                  }`}>
                    <span className="text-base font-medium">수당지급</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 공통 필드 */}
          <div className="space-y-2">
            <Label htmlFor="client-name">클라이언트명</Label>
            <div className="px-4 py-2 border border-gray-300 rounded-md bg-gray-50">
              <span className="text-base">{sampleOvertimeData.clientName}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="work-description">작업 내용</Label>
            <div className="px-4 py-2 border border-gray-300 rounded-md bg-gray-50 min-h-[80px]">
              <span className="text-base">{sampleOvertimeData.workDescription}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>신청 상태</Label>
            <div className={`px-4 py-2 rounded-lg border-2 ${
              status === "승인대기" 
                ? "border-gray-300 bg-gray-100" 
                : status === "승인완료"
                ? "border-gray-300 bg-white"
                : "border-gray-300 bg-gray-100"
            }`}>
                <div>
                  <span className={`text-base font-semibold ${
                    status === "승인대기" ? "text-gray-700" : status === "승인완료" ? "text-gray-600" : "text-gray-700"
                  }`}>
                    {status}
                  </span>
                  {status === "승인완료" && (
                    <p className="text-sm text-gray-500 mt-1">
                      승인일: 2024년 1월 15일
                    </p>
                  )}
                </div>
            </div>
          </div>
        </div>
          <DialogFooter>
            <Button variant="destructive" onClick={onCancel}>신청 취소하기</Button>
            <Button variant="outline" onClick={onClose}>닫기</Button>
          </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
