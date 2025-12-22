import React from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { Label } from '@components/ui/label';
import { useUser } from '@/hooks/useUser';
import { useAppDialog } from '@/components/common/ui/AppDialog/AppDialog';
import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';
import { OctagonAlert } from 'lucide-react';
import { notificationApi } from '@/api/notification';
import { defaultEventTitleMapper } from '@/components/calendar/config';
import { findManager } from '@/utils/managerHelper';
import { getDateRangeTextSimple, getDateRangeTextFull } from '@/utils/dateRangeHelper';

dayjs.locale('ko');

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
  onRequestCancel?: () => void; // 취소 신청(사용자)
  onApproveCancel?: () => void; // 취소 승인(매니저)
  selectedEvent?: EventData;
  isPage?: 'manager' | 'admin'; // 페이지 타입 (manager/admin)
}

export default function EventViewDialog({ 
  isOpen, 
  onClose, 
  onRequestCancel,
  onApproveCancel,
  selectedEvent,
  isPage
}: EventViewDialogProps) {
  const { user_id, user_level, team_id, user_name } = useUser();
  const { addDialog } = useAppDialog();
  const { addAlert } = useAppAlert();
  
  // 본인의 일정인지 확인 (user_id로 비교)
  const isMyEvent = user_id && selectedEvent?.userId === user_id;
  
  // manager/admin 권한 확인 (같은 팀 직원의 연차 승인 가능)
  const isManager = user_level === 'manager' || user_level === 'admin';
  
  // 같은 팀인지 확인
  const isSameTeam = team_id !== undefined && selectedEvent?.teamId !== undefined && team_id === selectedEvent.teamId;
  
  // 상태 표시: 본인이 보면 "취소 요청됨", 매니저가 보면 "취소 요청됨"
  const status = (() => {
    const baseStatus = selectedEvent?.status || "등록 완료";
    
    // "취소 완료" 상태는 그대로 반환 (버튼 표시 안 함)
    if (baseStatus === "취소 완료") {
      return "취소 완료";
    }
    
    // "취소 요청됨" 상태인 경우
    if (baseStatus === "취소 요청됨") {
      // 매니저이면서 같은 팀인 경우 "취소 요청됨"로 표시
      if (isManager && isSameTeam && !isMyEvent) {
        return "취소 요청됨";
      }
    }
    
    return baseStatus;
  })();

  // 취소 신청하기 확인 다이얼로그
  const handleCancelRequest = () => {
    // manager/admin은 바로 취소, user는 취소 신청
    const isUser = user_level === 'user';
    
    addDialog({
      title: `<span class="text-primary-blue-500 font-semibold">${isUser ? '취소 신청 확인' : '취소 확인'}</span>`,
      message: isUser 
        ? '이 일정을 정말 취소 신청하시겠습니까?' 
        : '이 일정을 정말 취소하시겠습니까?',
      confirmText: isUser ? '취소 신청하기' : '취소하기',
      cancelText: '닫기',
      onConfirm: async () => {
        try {
          // user: 취소 신청 (H 상태), manager/admin: 바로 취소 완료
          if (isUser) {
            if (onRequestCancel) {
              await onRequestCancel();

              // 알림 전송
              const eventLabel = selectedEvent?.title || defaultEventTitleMapper(selectedEvent?.eventType || '') || '일정';
              const rangeText = getDateRangeTextSimple(selectedEvent?.startDate, selectedEvent?.endDate, selectedEvent?.allDay);
              if (team_id != null) {
                try {
                  const manager = await findManager(team_id);              // 이벤트/휴가 공통 라벨 (calendar config 매퍼 사용)
                  if (manager.id) {
                    // 팀장 알림 (사용자 취소 요청 시)
                    await notificationApi.registerNotification({
                      user_id: manager.id,
                      user_name: manager.name,
                      noti_target: user_id!,
                      noti_title: `${eventLabel} (${rangeText})`,
                      noti_message: `일정 취소를 요청했습니다.`,
                      noti_type: selectedEvent?.category || '',
                      noti_url: '/manager/vacation',
                    });

                    // 본인
                    await notificationApi.registerNotification({
                      user_id: user_id!,
                      user_name: user_name || '',
                      noti_target: user_id!,
                      noti_title: `${eventLabel} (${rangeText})`,
                      noti_message: `일정 취소를 요청했습니다.`,
                      noti_type: selectedEvent?.category || '',
                      noti_url: '/calendar',
                    });
                  }
                } catch (e) {
                  console.error('알림 전송 실패:', e);
                }
              }
            }
          } else {
            if (onApproveCancel) {
              await onApproveCancel();
            }
          }
          
          // 성공 알림 먼저 표시
          addAlert({
            title: isUser ? '취소 신청 완료' : '취소 완료',
            message: isUser 
              ? '일정 취소 신청이 성공적으로 완료되었습니다.' 
              : '일정이 취소되었습니다.',
            icon: <OctagonAlert />,
            duration: 3000,
          });
          
          // 알림 표시 후 다이얼로그 닫기
          setTimeout(() => {
            onClose();
          }, 300);
          
        } catch (error) {
          // 실패 알림 표시
          const errorMessage = error instanceof Error ? error.message : '취소에 실패했습니다. 다시 시도해주세요.';
          addAlert({
            title: isUser ? '취소 신청 실패' : '취소 실패',
            message: errorMessage,
            icon: <OctagonAlert />,
            duration: 3000,
          });
        }
      },
    });
  };

  // 취소 요청 승인 확인 다이얼로그
  const handleApproveCancel = () => {
    addDialog({
      title: '<span class="text-primary-blue-500 font-semibold">취소 승인 확인</span>',
      message: '이 일정의 취소 요청을 승인하시겠습니까?',
      confirmText: '승인하기',
      cancelText: '닫기',
      onConfirm: async () => {
        try {
          // 취소 승인 API 호출 (매니저 전용)
          if (onApproveCancel) {
            await onApproveCancel();
          }
          
          // 알림 전송
          const eventLabel = selectedEvent?.title || defaultEventTitleMapper(selectedEvent?.eventType || '') || '일정';
          const rangeText = getDateRangeTextSimple(selectedEvent?.startDate, selectedEvent?.endDate, selectedEvent?.allDay);
          await notificationApi.registerNotification({
            user_id: selectedEvent?.userId!,
            user_name: selectedEvent?.author!,
            noti_target: user_id!, // 발신자: 현재 사용자(승인자)
            noti_title: `${eventLabel} (${rangeText})`,
            noti_message: `일정 취소를 승인했습니다.`,
            noti_type: selectedEvent?.category || '',
            noti_url: '/calendar',
          });
          
          // 성공 알림 먼저 표시
          addAlert({
            title: '승인 완료',
            message: '일정 취소가 승인되었습니다.',
            icon: <OctagonAlert />,
            duration: 3000,
          });
          
          // 알림 표시 후 다이얼로그 닫기
          setTimeout(() => {
            onClose();
          }, 300);
          
        } catch (error) {
          // 실패 알림 표시
          const errorMessage = error instanceof Error ? error.message : '승인 처리에 실패했습니다. 다시 시도해주세요.';
          addAlert({
            title: '승인 실패',
            message: errorMessage,
            icon: <OctagonAlert />,
            duration: 3000,
          });
        }
      },
    });
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>일정 상세 정보</DialogTitle>
          <DialogDescription>
            {selectedEvent
              ? getDateRangeTextFull(selectedEvent.startDate, selectedEvent.endDate, selectedEvent.startTime, selectedEvent.endTime, selectedEvent.allDay)
              : ''}
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
                {getDateRangeTextFull(selectedEvent?.startDate, selectedEvent?.endDate, selectedEvent?.startTime, selectedEvent?.endTime, selectedEvent?.allDay)}
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
          {status !== "취소 완료" && (
            <>
              {isManager && isSameTeam && status === "취소 요청됨" && onApproveCancel && (
                <Button variant="destructive" onClick={handleApproveCancel}>취소 요청 승인</Button>
              )}
              {/* 액션 버튼들 - 본인의 일정일 때만 표시 */}
              {isMyEvent && status === "등록 완료" && (
                <>
                  {user_level === 'user' && onRequestCancel && (
                    <Button variant="destructive" onClick={handleCancelRequest}>
                      취소 신청하기
                    </Button>
                  )}
                  {(user_level === 'manager' || user_level === 'admin') && onApproveCancel && (!isPage || isPage !== 'admin') && (
                    <Button variant="destructive" onClick={handleCancelRequest}>
                      취소하기
                    </Button>
                  )}
                </>
              )}
            </>
          )}
          <Button variant="outline" onClick={onClose}>닫기</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

