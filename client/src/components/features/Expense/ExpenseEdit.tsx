import { useEffect, useState, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToggleState } from '@/hooks/useToggleState';
import { UploadArea, type UploadAreaHandle, type PreviewFile } from './_components/UploadArea';
import { AttachmentFieldEdit } from './_components/AttachmentFieldEdit';
import { useUser } from '@/hooks/useUser';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getProposalList, matchNonProjectWithProposal, type ProposalItem } from '@/api/expense/proposal';
import { formatKST, formatAmount } from '@/utils';
import {
  getExpenseView,
  getBankList,
  type BankList,
  uploadFilesToServer,
  type ExpenseViewDTO,
  delExpenseAttachment,
  expenseUpdate,
} from '@/api';

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
import { Spinner } from '@components/ui/spinner';
import { RadioButton, RadioGroup } from '@components/ui/radioButton';
import { Popover, PopoverTrigger, PopoverContent } from '@components/ui/popover';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@components/ui/select';
import { Calendar, TooltipNoti, Close } from '@/assets/images/icons';
import { FileText, OctagonAlert, UserRound } from 'lucide-react';

import { format, parseISO } from 'date-fns';
import { statusIconMap, getLogMessage } from './utils/statusUtils';
import { Checkbox } from '@/components/ui/checkbox';
import { getMyAccounts, type BankAccount } from '@/api/mypage';

import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';
import { useAppDialog } from '@/components/common/ui/AppDialog/AppDialog';
import { AccountSelectDialog } from './_components/AccountSelectDialog';

// ✅ zod schema
const editSchema = z.object({
  el_method: z.string().nonempty('결제 수단을 선택해 주세요.'),
  el_title: z.string().nonempty('비용 제목을 입력해 주세요.'),
  account_name: z.string().nonempty('예금주명을 입력해 주세요.'),
  bank_code: z.string().nonempty('은행명을 선택해 주세요.'),
  bank_name: z.string().optional(),
  bank_account: z
    .string()
    .regex(/^[0-9-]+$/, '계좌번호 형식이 올바르지 않습니다.')
    .nonempty('계좌번호를 입력해 주세요.'),
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
        pro_id: z.string().nullable().optional(),
      })
    )
    .optional(),
});

type UploadedPreviewFile = {
  seq: number;
  ei_seq: number;
  fname: string;
  sname: string;
  ea_url: string;
};

type EditFormValues = z.infer<typeof editSchema>;

interface ExpenseEditProps {
  expId: string;
}

export default function ExpenseEdit({ expId }: ExpenseEditProps) {
  const navigate = useNavigate();
  const { user_id } = useUser();

  const [bankList, setBankList] = useState<BankList[]>([]);
  const [data, setData] = useState<ExpenseViewDTO | null>(null);
  const [header, setHeader] = useState<any>(null);
  const [logs, setLogs] = useState<any>(null);
  const depositPicker = useToggleState();

  const [newAttachments, setNewAttachments] = useState<Record<number, PreviewFile[]>>({}); // 새 증빙자료 State
  const [rowAttachments, setRowAttachments] = useState<Record<number, UploadedPreviewFile[]>>({}); // 기존 증빙자료 State

  const [loading, setLoading] = useState(true);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertDescription, setAlertDescription] = useState('');
  const [successState, setSuccessState] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // 비용 작성 등록 블로킹

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
      el_title: '',
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
  //내계좌 불러오기
  const { addAlert } = useAppAlert();
  const { addDialog } = useAppDialog();
  const [accountList, setAccountList] = useState<BankAccount[]>([]);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        const data = await getMyAccounts();
        setAccountList(data);
      } catch (err) {
        console.error('❌ 계좌 목록 불러오기 실패:', err);
      }
    })();
  }, []);
  const handleFillMyMainAccount = () => {
    const mainAcc = accountList.find((acc) => acc.flag === 'mine');

    if (!mainAcc) {
      addAlert({
        title: '계좌 없음',
        message: '대표 계좌가 등록되어 있지 않습니다.',
        icon: <OctagonAlert />,
        duration: 2500,
      });
      return;
    }

    form.setValue('bank_account', mainAcc.bank_account);
    form.setValue('bank_code', bankList.find((b) => b.name === mainAcc.bank_name)?.code || '');
    form.setValue('bank_name', mainAcc.bank_name);
    form.setValue('account_name', mainAcc.account_name);
  };

  //계좌 선택
  const handleOpenAccountDialog = () => {
    setAccountDialogOpen(true);
  };

  const handleSelectAccount = (acc: BankAccount) => {
    form.setValue('bank_account', acc.bank_account);
    form.setValue('bank_code', bankList.find((b) => b.name === acc.bank_name)?.code || '');
    form.setValue('bank_name', acc.bank_name);
    form.setValue('account_name', acc.account_name);

    setAccountDialogOpen(false);
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await getExpenseView(expId);
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
          pro_id: i.pro_id ? String(i.pro_id) : null,
        }));

        reset({
          el_method: h.el_method,
          el_title: h.el_title,
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
              ea_url: att.ea_url,
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

  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [proposalList, setProposalList] = useState<ProposalItem[]>([]);
  const [selectedProposalId, setSelectedProposalId] = useState<number | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<ProposalItem | null>(null);
  const [selectedProposalByRow, setSelectedProposalByRow] = useState<Record<number, number>>({});

  const handleOpenMatchingDialog = async () => {
    setDialogOpen(true);

    const flag = 'N';

    try {
      // 응답 구조: { success: boolean, items: ProposalItem[] }
      const res = await getProposalList(flag);

      const proposals = res.items ?? [];

      const filtered = proposals.filter((p) => ['일반비용', '교육비'].includes(p.rp_category) && !p.rp_expense_no);

      setProposalList(filtered);
    } catch (err) {
      console.error('기안서 리스트 불러오기 실패:', err);
    }
  };

  const hasProposalList = proposalList.length === 0;

  // 폼 제출
  const onSubmit = async (values: EditFormValues) => {
    addDialog({
      title: '일반 비용 수정',
      message: `비용을 수정하시겠습니까?`,
      confirmText: '확인',
      cancelText: '취소',
      onConfirm: async () => {
        try {
          setIsSubmitting(true);
          // 1️⃣ 새 업로드할 파일 목록 정리
          const allNewFiles = Object.entries(newAttachments).flatMap(([rowIdx, files]) =>
            files.map((f) => ({ ...f, rowIdx: Number(rowIdx) }))
          );

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
            const selectedProId = selectedProposalByRow[idx] ?? (item.pro_id ? Number(item.pro_id) : null);

            // (1) 기존 서버 첨부파일
            const existingAtt =
              rowAttachments[rowIdx]?.map((att) => ({
                fname: att.fname,
                sname: att.sname,
                url: att.ea_url,
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
              pro_id: selectedProId ?? item.pro_id,
              attachments: [...existingAtt, ...newAtt],
            };
          });

          console.log('enrichedItems', enrichedItems);

          // 6️⃣ 최종 payload 구성
          const payload = {
            header: {
              user_id: user_id!,
              el_method: values.el_method,
              el_title: values.el_title,
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
              pro_id: selectedProposalId,
              attachments: item.attachments.map((att: any) => ({
                filename: att.fname,
                savename: att.sname,
                url: att.url,
              })),
            })),
          };

          console.log('📦 최종 수정 payload:', payload);

          const res = await expenseUpdate(header.seq, payload);

          console.log(res);

          if (res.ok) {
            // ✅  기안서 매칭 (선택된 경우만)
            // 기안서 매칭이 바뀌지 않았으면 아래 기안서 매칭 API는 돌지 않아야함 (신규로 매칭 or 다른 기안서로 매칭하는 경우에만 API 호출)

            const itemSeq = (res as any).updated?.item_seqs ?? [];

            if (itemSeq.length === 0) {
              console.error('❌ 응답에서 item_seqs를 찾을 수 없음');
              setAlertTitle('수정 실패');
              setAlertDescription('아이템 정보를 가져오지 못했습니다.');
              setAlertOpen(true);
              return;
            }
            const selectedProId = enrichedItems.find((item) => item.pro_id !== null)?.pro_id ?? null;

            // 원본 데이터의 기안서 ID와 비교
            const originalProId = data?.items?.[0]?.pro_id ?? null;
            const isProposalChanged = selectedProId !== originalProId;

            console.log('🔍 기안서 변경 여부:', {
              원본: originalProId,
              현재: selectedProId,
              변경됨: isProposalChanged,
            });

            if (selectedProId && isProposalChanged) {
              try {
                // enrichedItems와 itemSeqs의 순서가 동일하므로 매핑
                const matchPromises = enrichedItems
                  .map((item, index) => ({
                    pro_id: item.pro_id,
                    item_seq: itemSeq[index],
                  }))
                  .filter(({ pro_id, item_seq }) => pro_id && item_seq !== undefined) // item_seq가 존재하는지 확인
                  .map(async ({ pro_id, item_seq }) => {
                    const matchResult = (await matchNonProjectWithProposal(pro_id as number, item_seq as number)) as {
                      success: boolean;
                      result: { type: string };
                    };

                    if (matchResult.success) {
                      console.log(`✅ 기안서 ${pro_id} - 아이템 ${item_seq} 매칭 완료`);
                    } else {
                      console.error(`❌ 기안서 ${pro_id} - 아이템 ${item_seq} 매칭 실패`);
                    }

                    return matchResult.success;
                  });

                if (matchPromises.length === 0) {
                  console.log('ℹ️ 매칭할 아이템 없음');
                } else {
                  const results = await Promise.all(matchPromises);
                  const allSuccess = results.every((r) => r);

                  if (!allSuccess) {
                    throw new Error('일부 매칭 실패');
                  }

                  console.log('✅ 모든 기안서 매칭 완료');
                }
              } catch (e) {
                console.error('❌ 기안서 매칭 실패:', e);
                setAlertTitle('부분 실패');
                setAlertDescription('비용은 수정되었으나 기안서 매칭에 실패했습니다.');
                setAlertOpen(true);
                return;
              }
            } else if (selectedProId && !isProposalChanged) {
              console.log('ℹ️ 기안서 변경 없음 - 매칭 API 호출 스킵');
            }

            addAlert({
              title: '비용 수정 완료',
              message: `${res.updated.itemCount} 건의 일반 비용이 수정되었습니다.`,
              icon: <OctagonAlert />,
              duration: 1500,
            });

            navigate(`/expense/${expId}`);
          } else {
            addAlert({
              title: '비용 수정 실패',
              message: '일반 비용 수정을 실패했습니다. 다시 시도해 주세요.',
              icon: <OctagonAlert />,
              duration: 1500,
            });
          }
        } catch (err) {
          console.error('❌ 수정 실패:', err);
          addAlert({
            title: '비용 수정 실패',
            message: '일반 비용 수정을 실패했습니다. 다시 시도해 주세요.',
            icon: <OctagonAlert />,
            duration: 1500,
          });
        } finally {
          setIsSubmitting(false);
        }
      },
    });
  };

  if (loading) return <p className="p-10 text-center text-gray-500">로딩 중...</p>;

  return (
    <>
      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="flex w-full max-w-sm flex-col items-center rounded-lg bg-white px-4 py-8 leading-[1.3] shadow-lg">
            <Spinner className="text-primary-blue-500 mb-3 size-12" />
            <p className="text-lg font-bold text-gray-800">작성한 비용을 등록하고 있습니다</p>
            <p className="text-base text-gray-500">잠시만 기다려 주세요</p>
          </div>
        </div>
      )}

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
                          <RadioButton value="기타" label="기타" variant="dynamic" iconHide />
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid-row-3 mb-12 grid grid-cols-4 gap-y-6 tracking-tight">
                <div className="col-span-4 text-base leading-[1.5] text-gray-700">
                  <FormField
                    control={form.control}
                    name="el_title"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex h-6 justify-between">
                          <FormLabel className="gap-.5 font-bold text-gray-950">비용 제목</FormLabel>
                        </div>
                        <FormControl>
                          <Input placeholder="비용 제목을 입력해 주세요" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
                              type="button"
                              variant="svgIcon"
                              size="icon"
                              title="내 대표계좌"
                              onClick={handleFillMyMainAccount}
                              className="bg-primary-blue-500/60 hover:bg-primary-blue-500/80 h-full rounded-none">
                              <UserRound className="size-3.5 text-white" />
                            </Button>
                            <Button
                              type="button"
                              variant="svgIcon"
                              size="icon"
                              title="내 계좌리스트"
                              onClick={handleOpenAccountDialog}
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

                <AccountSelectDialog
                  open={accountDialogOpen}
                  onOpenChange={setAccountDialogOpen}
                  accounts={accountList}
                  bankList={bankList}
                  onSelect={handleSelectAccount}
                />

                <div className="long-v-divider px-5 text-base leading-[1.5] text-gray-700">
                  <FormField
                    control={control}
                    name="el_deposit"
                    render={({ field }) => {
                      //const { isOpen, setIsOpen, close } = useToggleState();
                      return (
                        <FormItem>
                          <div className="flex h-6 justify-between">
                            <FormLabel className="gap-.5 font-bold text-gray-950">입금희망일</FormLabel>
                          </div>
                          <Popover open={depositPicker.isOpen} onOpenChange={depositPicker.setIsOpen}>
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
                  const currentProId = selectedProposalByRow[index] ?? data?.items?.[index]?.pro_id;
                  const currentProTitle = currentProId
                    ? proposalList.find((p) => p.rp_seq === currentProId)?.rp_title || data?.items?.[index]?.rp_title
                    : null;
                  return (
                    <article
                      key={`${field.id}`}
                      className="relative border-b border-gray-300 px-2 pt-10 pb-8 last-of-type:border-b-0 last-of-type:pb-4">
                      <div className="absolute top-2 left-0 flex w-full items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="outlinePrimary"
                          size="xs"
                          className="..."
                          onClick={() => {
                            setActiveRowIndex(index);
                            handleOpenMatchingDialog();
                          }}>
                          <FileText className="size-3.5" />
                          {currentProTitle || '기안서 매칭'}
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
                                        const raw = e.target.value
                                          .replace(/,/g, '')
                                          .replace(/[^0-9-]/g, '')
                                          .replace(/(?!^)-/g, ''); // 마이너스는 맨 앞만 허용

                                        field.onChange(raw);

                                        const taxValue =
                                          Number(String(form.getValues(`expense_items.${index}.tax`) || '').replace(/,/g, '')) || 0;

                                        const priceValue = Number(raw || 0);
                                        const total = priceValue + taxValue;

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
                                preview: att.ea_url,
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

      {/* 기안서 매칭 다이얼로그 */}
      <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>기안서 매칭</DialogTitle>
          </DialogHeader>

          <Table variant="primary">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">구분</TableHead>
                <TableHead>제목</TableHead>
                <TableHead className="w-[120px]">금액</TableHead>
                <TableHead className="w-[240px]">작성일</TableHead>
                <TableHead className="w-[40px]" />
              </TableRow>
            </TableHeader>

            <TableBody>
              {hasProposalList ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-[13px] text-gray-500">
                    등록된 기안서가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                proposalList.map((p) => {
                  const isSelected = selectedProposalId === p.rp_seq;
                  const isDisabled = selectedProposalId !== null && !isSelected;

                  return (
                    <TableRow key={p.rp_seq} className="hover:bg-gray-100">
                      <TableCell>{p.rp_category}</TableCell>
                      <TableCell className="text-left">{p.rp_title}</TableCell>
                      <TableCell className="text-right">{formatAmount(p.rp_cost)}원</TableCell>
                      <TableCell>{formatKST(p.rp_date)}</TableCell>
                      <TableCell className="px-2.5">
                        <Checkbox
                          size="sm"
                          checked={isSelected}
                          disabled={isDisabled}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedProposalId(p.rp_seq);
                              setSelectedProposal(p);
                            } else {
                              setSelectedProposalId(null);
                              setSelectedProposal(null);
                            }
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          <div className="mt-6 flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                // ✅ 취소 시 선택 초기화
                setSelectedProposalId(null);
                setSelectedProposal(null);
                setDialogOpen(false);
              }}>
              취소
            </Button>
            <Button
              size="sm"
              type="button"
              disabled={!selectedProposalId}
              onClick={() => {
                if (activeRowIndex === null || !selectedProposalId) {
                  console.log('❌ 조건 실패');
                  return;
                }
                setSelectedProposalByRow((prev) => ({
                  ...prev,
                  [activeRowIndex]: selectedProposalId,
                }));
                console.log('✅ 기안서 선택됨:', selectedProposalId, '→ row', activeRowIndex);
                setDialogOpen(false);
              }}>
              선택하기
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
