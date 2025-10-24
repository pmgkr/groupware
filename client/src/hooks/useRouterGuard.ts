import { useEffect, useState } from 'react';
import { useBlocker, useBeforeUnload } from 'react-router';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

/**
 * RHF isDirty 기반 라우트/새로고침 가드 (shadcn Dialog 버전)
 */
export function useUnsavedChangesGuard(isDirty: boolean) {
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    // 같은 페이지면 막을 필요 없음
    return isDirty && currentLocation.pathname !== nextLocation.pathname;
  });

  const [open, setOpen] = useState(false);

  // ✅ 라우트 차단 시 AlertDialog 열기
  useEffect(() => {
    if (blocker.state === 'blocked') {
      setOpen(true);
    }
  }, [blocker.state]);

  // ✅ 새로고침 / 탭 닫기 방지
  useBeforeUnload(
    (event) => {
      if (isDirty) {
        event.preventDefault();
        event.returnValue = '';
      }
    }
  );

  // ✅ shadcn AlertDialog 렌더링 (컴포넌트 리턴)
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>작성 중인 내용이 있습니다</AlertDialogTitle>
          <AlertDialogDescription>
            페이지를 이동하면 작성 중인 내용이 사라집니다.<br />
            그래도 이동하시겠습니까?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            className="h-8 px-3.5 text-sm"
            onClick={() => {
              setOpen(false);
              blocker.reset(); // ✅ 이동 취소
            }}
          >
            머무르기
          </AlertDialogCancel>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              setOpen(false);
              blocker.proceed(); // ✅ 이동 허용
            }}
          >
            나가기
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
