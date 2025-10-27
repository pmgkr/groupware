import React, { useState } from 'react';
import dayjs from 'dayjs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { Label } from '@components/ui/label';
import { Textbox } from '@components/ui/textbox';
import { Textarea } from '@components/ui/textarea';
import { RadioGroup } from '@components/ui/radio-group';
import { RadioButton } from '@components/ui/radioButton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';

interface WorkData {
  date: string;
  workType: "-" | "일반근무" | "외부근무" | "재택근무" | "연차" | "오전반차" | "오전반반차" | "오후반차" | "오후반반차" | "공가";
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
}

interface OvertimeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: OvertimeData) => void;
  selectedDay?: WorkData;
  selectedIndex?: number;
}

interface OvertimeData {
  overtimeHours: string;
  overtimeReason: string;
  clientName: string;
  workDescription: string;
  overtimeType: string;
  expectedEndTime: string;
  expectedEndMinute: string;
  mealAllowance: string;
  transportationAllowance: string;
}

export default function OvertimeDialog({ isOpen, onClose, onSave, selectedDay, selectedIndex }: OvertimeDialogProps) {
  const [formData, setFormData] = useState<OvertimeData>({
    overtimeHours: "",
    overtimeReason: "",
    clientName: "",
    workDescription: "",
    overtimeType: "",
    expectedEndTime: "",
    expectedEndMinute: "",
    mealAllowance: "",
    transportationAllowance: ""
  });

  const [errors, setErrors] = useState<Partial<Record<keyof OvertimeData, string>>>({});
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  const handleInputChange = (field: keyof OvertimeData, value: string) => {
    console.log('Select value changed:', field, value); // 디버깅용 로그
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 사용자 상호작용 표시
    setHasUserInteracted(true);
    
    // 입력 시 해당 필드의 에러 메시지 제거
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  // 유효성 검사 함수
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof OvertimeData, string>> = {};
    
    // 클라이언트명 검증
    if (!formData.clientName.trim()) {
      newErrors.clientName = "클라이언트명을 입력해주세요.";
    }
    
    // 작업 내용 검증
    if (!formData.workDescription.trim()) {
      newErrors.workDescription = "작업 내용을 입력해주세요.";
    }
    
    // 평일인 경우 예상 퇴근 시간 검증
    if (selectedDay && !isWeekend(selectedDay.dayOfWeek)) {
      if (!formData.expectedEndTime) {
        newErrors.expectedEndTime = "예상 퇴근 시간을 선택해주세요.";
      }
      if (!formData.expectedEndMinute) {
        newErrors.expectedEndMinute = "예상 퇴근 분을 선택해주세요.";
      }
      if (!formData.mealAllowance) {
        newErrors.mealAllowance = "식대 사용여부를 선택해주세요.";
      }
      if (!formData.transportationAllowance) {
        newErrors.transportationAllowance = "교통비 사용여부를 선택해주세요.";
      }
    }
    
    // 주말인 경우 초과근무 시간 및 보상 지급방식 검증
    if (selectedDay && isWeekend(selectedDay.dayOfWeek)) {
      if (!formData.overtimeHours) {
        newErrors.overtimeHours = "초과근무 시간을 선택해주세요.";
      }
      if (!formData.overtimeType) {
        newErrors.overtimeType = "보상 지급방식을 선택해주세요.";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return; // 유효성 검사 실패 시 저장하지 않음
    }
    
    onSave(formData);
    onClose();
    // 폼 초기화
    setFormData({
      overtimeHours: "",
      overtimeReason: "",
      clientName: "",
      workDescription: "",
      overtimeType: "",
      expectedEndTime: "",
      expectedEndMinute: "",
      mealAllowance: "",
      transportationAllowance: ""
    });
    setErrors({}); // 에러 상태도 초기화
    setHasUserInteracted(false); // 사용자 상호작용 상태도 초기화
  };

  const handleClose = () => {
    onClose();
    // 폼 초기화
    setFormData({
      overtimeHours: "",
      overtimeReason: "",
      clientName: "",
      workDescription: "",
      overtimeType: "",
      expectedEndTime: "",
      expectedEndMinute: "",
      mealAllowance: "",
      transportationAllowance: ""
    });
    setErrors({}); // 에러 상태도 초기화
    setHasUserInteracted(false); // 사용자 상호작용 상태도 초기화
  };

  // 주말 여부 확인 함수
  const isWeekend = (dayOfWeek: string) => {
    return dayOfWeek === '토' || dayOfWeek === '일';
  };

  // 토요일 여부 확인 함수
  const isSaturday = (dayOfWeek: string) => {
    return dayOfWeek === '토';
  };

  // 일요일 또는 공휴일 여부 확인 함수
  const isSundayOrHoliday = (dayOfWeek: string, workType: string) => {
    return dayOfWeek === '일' || workType === '공휴일';
  };

  // 다이얼로그가 열릴 때 상태 초기화
  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        overtimeHours: "",
        overtimeReason: "",
        clientName: "",
        workDescription: "",
        overtimeType: "",
        expectedEndTime: "",
        expectedEndMinute: "",
        mealAllowance: "",
        transportationAllowance: ""
      });
      setHasUserInteracted(false); // 사용자 상호작용 상태 초기화
      setErrors({}); // 에러 상태 초기화
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>초과근무 신청</DialogTitle>
          <DialogDescription>
            {selectedDay && (
              <>
                {dayjs(selectedDay.date).format('YYYY년 MM월 DD일')} {selectedDay.dayOfWeek}요일의 초과근무를 신청합니다.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* 평일 (월-금) 신청 시 표시되는 내용 */}
          {selectedDay && !isWeekend(selectedDay.dayOfWeek) && (
            <>
              <div className="space-y-3">
                <Label htmlFor="expected-end-time">예상 퇴근 시간을 선택해주세요.</Label>
                <div className="flex gap-2">
                  <Select
                    key="expected-end-time"
                    value={formData.expectedEndTime || undefined}
                    onValueChange={(value) => handleInputChange('expectedEndTime', value)}
                  >
                    <SelectTrigger className={`flex-1 ${errors.expectedEndTime ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="시간을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent className="z-[200]">
                      <SelectItem value="18">18시</SelectItem>
                      <SelectItem value="19">19시</SelectItem>
                      <SelectItem value="20">20시</SelectItem>
                      <SelectItem value="21">21시</SelectItem>
                      <SelectItem value="22">22시</SelectItem>
                      <SelectItem value="23">23시</SelectItem>
                      <SelectItem value="0">24시</SelectItem>
                      <SelectItem value="1">1시</SelectItem>
                      <SelectItem value="2">2시</SelectItem>
                      <SelectItem value="3">3시</SelectItem>
                      <SelectItem value="4">4시</SelectItem>
                      <SelectItem value="5">5시</SelectItem>
                      <SelectItem value="6">6시</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    key="expected-end-minute"
                    value={formData.expectedEndMinute || undefined}
                    onValueChange={(value) => handleInputChange('expectedEndMinute', value)}
                  >
                    <SelectTrigger className={`flex-1 ${errors.expectedEndMinute ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="분을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent className="z-[200]">
                      <SelectItem value="0">0분</SelectItem>
                      <SelectItem value="5">5분</SelectItem>
                      <SelectItem value="10">10분</SelectItem>
                      <SelectItem value="15">15분</SelectItem>
                      <SelectItem value="20">20분</SelectItem>
                      <SelectItem value="25">25분</SelectItem>
                      <SelectItem value="30">30분</SelectItem>
                      <SelectItem value="35">35분</SelectItem>
                      <SelectItem value="40">40분</SelectItem>
                      <SelectItem value="45">45분</SelectItem>
                      <SelectItem value="50">50분</SelectItem>
                      <SelectItem value="55">55분</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(errors.expectedEndTime || errors.expectedEndMinute) && (
                  <p className="text-sm text-red-500">
                    {errors.expectedEndTime || errors.expectedEndMinute}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <Label>식대 사용여부를 선택해주세요.</Label>
                <RadioGroup
                  value={formData.mealAllowance}
                  onValueChange={(value) => handleInputChange('mealAllowance', value)}
                  className="grid grid-cols-2 gap-2 mb-1"
                >
                  <RadioButton
                    value="yes"
                    label="사용함"
                    variant="dynamic"
                    size='md'
                    className='mb-0'
                  />
                  <RadioButton
                    value="no"
                    label="사용안함"
                    variant="dynamic"
                    size='md'
                    className='mb-0'
                  />
                </RadioGroup>
                {errors.mealAllowance && (
                  <p className="text-sm text-red-500">{errors.mealAllowance}</p>
                )}
              </div>

              <div className="space-y-3">
                <Label>교통비 사용여부를 선택해주세요.</Label>
                <RadioGroup
                  value={formData.transportationAllowance}
                  onValueChange={(value) => handleInputChange('transportationAllowance', value)}
                  className="grid grid-cols-2 gap-2 mb-1"
                >
                  <RadioButton
                    value="yes"
                    label="사용함"
                    variant="dynamic"
                    size='md'
                    className='mb-0'
                  />
                  <RadioButton
                    value="no"
                    label="사용안함"
                    variant="dynamic"
                    size='md'
                    className='mb-0'
                  />
                </RadioGroup>
                {errors.transportationAllowance && (
                  <p className="text-sm text-red-500">{errors.transportationAllowance}</p>
                )}
              </div>
            </>
          )}

          {/* 주말 (토, 일) 신청 시 표시되는 내용 */}
          {selectedDay && isWeekend(selectedDay.dayOfWeek) && (
            <>
              <div className="space-y-3">
                <Label htmlFor="overtime-hours">주말 예상 근무 시간을 선택해주세요.</Label>
                <Select
                  key="overtime-hours"
                  value={formData.overtimeHours || undefined}
                  onValueChange={(value) => handleInputChange('overtimeHours', value)}
                >
                  <SelectTrigger className={`w-full ${errors.overtimeHours ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="시간을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent className="z-[200]">
                    <SelectItem value="0">0시간</SelectItem>
                    <SelectItem value="1">1시간</SelectItem>
                    <SelectItem value="2">2시간</SelectItem>
                    <SelectItem value="3">3시간</SelectItem>
                    <SelectItem value="4">4시간</SelectItem>
                    <SelectItem value="5">5시간</SelectItem>
                    <SelectItem value="6">6시간</SelectItem>
                    <SelectItem value="7">7시간</SelectItem>
                    <SelectItem value="8">8시간</SelectItem>
                    <SelectItem value="9">9시간</SelectItem>
                    <SelectItem value="10">10시간</SelectItem>
                    <SelectItem value="11">11시간</SelectItem>
                    <SelectItem value="12">12시간</SelectItem>
                  </SelectContent>
                </Select>
                {errors.overtimeHours && (
                  <p className="text-sm text-red-500">{errors.overtimeHours}</p>
                )}
              </div>

              <div className="space-y-3">
                <Label>보상 지급방식을 선택해주세요.</Label>
                <RadioGroup
                  value={formData.overtimeType}
                  onValueChange={(value) => handleInputChange('overtimeType', value)}
                  className="grid grid-cols-2 gap-2"
                >
                  {/* 토요일인 경우: 특별대휴만 표시 */}
                  {isSaturday(selectedDay.dayOfWeek) && (
                    <RadioButton
                      value="special_vacation"
                      label="특별대휴"
                      variant="dynamic"
                      size='md'
                      className='mb-0'
                    />
                  )}
                  
                  {/* 일요일 또는 공휴일인 경우: 보상휴가, 수당지급 표시 */}
                  {isSundayOrHoliday(selectedDay.dayOfWeek, selectedDay.workType) && (
                    <>
                      <RadioButton
                        value="compensation_vacation"
                        label="보상휴가"
                        variant="dynamic"
                        size='md'
                        className='mb-0'
                      />
                      <RadioButton
                        value="event"
                        label="수당지급"
                        variant="dynamic"
                        size='md'
                        className='mb-0'
                      />
                    </>
                  )}
                </RadioGroup>
                {errors.overtimeType && (
                  <p className="text-sm text-red-500">{errors.overtimeType}</p>
                )}
              </div>
            </>
          )}

          <div className="space-y-3">
            <Label htmlFor="client-name">클라이언트명을 입력해주세요.</Label>
            <Textbox
              id="client-name"
              placeholder="클라이언트명을 입력하세요"
              value={formData.clientName}
              onChange={(e) => handleInputChange('clientName', e.target.value)}
              className="w-full"
              errorMessage={errors.clientName}
            />
          </div>
          
          <div className="space-y-3">
            <Label htmlFor="work-description">작업 내용을 작성해주세요.</Label>
            <Textarea
              id="work-description"
              placeholder="작업 내용을 입력하세요"
              value={formData.workDescription}
              onChange={(e) => handleInputChange('workDescription', e.target.value)}
              className="w-full"
              errorMessage={errors.workDescription}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>신청하기</Button>
          <Button variant="outline" onClick={handleClose}>닫기</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
