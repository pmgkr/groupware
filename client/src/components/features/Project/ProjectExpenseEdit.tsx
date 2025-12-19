import { useEffect, useState, useMemo, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToggleState } from '@/hooks/useToggleState';
import { UploadArea, type UploadAreaHandle, type PreviewFile } from './_components/UploadArea';
import { AttachmentFieldEdit } from './_components/AttachmentFieldEdit';
import { useUser } from '@/hooks/useUser';
import { formatKST, formatAmount } from '@/utils';
import { getBankList, uploadFilesToServer, type BankList, type ExpenseViewDTO } from '@/api';
import { getProjectExpenseView, delExpenseAttachment, expenseUpdate } from '@/api/project/expense';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@components/ui/alert-dialog';
import { SectionHeader } from '@components/ui/SectionHeader';
import { Badge } from '@components/ui/badge';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@components/ui/form';
import { Input } from '@components/ui/input';
import { Textarea } from '@components/ui/textarea';
import { Button } from '@components/ui/button';
import { DayPicker } from '@components/daypicker';
import { RadioButton, RadioGroup } from '@components/ui/radioButton';
import { Popover, PopoverTrigger, PopoverContent } from '@components/ui/popover';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@components/ui/select';
import { Calendar, TooltipNoti, Close } from '@/assets/images/icons';
import { FileText, UserRound } from 'lucide-react';

import { format, parseISO } from 'date-fns';
import { statusIconMap, getLogMessage } from '../Expense/utils/statusUtils';

// ✅ zod schema
const editSchema = z.object({
  el_method: z.string().nonempty('결제 수단을 선택해주세요.'),
  account_name: z.string().nonempty('예금주명을 입력해주세요.'),
  bank_code: z.string().nonempty('은행명을 선택해주세요.'),
  bank_name: z.string().optional(),
  bank_account: z
    .string()
    .regex(/^[0-9-]+$/, '계좌번호 형식이 올바르지 않습니다.')
    .nonempty('계좌번호를 입력해주세요.'),
  el_deposit: z.string().optional(),
  remark: z.string().optional(),
  expense_items: z
    .array(
      z.object({
        number: z.string().optional(),
        type: z.string().optional(),
        title: z.string().optional(),
        date: z.string().optional(),
        price: z.string().optional(),
        tax: z.string().optional(),
        total: z.string().optional(),
        pro_id: z.string().optional(),
      })
    )
    .optional(),
});

type UploadedPreviewFile = {
  seq: number;
  ei_seq: number;
  fname: string;
  sname: string;
};

type EditFormValues = z.infer<typeof editSchema>;

interface ExpenseEditProps {
  expId: string;
}

export default function ProjectExpenseEdit() {
  const { expId, projectId } = useParams();
  const navigate = useNavigate();
  const { user_id } = useUser();

  const [bankList, setBankList] = useState<BankList[]>([]);
  const [data, setData] = useState<ExpenseViewDTO | null>(null);
  const [header, setHeader] = useState<any>(null);
  const [logs, setLogs] = useState<any>(null);

  const [newAttachments, setNewAttachments] = useState<Record<number, PreviewFile[]>>({}); // 새 증빙자료 State
  const [rowAttachments, setRowAttachments] = useState<Record<number, UploadedPreviewFile[]>>({}); // 기존 증빙자료 State

  const [loading, setLoading] = useState(true);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertDescription, setAlertDescription] = useState('');
  const [successState, setSuccessState] = useState(false);

  const formatDate = (d?: string | Date | null) => {
    if (!d) return '';
    const date = typeof d === 'string' ? new Date(d) : d;
    return format(date, 'yyyy-MM-dd');
  };

  // ✅ react-hook-form 초기화
  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      el_method: '',
      bank_account: '',
      bank_code: '',
      bank_name: '',
      account_name: '',
      el_deposit: '',
      remark: '',
      expense_items: [],
    },
  });

  const { control, reset } = form;
  const { fields, replace } = useFieldArray({ control, name: 'expense_items' });
  const watchedItems = useWatch({
    control,
    name: 'expense_items',
  });

  // ✅ 은행 + 비용유형 가져오기
  useEffect(() => {
    (async () => {
      try {
        const [bankResult] = await Promise.allSettled([getBankList()]);

        if (bankResult.status === 'fulfilled') {
          const formattedBanks = bankResult.value.map((item: any) => item.code);
          setBankList(formattedBanks);
        } else {
          console.error('은행 목록 불러오기 실패:', bankResult.reason);
        }
      } catch (error) {
        console.error('예상치 못한 오류 발생:', error);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await getProjectExpenseView(expId);
        setData(res);
        setHeader(res.header);
        setLogs(res.logs || []);

        console.log('📥 비용 상세 데이터:', res);

        const h = res.header;
        const mappedItems = res.items.map((i) => ({
          type: h.el_type,
          title: i.ei_title,
          date: formatDate(i.ei_pdate),
          price: i.ei_amount.toString(),
          tax: i.ei_tax.toString(),
          total: i.ei_total.toString(),
        }));

        reset({
          el_method: h.el_method,
          bank_account: h.bank_account,
          bank_name: h.bank_name,
          bank_code: h.bank_code,
          account_name: h.account_name,
          el_deposit: formatDate(h.el_deposit) || '',
          remark: h.remark || '',
          expense_items: mappedItems,
        });

        const groupedAttachments: Record<number, UploadedPreviewFile[]> = {};

        res.items.forEach((item, idx) => {
          if (item.attachments && item.attachments.length > 0) {
            groupedAttachments[idx + 1] = item.attachments.map((att: any) => ({
              seq: att.seq,
              ei_seq: att.ei_seq,
              fname: att.ea_fname,
              sname: att.ea_sname,
              isServerFile: true,
            }));
          }
        });

        setRowAttachments(groupedAttachments);

        setLoading(false);
      } catch (err) {
        console.error('❌ 상세 조회 실패:', err);
        setAlertTitle('조회 실패');
        setAlertDescription('비용 데이터를 불러오지 못했습니다.');
        setAlertOpen(true);
      }
    })();
  }, [expId, reset, replace]);

  // 합계 계산
  const totalSum = useMemo(() => {
    if (!Array.isArray(watchedItems)) return 0;
    return watchedItems.reduce((sum, item) => {
      const value = Number(item?.total || 0);
      return sum + (isNaN(value) ? 0 : value);
    }, 0);
  }, [watchedItems]);

  const formattedTotal = totalSum.toLocaleString();

  // 증빙자료 삭제 핸들러
  const handleDeleteServerFile = async (seq: any, rowIdx: number) => {
    const backup = rowAttachments[rowIdx] || [];

    try {
      setRowAttachments((prev) => {
        const updated = { ...prev };
        updated[rowIdx] = backup.filter((f) => f.seq !== seq);
        return updated;
      });

      await delExpenseAttachment(seq);
      console.log(`✅ 첨부파일 #${seq} 삭제 완료`);
    } catch (err) {
      console.error('❌ 삭제 실패, 복구 진행:', err);
      setRowAttachments((prev) => ({
        ...prev,
        [rowIdx]: backup,
      }));
    }
  };

  // ✅ 폼 제출 (임시)
  const onSubmit = async (values: EditFormValues) => {
    try {
      // 1️⃣ 새 업로드할 파일 목록 정리
      const allNewFiles = Object.entries(newAttachments).flatMap(([rowIdx, files]) => files.map((f) => ({ ...f, rowIdx: Number(rowIdx) })));

      let uploadedFiles: any[] = [];

      if (allNewFiles.length > 0) {
        const uploadable = await Promise.all(
          allNewFiles.map(async (f, idx) => {
            const res = await fetch(f.preview);
            const blob = await res.blob();

            const ext = f.name.split('.').pop() || 'jpg';

            const item = values.expense_items?.[f.rowIdx - 1];
            const purchaseDate = item?.date ? format(new Date(item.date), 'yyyyMMdd') : format(new Date(), 'yyyyMMdd');

            const safeUserNm = (header.user_nm || 'unknown').replace(/[^\w가-힣]/g, '');
            const safeElType = (header.el_type || '기타').replace(/[^\w가-힣]/g, '');

            // ✅ 1️⃣ 기존 첨부파일 중 가장 큰 인덱스 찾기
            const existingFiles = rowAttachments[f.rowIdx] ?? [];
            let maxIndex = -1;

            existingFiles.forEach((att) => {
              const match = att.fname.match(/_(\d+)\.[^.]+$/); // 예: _3.jpg
              if (match) {
                const num = parseInt(match[1], 10);
                if (!isNaN(num) && num > maxIndex) maxIndex = num;
              }
            });

            // ✅ 2️⃣ 같은 rowIdx의 새 파일 중 순서(index)
            const newFilesInRow = allNewFiles.filter((nf) => nf.rowIdx === f.rowIdx);
            const localIndex = newFilesInRow.indexOf(f);

            // ✅ 3️⃣ 최종 인덱스 = (기존 파일 중 최대 인덱스 + 1) + 로컬 인덱스
            const nextIndex = maxIndex + 1 + localIndex;

            // ✅ 4️⃣ 최종 파일명
            const newFileName = `${safeUserNm}_${safeElType}_${purchaseDate}_${nextIndex}.${ext}`;

            return new File([blob], newFileName, { type: f.type || 'image/png' });
          })
        );

        // 3️⃣ 서버 업로드
        uploadedFiles = await uploadFilesToServer(uploadable, 'nexpense');
        uploadedFiles = uploadedFiles.map((file, i) => ({
          ...file,
          rowIdx: allNewFiles[i]?.rowIdx ?? 0,
        }));
        console.log('✅ 업로드 완료:', uploadedFiles);
      }

      // 4️⃣ 업로드된 파일을 항목별로 매핑
      const uploadedMap = uploadedFiles.reduce(
        (acc, file) => {
          if (!acc[file.rowIdx]) acc[file.rowIdx] = [];
          acc[file.rowIdx].push(file);
          return acc;
        },
        {} as Record<number, any[]>
      );

      // 5️⃣ expense_items 병합
      const enrichedItems = (values.expense_items ?? []).map((item, idx) => {
        const rowIdx = idx + 1;

        // (1) 기존 서버 첨부파일
        const existingAtt =
          rowAttachments[rowIdx]?.map((att) => ({
            fname: att.fname,
            sname: att.sname,
            url: `${import.meta.env.VITE_API_BASE_URL}/uploads/nexpense/${att.sname}`,
          })) ?? [];

        // (2) 새 업로드된 파일
        const newAtt =
          uploadedMap[rowIdx]?.map((f: any) => ({
            fname: f.fname,
            sname: f.sname,
            url: f.url,
          })) ?? [];

        return {
          el_type: item.type,
          ei_title: item.title,
          ei_pdate: item.date,
          ei_number: item.number || null,
          ei_amount: Number(item.price || 0),
          ei_tax: Number(item.tax || 0),
          ei_total: Number(item.total || 0),
          pro_id: !item.pro_id || item.pro_id === '0' || isNaN(Number(item.pro_id)) ? null : Number(item.pro_id),
          attachments: [...existingAtt, ...newAtt],
        };
      });

      console.log('enrichedItems', enrichedItems);

      // 6️⃣ 최종 payload 구성
      const payload = {
        header: {
          user_id: user_id!,
          el_method: values.el_method,
          el_attach: enrichedItems.some((item) => item.attachments.length > 0) ? 'Y' : 'N',
          el_deposit: values.el_deposit || null,
          bank_account: values.bank_account.replace(/-/g, ''),
          bank_name: values.bank_name || '',
          bank_code: values.bank_code,
          account_name: values.account_name,
          remark: values.remark || '',
        },
        items: enrichedItems.map((item: any) => ({
          el_type: item.el_type ?? '',
          ei_title: item.ei_title,
          ei_pdate: item.ei_pdate,
          ei_number: item.ei_number,
          ei_amount: item.ei_amount,
          ei_tax: item.ei_tax,
          ei_total: item.ei_total,
          pro_id: item.pro_id,
          attachments: item.attachments.map((att: any) => ({
            filename: att.fname,
            savename: att.sname,
            url: att.url,
          })),
        })),
      };

      console.log('📦 최종 수정 payload:', payload);

      const res = await expenseUpdate(header.seq, payload);

      if (res.ok) {
        setAlertTitle('수정 완료');
        setAlertDescription('비용 정보가 성공적으로 수정되었습니다.');
        setSuccessState(true);
      } else {
        setAlertTitle('수정 실패');
        setAlertDescription('등록 결과를 가져오지 못했습니다.');
      }
      setAlertOpen(true);
    } catch (err) {
      console.error('❌ 수정 실패:', err);
      setAlertTitle('수정 실패');
      setAlertDescription('수정 중 오류가 발생했습니다.');
      setAlertOpen(true);
    }
  };

  if (loading) return <p className="p-10 text-center text-gray-500">로딩 중...</p>;

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="flex items-end justify-between border-b border-b-gray-300 pb-2">
            <div>
              <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-950">
                [{header.el_method}] {header.el_title}{' '}
                <Badge variant="grayish" size="md">
                  임시저장
                </Badge>
              </h1>
              <ul className="itmes-center flex gap-2 text-base text-gray-500">
                <li className="text-gray-700">{header.exp_id}</li>
                <li className="before:mr-2 before:inline-flex before:h-[3px] before:w-[3px] before:rounded-[50%] before:bg-gray-400 before:align-middle">
                  {header.user_nm}
                </li>
                <li className="before:mr-2 before:inline-flex before:h-[3px] before:w-[3px] before:rounded-[50%] before:bg-gray-400 before:align-middle">
                  {formatKST(header.wdate)}
                </li>
              </ul>
            </div>
          </div>
          <div className="flex min-h-140 flex-wrap justify-between pt-6 pb-12">
            <div className="w-[74%] tracking-tight">
              <SectionHeader title="기본 정보" className="mb-4" />
              {/* 기본정보 입력 폼 */}
              <div className="mb-6">
                <FormField
                  control={control}
                  name="el_method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="gap-.5 h-6 font-bold text-gray-950">
                        증빙 수단<span className="text-primary-blue-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-x-1.5 [&_button]:mb-0">
                          <RadioButton value="PMG" label="PMG" variant="dynamic" iconHide />
                          <RadioButton value="MCS" label="MCS" variant="dynamic" iconHide />
                          <RadioButton value="개인" label="개인카드" variant="dynamic" iconHide />
                          <RadioButton value="세금계산서" label="세금계산서" variant="dynamic" iconHide />
                          <RadioButton value="현금영수증" label="현금영수증" variant="dynamic" iconHide />
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid-row-3 mb-12 grid grid-cols-4 gap-y-6 tracking-tight">
                <div className="pr-5 text-base leading-[1.5] text-gray-700">
                  <FormField
                    control={control}
                    name="bank_account"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex h-6 items-center justify-between">
                          <FormLabel className="gap-.5 font-bold text-gray-950">
                            계좌번호<span className="text-primary-blue-500">*</span>
                          </FormLabel>
                          <div className="flex h-5.5 overflow-hidden rounded-[var(--spacing)] border-1 border-gray-300">
                            <Button
                              variant="svgIcon"
                              size="icon"
                              title="내 대표계좌"
                              className="bg-primary-blue-500/60 hover:bg-primary-blue-500/80 h-full rounded-none">
                              <UserRound className="size-3.5 text-white" />
                            </Button>
                            <Button
                              variant="svgIcon"
                              size="icon"
                              title="내 계좌리스트"
                              className="h-full rounded-none bg-gray-400 hover:bg-gray-500/80">
                              <FileText className="size-3.5 text-white" />
                            </Button>
                          </div>
                        </div>
                        <FormControl>
                          <Input
                            placeholder="계좌번호를 입력해 주세요"
                            maxLength={17}
                            {...field}
                            onChange={(e) => {
                              // 숫자(0-9)와 하이픈(-)만 허용
                              const filtered = e.target.value.replace(/[^0-9-]/g, '');
                              field.onChange(filtered);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="long-v-divider px-5 text-base leading-[1.5] text-gray-700">
                  <FormField
                    control={control}
                    name="bank_code"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex h-6 justify-between">
                          <FormLabel className="gap-.5 font-bold text-gray-950">
                            은행명<span className="text-primary-blue-500">*</span>
                          </FormLabel>
                        </div>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={(code) => {
                              const selected = bankList.find((b) => b.code === code);
                              field.onChange(code);
                              form.setValue('bank_name', selected?.name || '');
                            }}
                            name={field.name}
                            defaultValue={bankList.find((b) => b.code === field.value)?.name}>
                            <FormControl>
                              <SelectTrigger className="aria-[invalid=true]:border-destructive w-full">
                                <SelectValue placeholder={bankList.length ? '은행 선택' : '불러오는 중...'} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-80 w-full">
                              {bankList.map((item) => (
                                <SelectItem key={item.code} value={item.code}>
                                  {item.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="long-v-divider px-5 text-base leading-[1.5] text-gray-700">
                  <FormField
                    control={control}
                    name="account_name"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex h-6 justify-between">
                          <FormLabel className="gap-.5 font-bold text-gray-950">
                            예금주명<span className="text-primary-blue-500">*</span>
                          </FormLabel>
                        </div>
                        <FormControl>
                          <Input placeholder="예금주명을 입력해 주세요" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="long-v-divider px-5 text-base leading-[1.5] text-gray-700">
                  <FormField
                    control={control}
                    name="el_deposit"
                    render={({ field }) => {
                      const { isOpen, setIsOpen, close } = useToggleState();
                      return (
                        <FormItem>
                          <div className="flex h-6 justify-between">
                            <FormLabel className="gap-.5 font-bold text-gray-950">입금희망일</FormLabel>
                          </div>
                          <Popover open={isOpen} onOpenChange={setIsOpen}>
                            <div className="relative w-full">
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    'border-input h-11 w-full px-3 text-left text-base font-normal text-gray-700 hover:bg-[none]',
                                    !field.value && 'text-muted-foreground hover:text-muted-foreground'
                                  )}>
                                  {field.value ? String(field.value) : 'YYYY-MM-DD'}
                                  <Calendar className="ml-auto size-4.5 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <DayPicker
                                  mode="single"
                                  selected={field.value ? new Date(field.value) : undefined}
                                  onSelect={(date) => {
                                    const formattedDate = date ? formatDate(date) : null;
                                    field.onChange(formattedDate);

                                    if (date) close();
                                  }}
                                />
                              </PopoverContent>
                            </div>
                          </Popover>
                        </FormItem>
                      );
                    }}
                  />
                </div>
                <div className="col-span-4 text-base leading-[1.5] text-gray-700">
                  <FormField
                    control={control}
                    name="remark"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex h-6 justify-between">
                          <FormLabel className="gap-.5 font-bold text-gray-950">비고</FormLabel>
                        </div>
                        <FormControl>
                          <Textarea
                            placeholder="추가 기입할 정보가 있으면 입력해 주세요."
                            className="scrollbar-hide h-16 min-h-16"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* 비용항목 입력 폼 */}
              <SectionHeader title="비용 항목" className="mb-0" />
              <div>
                {fields.map((field, index) => {
                  return (
                    <article
                      key={`${field.id}`}
                      className="relative border-b border-gray-300 px-2 pt-10 pb-8 last-of-type:border-b-0 last-of-type:pb-4">
                      <div className="absolute top-2 left-0 flex w-full items-center justify-end gap-2">
                        <Button type="button" variant="outlinePrimary" size="xs" className="border-0">
                          <FileText className="size-3.5" /> 기안서 매칭
                        </Button>
                      </div>
                      <div className="flex justify-between">
                        <input type="hidden" name={`expense_items.${index}.number`} value="" />
                        <div className="grid w-[66%] grid-cols-3 gap-4 tracking-tight">
                          <div className="text-base leading-[1.5] text-gray-700">
                            <FormField
                              control={control}
                              name={`expense_items.${index}.type`}
                              render={({ field }) => (
                                <FormItem>
                                  <div className="flex h-6 justify-between">
                                    <FormLabel className="gap-.5 font-bold text-gray-950">비용유형</FormLabel>
                                  </div>
                                  <FormControl>
                                    <Input {...field} className="cursor-default bg-gray-100 text-gray-600" readOnly />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="text-base leading-[1.5] text-gray-700">
                            <FormField
                              control={control}
                              name={`expense_items.${index}.title`}
                              render={({ field }) => (
                                <FormItem>
                                  <div className="flex h-6 justify-between">
                                    <FormLabel className="gap-.5 font-bold text-gray-950">가맹점명</FormLabel>
                                  </div>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="text-base leading-[1.5] text-gray-700">
                            <FormField
                              control={control}
                              name={`expense_items.${index}.date`}
                              render={({ field }) => {
                                const { isOpen, setIsOpen, close } = useToggleState();
                                return (
                                  <FormItem>
                                    <div className="flex h-6 justify-between">
                                      <FormLabel className="gap-.5 font-bold text-gray-950">매입 일자</FormLabel>
                                    </div>
                                    <Popover open={isOpen} onOpenChange={setIsOpen}>
                                      <div className="relative w-full">
                                        <PopoverTrigger asChild>
                                          <FormControl>
                                            <Button
                                              variant={'outline'}
                                              className={cn(
                                                'border-input focus-visible:border-primary-blue-300 h-11 w-full px-3 text-left text-base font-normal text-gray-700 hover:bg-[none]',
                                                !field.value && 'text-muted-foreground hover:text-muted-foreground'
                                              )}>
                                              {field.value || 'YYYY-MM-DD'}
                                              <Calendar className="ml-auto size-4.5 opacity-50" />
                                            </Button>
                                          </FormControl>
                                        </PopoverTrigger>
                                      </div>

                                      <PopoverContent className="w-auto p-0" align="start">
                                        <DayPicker
                                          mode="single"
                                          selected={field.value ? new Date(field.value) : undefined}
                                          onSelect={(date) => {
                                            const formatted = date ? formatDate(date) : '';
                                            field.onChange(formatted);
                                            if (date) close();
                                          }}
                                        />
                                      </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                  </FormItem>
                                );
                              }}
                            />
                          </div>
                          <div className="text-base leading-[1.5] text-gray-700">
                            <FormField
                              control={control}
                              name={`expense_items.${index}.price`}
                              render={({ field }) => (
                                <FormItem>
                                  <div className="flex h-6 justify-between">
                                    <FormLabel className="gap-.5 font-bold text-gray-950">금액</FormLabel>
                                  </div>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      inputMode="numeric"
                                      placeholder="금액"
                                      value={field.value ? formatAmount(field.value) : ''}
                                      onChange={(e) => {
                                        const raw = e.target.value.replace(/[^0-9]/g, '');
                                        field.onChange(raw);

                                        // ✅ 세금 필드와 합산하여 total 자동 계산
                                        const taxValue =
                                          Number(String(form.getValues(`expense_items.${index}.tax`) || '').replace(/,/g, '')) || 0;
                                        const total = Number(raw || 0) + taxValue;

                                        form.setValue(`expense_items.${index}.total`, total.toString(), {
                                          shouldValidate: false,
                                          shouldDirty: true,
                                        });
                                      }}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="text-base leading-[1.5] text-gray-700">
                            <FormField
                              control={control}
                              name={`expense_items.${index}.tax`}
                              render={({ field }) => (
                                <FormItem>
                                  <div className="flex h-6 justify-between">
                                    <FormLabel className="gap-.5 font-bold text-gray-950">세금</FormLabel>
                                  </div>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      inputMode="numeric"
                                      placeholder="세금"
                                      value={field.value ? formatAmount(field.value) : ''}
                                      onChange={(e) => {
                                        const raw = e.target.value.replace(/[^0-9]/g, '');
                                        field.onChange(raw);

                                        // ✅ 금액 필드와 합산하여 total 자동 계산
                                        const priceValue =
                                          Number(String(form.getValues(`expense_items.${index}.price`) || '').replace(/,/g, '')) || 0;
                                        const total = priceValue + Number(raw || 0);

                                        form.setValue(`expense_items.${index}.total`, total.toString(), {
                                          shouldValidate: false,
                                          shouldDirty: true,
                                        });
                                      }}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="text-base leading-[1.5] text-gray-700">
                            <FormField
                              control={control}
                              name={`expense_items.${index}.total`}
                              render={({ field }) => (
                                <FormItem>
                                  <div className="flex h-6 justify-between">
                                    <FormLabel className="gap-.5 font-bold text-gray-950">합계</FormLabel>
                                  </div>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      readOnly
                                      inputMode="numeric"
                                      placeholder="합계"
                                      value={field.value ? formatAmount(field.value) : ''}
                                      className="focus-visible:border-input cursor-default bg-gray-100 text-gray-600"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                        <div className="w-[32%] pl-2">
                          <AttachmentFieldEdit
                            rowIndex={index + 1}
                            serverFiles={[
                              ...(rowAttachments[index + 1]?.map((att) => ({
                                seq: att.seq,
                                name: att.fname,
                                type: 'image',
                                preview: `${import.meta.env.VITE_API_BASE_URL}/uploads/nexpense/${att.sname}`,
                              })) ?? []),
                              ...(newAttachments[index + 1] ?? []),
                            ]}
                            onUploadNew={(newFiles, rowIdx) => {
                              console.log('📤 업로드된 새 파일:', newFiles, '→ row', rowIdx);

                              setNewAttachments((prev) => ({
                                ...prev,
                                [rowIdx]: [...(prev[rowIdx] || []), ...newFiles],
                              }));
                            }}
                            onDeleteServerFile={(file, rowIdx) => {
                              if ('seq' in file && typeof file.seq === 'number') {
                                console.log(`🗑 삭제 요청: file #${file.seq} (row ${rowIdx})`);
                                handleDeleteServerFile(file.seq, rowIdx);
                                setRowAttachments((prev) => {
                                  const updated = { ...prev };
                                  updated[rowIdx] = (updated[rowIdx] || []).filter((f) => f.seq !== file.seq);
                                  return updated;
                                });
                              } else {
                                // 새로 올린 파일을 삭제했을 때 newAttachments에서도 제거
                                setNewAttachments((prev) => {
                                  const updated = { ...prev };
                                  updated[rowIdx] = (updated[rowIdx] || []).filter((f) => f.name !== file.name);
                                  return updated;
                                });
                              }
                            }}
                          />
                        </div>
                      </div>
                    </article>
                  );
                })}
                <div className="bg-primary-blue-100 flex justify-between px-4 py-4 text-base font-medium">
                  <div className="flex w-[66%] justify-between">
                    <span>총 비용</span>
                    <span>{formattedTotal ? formattedTotal : 0} 원</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-[24%] px-4">
              <h2 className="mb-2 text-lg font-bold text-gray-800">로그</h2>
              <div className="flex flex-col gap-8">
                {logs.map((log: any) => (
                  <div
                    key={`${log.idx}-${log.exp_status}`}
                    className="relative before:absolute before:bottom-[100%] before:left-[15.5px] before:mb-1 before:h-6 before:w-[1px] before:bg-gray-400/80 first:before:hidden">
                    <div className="flex items-center gap-4">
                      <span className="flex size-8 items-center justify-center rounded-full bg-white ring-1 ring-gray-300">
                        {statusIconMap[log.exp_status as keyof typeof statusIconMap]}
                      </span>
                      <dl className="text-base leading-[1.3] text-gray-800">
                        <dt>{getLogMessage(log)}</dt>
                        {log.exp_status === 'Rejected' ? (
                          <dd className="text-destructive text-[.88em]">반려 사유: {header.rej_reason}</dd>
                        ) : (
                          <dd className="text-[.88em] text-gray-500">
                            {formatKST(
                              log.exp_status === 'Approved'
                                ? (header.ddate ?? log.log_date)
                                : log.exp_status === 'Completed'
                                  ? (header.edate ?? log.log_date)
                                  : log.log_date
                            ) || '-'}
                          </dd>
                        )}
                      </dl>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ---------------------- 하단 버튼 ---------------------- */}
          <div className="my-10 flex justify-center gap-2">
            <Button type="submit" className="min-w-[120px]">
              수정
            </Button>
            <Button type="button" variant="outline" className="min-w-[120px]" asChild>
              <Link to="/expense">취소</Link>
            </Button>
          </div>
        </form>
      </Form>

      {/* ---------------------- Alert Dialog ---------------------- */}
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertTitle}</AlertDialogTitle>
            <AlertDialogDescription>{alertDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {successState ? (
              <AlertDialogAction className="h-8 px-3.5 text-sm" onClick={() => navigate(`/expense/${expId}`)}>
                확인
              </AlertDialogAction>
            ) : (
              <AlertDialogCancel className="h-8 px-3.5 text-sm" onClick={() => setAlertOpen(false)}>
                닫기
              </AlertDialogCancel>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
