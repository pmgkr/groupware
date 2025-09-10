// client/src/components/calendar/EventDialog.tsx
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Textbox } from '../ui/textbox';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { RadioButton, RadioGroup } from '../ui/radioButton';
import { Checkbox } from '../ui/checkbox';
import DateTimePicker from './datetime';

interface EventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: EventData) => void;
  selectedDate?: Date;
}

interface EventData {
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
}

const vacationTypes = [
  { value: 'eventVacation', label: '연차' },
  { value: 'eventHalfDayMorning', label: '오전반차' },
  { value: 'eventHalfDayAfternoon', label: '오후반차' },
  { value: 'eventHalfHalfDayMorning', label: '오전반반차' },
  { value: 'eventHalfHalfDayAfternoon', label: '오후반반차' },
  { value: 'eventOfficialLeave', label: '공가' },
];

const eventTypes = [
  { value: 'eventWorkFromHome', label: '재택' },
  { value: 'eventExternal', label: '외부일정' },
];

export default function EventDialog({ isOpen, onClose, onSave, selectedDate }: EventDialogProps) {
  const [formData, setFormData] = useState<EventData>({
    title: '',
    description: '',
    startDate: selectedDate ? selectedDate.toISOString().split('T')[0] : '',
    endDate: selectedDate ? selectedDate.toISOString().split('T')[0] : '',
    startTime: '09:00',
    endTime: '18:00',
    allDay: true,
    category: '',
    eventType: '',
    author: '이연상', // 실제로는 로그인한 사용자 정보에서 가져와야 함
  });

  const handleInputChange = (field: keyof EventData, value: string | boolean) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      
      // 카테고리가 변경되면 이벤트 타입도 초기화
      if (field === 'category') {
        newData.eventType = '';
      }
      
      // 이벤트 타입이 변경되면 종료일을 시작일과 동일하게 설정
      if (field === 'eventType') {
        newData.endDate = newData.startDate;
      }
      
      return newData;
    });
  };

  // 시간 선택이 필요한 이벤트 타입인지 확인
  const isTimeRequired = formData.eventType && 
    !['eventVacation', 'eventOfficialLeave'].includes(formData.eventType);

  // datetime-local input을 위한 값 포맷팅
  const formatDateTimeValue = (date: string, time: string) => {
    if (!date || !time) return '';
    return `${date}T${time}`;
  };

  const handleSave = () => {
    // if (!formData.title.trim()) {
    //   alert('제목을 입력해주세요.');
    //   return;
    // }

    onSave(formData);
    onClose();
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      startDate: selectedDate ? selectedDate.toISOString().split('T')[0] : '',
      endDate: selectedDate ? selectedDate.toISOString().split('T')[0] : '',
      startTime: '09:00',
      endTime: '18:00',
      allDay: true,
      category: '',
      eventType: '',
      author: '이연상',
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>신규 일정 등록</DialogTitle>
          <DialogDescription>
            일정의 유형과 세부 정보를 입력해주세요.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">

          {/* 일정 카테고리 */}
          <div className="space-y-3">
            <Label>등록하실 일정 유형을 선택해주세요.</Label>
            <RadioGroup
              value={formData.category}
              onValueChange={(value) => handleInputChange('category', value)}
              className="grid grid-cols-2 gap-4"
            >
              <RadioButton
                value="vacation"
                label="휴가"
                variant="dynamic"
                size='md'
              />
              <RadioButton
                value="event"
                label="이벤트"
                variant="dynamic"
                size='md'
              />
            </RadioGroup>
          </div>

          {/* 세부 일정 타입 - 카테고리가 선택된 경우에만 표시 */}
          {formData.category && (
            <div className="space-y-3">
              <Label>세부 유형을 선택해주세요.</Label>
              <RadioGroup
                value={formData.eventType}
                onValueChange={(value) => handleInputChange('eventType', value)}
                className="grid grid-cols-3 gap-3"
              >
                {(formData.category === 'vacation' ? vacationTypes : eventTypes).map((type) => (
                  <RadioButton
                    key={type.value}
                    value={type.value}
                    label={type.label}
                    variant="dynamic"
                    size="md"
                  />
                ))}
              </RadioGroup>
            </div>
          )}

          {/* 나머지 필드들 - 세부 유형이 선택된 경우에만 표시 */}
          {formData.eventType && (
            <>

              {/* 시작일 */}
              <div className="space-y-2">
                <Label htmlFor="startDate">
                  {isTimeRequired ? '시작일과 시간을 선택해주세요.' : '시작일을 선택해주세요.'}
                </Label>
                <Textbox
                  key={`startDate-${isTimeRequired ? 'datetime' : 'date'}`}
                  id="startDate"
                  type={isTimeRequired ? "datetime-local" : "date"}
                  value={isTimeRequired ? formatDateTimeValue(formData.startDate, formData.startTime) : formData.startDate}
                  onChange={(e) => {
                    if (isTimeRequired) {
                      const [date, time] = e.target.value.split('T');
                      if (date) handleInputChange('startDate', date);
                      if (time) handleInputChange('startTime', time);
                    } else {
                      handleInputChange('startDate', e.target.value);
                    }
                  }}
                  className="w-full"
                />
              </div>

              {/* 종료일 */}
              <div className="space-y-2">
                <Label htmlFor="endDate">
                  {isTimeRequired ? '종료일과 시간을 선택해주세요.' : '종료일을 선택해주세요.'}
                </Label>
                <Textbox
                  key={`endDate-${isTimeRequired ? 'datetime' : 'date'}`}
                  id="endDate"
                  type={isTimeRequired ? "datetime-local" : "date"}
                  value={isTimeRequired ? formatDateTimeValue(formData.endDate, formData.endTime) : formData.endDate}
                  onChange={(e) => {
                    if (isTimeRequired) {
                      const [date, time] = e.target.value.split('T');
                      if (date) handleInputChange('endDate', date);
                      if (time) handleInputChange('endTime', time);
                    } else {
                      handleInputChange('endDate', e.target.value);
                    }
                  }}
                  className="w-full"
                />
              </div>

              {/* 설명 */}
              <div className="space-y-2">
                <Label htmlFor="description">설명</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="일정에 대한 설명을 입력하세요"
                  rows={3}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            취소
          </Button>
          <Button onClick={handleSave}>
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
