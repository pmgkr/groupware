import React from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@components/ui/dialog';

dayjs.locale('ko');
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
  userId: string; // 작성자 ID
  teamId?: number; // 작성자 팀 ID
  status?: "등록 완료" | "취소 요청됨" | "취소 완료";
  cancelRequestDate?: string;
  createdAt?: string; // sch_created_at
}

interface EventViewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestCancel?: () => void;
  selectedEvent?: EventData;
}

export default function EventViewDialog({ 
  isOpen, 
  onClose, 
  onRequestCancel,
  selectedEvent 
}: EventViewDialogProps) {
  const { user_id, user_level, team_id } = useUser();
  
  // 본인의 일정인지 확인 (user_id로 비교)
  const isMyEvent = user_id && selectedEvent?.userId === user_id;
  
  // manager 권한 확인 (같은 팀 직원의 연차 승인 가능)
  const isManager = user_level === 'manager';
  
  // 같은 팀인지 확인
  const isSameTeam = team_id !== undefined && selectedEvent?.teamId !== undefined && team_id === selectedEvent.teamId;
  
  // 상태 표시: 본인이 보면 "취소 요청됨", 매니저가 보면 "취소 요청됨"
  const status = (() => {
    const baseStatus = selectedEvent?.status || "등록 완료";
    
    // "취소 요청됨" 상태인 경우
    if (baseStatus === "취소 요청됨") {
      // 매니저이면서 같은 팀인 경우 "취소 요청됨"로 표시
      if (isManager && isSameTeam && !isMyEvent) {
        return "취소 요청됨";
      }
    }
    
    return baseStatus;
  })();

  // 날짜 범위 포맷팅
  const getDateRangeText = () => {
    if (!selectedEvent) return '';
    
    const startDate = dayjs(selectedEvent.startDate);
    const endDate = dayjs(selectedEvent.endDate);
    const { startTime, endTime, allDay } = selectedEvent;
    
    // 시간에서 초 제거 (HH:mm:ss -> HH:mm)
    const formatTime = (time: string) => time?.substring(0, 5) || time;
    
    // 종일 이벤트인 경우
    if (allDay) {
      if (startDate.isSame(endDate, 'day')) {
        return startDate.format('YYYY년 MM월 DD일 ddd요일');
      } else {
        return `${startDate.format('YYYY년 MM월 DD일 ddd요일')} - ${endDate.format('YYYY년 MM월 DD일 ddd요일')}`;
      }
    }
    
    // 종일이 아닌 경우 시간도 포함 (초 제거)
    if (startDate.isSame(endDate, 'day')) {
      return `${startDate.format('YYYY년 MM월 DD일 ddd요일')} ${formatTime(startTime)} - ${formatTime(endTime)}`;
    } else {
      return `${startDate.format('YYYY년 MM월 DD일 ddd요일')} ${formatTime(startTime)} - ${endDate.format('YYYY년 MM월 DD일 ddd요일')} ${formatTime(endTime)}`;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>일정 상세 정보</DialogTitle>
          {/* <DialogDescription>
            {selectedEvent && (
              <>
                {getDateRangeText()}
              </>
            )}
          </DialogDescription> */}
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
            <Label>{selectedEvent?.category === 'vacation' ? '휴가' : '이벤트'  } 유형</Label>
            <div className="px-4 py-2 border border-gray-300 rounded-md bg-gray-100">
              <span className="text-base">
                {selectedEvent?.title}
              </span>
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

          {/* 일정 상태 - 본인의 일정이거나 매니저가 같은 팀 직원의 일정을 볼 때 표시 */}
          {(isMyEvent || (isManager && isSameTeam)) && status && (
            <div className="space-y-2">
              <Label>진행 상태</Label>
              <div className="px-4 py-2 rounded-lg border border-gray-300 bg-gray-100">
                  <div>
                    <span className="text-base font-semibold text-gray-800">
                      {status}
                    </span>
                    {status === "등록 완료" && selectedEvent?.createdAt && (
                      <p className="text-sm text-gray-800 mt-1">
                        등록일: {dayjs(selectedEvent.createdAt).format('YYYY년 MM월 DD일')}
                      </p>
                    )}
                    {status === "취소 요청됨" && selectedEvent?.cancelRequestDate && (
                      <p className="text-sm text-gray-800 mt-1">
                        요청날짜: {dayjs(selectedEvent.cancelRequestDate).format('YYYY년 MM월 DD일')}
                      </p>
                    )}
                  </div>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          {isManager && isSameTeam && status === "취소 요청됨" && onRequestCancel && (
            <Button variant="destructive" onClick={onRequestCancel}>취소 요청 승인</Button>
          )}
          {/* 액션 버튼들 - 본인의 일정일 때만 표시 */}
          {isMyEvent && status === "등록 완료" && onRequestCancel && (
            <Button variant="destructive" onClick={onRequestCancel}>취소 신청하기</Button>
          )}
          <Button variant="outline" onClick={onClose}>닫기</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

