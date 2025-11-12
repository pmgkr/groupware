import React, { useState, useEffect } from 'react';
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
  const [isSaving, setIsSaving] = useState(false);

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

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="start-time">출근 시간</Label>
            <Input
              id="start-time"
              type="time"
              value={editStartTime}
              onChange={(e) => setEditStartTime(e.target.value)}
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end-time">퇴근 시간</Label>
            <Input
              id="end-time"
              type="time"
              value={editEndTime}
              onChange={(e) => setEditEndTime(e.target.value)}
              disabled={isSaving}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? '저장 중...' : '저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

