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

import { OctagonAlert } from 'lucide-react';

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
    reValidateMode: 'onChange',
    resolver: zodResolver(invoiceSchema),
    shouldUnregister: false,
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

  const formValidate = async (nextStep: RegisterStep) => {
    if (nextStep === 'items') {
      // Info 단계 필수값 검증
      const valid = await form.trigger(['invoice_title', 'client_nm', 'contact_nm', 'contact_tel']);

      console.log(valid);

      if (!valid) return;
    }

    if (nextStep === 'confirm') {
      // Items 단계에서 최소 한 개의 유효한 row가 있는지 검사
      const items = form.getValues('items') || [];
      const hasValidRow = items.some((r) => r.il_title?.trim() && r.il_amount !== '' && r.il_qty !== '');

      if (!hasValidRow) {
        addAlert({
          title: '항목 작성 필요',
          message: '최소 1개의 항목을 입력해 주세요.',
          icon: <OctagonAlert />,
          duration: 2000,
        });
        return;
      }
    }

    setRegisterStep(nextStep);
  };

  // Dialog 하위 취소 버튼 클릭 시 폼 리셋
  const handleCancel = () => {
    form.reset();
    onClose?.();
  };

  // Dialog 인보이스 등록 onSubmit 이벤트 핸들러
  const handleRegister = () => {};

  const onSubmit = (v: InvoiceFormValues) => {
    addDialog({
      title: '인보이스를 등록하시겠습니까?',
      message: `<span class="text-primary-blue-500 font-semibold">${v.invoice_title}</span> 인보이스를 발행 신청합니다.`,
      confirmText: '확인',
      cancelText: '취소',
      onConfirm: async () => {
        const cleanedItems = (v.items ?? [])
          .filter((r) => r.il_title && r.il_amount && r.il_qty)
          .map((r) => ({
            il_title: r.il_title,
            il_amount: Number(r.il_amount.replace(/,/g, '')),
            il_qty: Number(r.il_qty.replace(/,/g, '')),
          }));

        const payload = {
          invoice_title: v.invoice_title,
          client_nm: v.client_nm,
          contact_nm: v.contact_nm,
          contact_tel: v.contact_tel,
          contact_email: v.contact_email,
          idate: v.idate,
          po_no: v.po_no,
          remark: v.remark,
          tax: Number(v.tax),
          items: cleanedItems,
        };

        // const result = await projectCreate(payload);

        // console.log('✅ 등록 성공:', result);
        // if (result.ok) {
        //   addAlert({
        //     title: '프로젝트 생성이 완료되었습니다.',
        //     message: `<p>프로젝트 아이디 <span class="text-primary-blue-500">${result.project_id}</span>로 생성되었습니다.</p>`,
        //     icon: <OctagonAlert />,
        //     duration: 2000,
        //   });

        //   onSuccess?.();
        // }
      },
    });
  };

  return (
    <Dialog>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                <Button type="button" onClick={() => formValidate('confirm')}>
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
      </Form>
    </Dialog>
  );
}
