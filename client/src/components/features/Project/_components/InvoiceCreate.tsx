import { useState } from 'react';
import { useOutletContext } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';

import { invoiceSchema, type InvoiceFormValues } from '@/types/invoice';
import type { ProjectLayoutContext } from '@/pages/Project/ProjectLayout';
import { uploadFilesToServer, invoiceRegister } from '@/api';

import InvoiceInfoForm from './InvoiceCreateInfo';
import InvoiceItemsForm from './InvoiceCreateItems';
import InvoiceCreateConfirm from './InvoiceCreateConfirm';

import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';
import { useAppDialog } from '@/components/common/ui/AppDialog/AppDialog';

import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { OctagonAlert } from 'lucide-react';

type Props = {
  onClose?: () => void;
  onSuccess?: () => void; // 인보이스 생성 후 리스트 새로고침
};

export type PreviewFile = {
  file: File;
  name: string;
  type: string;
  size: number;
};

export type uploadedFiles = {
  ia_role: string;
  ia_fname: string;
  ia_sname: string;
  ia_url: string;
};

/* ------------------------------------------------------------------------- */
/* 🔥 공통 유틸: payload 생성 함수 */
/* ------------------------------------------------------------------------- */
function buildInvoicePayload(v: InvoiceFormValues, projectId: string, clientId: number, attachments: uploadedFiles[]) {
  const parseNum = (val?: string) => {
    if (!val) return 0;
    return Number(val.replace(/,/g, ''));
  };

  // 유효 row만 남기기
  const cleanedItems = (v.items ?? [])
    .filter((r) => r.ii_title && r.ii_amount && r.ii_qty)
    .map((r) => ({
      ii_title: r.ii_title,
      ii_amount: parseNum(r.ii_amount),
      ii_qty: parseNum(r.ii_qty),
    }));

  // subtotal·tax·total 계산
  const subtotal = cleanedItems.reduce((sum, r) => sum + r.ii_amount * r.ii_qty, 0);
  const taxRate = Number(v.tax ?? 0);
  const taxAmount = Math.round(subtotal * taxRate);
  const total = subtotal + taxAmount;

  return {
    invoice: {
      project_id: projectId,
      invoice_title: v.invoice_title,
      client_id: clientId,
      client_nm: v.client_nm,
      contact_nm: v.contact_nm,
      contact_email: v.contact_email,
      contact_tel: v.contact_tel ?? null,
      po_no: v.po_no ?? null,
      idate: v.idate ?? null,
      invoice_amount: subtotal,
      invoice_tax: taxAmount,
      invoice_total: total,
      remark: v.remark,
    },
    items: cleanedItems,
    attachments: attachments, // 서버 업로드 후 서버 응답 형태로 교체
  };
}

/* ------------------------------------------------------------------------- */
/* 메인 컴포넌트 */
/* ------------------------------------------------------------------------- */

export default function InvoiceCreateForm({ onClose, onSuccess }: Props) {
  const { addAlert } = useAppAlert();
  const { addDialog } = useAppDialog();

  const { data } = useOutletContext<ProjectLayoutContext>();
  const formatDate = (d?: Date) => (d ? format(d, 'yyyy-MM-dd') : '');

  type RegisterStep = 'info' | 'items' | 'confirm';
  const [registerStep, setRegisterStep] = useState<RegisterStep>('info');
  const [attachments, setAttachments] = useState<PreviewFile[]>([]);

  console.log(data);

  const form = useForm<InvoiceFormValues>({
    mode: 'onSubmit',
    resolver: zodResolver(invoiceSchema),
    shouldUnregister: false,
    defaultValues: {
      invoice_title: '',
      client_nm: data.client_nm,
      contact_nm: '',
      contact_email: '',
      contact_tel: '',
      remark: '',
      items: Array.from({ length: 3 }).map(() => ({
        ii_title: '',
        ii_amount: '',
        ii_qty: '',
      })),
      tax: '0.1',
      attachments: [],
    },
  });

  /* ----------------------------------------------------------------------- */
  /* 단계 이동 validation */
  /* ----------------------------------------------------------------------- */

  const formValidate = async (nextStep: RegisterStep) => {
    if (nextStep === 'items') {
      const valid = await form.trigger(['invoice_title', 'client_nm', 'contact_nm', 'contact_email']);
      if (!valid) return;
    }

    if (nextStep === 'confirm') {
      const items = form.getValues('items') || [];
      const hasValidRow = items.some((r) => r.ii_title?.trim() && r.ii_amount !== '' && r.ii_qty !== '');

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

  /* ----------------------------------------------------------------------- */
  /* 취소 */
  /* ----------------------------------------------------------------------- */

  const handleCancel = () => {
    form.reset();
    setAttachments([]);
    onClose?.();
  };

  /* ----------------------------------------------------------------------- */
  /* 등록 처리 핸들러 */
  /* ----------------------------------------------------------------------- */

  const handleRegister = () => {
    const values = form.getValues();

    addDialog({
      title: '인보이스를 등록하시겠습니까?',
      message: `<span class="text-primary-blue-500 font-semibold block">${values.invoice_title}</span>인보이스를 발행 신청합니다.`,
      confirmText: '확인',
      cancelText: '취소',
      onConfirm: async () => {
        /* 1) payload 생성 (첨부파일 제외) */
        const payload = buildInvoicePayload(values, data.project_id, data.client_id, []);

        /* 2) 첨부파일 업로드 (1개만 허용) */
        let uploadedFiles: {
          ia_role: string;
          ia_fname: string;
          ia_sname: string;
          ia_url: string;
        }[] = [];

        if (attachments.length > 0) {
          const uploadArr = attachments.map((f) => f.file);
          const uploaded = await uploadFilesToServer(uploadArr, 'invoice');

          uploadedFiles = uploaded.map((file: any) => ({
            ia_role: 'user',
            ia_fname: file.fname,
            ia_sname: file.sname,
            ia_url: file.url,
          }));
        }

        /* 3) payload에 첨부파일 반영 */
        payload.attachments = uploadedFiles;

        console.log('📌 최종 인보이스 payload', payload);

        /* 4) API 호출 */
        const result = await invoiceRegister(payload);

        if (result.success) {
          addAlert({
            title: '인보이스 발행 신청이 완료되었습니다.',
            message: `<p>인보이스 아이디 <span class="text-primary-blue-500">${result.data.invoice_id}</span>로 생성되었습니다.</p>`,
            icon: <OctagonAlert />,
            duration: 2000,
          });

          onSuccess?.();
        }
      },
    });
  };

  /* ----------------------------------------------------------------------- */
  /* 렌더링 */
  /* ----------------------------------------------------------------------- */

  return (
    <Dialog>
      <Form {...form}>
        <form className="flex h-full flex-col space-y-5 pt-4">
          <div className="grid grid-cols-2 items-start gap-4">
            {registerStep === 'info' && (
              <InvoiceInfoForm control={form.control} watch={form.watch} setValue={form.setValue} formatDate={formatDate} />
            )}

            {registerStep === 'items' && <InvoiceItemsForm control={form.control} watch={form.watch} setValue={form.setValue} />}

            {registerStep === 'confirm' && (
              <InvoiceCreateConfirm control={form.control} watch={form.watch} attachments={attachments} setAttachments={setAttachments} />
            )}
          </div>

          {/* bottom buttons */}
          <div className="mt-auto flex justify-between gap-3 pt-3">
            <Button type="button" variant="outline" className="max-md:flex-1" onClick={handleCancel}>
              취소
            </Button>

            {registerStep === 'info' && (
              <Button type="button" className="max-md:flex-1" onClick={() => formValidate('items')}>
                항목 작성
              </Button>
            )}

            {registerStep === 'items' && (
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="max-md:flex-1" onClick={() => setRegisterStep('info')}>
                  이전
                </Button>
                <Button type="button" className="max-md:flex-1" onClick={() => formValidate('confirm')}>
                  정보 확인
                </Button>
              </div>
            )}

            {registerStep === 'confirm' && (
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="max-md:flex-1" onClick={() => setRegisterStep('items')}>
                  이전
                </Button>
                <Button type="button" className="max-md:flex-1" onClick={handleRegister}>
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
