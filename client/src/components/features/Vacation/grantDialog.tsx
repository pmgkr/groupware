import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@components/ui/alert-dialog';
import { Button } from '@components/ui/button';
import { PlusIcon, MinusIcon, CheckCircle2Icon } from 'lucide-react';
import { Label } from '@components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@components/ui/select';
import { Input } from '@components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { adminVacationApi } from '@/api/admin/vacation';
import { useToast } from '@/components/ui/use-toast';

interface GrantDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  userName?: string;
  onSuccess?: () => void;
}

export default function GrantDialog({ isOpen, onClose, userId, userName, onSuccess }: GrantDialogProps) {
  const { toast } = useToast();
  const [vaYear, setVaYear] = useState<string>('');
  const [vaType, setVaType] = useState<string>('');
  const [vCount, setVCount] = useState<string>('1');
  const [remark, setRemark] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [grantedInfo, setGrantedInfo] = useState<{ type: string; count: number; year: number } | null>(null);

  // 다이얼로그가 열릴 때 현재 연도로 초기화
  useEffect(() => {
    if (isOpen) {
      const currentYear = new Date().getFullYear();
      setVaYear(currentYear.toString());
      setVaType('');
      setVCount('1');
      setRemark('');
    }
  }, [isOpen]);

  // 연도 증가/감소
  const handleYearChange = (delta: number) => {
    if (vaYear) {
      const year = parseInt(vaYear);
      const newYear = year + delta;
      if (newYear >= 2020 && newYear <= 2100) {
        setVaYear(newYear.toString());
      }
    }
  };

  // 휴가 일수 증가/감소
  const handleCountChange = (delta: number) => {
    const current = parseFloat(vCount) || 0;
    const newCount = current + delta;
    setVCount(newCount.toString());
  };

  // 휴가 부여 처리
  const handleSubmit = async () => {
    if (!userId) {
      toast({
        title: '오류',
        description: '사용자 정보가 없습니다.',
        variant: 'destructive'
      });
      return;
    }

    if (!vaYear) {
      toast({
        title: '오류',
        description: '휴가 연도를 선택해주세요.',
        variant: 'destructive'
      });
      return;
    }

    if (!vaType) {
      toast({
        title: '오류',
        description: '휴가 유형을 선택해주세요.',
        variant: 'destructive'
      });
      return;
    }

    const count = parseFloat(vCount);
    if (isNaN(count)) {
      toast({
        title: '오류',
        description: '휴가 부여일수를 올바르게 입력해주세요.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      await adminVacationApi.grantVacation(
        userId,
        parseInt(vaYear),
        vaType,
        count,
        remark || ''
      );
      
      // 성공 정보 저장
      const typeNames: Record<string, string> = {
        current: '기본연차',
        carryover: '이월연차',
        special: '특별대휴',
        official: '공가'
      };
      
      setGrantedInfo({
        type: typeNames[vaType] || vaType,
        count,
        year: parseInt(vaYear)
      });
      
      // 부여 다이얼로그 닫기
      onClose();
      
      // 성공 다이얼로그 표시
      setShowSuccessDialog(true);
      
      // 데이터 새로고침
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: '오류',
        description: error?.message || '휴가 부여에 실패했습니다.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessDialogClose = () => {
    setShowSuccessDialog(false);
    setGrantedInfo(null);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>휴가 관리</DialogTitle>
          <DialogDescription>
            {userName ? `${userName}님의 휴가를 관리합니다.` : '휴가를 관리합니다.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="space-y-3">
                <Label htmlFor="grant-year">휴가 연도</Label>
                <div className="flex gap-2">
                    <Select
                        value={vaYear}
                        onValueChange={setVaYear}
                    >
                        <SelectTrigger className="flex-1">
                            <SelectValue placeholder="휴가 연도를 선택해주세요">
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="z-[200]">
                            <SelectItem value="2024">2024</SelectItem>
                            <SelectItem value="2025">2025</SelectItem>
                            <SelectItem value="2026">2026</SelectItem>
                        </SelectContent>
                    </Select>
                </div>  
            </div>
            <div className="space-y-3">
                <Label htmlFor="grant-type">휴가 유형</Label>
                <div className="flex gap-2">
                    <Select
                        value={vaType}
                        onValueChange={setVaType}
                    >
                        <SelectTrigger className="flex-1">
                            <SelectValue placeholder="휴가 유형을 선택해주세요">
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="z-[200]">
                            <SelectItem value="current">기본연차</SelectItem>
                            <SelectItem value="carryover">이월연차</SelectItem>
                            <SelectItem value="special">특별대휴</SelectItem>
                            <SelectItem value="official">공가</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="space-y-3">
                <Label htmlFor="grant-count">휴가 부여일수</Label>
                <div className="flex gap-2">
                    <Input 
                      type="number" 
                      placeholder="휴가 부여일수를 입력해주세요" 
                      value={vCount}
                      onChange={(e) => setVCount(e.target.value)}
                      step="0.25"
                    />
                    <div className="flex flex-col gap-1 h-11">
                      <Button 
                        variant="outlinePrimary" 
                        size="sm" 
                        className="flex-1 h-auto rounded-sm"
                        onClick={() => handleCountChange(1)}
                        type="button"
                      >
                          <PlusIcon className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outlinePrimary" 
                        size="sm" 
                        className="flex-1 h-auto rounded-sm"
                        onClick={() => handleCountChange(-1)}
                        type="button"
                      >
                          <MinusIcon className="w-4 h-4" />
                      </Button>
                    </div>
                </div>
            </div>
            <div className="space-y-3">
              <Label htmlFor="grant-remark">설명</Label>
              <Textarea 
                placeholder="부여되는 휴가에 대한 설명을 기입해주세요" 
                className="resize-none" 
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
              />
            </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? '처리 중' : '부여하기'}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    
    {/* 성공 다이얼로그 */}
    <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <CheckCircle2Icon className="w-8 h-8 text-green-500" />
            </div>
            <div>
              <AlertDialogTitle className="text-left">휴가 부여 완료</AlertDialogTitle>
              <AlertDialogDescription className="text-left mt-2">
                {grantedInfo && (
                  <div className="space-y-1">
                    <p className="text-base font-medium text-gray-900">
                      {userName}님에게 {grantedInfo.year}년도 {grantedInfo.type} {grantedInfo.count}일이 부여되었습니다.
                    </p>
                    <p className="text-sm text-gray-600">
                      화면에 반영된 내용을 확인해주세요.
                    </p>
                  </div>
                )}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button onClick={handleSuccessDialogClose} className="w-full">
            확인
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
