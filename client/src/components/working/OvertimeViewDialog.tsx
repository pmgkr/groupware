import React, { useState } from 'react';
import dayjs from 'dayjs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { Label } from '@components/ui/label';
import { Textarea } from '@components/ui/textarea';
import { useAppDialog } from '@/components/common/ui/AppDialog/AppDialog';
import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';
import { OctagonAlert, CheckCircle } from 'lucide-react';
import type { WorkData } from '@/types/working';
import { useAuth } from '@/contexts/AuthContext';
import { findManager } from '@/utils/managerHelper';
import { notificationApi } from '@/api/notification';

interface OvertimeViewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel: () => void;
  onReapply?: () => void;
  onApprove?: () => void;
  onReject?: (reason: string) => void;
  onCompensation?: () => void;
  selectedDay?: WorkData;
  selectedIndex?: number;
  isManager?: boolean;
  isOwnRequest?: boolean;
  activeTab?: 'weekday' | 'weekend';
  isPage?: 'manager' | 'admin';
  user?: { user_level?: string; team_id?: number };
}

// 주말 여부 확인 함수
const isWeekend = (dayOfWeek: string) => {
  return dayOfWeek === '토' || dayOfWeek === '일';
};

// 주말 또는 공휴일 여부 확인 함수 (폼 표시 제어용)
const isWeekendOrHoliday = (dayOfWeek: string, workType: string, isHoliday?: boolean, holidayName?: string | null) => {
  if (isHoliday || holidayName) return true;
  return dayOfWeek === '토' || dayOfWeek === '일' || workType === '공휴일';
};

// 토요일 여부 확인 함수
const isSaturday = (dayOfWeek: string) => {
  return dayOfWeek === '토';
};

// 일요일 또는 공휴일 여부 확인 함수
const isSundayOrHoliday = (dayOfWeek: string, workType: string, isHoliday?: boolean, holidayName?: string | null) => {
  if (isHoliday || holidayName) return true;
  return dayOfWeek === '일' || workType === '공휴일';
};

export default function OvertimeViewDialog({ 
  isOpen, 
  onClose, 
  onCancel, 
  onReapply, 
  onApprove,
  onReject,
  onCompensation,
  selectedDay, 
  selectedIndex,
  isManager = false,
  isOwnRequest = false,
  activeTab = 'weekday',
  isPage = 'manager',
  user
}: OvertimeViewDialogProps) {
  console.log({
    onCompensation,
    onReject,
    isManager,
    isOwnRequest,
    userLevel: user?.user_level,
    isPage,
    activeTab,
  });
  const { user: currentUser } = useAuth();
  // Hook 호출
  const { addDialog } = useAppDialog();
  const { addAlert } = useAppAlert();
  
  // 반려 사유 state
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  
  // selectedDay에서 상태 가져오기
  const status = selectedDay?.overtimeStatus || "신청하기";
  const isWeekendOrHolidayDay = selectedDay
    ? isWeekendOrHoliday(
        selectedDay.dayOfWeek,
        selectedDay.workType,
        selectedDay.isHoliday,
        selectedDay.holidayName
      )
    : false;
  
  // HR팀 또는 Finance팀 관리자/관리자 권한 확인 함수
  const isHrOrFinanceTeam = () => {
    return (user?.user_level === 'manager' || user?.user_level === 'admin') && 
           (user?.team_id === 1 || user?.team_id === 5);
  };
  
  // 보상 지급 가능 여부 확인 (HR/Finance팀이고 휴일 근무 탭이며 보상대기 상태일 때)
  const canShowCompensation = isHrOrFinanceTeam() && isWeekendOrHolidayDay && status === '보상대기';
  
  // 신청 취소하기 확인 다이얼로그
  const handleCancelClick = () => {
    addDialog({
      title: '<span class="text-primary-blue-500 font-semibold">삭제 확인</span>',
      message: `이 ${getOvertimeLabel()} 신청을 정말 취소하시겠습니까?`,
      confirmText: '신청 취소하기',
      cancelText: '닫기',
      onConfirm: async () => {
        try {
          await onCancel();
          
          addAlert({
            title: '삭제 완료',
            message: `${getOvertimeLabel()} 신청이 성공적으로 취소되었습니다.`,
            icon: <OctagonAlert />,
            duration: 3000,
          });
          
          setTimeout(() => {
            onClose();
          }, 300);
          
        } catch (error) {
          console.error('취소 실패:', error);
          // 실패 알림 표시
          const errorMessage = error instanceof Error ? error.message : '신청 취소에 실패했습니다. 다시 시도해주세요.';
          addAlert({
            title: '삭제 실패',
            message: errorMessage,
            icon: <OctagonAlert />,
            duration: 3000,
          });
        }
      },
    });
  };

  // 승인 확인 다이얼로그
  const handleApproveClick = () => {
    const isCompensation = isPage === 'admin' && isWeekendOrHolidayDay && (user?.team_id === 1 || user?.team_id === 5);
    
    addDialog({
      title: `<span class="text-primary-blue font-semibold">${isCompensation ? '보상 지급 확인' : '승인 확인'}</span>`,
      message: isCompensation ? '이 보상지급 요청을 승인하시겠습니까?' : `이 ${getOvertimeLabel()} 신청을 승인하시겠습니까?`,
      confirmText: isCompensation ? '보상 지급하기' : '승인하기',
      cancelText: '취소',
      onConfirm: async () => {
        try {
          if (onApprove) {
            await onApprove();
            addAlert({
              title: '승인 완료',
              message: `${getOvertimeLabel()} 신청이 승인되었습니다.`,
              icon: <CheckCircle />,
              duration: 3000,
            });
            setTimeout(() => {
              onClose();
            }, 300);
          }
        } catch (error) {
          console.error('승인 실패:', error);
          const errorMessage = error instanceof Error ? error.message : '승인에 실패했습니다. 다시 시도해주세요.';
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

  // 반려 처리
  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) {
      addAlert({
        title: '입력 오류',
        message: '반려 사유를 입력해주세요.',
        icon: <OctagonAlert />,
        duration: 3000,
      });
      return;
    }

    try {
      if (onReject) {
        await onReject(rejectReason);
        addAlert({
          title: '반려 완료',
          message: `${getOvertimeLabel()} 신청이 반려되었습니다.`,
          icon: <OctagonAlert />,
          duration: 3000,
        });
        setShowRejectInput(false);
        setRejectReason('');
        setTimeout(() => {
          onClose();
        }, 300);
      }
    } catch (error) {
      console.error('반려 실패:', error);
      const errorMessage = error instanceof Error ? error.message : '반려에 실패했습니다. 다시 시도해주세요.';
      addAlert({
        title: '반려 실패',
        message: errorMessage,
        icon: <OctagonAlert />,
        duration: 3000,
      });
    }
  };

  // 보상 지급 확인 다이얼로그
  const handleCompensationClick = () => {
    const isCompensation = isPage === 'admin' && isWeekendOrHolidayDay && (user?.team_id === 1 || user?.team_id === 5);
    
    addDialog({
      title: `<span class="text-primary-blue font-semibold">${isCompensation ? '보상 지급 확인' : '승인 확인'}</span>`,
      message: isCompensation ? '이 보상지급 요청을 승인하시겠습니까?' : `이 ${getOvertimeLabel()} 신청을 승인하시겠습니까?`,
      confirmText: isCompensation ? '보상 지급하기' : '승인하기',
      cancelText: '취소',
      onConfirm: async () => {
        try {
          if (onCompensation) {
            await onCompensation();
            addAlert({
              title: '보상 지급 완료',
              message: '보상지급 요청이 승인되었습니다.',
              icon: <CheckCircle />,
              duration: 3000,
            });
            setTimeout(() => {
              onClose();
            }, 300);
          }
        } catch (error) {
          console.error('보상 지급 실패:', error);
          const errorMessage = error instanceof Error ? error.message : '보상 지급에 실패했습니다. 다시 시도해주세요.';
          addAlert({
            title: '보상 지급 실패',
            message: errorMessage,
            icon: <OctagonAlert />,
            duration: 3000,
          });
        }
      },
    });
  };
  
  // 신청 데이터
  const overtimeData = selectedDay?.overtimeData || {
    expectedStartTime: "",
    expectedStartTimeMinute: "",
    expectedEndTime: "",
    expectedEndMinute: "",
    mealAllowance: "",
    transportationAllowance: "",
    overtimeHours: "",
    overtimeMinutes: "",
    overtimeType: "",
    clientName: "",
    workDescription: ""
  };

  const getOvertimeLabel = () => {
    if (selectedDay) {
      return isWeekendOrHoliday(
        selectedDay.dayOfWeek,
        selectedDay.workType,
        selectedDay.isHoliday,
        selectedDay.holidayName
      )
        ? '휴일근무'
        : '연장근무';
    }
    return '연장근무';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{`${getOvertimeLabel()} 신청 내역`}</DialogTitle>
          <DialogDescription>
            {selectedDay && (
              <>
                {dayjs(selectedDay.date).format('YYYY년 MM월 DD일')} {selectedDay.dayOfWeek}요일의 {getOvertimeLabel()} 신청 내역입니다.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* 평일 (월-금) 신청 내역 */}
          {selectedDay && !isWeekendOrHoliday(selectedDay.dayOfWeek, selectedDay.workType, selectedDay.isHoliday, selectedDay.holidayName) && (
            <>
              <div className="space-y-2">
                <Label htmlFor="expected-end-time">예상 퇴근 시간</Label>
                <div className="h-11 flex-1 flex items-center gap-1 px-3 py-1 border border-gray-300 rounded-md bg-gray-100 max-md:h-10 max-md:rounded-sm">
                  <span className="text-base max-md:text-[13px]">
                    {overtimeData.expectedEndTime}시
                  </span>
                  <span className="text-base max-md:text-[13px]">
                    {overtimeData.expectedEndMinute}분
                  </span>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                <Label>식대 사용여부</Label>
                <div className="flex gap-2">
                  <div className={`px-4 py-2 rounded-md border ${
                    overtimeData.mealAllowance === 'yes' 
                      ? 'bg-primary-blue-100 border-primary-blue-300 text-primary-blue' 
                      : 'bg-gray-100 border-gray-300 text-gray-600'
                  }`}>
                    <span className="text-base font-medium">사용함</span>
                  </div>
                  <div className={`px-4 py-2 rounded-md border ${
                    overtimeData.mealAllowance === 'no' 
                      ? 'bg-primary-blue-100 border-primary-blue-300 text-primary-blue' 
                      : 'bg-gray-100 border-gray-300 text-gray-600'
                  }`}>
                    <span className="text-base font-medium">사용안함</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                <Label>교통비 사용여부</Label>
                <div className="flex gap-2">
                  <div className={`px-4 py-2 rounded-md border ${
                    overtimeData.transportationAllowance === 'yes' 
                      ? 'bg-primary-blue-100 border-primary-blue-300 text-primary-blue' 
                      : 'bg-gray-100 border-gray-300 text-gray-600'
                  }`}>
                    <span className="text-base font-medium">사용함</span>
                  </div>
                  <div className={`px-4 py-2 rounded-md border ${
                    overtimeData.transportationAllowance === 'no' 
                      ? 'bg-primary-blue-100 border-primary-blue-300 text-primary-blue' 
                      : 'bg-gray-100 border-gray-300 text-gray-600'
                  }`}>
                    <span className="text-base font-medium">사용안함</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 주말 (토, 일) 또는 공휴일 신청 내역 */}
          {selectedDay && isWeekendOrHoliday(selectedDay.dayOfWeek, selectedDay.workType, selectedDay.isHoliday, selectedDay.holidayName) && (
            <>
              <div className="space-y-2">
                <Label htmlFor="expected-start-time">근무 시간</Label>
                <div className="h-11 flex-1 flex items-center gap-1 px-3 py-1 border border-gray-300 rounded-md bg-gray-100 max-md:h-10 max-md:rounded-sm">
                  <span className="text-base max-md:text-[13px]">
                    {overtimeData.expectedStartTime}시 {overtimeData.expectedStartTimeMinute}분
                  </span>
                  -
                  <span className="text-base max-md:text-[13px]">
                    {overtimeData.expectedEndTime}시 {overtimeData.expectedEndMinute}분
                  </span>
                  <span className="text-base max-md:text-[13px] text-gray-600">
                    (인정 근무시간: <span className="text-primary-blue-500">{overtimeData.overtimeHours}시간 {overtimeData.overtimeMinutes}분</span>)
                  </span>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                <Label>보상 지급방식</Label>
                <div className="grid grid-cols-2 gap-2">
                  {/* 토요일인 경우: 특별대휴만 표시 */}
                  {isSaturday(selectedDay.dayOfWeek) && (
                    <div className={`px-4 py-2 rounded-md border ${
                      overtimeData.overtimeType === 'special_vacation' 
                        ? 'bg-primary-blue-100 border-primary-blue-300 text-primary-blue' 
                        : 'bg-gray-100 border-gray-300 text-gray-600'
                    }`}>
                      <span className="text-base font-medium">특별대휴</span>
                    </div>
                  )}
                  
                  {/* 일요일 또는 공휴일인 경우: 보상휴가, 수당지급 표시 */}
                  {isSundayOrHoliday(selectedDay.dayOfWeek, selectedDay.workType, selectedDay.isHoliday, selectedDay.holidayName) && (
                    <>
                      <div className={`px-4 py-2 rounded-md border ${
                        overtimeData.overtimeType === 'compensation_vacation' 
                          ? 'bg-primary-blue-100 border-primary-blue-300 text-primary-blue' 
                          : 'bg-gray-100 border-gray-300 text-gray-600'
                      }`}>
                        <span className="text-base font-medium">보상휴가</span>
                      </div>
                      <div className={`px-4 py-2 rounded-md border ${
                        overtimeData.overtimeType === 'event' 
                          ? 'bg-primary-blue-100 border-primary-blue-300 text-primary-blue' 
                          : 'bg-gray-100 border-gray-300 text-gray-600'
                      }`}>
                        <span className="text-base font-medium">수당지급</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          {/* 공통 필드 */}
          <div className="space-y-2">
            <Label htmlFor="client-name">클라이언트명</Label>
            <div className="h-11 px-3 py-1 border border-gray-300 rounded-md bg-gray-100 max-md:h-10 max-md:rounded-sm flex items-center break-all">
              <span className="text-base max-md:text-[13px]">{overtimeData.clientName}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="work-description">업무 내용</Label>
            <div className="min-h-[80px] px-3 py-1 border border-gray-300 rounded-md bg-gray-100 max-md:rounded-sm flex items-start pt-3 break-all whitespace-pre-wrap">
              <span className="text-base max-md:text-[13px]">{overtimeData.workDescription}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>신청 상태</Label>
            <div className="min-h-[44px] px-3 py-1 rounded-lg border border-gray-300 bg-gray-100 max-md:rounded-sm flex items-center">
                <div>
                  <span className="text-base max-md:text-[13px] font-semibold text-gray-800">
                    {status}
                  </span>
                  {/* 승인완료 시 승인일 표시는 백엔드 데이터 연동 시 추가 예정 */}
                  {status === "취소완료" && selectedDay?.rejectionDate && selectedDay?.rejectionReason && (
                    <>
                    <p className="text-sm max-md:text-[11px] text-gray-800 mt-1">
                        반려일: {dayjs(selectedDay.rejectionDate).format('YYYY년 MM월 DD일')}
                    </p>
                    <p className="text-sm max-md:text-[11px] text-gray-800">
                        반려사유: {selectedDay.rejectionReason}
                    </p>
                    </>
                  )}
                </div>
            </div>
          </div>

          {/* 반려 정보 표시 */}
          {/* {status === "취소완료" && selectedDay?.rejectionDate && selectedDay?.rejectionReason && (
            <>
              <div className="space-y-2">
                <Label>반려사유</Label>
                <div className="px-4 py-2 border border-gray-300 rounded-md bg-gray-100 min-h-[80px]">
                  <span className="text-base">{selectedDay.rejectionReason}</span>
                </div>
              </div>
            </>
          )} */}
        </div>

          {/* 반려 사유 입력 */}
          {showRejectInput && (
            <div className="space-y-2">
              <Label htmlFor="reject-reason">반려 사유</Label>
              <Textarea
                id="reject-reason"
                placeholder="반려 사유를 입력해주세요"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          )}

          <DialogFooter className="gap-2 max-md:flex-row max-md:flex-nowrap">
            {/* 관리자 모드 - 승인대기 상태일 때 승인/반려 버튼 */}
            {isManager && status === "승인대기" && (
              <>
                {!showRejectInput ? (
                  <>
                    {onApprove && (
                      <Button variant="default" onClick={handleApproveClick} className="bg-primary-blue-500 active:bg-primary-blue hover:bg-primary-blue mr-0 max-md:flex-1">
                        {isPage === 'admin' && isWeekendOrHolidayDay && (user?.team_id === 1 || user?.team_id === 5) ? '보상 지급하기' : '승인하기'}
                      </Button>
                    )}
                    {onReject && (
                      <Button variant="destructive" onClick={() => setShowRejectInput(true)} className="bg-destructive hover:bg-destructive mr-0 max-md:flex-1">
                        반려하기
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <Button variant="default" onClick={handleRejectSubmit} className="max-md:flex-1">
                      반려 확정
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setShowRejectInput(false);
                      setRejectReason('');
                    }} className="max-md:flex-1">
                      취소
                    </Button>
                  </>
                )}
              </>
            )}

            {/* 보상대기 상태일 때 보상 지급하기 + 반려하기 버튼 (admin이고 휴일 근무일 때만) */}
            {isManager && status === "보상대기" && isWeekendOrHolidayDay && (onCompensation || onReject) && (
              <>
                {!showRejectInput ? (
                  <>
                    {onCompensation && (
                      <Button variant="default" onClick={handleCompensationClick} className="bg-primary-blue-500 active:bg-primary-blue hover:bg-primary-blue mr-0 max-md:flex-1">
                        {isPage === 'admin' && isWeekendOrHolidayDay && (user?.team_id === 1 || user?.team_id === 5) ? '보상 지급하기' : '승인하기'}
                      </Button>
                    )}
                    {onReject && (
                      <Button variant="destructive" onClick={() => setShowRejectInput(true)} className="bg-destructive hover:bg-destructive mr-0 max-md:flex-1">
                        반려하기
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <Button variant="default" onClick={handleRejectSubmit} className="max-md:flex-1">
                      반려 확정
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setShowRejectInput(false);
                      setRejectReason('');
                    }} className="max-md:flex-1">
                      취소
                    </Button>
                  </>
                )}
              </>
            )}

            {/* 본인 신청이거나 일반 사용자 모드 */}
            {(isOwnRequest || !isManager) && (
              <>
                {status === "취소완료" && onReapply && (
                  <Button variant="default" onClick={onReapply} className="mr-0 max-md:flex-1">재신청하기</Button>
                )}
                {status === "승인대기" && (
                  <Button variant="destructive" onClick={handleCancelClick} className="mr-0 max-md:flex-1">신청 취소하기</Button>
                )}
              </>
            )}

            {/* 닫기 버튼 (항상 표시) */}
            {!showRejectInput && (
              <Button variant="outline" onClick={onClose} className="max-md:flex-1">닫기</Button>
            )}
          </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
