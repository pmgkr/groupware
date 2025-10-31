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
        <AlertDialogContent className="sm:max-w-sm">
          <AlertDialogHeader>
            {dialog?.title && <AlertDialogTitle dangerouslySetInnerHTML={{ __html: dialog.title }}></AlertDialogTitle>}
            {dialog?.message && <AlertDialogDescription className="text-gray-700" dangerouslySetInnerHTML={{ __html: dialog.message }} />}
          </AlertDialogHeader>
          {(dialog?.confirmText || dialog?.cancelText) && (
            <AlertDialogFooter>
              {dialog?.confirmText && (
                <AlertDialogAction asChild>
                  <Button onClick={handleConfirm} className="min-w-[80px]">
                    {dialog.confirmText}
                  </Button>
                </AlertDialogAction>
              )}
              {dialog?.cancelText && (
                <AlertDialogCancel asChild>
                  <Button variant="outline" onClick={handleCancel} className="min-w-[80px]">
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
