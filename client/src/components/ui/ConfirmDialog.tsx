import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
        {/* ✅ Overlay: 기존 DialogOverlay와 동일 */}
        <AlertDialogPrimitive.Overlay
          className={cn(
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-[100] bg-black/40'
          )}
        />

        {/* ✅ Content: 기존 DialogContent와 동일 레이아웃 */}
        <AlertDialogPrimitive.Content
          onEscapeKeyDown={(e) => e.preventDefault()}
          //onPointerDownOutside={(e) => e.preventDefault()}
          className={cn(
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 fixed top-[50%] left-[50%] z-[101] w-[400px] max-w-[90vw] translate-x-[-50%] translate-y-[-50%] rounded-lg border border-gray-300 bg-white p-6 shadow-2xl'
          )}>
          {/* Header */}
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
                onClick={() => {
                  onConfirm();
                  onOpenChange(false);
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
