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
  workType: "정상근무" | "외부근무" | "휴가";
  startTime: string;
  endTime: string;
  basicHours: number;
  overtimeHours: number;
  totalHours: number;
  overtimeStatus: "신청하기" | "승인대기" | "승인완료";
  dayOfWeek: string;
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
    overtimeHours: "0",
    overtimeReason: "",
    clientName: "",
    workDescription: "",
    overtimeType: "special_vacation",
    expectedEndTime: "18",
    expectedEndMinute: "0",
    mealAllowance: "no",
    transportationAllowance: "no"
  });

  const handleInputChange = (field: keyof OvertimeData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
    // 폼 초기화
    setFormData({
      overtimeHours: "0",
      overtimeReason: "",
      clientName: "",
      workDescription: "",
      overtimeType: "special_vacation",
      expectedEndTime: "18",
      expectedEndMinute: "0",
      mealAllowance: "no",
      transportationAllowance: "no"
    });
  };

  const handleClose = () => {
    onClose();
    // 폼 초기화
    setFormData({
      overtimeHours: "0",
      overtimeReason: "",
      clientName: "",
      workDescription: "",
      overtimeType: "special_vacation",
      expectedEndTime: "18",
      expectedEndMinute: "0",
      mealAllowance: "no",
      transportationAllowance: "no"
    });
  };

  // 주말 여부 확인 함수
  const isWeekend = (dayOfWeek: string) => {
    return dayOfWeek === '토' || dayOfWeek === '일';
  };

  // 다이얼로그가 열릴 때 선택된 날짜의 초기값 설정
  React.useEffect(() => {
    if (isOpen && selectedDay) {
      setFormData(prev => ({
        ...prev,
        overtimeHours: selectedDay.overtimeHours.toString()
      }));
    }
  }, [isOpen, selectedDay]);

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
              <div className="space-y-2">
                <Label htmlFor="expected-end-time">예상 퇴근 시간을 선택해주세요.</Label>
                <div className="flex gap-2">
                  <Select
                    value={formData.expectedEndTime}
                    onValueChange={(value) => handleInputChange('expectedEndTime', value)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="시간을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
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
                    value={formData.expectedEndMinute}
                    onValueChange={(value) => handleInputChange('expectedEndMinute', value)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="분을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
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
              </div>

              <div className="space-y-3 mb-8">
                <Label>식대 사용여부를 선택해주세요.</Label>
                <RadioGroup
                  value={formData.mealAllowance}
                  onValueChange={(value) => handleInputChange('mealAllowance', value)}
                  className="grid grid-cols-2 gap-4"
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
              </div>

              <div className="space-y-3 mb-8">
                <Label>교통비 사용여부를 선택해주세요.</Label>
                <RadioGroup
                  value={formData.transportationAllowance}
                  onValueChange={(value) => handleInputChange('transportationAllowance', value)}
                  className="grid grid-cols-2 gap-4"
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
              </div>
            </>
          )}

          {/* 주말 (토, 일) 신청 시 표시되는 내용 */}
          {selectedDay && isWeekend(selectedDay.dayOfWeek) && (
            <>
              <div className="space-y-2">
                <Label htmlFor="overtime-hours">초과근무 시간</Label>
                <Select
                  value={formData.overtimeHours}
                  onValueChange={(value) => handleInputChange('overtimeHours', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="시간을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
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
              </div>

              <div className="space-y-3 mb-8">
                <Label>보상 지급방식을 선택해주세요.</Label>
                <RadioGroup
                  value={formData.overtimeType}
                  onValueChange={(value) => handleInputChange('overtimeType', value)}
                  className="grid grid-cols-2 gap-4"
                >
                  <RadioButton
                    value="special_vacation"
                    label="특별대휴"
                    variant="dynamic"
                    size='md'
                    className='mb-0'
                  />
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
                </RadioGroup>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="client-name">클라이언트명을 입력해주세요.</Label>
            <Textbox
              id="client-name"
              placeholder="클라이언트명을 입력하세요"
              value={formData.clientName}
              onChange={(e) => handleInputChange('clientName', e.target.value)}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="work-description">작업 내용을 작성해주세요.</Label>
            <Textarea
              id="work-description"
              placeholder="작업 내용을 입력하세요"
              value={formData.workDescription}
              onChange={(e) => handleInputChange('workDescription', e.target.value)}
              className="w-full"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            취소
          </Button>
          <Button onClick={handleSave}>신청하기</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
