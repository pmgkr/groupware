import React from 'react';
import dayjs from 'dayjs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { Label } from '@components/ui/label';
import { useUser } from '@/hooks/useUser';

interface EventData {
  id?: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  category: string; // 'vacation' | 'event'
  eventType: string;
  author: string;
  status?: "승인대기" | "승인완료" | "반려됨" | "취소요청됨";
  approvalDate?: string;
  rejectionDate?: string;
  rejectionReason?: string;
  cancelRequestDate?: string;
}

interface EventViewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel?: () => void;
  onReapply?: () => void;
  selectedEvent?: EventData;
}

// 카테고리 한글 변환
const getCategoryLabel = (category: string) => {
  switch (category) {
    case 'vacation':
      return '휴가';
    case 'event':
      return '이벤트';
    default:
      return category;
  }
};

// 이벤트 타입 한글 변환
const getEventTypeLabel = (eventType: string) => {
  const types: Record<string, string> = {
    eventVacation: '연차',
    eventHalfDayMorning: '오전반차',
    eventHalfDayAfternoon: '오후반차',
    eventHalfHalfDayMorning: '오전반반차',
    eventHalfHalfDayAfternoon: '오후반반차',
    eventOfficialLeave: '공가',
    eventWorkFromHome: '재택',
    eventExternal: '외부 일정',
  };
  return types[eventType] || eventType;
};

export default function EventViewDialog({ 
  isOpen, 
  onClose, 
  onCancel, 
  onReapply,
  selectedEvent 
}: EventViewDialogProps) {
  const { user_name } = useUser();
  const status = selectedEvent?.status || "승인완료";
  
  // 본인의 일정인지 확인
  const isMyEvent = user_name && selectedEvent?.author === user_name;

  // 날짜 범위 포맷팅
  const getDateRangeText = () => {
    if (!selectedEvent) return '';
    
    const startDate = dayjs(selectedEvent.startDate);
    const endDate = dayjs(selectedEvent.endDate);
    const { startTime, endTime, allDay } = selectedEvent;
    
    // 종일 이벤트인 경우
    if (allDay) {
      if (startDate.isSame(endDate, 'day')) {
        return startDate.format('YYYY년 MM월 DD일 (ddd)');
      } else {
        return `${startDate.format('YYYY년 MM월 DD일 (ddd)')} ~ ${endDate.format('YYYY년 MM월 DD일 (ddd)')}`;
      }
    }
    
    // 종일이 아닌 경우 시간도 포함
    if (startDate.isSame(endDate, 'day')) {
      return `${startDate.format('YYYY년 MM월 DD일 (ddd)')} ${startTime} ~ ${endTime}`;
    } else {
      return `${startDate.format('YYYY년 MM월 DD일 (ddd)')} ${startTime} ~ ${endDate.format('YYYY년 MM월 DD일 (ddd)')} ${endTime}`;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>일정 상세 정보</DialogTitle>
          <DialogDescription>
            {selectedEvent && (
              <>
                {getDateRangeText()}
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            
          {/* 작성자 */}
          <div className="space-y-2">
            <Label>작성자</Label>
            <div className="px-4 py-2 border border-gray-300 rounded-md bg-gray-100">
              <span className="text-base">{selectedEvent?.author}</span>
            </div>
          </div>

          {/* 일정 유형 */}
          <div className="space-y-2">
            <Label>일정 유형</Label>
            <div className="px-4 py-2 border border-gray-300 rounded-md bg-gray-100">
              <span className="text-base">{selectedEvent && getCategoryLabel(selectedEvent.category)}</span>
            </div>
          </div>

          {/* 세부 유형 */}
          <div className="space-y-2">
            <Label>세부 유형</Label>
            <div className="px-4 py-2 border border-gray-300 rounded-md bg-gray-100">
              <span className="text-base">{selectedEvent && getEventTypeLabel(selectedEvent.eventType)}</span>
            </div>
          </div>

          {/* 기간 */}
          <div className="space-y-2">
            <Label>기간</Label>
            <div className="px-4 py-2 border border-gray-300 rounded-md bg-gray-100">
              <span className="text-base">
                {getDateRangeText()}
              </span>
            </div>
          </div>

          {/* 설명 */}
          {selectedEvent?.description && (
            <div className="space-y-2">
              <Label>설명</Label>
              <div className="px-4 py-2 border border-gray-300 rounded-md bg-gray-100 min-h-[80px]">
                <span className="text-base">{selectedEvent.description}</span>
              </div>
            </div>
          )}

          {/* 승인 상태 - 본인의 일정일 때만 표시 */}
          {isMyEvent && status && (
            <div className="space-y-2">
              <Label>승인 상태</Label>
              <div className={`px-4 py-2 rounded-lg border ${
                status === "반려됨" 
                  ? "border-red-300 bg-red-50"
                  : "border-gray-300 bg-gray-100"
              }`}>
                  <div>
                    <span className={`text-base font-semibold ${
                      status === "반려됨" ? "text-red-700" :
                      "text-gray-800"
                    }`}>
                      {status}
                    </span>
                    {status === "승인완료" && (
                      <p className="text-sm text-gray-800 mt-1">
                        승인일: {selectedEvent?.approvalDate ? dayjs(selectedEvent.approvalDate).format('YYYY년 MM월 DD일') : '2025년 10월 11일'}
                      </p>
                    )}
                    {status === "취소요청됨" && selectedEvent?.cancelRequestDate && (
                      <p className="text-sm text-gray-800 mt-1">
                        요청날짜: {dayjs(selectedEvent.cancelRequestDate).format('YYYY년 MM월 DD일')}
                      </p>
                    )}
                    {status === "반려됨" && selectedEvent?.rejectionDate && selectedEvent?.rejectionReason && (
                      <>
                        <p className="text-sm text-gray-800 mt-1">
                          반려일: {dayjs(selectedEvent.rejectionDate).format('YYYY년 MM월 DD일')}
                        </p>
                        <p className="text-sm text-gray-800">
                          반려사유: {selectedEvent.rejectionReason}
                        </p>
                      </>
                    )}
                  </div>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          {/* 액션 버튼들 - 본인의 일정일 때만 표시 */}
          {isMyEvent && (
            <>
              {status === "반려됨" && onReapply && (
                <Button variant="default" onClick={onReapply}>재신청하기</Button>
              )}
              {status !== "반려됨" && onCancel && (
                <Button variant="destructive" onClick={onCancel}>신청 취소하기</Button>
              )}
            </>
          )}
          <Button variant="outline" onClick={onClose}>닫기</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

