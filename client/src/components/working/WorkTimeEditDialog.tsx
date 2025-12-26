import React, { useState, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { Label } from '@components/ui/label';
import { Input } from '@components/ui/input';

interface WorkTimeEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (startTime: string, endTime: string) => Promise<void>;
  userName: string;
  date: string;
  startTime: string;
  endTime: string;
}

export default function WorkTimeEditDialog({
  isOpen,
  onClose,
  onSave,
  userName,
  date,
  startTime,
  endTime
}: WorkTimeEditDialogProps) {
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const startInputRef = useRef<HTMLInputElement | null>(null);
  const endInputRef = useRef<HTMLInputElement | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const openNativePicker = (ref: React.RefObject<HTMLInputElement | null>) => {
    const el = ref.current;
    if (!el) return;
    if (typeof (el as HTMLInputElement & { showPicker?: () => void }).showPicker === 'function') {
      (el as HTMLInputElement & { showPicker?: () => void }).showPicker();
    } else {
      el.focus();
    }
  };

  // 다이얼로그가 열릴 때 초기값 설정
  useEffect(() => {
    if (isOpen) {
      setEditStartTime(startTime && startTime !== '-' ? startTime : '');
      setEditEndTime(endTime && endTime !== '-' ? endTime : '');
    }
  }, [isOpen, startTime, endTime]);

  const handleSave = async () => {
    if (!editStartTime) {
      alert('출근 시간을 입력해주세요.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(editStartTime, editEndTime);
      onClose();
    } catch (error: any) {
      console.error('출퇴근 시간 수정 실패:', error);
      const errorMessage = error?.message || error?.toString() || '알 수 없는 오류';
      alert(`출퇴근 시간 수정에 실패했습니다.\n\n에러: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
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
        <div className="flex gap-2 justify-between w-full">
          <div className="space-y-2 w-full">
            <Label htmlFor="start-time">출근 시간</Label>
            <Input
              id="start-time"
              type="time"
              ref={startInputRef}
              value={editStartTime}
              onChange={(e) => setEditStartTime(e.target.value)}
              onClick={() => openNativePicker(startInputRef)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openNativePicker(startInputRef);
                }
              }}
              disabled={isSaving}
              className="cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:pointer-events-none [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden"
            />
          </div>
          <div className="space-y-2 w-full">
            <Label htmlFor="end-time">퇴근 시간</Label>
            <Input
              id="end-time"
              type="time"
              ref={endInputRef}
              value={editEndTime}
              onChange={(e) => setEditEndTime(e.target.value)}
              onClick={() => openNativePicker(endInputRef)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openNativePicker(endInputRef);
                }
              }}
              disabled={isSaving}
              className="cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:pointer-events-none [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden"
            />
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

