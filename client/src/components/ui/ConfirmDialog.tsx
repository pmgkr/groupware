import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  confirmVariant?: 'default' | 'destructive' | 'secondary';
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = '확인',
  cancelText = '취소',
  confirmVariant = 'default',
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay
          className={cn(
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-[100] bg-black/40'
          )}
        />
        <AlertDialogPrimitive.Content
          onEscapeKeyDown={(e) => e.preventDefault()}
          //onPointerDownOutside={(e) => e.preventDefault()}

          className={cn(
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 fixed top-[50%] left-[50%] z-[101] w-[400px] max-w-[90vw] translate-x-[-50%] translate-y-[-50%] rounded-lg border border-gray-300 bg-white p-6 shadow-2xl'
          )}>
          <VisuallyHidden>
            <AlertDialogPrimitive.Description>확인 또는 취소를 선택할 수 있는 대화상자입니다.</AlertDialogPrimitive.Description>
          </VisuallyHidden>

          <div className="mb-4 space-y-2 text-center sm:text-left">
            <AlertDialogPrimitive.Title className="text-lg leading-none font-semibold tracking-tight">{title}</AlertDialogPrimitive.Title>
            {description && (
              <AlertDialogPrimitive.Description className="text-sm text-gray-600">{description}</AlertDialogPrimitive.Description>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3">
            <AlertDialogPrimitive.Cancel asChild>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {cancelText}
              </Button>
            </AlertDialogPrimitive.Cancel>
            <AlertDialogPrimitive.Action asChild>
              <Button
                variant={confirmVariant}
                onClick={async () => {
                  await onConfirm(); // 완료 처리 후
                  onOpenChange(false); // 다이얼로그 닫기
                }}>
                {confirmText}
              </Button>
            </AlertDialogPrimitive.Action>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}

/* 
사용법

 // 컨펌 다이얼로그 상태
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    confirmText?: string;
    action?: () => void;
  }>({ open: false, title: '' });

  // 컨펌 다이얼로그 열기 함수
  const openConfirm = (title: string, action: () => void, confirmText = '확인') => {
    setConfirmState({ open: true, title, action, confirmText });
  };

  <ConfirmDialog
        open={confirmState.open}
        onOpenChange={(open) => setConfirmState((prev) => ({ ...prev, open }))}
        title={confirmState.title}
        onConfirm={() => confirmState.action?.()}
  />
  
  onClick={() => {
                    openConfirm('장비 정보를 수정하시겠습니까?', () => handleSave());
                  }}>
*/
