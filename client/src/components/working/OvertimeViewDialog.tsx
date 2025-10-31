import React from 'react';
import dayjs from 'dayjs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { Label } from '@components/ui/label';
import { useAppDialog } from '@/components/common/ui/AppDialog/AppDialog';
import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';
import { OctagonAlert } from 'lucide-react';

interface WorkData {
  date: string;
  workType: "-" | "일반근무" | "외부근무" | "재택근무" | "연차" | "오전반차" | "오전반반차" | "오후반차" | "오후반반차" | "공가" | "공휴일";
  startTime: string;
  endTime: string;
  basicHours: number;
  basicMinutes: number;
  overtimeHours: number;
  overtimeMinutes: number;
  totalHours: number;
  totalMinutes: number;
  overtimeStatus: "신청하기" | "승인대기" | "승인완료" | "반려됨";
  dayOfWeek: string;
  rejectionDate?: string;
  rejectionReason?: string;
  // 신청 데이터 추가
  overtimeData?: {
    expectedEndTime: string;
    expectedEndMinute: string;
    mealAllowance: string;
    transportationAllowance: string;
    overtimeHours: string;
    overtimeType: string;
    clientName: string;
    workDescription: string;
  };
  overtimeId?: number; // 초과근무 ID
  isHoliday?: boolean; // 공휴일 여부
}

interface OvertimeViewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel: () => void;
  onReapply?: () => void;
  selectedDay?: WorkData;
  selectedIndex?: number;
}

// 주말 여부 확인 함수
const isWeekend = (dayOfWeek: string) => {
  return dayOfWeek === '토' || dayOfWeek === '일';
};

// 주말 또는 공휴일 여부 확인 함수 (폼 표시 제어용)
const isWeekendOrHoliday = (dayOfWeek: string, workType: string) => {
  return dayOfWeek === '토' || dayOfWeek === '일' || workType === '공휴일';
};

// 토요일 여부 확인 함수
const isSaturday = (dayOfWeek: string) => {
  return dayOfWeek === '토';
};

// 일요일 또는 공휴일 여부 확인 함수
const isSundayOrHoliday = (dayOfWeek: string, workType: string) => {
  return dayOfWeek === '일' || workType === '공휴일';
};

export default function OvertimeViewDialog({ isOpen, onClose, onCancel, onReapply, selectedDay, selectedIndex }: OvertimeViewDialogProps) {
  // Hook 호출
  const { addDialog } = useAppDialog();
  const { addAlert } = useAppAlert();
  
  // selectedDay에서 상태 가져오기
  const status = selectedDay?.overtimeStatus || "신청하기";
  
  // 신청 취소하기 확인 다이얼로그
  const handleCancelClick = () => {
    addDialog({
      title: '<span class="text-primary-blue-500 font-semibold">삭제 확인</span>',
      message: '이 초과근무 신청을 정말 취소하시겠습니까?',
      confirmText: '신청 취소하기',
      cancelText: '닫기',
      onConfirm: async () => {
        console.log('=== OvertimeViewDialog onConfirm 호출됨 ===');
        try {
          // 취소 콜백 호출
          console.log('onCancel 호출 시작');
          await onCancel();
          console.log('onCancel 호출 성공');
          
          // 성공 알림 먼저 표시
          console.log('알림 표시 시도...');
          addAlert({
            title: '삭제 완료',
            message: '초과근무 신청이 성공적으로 취소되었습니다.',
            icon: <OctagonAlert />,
            duration: 3000,
          });
          console.log('알림 표시 완료');
          
          // 알림 표시 후 다이얼로그 닫기
          setTimeout(() => {
            console.log('다이얼로그 닫기');
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
  
  // 신청 데이터
  const overtimeData = selectedDay?.overtimeData || {
    expectedEndTime: "",
    expectedEndMinute: "",
    mealAllowance: "",
    transportationAllowance: "",
    overtimeHours: "",
    overtimeType: "",
    clientName: "",
    workDescription: ""
  };

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
          {selectedDay && !isWeekendOrHoliday(selectedDay.dayOfWeek, selectedDay.workType) && (
            <>
              <div className="space-y-2">
                <Label htmlFor="expected-end-time">예상 퇴근 시간</Label>
                <div className="flex gap-2">
                  <div className="flex-1 px-4 py-2 border border-gray-300 rounded-md bg-gray-100">
                    <span className="text-base">
                      {overtimeData.expectedEndTime}시
                    </span>
                  </div>
                  <div className="flex-1 px-4 py-2 border border-gray-300 rounded-md bg-gray-100">
                    <span className="text-base">
                      {overtimeData.expectedEndMinute}분
                    </span>
                  </div>
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
          {selectedDay && isWeekendOrHoliday(selectedDay.dayOfWeek, selectedDay.workType) && (
            <>
              <div className="space-y-2">
                <Label htmlFor="overtime-hours">초과근무 시간</Label>
                <div className="px-4 py-2 border border-gray-300 rounded-md bg-gray-100">
                  <span className="text-base">{overtimeData.overtimeHours}시간</span>
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
                  {isSundayOrHoliday(selectedDay.dayOfWeek, selectedDay.workType) && (
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
            <div className="px-4 py-2 border border-gray-300 rounded-md bg-gray-100">
              <span className="text-base">{overtimeData.clientName}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="work-description">작업 내용</Label>
            <div className="px-4 py-2 border border-gray-300 rounded-md bg-gray-100 min-h-[80px]">
              <span className="text-base">{overtimeData.workDescription}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>신청 상태</Label>
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
                  {/* 승인완료 시 승인일 표시는 백엔드 데이터 연동 시 추가 예정 */}
                  {status === "반려됨" && selectedDay?.rejectionDate && selectedDay?.rejectionReason && (
                    <>
                    <p className="text-sm text-gray-800 mt-1">
                        반려일: {dayjs(selectedDay.rejectionDate).format('YYYY년 MM월 DD일')}
                    </p>
                    <p className="text-sm text-gray-800">
                        반려사유: {selectedDay.rejectionReason}
                    </p>
                    </>
                  )}
                </div>
            </div>
          </div>

          {/* 반려 정보 표시 */}
          {/* {status === "반려됨" && selectedDay?.rejectionDate && selectedDay?.rejectionReason && (
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
          <DialogFooter>
            {status === "반려됨" && onReapply && (
              <Button variant="default" onClick={onReapply}>재신청하기</Button>
            )}
            {status !== "반려됨" && (
              <Button variant="destructive" onClick={handleCancelClick}>신청 취소하기</Button>
            )}
            <Button variant="outline" onClick={onClose}>닫기</Button>
          </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
