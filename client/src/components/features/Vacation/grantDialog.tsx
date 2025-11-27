import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { PlusIcon, MinusIcon } from 'lucide-react';
import { Label } from '@components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@components/ui/select';
import { Input } from '@components/ui/input';

interface GrantDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
}

export default function GrantDialog({ isOpen, onClose, userName }: GrantDialogProps) {
  return (
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
                <Label htmlFor="grant-type">휴가 연도</Label>
                <div className="flex gap-2">
                    <Select
                        key="grant-type"
                        value=""
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
                        key="grant-type"
                        value=""
                    >
                        <SelectTrigger className="flex-1">
                            <SelectValue placeholder="휴가 유형을 선택해주세요">
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="z-[200]">
                            <SelectItem value="current">당해연차</SelectItem>
                            <SelectItem value="carryover">이월연차</SelectItem>
                            <SelectItem value="special">특별대휴</SelectItem>
                            <SelectItem value="official">공가</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="space-y-3">
                <Label htmlFor="grant-type">휴가 부여일수</Label>
                <div className="flex gap-2">
                    <Input type="number" placeholder="휴가 부여일수를 입력해주세요" />
                    <Button variant="outlinePrimary" size="sm">
                        <MinusIcon className="w-4 h-4" />
                    </Button>
                    <Button variant="outlinePrimary" size="sm">
                        <PlusIcon className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
