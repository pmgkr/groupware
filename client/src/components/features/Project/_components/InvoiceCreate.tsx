import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ProjectLayoutContext } from '@/pages/Project/ProjectLayout';
import { format } from 'date-fns';

import { invoiceSchema, type InvoiceFormValues } from '@/types/invoice';

import InvoiceInfoForm from './InvoiceCreateInfo';
import InvoiceItemsForm from './InvoiceCreateItems';
import InvoiceCreateConfirm from './InvoiceCreateConfirm';

import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';
import { useAppDialog } from '@/components/common/ui/AppDialog/AppDialog';

import { Input } from '@/components/ui/input';
import { Button } from '@components/ui/button';
import { MultiSelect, type MultiSelectOption } from '@/components/multiselect/multi-select';
import { Form, FormItem, FormLabel } from '@/components/ui/form';
import { Dialog, DialogTrigger, DialogClose, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverTrigger, PopoverContent } from '@components/ui/popover';
import { DayPicker } from '@components/daypicker';

import { CalendarIcon, Bookmark } from 'lucide-react';

type Props = {
  onClose?: () => void;
  onSuccess?: () => void;
};

export default function InvoiceCreateForm({ onClose, onSuccess }: Props) {
  // Alert & Dialog hooks
  const { addAlert } = useAppAlert();
  const { addDialog } = useAppDialog();

  const { data } = useOutletContext<ProjectLayoutContext>();
  const formatDate = (d?: Date) => (d ? format(d, 'yyyy-MM-dd') : '');

  // 인보이스 작성 State
  type RegisterStep = 'info' | 'items' | 'confirm';
  const [registerStep, setRegisterStep] = useState<RegisterStep>('info');

  const form = useForm<InvoiceFormValues>({
    mode: 'onSubmit',
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoice_title: '',
      client_nm: data.client_nm,
      contact_nm: '',
      contact_email: '',
      contact_tel: '',
      remark: '',
      items: Array.from({ length: 3 }).map(() => ({ il_title: '', il_amount: '', il_qty: '' })),
      tax: '0.1',
    },
  });

  const formValidate = (step: 'info' | 'items' | 'confirm') => {
    setRegisterStep(step);
  };

  // Dialog 하위 취소 버튼 클릭 시 폼 리셋
  const handleCancel = () => {
    form.reset();
    onClose?.();
  };

  // Dialog 인보이스 등록 onSubmit 이벤트 핸들러
  const handleRegister = () => {};

  return (
    <Form {...form}>
      <Dialog>
        <form onSubmit={() => {}} className="space-y-5">
          <div className="grid grid-cols-2 items-start gap-4">
            {registerStep === 'info' && (
              <InvoiceInfoForm control={form.control} watch={form.watch} setValue={form.setValue} formatDate={formatDate} />
            )}
            {registerStep === 'items' && <InvoiceItemsForm control={form.control} watch={form.watch} setValue={form.setValue} />}
            {registerStep === 'confirm' && <InvoiceCreateConfirm control={form.control} watch={form.watch} />}
          </div>

          <div className="flex justify-between gap-3 pt-3">
            <Button type="button" variant="outline" onClick={handleCancel}>
              취소
            </Button>
            {registerStep === 'info' && (
              <Button type="button" onClick={() => formValidate('items')}>
                항목 작성
              </Button>
            )}
            {registerStep === 'items' && (
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setRegisterStep('info')}>
                  이전
                </Button>
                <Button type="button" onClick={() => setRegisterStep('confirm')}>
                  정보 확인
                </Button>
              </div>
            )}
            {registerStep === 'confirm' && (
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setRegisterStep('items')}>
                  이전
                </Button>
                <Button type="button" onClick={handleRegister}>
                  인보이스 등록
                </Button>
              </div>
            )}
          </div>
        </form>
      </Dialog>
    </Form>
  );
}
