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
import { getCachedHolidays } from '@/services/holidayApi';
import { Tooltip, TooltipTrigger, TooltipContent } from '@components/ui/tooltip';
import { TooltipIcon } from '@components/ui/tooltip';
import { getMyVacation, type MyVacationInfo } from '@/api/common/vacation';

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
  vacationDaysUsed?: number; // 실제 사용된 연차 일수 (공휴일 제외)
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
  const [calculatedVacationDays, setCalculatedVacationDays] = useState<number>(0);
  const [vacationInfo, setVacationInfo] = useState<MyVacationInfo | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof EventData, string>>>({});
  
  // 실제 근무일 수 계산 함수 (주말 및 공휴일 제외)
  const calculateWorkingDays = async (startDate: Date, endDate: Date): Promise<number> => {
    let count = 0;
    const currentDate = new Date(startDate);
    const end = new Date(endDate);
    
    // 해당 연도의 공휴일 목록 가져오기
    const year = currentDate.getFullYear();
    const holidays = await getCachedHolidays(year);
    
    // 다음 해도 범위에 포함되는 경우 처리
    const endYear = end.getFullYear();
    let nextYearHolidays: typeof holidays = [];
    if (endYear > year) {
      nextYearHolidays = await getCachedHolidays(endYear);
    }
    
    const allHolidays = [...holidays, ...nextYearHolidays];
    
    // 공휴일을 Set으로 변환 (빠른 검색을 위해)
    const holidaySet = new Set(allHolidays.map(h => h.date));
    
    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay();
      const dateString = 
        currentDate.getFullYear().toString() + 
        String(currentDate.getMonth() + 1).padStart(2, '0') + 
        String(currentDate.getDate()).padStart(2, '0');
      
      // 주말(0:일요일, 6:토요일)과 공휴일이 아닌 경우만 카운트
      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidaySet.has(dateString)) {
        count++;
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return count;
  };
  
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

  // 연차 정보 로드 (다이얼로그가 열릴 때 미리 로드)
  useEffect(() => {
    const loadVacationInfo = async () => {
      if (user?.user_id && isOpen) {
        try {
          const currentYear = new Date().getFullYear();
          const response = await getMyVacation(currentYear);
          
          // summary 배열에서 현재 연도 정보 찾기
          const currentYearInfo = response.summary.find(info => info.va_year === currentYear);
          
          if (currentYearInfo) {
            setVacationInfo(currentYearInfo);
            // 남은 휴가 일수 계산: 당해연차 + 이월연차 + 특별대휴
            const totalRemaining = 
              parseFloat(currentYearInfo.va_current || '0') +
              parseFloat(currentYearInfo.va_carryover || '0') +
              parseFloat(currentYearInfo.va_comp || '0');
            setRemainingVacationDays(totalRemaining);
          } else {
            setVacationInfo(null);
            setRemainingVacationDays(0);
          }
        } catch (error) {
          setVacationInfo(null);
          setRemainingVacationDays(0);
        }
      } else if (!isOpen) {
        // 다이얼로그가 닫힐 때 초기화
        setVacationInfo(null);
        setRemainingVacationDays(0);
      }
    };

    loadVacationInfo();
  }, [user, isOpen]);

  // 다이얼로그가 열릴 때 에러 상태 초기화
  useEffect(() => {
    if (isOpen) {
      setErrors({});
    }
  }, [isOpen]);

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
        } else if (value === 'vacationDay' || value === 'vacationOfficial') {
          // 연차/공가는 종일로 설정
          newData.allDay = true;
          newData.startTime = '09:30';
          newData.endTime = '18:30';
        }
      }
      
      return newData;
    });
    
    // 입력 시 해당 필드의 에러 메시지 제거
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  // 단일 날짜 선택 핸들러
  const handleDateSelect = (date: Date | undefined) => {
    
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
      
      setFormData(prev => {
        const newData = {
          ...prev,
          selectedDate: date,
          startDate: dateStr,
          endDate: dateStr,
          startTime: timeStr, // 시간 정보 저장
        };
        
        return newData;
      });
      
      // 날짜 선택 시 에러 제거
      if (errors.selectedDate) {
        setErrors(prev => ({
          ...prev,
          selectedDate: undefined
        }));
      }
    } else {
    }
  };

  // 날짜 범위 선택 핸들러
  const handleDateRangeSelect = async (range: DateRange | undefined) => {
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
      
      // 연차인 경우 실제 근무일 수 계산
      let vacationDays = 0;
      if (formData.category === 'vacation' && formData.eventType === 'vacationDay') {
        vacationDays = await calculateWorkingDays(range.from, range.to);
        setCalculatedVacationDays(vacationDays);
      }
      
      setFormData(prev => ({
        ...prev,
        selectedDateRange: range,
        startDate: startDateStr,
        endDate: endDateStr,
        vacationDaysUsed: vacationDays > 0 ? vacationDays : undefined,
      }));
      
      // 날짜 범위 선택 시 에러 제거
      if (errors.selectedDateRange) {
        setErrors(prev => ({
          ...prev,
          selectedDateRange: undefined
        }));
      }
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

  // 유효성 검사 함수
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof EventData, string>> = {};
    
    // 일정 유형 검증
    if (!formData.category) {
      newErrors.category = "등록하실 일정 유형을 선택해주세요.";
    }
    
    // 세부 유형 검증
    if (!formData.eventType) {
      newErrors.eventType = "세부 유형을 선택해주세요.";
    }
    
    // 날짜/기간 검증
    if (isTimeRequired) {
      // 반차/반반차인 경우 단일 날짜 선택 필요
      if (!formData.selectedDate) {
        newErrors.selectedDate = "시작일 및 시간을 선택해주세요.";
      }
    } else {
      // 연차/공가/이벤트인 경우 날짜 범위 선택 필요
      if (!formData.selectedDateRange || !formData.selectedDateRange.from || !formData.selectedDateRange.to) {
        newErrors.selectedDateRange = "기간을 선택해주세요.";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // remainingVacationDays는 이제 state로 관리됨


  const handleSave = () => {
    if (!validateForm()) {
      return; // 유효성 검사 실패 시 저장하지 않음
    }
    // if (!formData.title.trim()) {
    //   alert('제목을 입력해주세요.');
    //   return;
    // }

    // 연차 사용일수 계산
    let vacationDaysUsed = 0;
    if (formData.category === 'vacation') {
      switch (formData.eventType) {
        case 'vacationDay':
          // 연차는 이미 calculateWorkingDays로 계산된 값 사용
          vacationDaysUsed = formData.vacationDaysUsed || calculatedVacationDays || 1;
          break;
        case 'vacationHalfMorning':
        case 'vacationHalfAfternoon':
          vacationDaysUsed = 0.5;
          break;
        case 'vacationQuarterMorning':
        case 'vacationQuarterAfternoon':
          vacationDaysUsed = 0.25;
          break;
        case 'vacationOfficial':
          // 공가는 연차 차감 없음
          vacationDaysUsed = 0;
          break;
        default:
          vacationDaysUsed = 0;
      }
    }

    const eventDataToSave = {
      ...formData,
      vacationDaysUsed,
    };

    onSave(eventDataToSave);
    
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
    setCalculatedVacationDays(0);
    setErrors({}); // 에러 상태도 초기화
    
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
    setCalculatedVacationDays(0);
    setErrors({}); // 에러 상태도 초기화
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
            {errors.category && (
              <p className="text-sm text-red-500">{errors.category}</p>
            )}
          </div>

          {/* 세부 일정 타입 - 카테고리가 선택된 경우에만 표시 */}
          {formData.category && (
            <div className="space-y-3 mb-8">
              <Label>
                세부 유형을 선택해주세요.
                {formData.category === 'vacation' && (
                <>
                <p className="text-sm text-gray-600">현재 휴가가 <span className="font-semibold text-[var(--color-primary-blue-500)]">{remainingVacationDays}</span>일 남았습니다</p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="inline-flex items-center">
                      <TooltipIcon />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="flex flex-col gap-1">
                      <p>당해연차: <span className="font-semibold text-[var(--color-primary-blue-500)]">{vacationInfo ? parseFloat(vacationInfo.va_current || '0') : 0}</span>일</p>
                      <p>이월연차: <span className="font-semibold text-[var(--color-primary-blue-500)]">{vacationInfo ? parseFloat(vacationInfo.va_carryover || '0') : 0}</span>일</p>
                      <p>특별대휴: <span className="font-semibold text-[var(--color-primary-blue-500)]">{vacationInfo ? parseFloat(vacationInfo.va_comp || '0') : 0}</span>일</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
                </>
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
              {errors.eventType && (
                <p className="text-sm text-red-500">{errors.eventType}</p>
              )}
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
                    {errors.selectedDate && (
                      <p className="text-sm text-red-500">{errors.selectedDate}</p>
                    )}
                  </>
                ) : (
                  <>
                    <DatePickerWithRange 
                      selected={formData.selectedDateRange}
                      onSelect={handleDateRangeSelect}
                      placeholder="기간을 선택해주세요"
                    />
                    {formData.category === 'vacation' && formData.category === 'vacation' && calculatedVacationDays > 0 && (
                      <div className="text-xs text-gray-600 mt-1">
                        실제 사용 연차: <span className="font-semibold text-[var(--color-primary-blue-500)]">{calculatedVacationDays}일</span> (주말 및 공휴일 제외)
                      </div>
                    )}
                    {errors.selectedDateRange && (
                      <p className="text-sm text-red-500">{errors.selectedDateRange}</p>
                    )}
                  </>
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
