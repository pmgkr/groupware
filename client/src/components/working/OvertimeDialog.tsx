import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { Label } from '@components/ui/label';
import { Textarea } from '@components/ui/textarea';
import { RadioGroup } from '@components/ui/radio-group';
import { RadioButton } from '@components/ui/radioButton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import type { WorkData } from '@/types/working';
import { useAuth } from '@/contexts/AuthContext';
import { workingApi } from '@/api/working';
import { managerOvertimeApi } from '@/api/manager/overtime';
import { buildOvertimeApiParams } from '@/utils/overtimeHelper';
import { getClientList, type ClientList } from '@/api/common/project';

interface OvertimeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: OvertimeData) => void;
  onCancel?: () => void;
  selectedDay?: WorkData;
}

interface OvertimeData {
  overtimeHours: string;
  overtimeMinutes: string;
  overtimeReason: string;
  clientName: string;
  workDescription: string;
  overtimeType: string;
  expectedStartTime: string;
  expectedStartTimeMinute: string;
  expectedEndTime: string;
  expectedEndMinute: string;
  mealAllowance: string;
  transportationAllowance: string;
}

const initialFormData: OvertimeData = {
  overtimeHours: "",
  overtimeMinutes: "",
  overtimeReason: "",
  clientName: "",
  workDescription: "",
  overtimeType: "",
  expectedStartTime: "",
  expectedStartTimeMinute: "",
  expectedEndTime: "",
  expectedEndMinute: "",
  mealAllowance: "",
  transportationAllowance: ""
};

export default function OvertimeDialog({ isOpen, onClose, onSave, onCancel, selectedDay }: OvertimeDialogProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<OvertimeData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof OvertimeData, string>>>({});
  const [clientList, setClientList] = useState<ClientList[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getClientList().then(setClientList).catch(() => setClientList([]));
    }
  }, [isOpen]);

  const handleInputChange = (field: keyof OvertimeData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof OvertimeData, string>> = {};
    
    if (!formData.clientName.trim()) {
      newErrors.clientName = "클라이언트명을 선택해주세요.";
    }
    if (!formData.workDescription.trim()) {
      newErrors.workDescription = "작업 내용을 입력해주세요.";
    }
    
    if (selectedDay && !isWeekendOrHoliday(selectedDay.dayOfWeek, selectedDay.workType)) {
      // 평일: 퇴근 시간만 검증
      if (!formData.expectedEndTime) newErrors.expectedEndTime = "예상 퇴근 시간을 선택해주세요.";
      if (!formData.expectedEndMinute) newErrors.expectedEndMinute = "예상 퇴근 분을 선택해주세요.";
      if (!formData.mealAllowance) newErrors.mealAllowance = "식대 사용여부를 선택해주세요.";
      if (!formData.transportationAllowance) newErrors.transportationAllowance = "교통비 사용여부를 선택해주세요.";
    }
    
    if (selectedDay && isWeekendOrHoliday(selectedDay.dayOfWeek, selectedDay.workType)) {
      // 주말/공휴일: 출근 시간과 퇴근 시간 검증 (ot_hours는 자동 계산)
      if (!formData.expectedStartTime) newErrors.expectedStartTime = "예상 출근 시간을 선택해주세요.";
      if (!formData.expectedStartTimeMinute) newErrors.expectedStartTimeMinute = "예상 출근 분을 선택해주세요.";
      if (!formData.expectedEndTime) newErrors.expectedEndTime = "예상 퇴근 시간을 선택해주세요.";
      if (!formData.expectedEndMinute) newErrors.expectedEndMinute = "예상 퇴근 분을 선택해주세요.";
      if (!formData.overtimeType) newErrors.overtimeType = "보상 지급방식을 선택해주세요.";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !selectedDay) return;
    
    setIsSubmitting(true);
    
    try {
      const apiParams = buildOvertimeApiParams(selectedDay, formData);
      const response = await workingApi.requestOvertime(apiParams);
      
      const isManagerOrAdmin = user?.user_level === 'manager' || user?.user_level === 'admin';
      if (isManagerOrAdmin) {
        let otSeq = response?.ot_seq || response?.id || response?.data?.ot_seq || response?.data?.id;
        
        if (!otSeq) {
          try {
            const formattedDate = selectedDay.date.includes('T') 
              ? selectedDay.date.split('T')[0] 
              : selectedDay.date;
            
            for (let retryCount = 0; retryCount < 5 && !otSeq; retryCount++) {
              if (retryCount > 0) {
                await new Promise(resolve => setTimeout(resolve, 300));
              }
              
              const overtimeList = await workingApi.getOvertimeList({
                page: 1,
                size: 20,
                user_id: user?.user_id
              });
              
              const pendingOvertimes = overtimeList.items?.filter(
                (item: any) => item.ot_date === formattedDate && item.ot_status === 'H'
              ) || [];
              
              if (pendingOvertimes.length > 0) {
                const latestOvertime = pendingOvertimes.reduce((latest: any, current: any) => {
                  const latestTime = new Date(latest.ot_created_at || 0).getTime();
                  const currentTime = new Date(current.ot_created_at || 0).getTime();
                  return currentTime > latestTime ? current : latest;
                });
                otSeq = latestOvertime.id;
                break;
              }
            }
          } catch {
            // 목록 조회 실패 시 무시
          }
        }
        
        if (otSeq) {
          try {
            await managerOvertimeApi.approveOvertime(otSeq);
          } catch {
            // 자동 승인 실패해도 신청은 성공했으므로 계속 진행
          }
        }
      }
      
      onSave(formData);
      onClose();
      setFormData(initialFormData);
      setErrors({});
    } catch (error: any) {
      const errorMessage = error?.message || error?.response?.data?.message || '알 수 없는 오류가 발생했습니다.';
      alert(`추가근무 신청에 실패했습니다.\n오류: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    setFormData(initialFormData);
    setErrors({});
  };

  const isWeekendOrHoliday = (dayOfWeek: string, workType: string) => {
    return dayOfWeek === '토' || dayOfWeek === '일' || workType === '공휴일';
  };

  const isSaturday = (dayOfWeek: string) => dayOfWeek === '토';
  const isSundayOrHoliday = (dayOfWeek: string, workType: string) => {
    return dayOfWeek === '일' || workType === '공휴일';
  };

  useEffect(() => {
    if (isOpen) {
      if (selectedDay?.overtimeData) {
        setFormData({
          overtimeHours: selectedDay.overtimeData.overtimeHours || "",
          overtimeMinutes: selectedDay.overtimeData.overtimeMinutes || "",
          overtimeReason: "",
          clientName: selectedDay.overtimeData.clientName || "",
          workDescription: selectedDay.overtimeData.workDescription || "",
          overtimeType: selectedDay.overtimeData.overtimeType || "",
          expectedStartTime: selectedDay.overtimeData.expectedStartTime || "",
          expectedStartTimeMinute: selectedDay.overtimeData.expectedStartTimeMinute || "",
          expectedEndTime: selectedDay.overtimeData.expectedEndTime || "",
          expectedEndMinute: selectedDay.overtimeData.expectedEndMinute || "",
          mealAllowance: selectedDay.overtimeData.mealAllowance || "",
          transportationAllowance: selectedDay.overtimeData.transportationAllowance || ""
        });
      } else {
        setFormData(initialFormData);
      }
      setErrors({});
    }
  }, [isOpen, selectedDay]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>추가근무 신청</DialogTitle>
          <DialogDescription>
            {selectedDay && `${dayjs(selectedDay.date).format('YYYY년 MM월 DD일')} ${selectedDay.dayOfWeek}요일의 추가근무를 신청합니다.`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* 평일 (월-금) 신청 시 표시되는 내용 */}
          {selectedDay && !isWeekendOrHoliday(selectedDay.dayOfWeek, selectedDay.workType) && (
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

          {/* 주말 (토, 일) 또는 공휴일 신청 시 표시되는 내용 */}
          {selectedDay && isWeekendOrHoliday(selectedDay.dayOfWeek, selectedDay.workType) && (
            <>
              <div className="space-y-3">
                <Label htmlFor="expected-start-time">예상 출근 시간을 선택해주세요.</Label>
                <div className="flex gap-2">
                  <Select
                    key="expected-start-time"
                    value={formData.expectedStartTime || undefined}
                    onValueChange={(value) => handleInputChange('expectedStartTime', value)}
                  >
                    <SelectTrigger className={`flex-1 ${errors.expectedStartTime ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="시간을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent className="z-[200]">
                      <SelectItem value="6">06시</SelectItem>
                      <SelectItem value="7">07시</SelectItem>
                      <SelectItem value="8">08시</SelectItem>
                      <SelectItem value="9">09시</SelectItem>
                      <SelectItem value="10">10시</SelectItem>
                      <SelectItem value="11">11시</SelectItem>
                      <SelectItem value="12">12시</SelectItem>
                      <SelectItem value="13">13시</SelectItem>
                      <SelectItem value="14">14시</SelectItem>
                      <SelectItem value="15">15시</SelectItem>
                      <SelectItem value="16">16시</SelectItem>
                      <SelectItem value="17">17시</SelectItem>
                      <SelectItem value="18">18시</SelectItem>
                      <SelectItem value="19">19시</SelectItem>
                      <SelectItem value="20">20시</SelectItem>
                      <SelectItem value="21">21시</SelectItem>
                      <SelectItem value="22">22시</SelectItem>
                      <SelectItem value="23">23시</SelectItem>
                      <SelectItem value="24">24시</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    key="expected-end-minute"
                    value={formData.expectedStartTimeMinute || undefined}
                    onValueChange={(value) => handleInputChange('expectedStartTimeMinute', value)}
                  >
                    <SelectTrigger className={`flex-1 ${errors.expectedStartTimeMinute ? 'border-red-500' : ''}`}>
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
                {(errors.expectedStartTime || errors.expectedStartTimeMinute) && (
                  <p className="text-sm text-red-500">
                    {errors.expectedStartTime || errors.expectedStartTimeMinute}
                  </p>
                )}
              </div>
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
                      <SelectItem value="12">12시</SelectItem>
                      <SelectItem value="13">13시</SelectItem>
                      <SelectItem value="14">14시</SelectItem>
                      <SelectItem value="15">15시</SelectItem>
                      <SelectItem value="16">16시</SelectItem>
                      <SelectItem value="17">17시</SelectItem>
                      <SelectItem value="18">18시</SelectItem>
                      <SelectItem value="19">19시</SelectItem>
                      <SelectItem value="20">20시</SelectItem>
                      <SelectItem value="21">21시</SelectItem>
                      <SelectItem value="22">22시</SelectItem>
                      <SelectItem value="23">23시</SelectItem>
                      <SelectItem value="24">24시</SelectItem>
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
            <Label htmlFor="client-name">클라이언트명을 선택해주세요.</Label>
            <Select
              key="client-name"
              value={formData.clientName}
              onValueChange={(value) => handleInputChange('clientName', value)}
            >
              <SelectTrigger className={`w-full ${errors.clientName ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="클라이언트명을 선택하세요" />
              </SelectTrigger>
              <SelectContent className="z-[200]">
                {clientList.map((client) => (
                  <SelectItem key={client.cl_seq} value={client.cl_name}>
                    {client.cl_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.clientName && (
              <p className="text-sm text-red-500">{errors.clientName}</p>
            )}
          </div>
          
          <div className="space-y-3">
            <Label htmlFor="work-description">작업 내용을 작성해주세요.</Label>
            <Textarea
              id="work-description"
              placeholder="작업 내용을 입력하세요"
              maxLength={500}
              value={formData.workDescription}
              onChange={(e) => handleInputChange('workDescription', e.target.value)}
              className="w-full"
              errorMessage={errors.workDescription}
            />
          </div>
        </div>
        <DialogFooter>
          {selectedDay?.overtimeStatus === '승인대기' ? (
            <>
              <Button variant="destructive" onClick={onCancel}>신청 취소하기</Button>
              <Button variant="outline" onClick={handleClose}>닫기</Button>
            </>
          ) : (
            <>
              <Button onClick={handleSave} disabled={isSubmitting}>
                {isSubmitting ? '처리 중' : '신청하기'}
              </Button>
              <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>닫기</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
