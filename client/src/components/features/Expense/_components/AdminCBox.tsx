import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface CBoxDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
}

export function CBoxDialog({ open, onClose, onSubmit }: CBoxDialogProps) {
  const [localValue, setLocalValue] = useState('');

  // 다이얼로그 열릴 때 초기화
  useEffect(() => {
    if (open) setLocalValue('');
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>EXP# 지급 승인</DialogTitle>
          <DialogDescription>승인하고자 하는 비용 넘버를 줄바꿈(엔터)으로 구분해 입력해 주세요.</DialogDescription>
        </DialogHeader>

        <Textarea
          placeholder="EXP#를 줄바꿈(엔터)으로 구분해 입력해 주세요."
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          className="min-h-[120px]"
        />

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={() => onSubmit(localValue)} disabled={!localValue.trim()}>
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
