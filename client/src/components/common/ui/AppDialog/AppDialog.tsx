// src/components/common/AppConfirm/AppConfirm.tsx
import { createContext, useContext, useState, type ReactNode } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

type DialogData = {
  title: string;
  message?: string;
  content?: string | TrustedHTML;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
};

type DialogContextValue = {
  addDialog: (dialog: DialogData) => void;
};

const DialogContext = createContext<DialogContextValue | null>(null);

export function useAppDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useAppDialog must be used within AppDialogProvider');
  return ctx;
}

export function AppDialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<DialogData | null>(null);
  const [open, setOpen] = useState(false);

  const addDialog = (data: DialogData) => {
    setDialog(data);
    setOpen(true);
  };

  const handleConfirm = () => {
    dialog?.onConfirm?.();
    setOpen(false);
  };

  const handleCancel = () => {
    dialog?.onCancel?.();
    setOpen(false);
  };

  return (
    <DialogContext.Provider value={{ addDialog }}>
      {children}

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="z-100 flex flex-col sm:max-w-sm">
          <AlertDialogHeader className="gap-1">
            {dialog?.title && <AlertDialogTitle dangerouslySetInnerHTML={{ __html: dialog.title }}></AlertDialogTitle>}
            {dialog?.message && (
              <AlertDialogDescription className="leading-[1.3] text-gray-700" dangerouslySetInnerHTML={{ __html: dialog.message }} />
            )}
          </AlertDialogHeader>
          {dialog?.content && <div className="w-full max-w-full" dangerouslySetInnerHTML={{ __html: dialog.content }}></div>}
          {(dialog?.confirmText || dialog?.cancelText) && (
            <AlertDialogFooter className="max-md:mt-4 max-md:flex-row max-md:gap-2">
              {dialog?.confirmText && (
                <AlertDialogAction asChild>
                  <Button onClick={handleConfirm} className="h-9 min-w-[80px] max-md:flex-1">
                    {dialog.confirmText}
                  </Button>
                </AlertDialogAction>
              )}
              {dialog?.cancelText && (
                <AlertDialogCancel asChild>
                  <Button variant="outline" onClick={handleCancel} className="h-9 min-w-[80px] max-md:flex-1">
                    {dialog.cancelText}
                  </Button>
                </AlertDialogCancel>
              )}
            </AlertDialogFooter>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </DialogContext.Provider>
  );
}
