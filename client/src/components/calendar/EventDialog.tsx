// client/src/components/calendar/EventDialog.tsx
import React, { useState, useEffect } from 'react';
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
import { scheduleApi } from '@/api/calendar';
import { useAuth } from '@/contexts/AuthContext';

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
  { value: 'vacationDay', label: '연차' },
  { value: 'vacationHalfMorning', label: '오전반차' },
  { value: 'vacationHalfAfternoon', label: '오후반차' },
  { value: 'vacationQuarterMorning', label: '오전반반차' },
  { value: 'vacationQuarterAfternoon', label: '오후반반차' },
  { value: 'vacationOfficial', label: '공가' },
];

const eventTypes = [
  { value: 'eventRemote', label: '재택' },
  { value: 'eventField', label: '외부 일정' },
];

export default function EventDialog({ isOpen, onClose, onSave, selectedDate }: EventDialogProps) {
  const { user } = useAuth();
  const [remainingVacationDays, setRemainingVacationDays] = useState<number>(0);
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
    author: user?.user_name || '이연상',
    selectedDate: undefined,
    selectedDateRange: undefined,
  });

  // 연차 정보 로드
  useEffect(() => {
    const loadVacationInfo = async () => {
      if (user?.user_id && isOpen) {
        try {
          const currentYear = new Date().getFullYear();
          const vacationInfo = await scheduleApi.getUserVacations(user.user_id, currentYear);
          setRemainingVacationDays(parseFloat(vacationInfo.va_remaining));
        } catch (error) {
          console.error('연차 정보를 불러오는데 실패했습니다:', error);
          setRemainingVacationDays(0);
        }
      }
    };

    loadVacationInfo();
  }, [user, isOpen]);

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
      
      // 이벤트 타입이 변경되면 설정
      if (field === 'eventType' && typeof value === 'string') {
        newData.endDate = newData.startDate;
        
        // 반차/반반차인 경우 allDay를 false로 설정 (시간은 DateTimePicker에서 선택)
        if (['vacationHalfMorning', 'vacationHalfAfternoon', 'vacationQuarterMorning', 'vacationQuarterAfternoon'].includes(value)) {
          newData.allDay = false;
          // startTime은 DateTimePicker에서 선택될 때 설정됨
          console.log('반차/반반차 타입 선택:', value);
          console.log('allDay를 false로 설정 (시간은 DateTimePicker에서 선택 필요)');
        } else if (value === 'vacationDay' || value === 'vacationOfficial') {
          // 연차/공가는 종일로 설정
          newData.allDay = true;
          newData.startTime = '09:30';
          newData.endTime = '18:30';
        }
      }
      
      return newData;
    });
  };

  // 단일 날짜 선택 핸들러
  const handleDateSelect = (date: Date | undefined) => {
    console.log('=== handleDateSelect 호출 ===');
    console.log('선택된 date:', date);
    
    if (date) {
      // 로컬 시간 기준으로 YYYY-MM-DD 문자열 생성
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      // 시간 정보 추출 (HH:mm 형식)
      const hour = String(date.getHours()).padStart(2, '0');
      const minute = String(date.getMinutes()).padStart(2, '0');
      const timeStr = `${hour}:${minute}`;
      
      console.log('생성된 dateStr:', dateStr);
      console.log('생성된 timeStr:', timeStr);
      console.log('hour:', hour, 'minute:', minute);
      
      setFormData(prev => {
        const newData = {
          ...prev,
          selectedDate: date,
          startDate: dateStr,
          endDate: dateStr,
          startTime: timeStr, // 시간 정보 저장
        };
        
        console.log('업데이트된 formData.startTime:', newData.startTime);
        return newData;
      });
    } else {
      console.log('date가 undefined입니다');
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
    ['vacationHalfMorning', 'vacationHalfAfternoon', 'vacationQuarterMorning', 'vacationQuarterAfternoon'].includes(formData.eventType);

  // 반차/반반차 시간 제한 설정
  const getTimeRestriction = () => {
    switch (formData.eventType) {
      case 'vacationHalfMorning':
        return { startHour: 9, startMinute: 30, endHour: 10, endMinute: 0 };
      case 'vacationQuarterMorning':
        return { startHour: 9, startMinute: 30, endHour: 10, endMinute: 0 };
      case 'vacationHalfAfternoon':
        return { startHour: 14, startMinute: 30, endHour: 15, endMinute: 0 };
      case 'vacationQuarterAfternoon':
        return { startHour: 16, startMinute: 30, endHour: 17, endMinute: 0 };
      default:
        return undefined;
    }
  };


  // remainingVacationDays는 이제 state로 관리됨


  const handleSave = () => {
    // if (!formData.title.trim()) {
    //   alert('제목을 입력해주세요.');
    //   return;
    // }

    console.log('=== EventDialog handleSave ===');
    console.log('저장할 formData:', JSON.stringify(formData, null, 2));
    console.log('formData.startTime:', formData.startTime);
    console.log('formData.endTime:', formData.endTime);
    console.log('formData.eventType:', formData.eventType);
    console.log('formData.selectedDate:', formData.selectedDate);

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
                  <>
                    <DateTimePicker24h 
                      selected={formData.selectedDate}
                      onSelect={handleDateSelect}
                      placeholder="휴가 사용일과 시간을 선택해주세요"
                      timeRestriction={getTimeRestriction()}
                    />
                    <div className="text-xs text-gray-600 mt-1">
                      선택된 시간: {formData.startTime || '없음'}
                    </div>
                  </>
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
