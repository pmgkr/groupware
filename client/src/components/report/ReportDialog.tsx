import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogOverlay,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type ReportDialogProps = {
  trigger: React.ReactNode; // 트리거로 쓸 JSX (제목, 버튼 등)
  report: {
    id: number;
    title: string;
    content: string;
    team: string;
    user: string;
    date: string;
  };
};

export function ReportDialog({ trigger, report }: ReportDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogOverlay className="fixed inset-0 bg-black/20" />

      <DialogContent className="bg-white p-7">
        <DialogHeader>
          <DialogTitle className="mb-3">기안서 확인</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <div>
            <strong>제목:</strong> {report.title}
          </div>
          <div>
            <strong>내용:</strong> {report.content}
          </div>
          <div>
            <strong>팀/작성자:</strong> {report.team} / {report.user}
          </div>
          <div>
            <strong>작성일:</strong> {report.date}
          </div>
        </div>

        <DialogFooter className="mt-5">
          <DialogClose asChild>
            <Button variant="outline">닫기</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
