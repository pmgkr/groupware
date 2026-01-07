import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { Label } from '@components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { CheckCircle, OctagonAlert } from 'lucide-react';
import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';
import { notificationApi } from '@/api/notification';
import { getWeekStartDate, getWeekNumber } from '@/utils/dateHelper';
import { useAuth } from '@/contexts/AuthContext';
interface WorkTimeEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (startTime: string, endTime: string) => Promise<void>;
  userId: string;
  userName: string;
  date: string;
  startTime: string;
  endTime: string;
}

export default function WorkTimeEditDialog({
  isOpen,
  onClose,
  onSave,
  userId,
  userName,
  date,
  startTime,
  endTime
}: WorkTimeEditDialogProps) {
  const { addAlert } = useAppAlert();
  const { user } = useAuth();
  const [startHour, setStartHour] = useState('');
  const [startMinute, setStartMinute] = useState('');
  const [endHour, setEndHour] = useState('');
  const [endMinute, setEndMinute] = useState('');
  const [isEndTimeNextDay, setIsEndTimeNextDay] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{
    startHour?: string;
    startMinute?: string;
    endHour?: string;
    endMinute?: string;
  }>({});

  // 시간 문자열을 시와 분으로 분리하는 함수 (익일 시간 처리 포함)
  const parseTime = (time: string, isEndTime: boolean = false) => {
    if (!time || time === '-') return { hour: '', minute: '', isNextDay: false };
    const [hour, minute] = time.split(':');
    const hourNum = parseInt(hour || '0', 10);
    
    // 24시 이상인 경우 익일 시간으로 처리
    if (hourNum >= 24) {
      return {
        hour: (hourNum - 24).toString().padStart(2, '0'),
        minute: minute || '',
        isNextDay: true
      };
    }
    
    // 퇴근 시간이고 00-11시인 경우 자동으로 익일로 처리
    if (isEndTime && hourNum >= 0 && hourNum < 12) {
      return {
        hour: hour || '',
        minute: minute || '',
        isNextDay: true
      };
    }
    
    return { hour: hour || '', minute: minute || '', isNextDay: false };
  };

  // 시와 분을 시간 문자열로 합치는 함수 (익일 시간 처리 포함)
  const formatTime = (hour: string, minute: string, isNextDay: boolean = false) => {
    if (!hour || !minute) return '';
    const hourNum = parseInt(hour, 10);
    // 익일 시간인 경우 24를 더함
    const finalHour = isNextDay ? hourNum + 24 : hourNum;
    return `${finalHour.toString().padStart(2, '0')}:${minute.padStart(2, '0')}`;
  };

  
  // 출근 시간 옵션 생성 (07-17시)
  const startHourOptions = Array.from({ length: 11 }, (_, i) => (i + 7).toString().padStart(2, '0'));
  // 분 옵션 생성 (00-59)
  const minuteOptions = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
  
  // 퇴근 시간 옵션 생성 (12-23시 + 익일 00-07시)
  // value는 고유하게 만들기 위해 익일 시간은 "24", "25" 등으로 저장
  const endHourOptions = [
    // 오늘 12-23시
    ...Array.from({ length: 12 }, (_, i) => ({
      value: (i + 12).toString().padStart(2, '0'),
      label: `${(i + 12).toString().padStart(2, '0')}시`,
      isNextDay: false,
      displayHour: (i + 12).toString().padStart(2, '0')
    })),
    // 익일 00-07시 (value는 24-31로 저장, 표시는 00-07)
    ...Array.from({ length: 8 }, (_, i) => ({
      value: (i + 24).toString().padStart(2, '0'),
      label: `익일 ${i.toString().padStart(2, '0')}시`,
      isNextDay: true,
      displayHour: i.toString().padStart(2, '0')
    }))
  ];
  
  // endHour를 실제 hour 값으로 변환 (저장용)
  const getEndHourValue = () => {
    if (!endHour) return '';
    const hourNum = parseInt(endHour, 10);
    // 24 이상인 경우 익일 시간
    if (hourNum >= 24) {
      return (hourNum - 24).toString().padStart(2, '0');
    }
    return endHour;
  };
  
  // endHour 설정 (익일 여부 포함)
  const setEndHourWithNextDay = (value: string, isNextDay: boolean) => {
    if (isNextDay) {
      const hourNum = parseInt(value, 10);
      setEndHour((hourNum + 24).toString().padStart(2, '0'));
    } else {
      setEndHour(value);
    }
    setIsEndTimeNextDay(isNextDay);
  };
  
  // 현재 선택된 퇴근 시간의 Select value 계산
  // endHour는 이미 Select의 value 형식으로 저장되어 있음 (12-23 또는 24-31)
  const currentEndHourValue = endHour || '';

  // 다이얼로그가 열릴 때 초기값 설정
  useEffect(() => {
    if (isOpen) {
      const start = parseTime(startTime, false);
      const end = parseTime(endTime, true); // 퇴근 시간은 isEndTime=true로 전달
      
      setStartHour(start.hour);
      setStartMinute(start.minute);
      
      // 퇴근 시간 초기값 설정
      if (end.hour && end.minute) {
        // 다음날 시간인 경우 endHour를 24+hour로 설정
        if (end.isNextDay) {
          const hourNum = parseInt(end.hour, 10);
          const endHourValue = (hourNum + 24).toString().padStart(2, '0');
          setEndHour(endHourValue);
          setIsEndTimeNextDay(true);
        } else {
          setEndHour(end.hour);
          setIsEndTimeNextDay(false);
        }
        setEndMinute(end.minute);
      } else {
        setEndHour('');
        setEndMinute('');
        setIsEndTimeNextDay(false);
      }
    } else {
      // 다이얼로그가 닫힐 때 초기화
      setStartHour('');
      setStartMinute('');
      setEndHour('');
      setEndMinute('');
      setIsEndTimeNextDay(false);
      setErrors({});
    }
  }, [isOpen, startTime, endTime]);

  // Validation 체크
  const validate = () => {
    const newErrors: typeof errors = {};
    
    if (!startHour) {
      newErrors.startHour = '시를를 선택해주세요.';
    }
    if (!startMinute) {
      newErrors.startMinute = '분을 선택해주세요.';
    }
    if (!endHour) {
      newErrors.endHour = '시를 선택해주세요.';
    }
    if (!endMinute) {
      newErrors.endMinute = '분을 선택해주세요.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    setIsSaving(true);
    try {
      const formattedStartTime = formatTime(startHour, startMinute);
      const actualEndHour = getEndHourValue();
      const formattedEndTime = formatTime(actualEndHour, endMinute, isEndTimeNextDay);
      
      await onSave(formattedStartTime, formattedEndTime);

      // 출퇴근시간이 수정된 대상자에게 알림 전송
      if (user?.user_id && user?.user_name) {
        try {
          // 날짜를 주차로 변환
          const dateObj = new Date(date);
          const weekStartDate = getWeekStartDate(dateObj);
          const { year, week } = getWeekNumber(weekStartDate);
          
          await notificationApi.registerNotification({
            user_id: userId,
            user_name: userName,
            noti_target: user.user_id,
            noti_title: `${dayjs(date).format('YYYY년 MM월 DD일')}의 출퇴근 시간`,
            noti_message: `${user.user_name}님이 출퇴근 시간을 수정하셨습니다.`,
            noti_type: 'worktime',
            noti_url: `/working?year=${year}&week=${week}`,
          });
        } catch (e) {
          // 알림 전송 실패는 무시 (에러 로그 제거)
        }
      }

      addAlert({
        title: `출퇴근 시간 수정 완료`,
        message: `${userName}님의 ${dayjs(date).format('YYYY년 MM월 DD일')}의 출퇴근 시간 수정이 완료되었습니다.`,
        icon: <CheckCircle />,
        duration: 3000,
      });
      onClose();
    } catch (error: any) {
      const errorMessage = error?.message || error?.toString() || '알 수 없는 오류';
      addAlert({
        title: `출퇴근 시간 수정 실패`,
        message: `${userName}의 ${dayjs(date).format('YYYY년 MM월 DD일')}의 출퇴근 시간 수정에 실패했습니다.\n\n에러: ${errorMessage}.`,
        icon: <OctagonAlert />,
        duration: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // 출근 시간 시 변경 핸들러
  const handleStartHourChange = (value: string) => {
    setStartHour(value);
    setErrors(prev => ({ ...prev, startHour: undefined }));
  };

  // 출근 시간 분 변경 핸들러
  const handleStartMinuteChange = (value: string) => {
    setStartMinute(value);
    setErrors(prev => ({ ...prev, startMinute: undefined }));
  };

  // 퇴근 시간 변경 핸들러
  const handleEndHourChange = (value: string) => {
    const selectedOption = endHourOptions.find(opt => opt.value === value);
    if (selectedOption) {
      setEndHourWithNextDay(selectedOption.displayHour, selectedOption.isNextDay);
      setErrors(prev => ({ ...prev, endHour: undefined }));
    }
  };

  // 퇴근 시간 분 변경 핸들러
  const handleEndMinuteChange = (value: string) => {
    setEndMinute(value);
    setErrors(prev => ({ ...prev, endMinute: undefined }));
  };

  const handleClose = () => {
    if (!isSaving) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>출퇴근 시간 수정</DialogTitle>
          <DialogDescription>
            {userName} - {dayjs(date).format('YYYY년 MM월 DD일 (ddd)')}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 w-full">
          <div className="space-y-2 w-full">
            <Label className='gap-0.5'>출근 시간 <span className="text-red-500">*</span></Label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Select 
                  value={startHour} 
                  onValueChange={handleStartHourChange} 
                  disabled={isSaving}
                  required
                >
                  <SelectTrigger className={`w-full ${errors.startHour ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="시" />
                  </SelectTrigger>
                  <SelectContent>
                    {startHourOptions.map((hour) => (
                      <SelectItem key={hour} value={hour}>
                        {hour}시
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.startHour && (
                  <p className="text-xs text-red-500 mt-1">{errors.startHour}</p>
                )}
              </div>
              <div className="flex-1">
                <Select 
                  value={startMinute} 
                  onValueChange={handleStartMinuteChange} 
                  disabled={isSaving}
                  required
                >
                  <SelectTrigger className={`w-full ${errors.startMinute ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="분" />
                  </SelectTrigger>
                  <SelectContent>
                    {minuteOptions.map((minute) => (
                      <SelectItem key={minute} value={minute}>
                        {minute}분
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.startMinute && (
                  <p className="text-xs text-red-500 mt-1">{errors.startMinute}</p>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-2 w-full">
            <Label className='gap-0.5'>퇴근 시간 <span className="text-red-500">*</span></Label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Select 
                  key={`end-hour-${currentEndHourValue}-${isOpen}`}
                  value={currentEndHourValue || undefined} 
                  onValueChange={handleEndHourChange} 
                  disabled={isSaving}
                  required
                >
                  <SelectTrigger className={`w-full ${errors.endHour ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="시" />
                  </SelectTrigger>
                  <SelectContent>
                    {endHourOptions.map((option) => (
                      <SelectItem key={`${option.value}-${option.isNextDay}`} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.endHour && (
                  <p className="text-xs text-red-500 mt-1">{errors.endHour}</p>
                )}
              </div>
              <div className="flex-1">
                <Select 
                  value={endMinute} 
                  onValueChange={handleEndMinuteChange} 
                  disabled={isSaving}
                  required
                >
                  <SelectTrigger className={`w-full ${errors.endMinute ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="분" />
                  </SelectTrigger>
                  <SelectContent>
                    {minuteOptions.map((minute) => (
                      <SelectItem key={minute} value={minute}>
                        {minute}분
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.endMinute && (
                  <p className="text-xs text-red-500 mt-1">{errors.endMinute}</p>
                )}
              </div>
            </div>
          </div>

        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? '저장 중' : '저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

