// client/src/components/calendar/EventDialog.tsx
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '@components/ui/button';
import { Label } from '@components/ui/label';
import { Textarea } from '@components/ui/textarea';
import { RadioButton, RadioGroup } from '@components/ui/radioButton';
import { Checkbox } from '@components/ui/checkbox';
import { DatePickerDemo } from '@/components/date-n-time/date-picker';
import { DatePickerWithRange } from '@/components/date-n-time/date-picker-range';
import { DateTimePicker24h } from '@/components/date-n-time/date-time-picker-24h';
import type { DateRange } from 'react-day-picker';

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
  selectedDate?: Date; // 단일 날짜 선택용
  selectedDateRange?: DateRange; // 날짜 범위 선택용
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
  { value: 'eventExternal', label: '외부 일정' },
];

export default function EventDialog({ isOpen, onClose, onSave, selectedDate }: EventDialogProps) {
  const [formData, setFormData] = useState<EventData>({
    title: '',
    description: '',
    startDate: selectedDate ? (() => {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    })() : '',
    endDate: selectedDate ? (() => {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    })() : '',
    startTime: '09:30',
    endTime: '18:30',
    allDay: true,
    category: '',
    eventType: '',
    author: '이연상', // 실제로는 로그인한 사용자 정보에서 가져와야 함
    selectedDate: undefined,
    selectedDateRange: undefined,
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

  // 단일 날짜 선택 핸들러
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      // 로컬 시간 기준으로 YYYY-MM-DD 문자열 생성
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      setFormData(prev => ({
        ...prev,
        selectedDate: date,
        startDate: dateStr,
        endDate: dateStr,
      }));
    }
  };

  // 날짜 범위 선택 핸들러
  const handleDateRangeSelect = (range: DateRange | undefined) => {
    if (range && range.from && range.to) {
      // 로컬 시간 기준으로 YYYY-MM-DD 문자열 생성
      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const startDateStr = formatDate(range.from);
      const endDateStr = formatDate(range.to);
      
      setFormData(prev => ({
        ...prev,
        selectedDateRange: range,
        startDate: startDateStr,
        endDate: endDateStr,
      }));
    }
  };

  // 시간 선택이 필요한 이벤트 타입인지 확인 (반차/반반차일때 시간 필요)
  const isTimeRequired = formData.eventType && 
    ['eventHalfDayMorning', 'eventHalfDayAfternoon', 'eventHalfHalfDayMorning', 'eventHalfHalfDayAfternoon'].includes(formData.eventType);

  // 반차/반반차 시간 제한 설정
  const getTimeRestriction = () => {
    switch (formData.eventType) {
      case 'eventHalfDayMorning':
        return { startHour: 9, startMinute: 30, endHour: 10, endMinute: 0 };
      case 'eventHalfHalfDayMorning':
        return { startHour: 9, startMinute: 30, endHour: 10, endMinute: 0 };
      case 'eventHalfDayAfternoon':
        return { startHour: 14, startMinute: 30, endHour: 15, endMinute: 0 };
      case 'eventHalfHalfDayAfternoon':
        return { startHour: 16, startMinute: 30, endHour: 17, endMinute: 0 };
      default:
        return undefined;
    }
  };


  // 휴가 일수 계산 (임시로 10일로 설정, 실제로는 API에서 가져와야 함)
  const remainingVacationDays = 10;


  const handleSave = () => {
    // if (!formData.title.trim()) {
    //   alert('제목을 입력해주세요.');
    //   return;
    // }

    onSave(formData);
    
    // 폼 데이터 리셋
    setFormData({
      title: '',
      description: '',
      startDate: selectedDate ? (() => {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      })() : '',
      endDate: selectedDate ? (() => {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      })() : '',
      startTime: '09:30',
      endTime: '18:30',
      allDay: true,
      category: '',
      eventType: '',
      author: '이연상',
      selectedDate: undefined,
      selectedDateRange: undefined,
    });
    
    onClose();
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      startDate: selectedDate ? (() => {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      })() : '',
      endDate: selectedDate ? (() => {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      })() : '',
      startTime: '09:00',
      endTime: '18:00',
      allDay: true,
      category: '',
      eventType: '',
      author: '이연상',
      selectedDate: undefined,
      selectedDateRange: undefined,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>신규 일정 등록</DialogTitle>
          <DialogDescription>
            등록하실 일정 정보를 입력하는 곳입니다.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">

          {/* 일정 카테고리 */}
          <div className="space-y-3 mb-8">
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
                className='mb-0'
              />
              <RadioButton
                value="event"
                label="이벤트"
                variant="dynamic"
                size='md'
                className='mb-0'
              />
            </RadioGroup>
          </div>

          {/* 세부 일정 타입 - 카테고리가 선택된 경우에만 표시 */}
          {formData.category && (
            <div className="space-y-3 mb-8">
              <Label>
                세부 유형을 선택해주세요.
                {formData.category === 'vacation' && (
                    <small className="text-sm text-gray-600">
                        (현재 휴가가 <span className="text-[var(--color-primary-blue-500)]">{remainingVacationDays}</span>일 남았습니다)
                    </small>
                )}    
            </Label>
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
                    className='mb-0'
                  />
                ))}
              </RadioGroup>
              
            </div>
          )}

          {/* 나머지 필드들 - 세부 유형이 선택된 경우에만 표시 */}
          {formData.eventType && (
            <>

              {/* 시작일 */}
              <div className="space-y-2 mb-8">
                <Label htmlFor="startDate">
                  {isTimeRequired ? '시작일 및 시간을 선택해주세요.' : '기간을 선택해주세요.'}
                </Label>
                {isTimeRequired ? (
                  <DateTimePicker24h 
                    selected={formData.selectedDate}
                    onSelect={handleDateSelect}
                    placeholder="휴가 사용일과 시간을 선택해주세요"
                    timeRestriction={getTimeRestriction()}
                  />
                ) : (
                  <DatePickerWithRange 
                    selected={formData.selectedDateRange}
                    onSelect={handleDateRangeSelect}
                    placeholder="기간을 선택해주세요"
                  />
                )}
              </div>


              {/* 설명 */}
              <div className="space-y-2 mb-8">
                <Label htmlFor="description">기타 설명을 기입해주세요.</Label>
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
