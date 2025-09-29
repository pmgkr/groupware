import React, { useState } from 'react';
import dayjs from 'dayjs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { Label } from '@components/ui/label';
import { Textbox } from '@components/ui/textbox';
import { Textarea } from '@components/ui/textarea';
import { RadioGroup } from '@components/ui/radio-group';
import { RadioButton } from '@components/ui/radioButton';

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
}

export default function OvertimeDialog({ isOpen, onClose, onSave, selectedDay, selectedIndex }: OvertimeDialogProps) {
  const [formData, setFormData] = useState<OvertimeData>({
    overtimeHours: "0",
    overtimeReason: "",
    clientName: "",
    workDescription: "",
    overtimeType: "special_vacation"
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
      overtimeType: "special_vacation"
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
      overtimeType: "special_vacation"
    });
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
                {dayjs(selectedDay.date).format('YYYY년 MM월 DD일')} ({selectedDay.dayOfWeek})의 초과근무를 신청합니다.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="overtime-hours">초과근무 시간</Label>
            <Textbox
              id="overtime-hours"
              type="number"
              placeholder="시간을 입력하세요"
              value={formData.overtimeHours}
              onChange={(e) => handleInputChange('overtimeHours', e.target.value)}
              className="w-full"
            />
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
