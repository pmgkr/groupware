import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import { useToggleState } from '@/hooks/useToggleState';
import { useUser } from '@/hooks/useUser';
import { mapExcelToExpenseItems } from '@/utils';
import { uploadFilesToServer, expenseRegister, getBankList, type BankList, getExpenseType, type ExpenseType } from '@/api';
import { ExpenseRow } from './_components/ExpenseRegisterRow';
import { UploadArea, type UploadAreaHandle, type PreviewFile } from './_components/UploadArea';

import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';
import { useAppDialog } from '@/components/common/ui/AppDialog/AppDialog';
import { SectionHeader } from '@components/ui/SectionHeader';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@components/ui/form';
import { Input } from '@components/ui/input';
import { Textarea } from '@components/ui/textarea';
import { Button } from '@components/ui/button';

import { DayPicker } from '@components/daypicker';
import { RadioButton, RadioGroup } from '@components/ui/radioButton';
import { Popover, PopoverTrigger, PopoverContent } from '@components/ui/popover';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectItem } from '@components/ui/select';

import { Add, Calendar, TooltipNoti, Delete, Close } from '@/assets/images/icons';
import { UserRound, FileText, OctagonAlert } from 'lucide-react';

import { format } from 'date-fns';
import { zodResolver } from '@hookform/resolvers/zod';
import { getMyAccounts, type BankAccount } from '@/api/mypage';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const expenseSchema = z.object({
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

export default function ExpenseRegister() {
  const navigate = useNavigate();
  const { user_id, user_name, user_level } = useUser();
  const uploadRef = useRef<UploadAreaHandle>(null);

  // Alert & Dialog hooks
  const { addAlert } = useAppAlert();
  const { addDialog } = useAppDialog();

  const { state } = useLocation(); // Excel 업로드 시 state.excelData 로 전달
  // 비용 항목 기본 세팅값 : Excel 업로드 시 0으로 세팅, 수기 작성 시 5개로 세팅
  const [articleCount, setArticleCount] = useState(state?.excelData ? 0 : 5);
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]); // 비용 유형 API State
  const [bankList, setBankList] = useState<BankList[]>([]);

  const [files, setFiles] = useState<PreviewFile[]>([]);
  const [hasFiles, setHasFiles] = useState(false); // 추가 업로드 버튼 활성화 State
  const [linkedRows, setLinkedRows] = useState<Record<string, number | null>>({}); // 업로드된 이미지와 연결된 행 번호 저장용
  const [activeFile, setActiveFile] = useState<string | null>(null); // UploadArea & Attachment 연결상태 공유용

  const formatDate = (d?: Date) => (d ? format(d, 'yyyy-MM-dd') : ''); // YYYY-MM-DD Date 포맷 변경

  const form = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(expenseSchema) as any,
    defaultValues: {
      el_method: '',
      bank_account: '',
      bank_name: '',
      bank_code: '',
      account_name: '',
      el_deposit: '',
      remark: '',
      expense_items: Array.from({ length: articleCount }).map(() => ({
        type: '',
        title: '',
        number: '',
        date: '',
        price: '',
        tax: '',
        total: '',
        pro_id: '',
      })),
    },
  });

  const { control } = form;
  const { fields, append, replace, remove } = useFieldArray({
    control,
    name: 'expense_items',
  });

  // 합계 계산: debounce 적용
  const watchedItems = useWatch({
    control: form.control,
    name: 'expense_items',
  });

  const totalSum = useMemo(() => {
    if (!Array.isArray(watchedItems)) return 0;
    return watchedItems.reduce((sum, item) => sum + (Number(item?.total) || 0), 0);
  }, [watchedItems]);

  const formattedTotal = totalSum.toLocaleString();

  useEffect(() => {
    (async () => {
      try {
        // 유저레벨이 staff나 user인 경우 nexp_type2 : manager나 admin인 경우 nexp_type1 호출
        const expenseTypeParam = user_level === 'staff' || user_level === 'user' ? 'nexp_type2' : 'nexp_type1';

        // 페이지 렌더 시 API 병렬 호출
        const [bankResult, expResult] = await Promise.allSettled([getBankList(), getExpenseType(expenseTypeParam)]);

        // API 개별 결과 관리
        if (bankResult.status === 'fulfilled') {
          const formattedBanks = bankResult.value.map((item: any) => item.code);
          setBankList(formattedBanks);
        } else {
          console.error('은행 목록 불러오기 실패:', bankResult.reason);
        }

        if (expResult.status === 'fulfilled') {
          setExpenseTypes(expResult.value);
        } else {
          console.error('비용 유형 불러오기 실패:', expResult.reason);
        }
      } catch (error) {
        // Promise.allSettled 자체는 에러를 던지지 않지만, 안전하게 감싸줌
        console.error('예상치 못한 오류 발생:', error);
      }
    })();
  }, []);

  // Excel 업로드 시 전달받은 rowCount 반영
  useEffect(() => {
    if (state?.excelData && Array.isArray(state.excelData)) {
      const mapped = mapExcelToExpenseItems(state.excelData);

      if (mapped.length > 0) {
        setArticleCount(mapped.length);
        replace(mapped);

        form.reset({
          ...form.getValues(),
          expense_items: mapped,
        });
      } else {
        form.reset({
          ...form.getValues(),
          expense_items: Array.from({ length: 5 }).map(() => ({
            type: '',
            title: '',
            number: '',
            date: '',
            price: '',
            tax: '',
            total: '',
            pro_id: '',
          })),
        });
      }
    }
  }, [state]);

  // 항목 추가 버튼 클릭 시
  const handleAddArticle = useCallback(() => {
    setArticleCount((prev) => prev + 1);
    append({ type: '', title: '', number: '', date: '', price: '', tax: '', total: '', pro_id: '' });
  }, [append]);

  // 항목 삭제 버튼 클릭 시
  const handleRemoveArticle = useCallback(
    (index: number) => {
      if (fields.length === 1) {
        addAlert({
          title: '비용 항목을 삭제할 수 없습니다.',
          message: '최소 1개의 비용 항목이 등록되어야 합니다.',
          icon: <OctagonAlert />,
          duration: 2000,
        });
        return;
      }
      remove(index);
      form.clearErrors('expense_items');
      setArticleCount((prev) => Math.max(prev - 1, 1));
    },
    [fields.length, form, remove]
  );

  // 증빙자료 추가 업로드 버튼 클릭 시 업로드 창 노출
  const handleAddUploadClick = () => {
    uploadRef.current?.openFileDialog();
  };

  // UploadArea에 파일이 업로드 파악 후 setHasFiels State 변경
  const handleFilesChange = (newFiles: PreviewFile[]) => {
    setFiles(newFiles);
    setHasFiles(newFiles.length > 0);
    setLinkedRows((prev) => {
      const updated = { ...prev };
      newFiles.forEach((f) => {
        if (!(f.name in updated)) updated[f.name] = null;
      });
      return updated;
    });
  };

  // UploadArea → AttachmentField 드롭 시
  const handleDropFiles = useCallback((files: PreviewFile[], fieldName: string, rowIndex: number | null) => {
    setLinkedRows((prev) => {
      const updated = { ...prev };
      if (rowIndex === null) {
        files.forEach((file) => {
          if (updated[file.name] !== undefined) updated[file.name] = null;
        });
      } else {
        files.forEach((file) => {
          updated[file.name] = rowIndex;
        });
      }
      return updated;
    });
  }, []);

  // AttachmentField에 개별 업로드 시
  const handleAttachUpload = useCallback(
    (newFiles: PreviewFile[], rowIndex: number | null) => {
      setFiles((prev) => {
        const unique = newFiles.filter((nf) => !prev.some((pf) => pf.name === nf.name));
        return [...prev, ...unique];
      });
      handleDropFiles(newFiles, '', rowIndex);
    },
    [handleDropFiles]
  );

  //내계좌 불러오기
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

  // 등록 버튼 클릭 시
  const onSubmit = async (values: any) => {
    try {
      const items = values.expense_items.filter((v: any) => v.title || v.price || v.total);

      if (items.length === 0) {
        addAlert({
          title: '작성된 비용 항목이 없습니다.',
          message: '최소 1개의 비용 항목이 작성되어야 합니다.',
          icon: <OctagonAlert />,
          duration: 2000,
        });
        return;
      }

      addDialog({
        title: '작성한 비용 항목을 등록합니다.',
        message: `<span class="text-primary-blue-500 font-semibold">${items.length}</span>건의 비용을 등록하시겠습니까?`,
        confirmText: '확인',
        cancelText: '취소',
        onConfirm: async () => {
          // [1] 연결된 파일 업로드
          const linkedFiles = files.filter((f) => linkedRows[f.name] !== null);
          let uploadedFiles: any[] = [];

          if (linkedFiles.length > 0) {
            // 🔹 행별 그룹화
            const filesByRow = linkedFiles.reduce<Record<number, PreviewFile[]>>((acc, f) => {
              const rowIdx = linkedRows[f.name];
              if (rowIdx !== null) {
                if (!acc[rowIdx]) acc[rowIdx] = [];
                acc[rowIdx].push(f);
              }
              return acc;
            }, {});

            // 🔹 업로드 대상 파일 변환
            const allNewFiles = linkedFiles.map((f) => ({
              ...f,
              rowIdx: linkedRows[f.name]!,
            }));

            const uploadable = await Promise.all(
              allNewFiles.map(async (f) => {
                const res = await fetch(f.preview);
                const blob = await res.blob();

                const ext = f.name.split('.').pop() || 'jpg';

                const item = values.expense_items?.[f.rowIdx - 1];
                const purchaseDate = item?.date ? format(new Date(item.date), 'yyyyMMdd') : format(new Date(), 'yyyyMMdd');

                // ✅ 사용자명, 증빙수단 정제
                const safeUserNm = (user_name || 'unknown').replace(/[^\w가-힣]/g, '');
                const safeElType = (item.type || '기타').replace(/[^\w가-힣]/g, '');

                // ✅ 기존 파일 중 가장 큰 인덱스
                const existingFiles = filesByRow[f.rowIdx] ?? [];
                let maxIndex = -1;

                existingFiles.forEach((att) => {
                  const match = att.name.match(/_(\d+)\.[^.]+$/);
                  if (match) {
                    const num = parseInt(match[1], 10);
                    if (!isNaN(num) && num > maxIndex) maxIndex = num;
                  }
                });

                // ✅ 같은 rowIdx 내 새 파일 순서
                const newFilesInRow = allNewFiles.filter((nf) => nf.rowIdx === f.rowIdx);
                const localIndex = newFilesInRow.indexOf(f);

                // ✅ 최종 인덱스
                const nextIndex = maxIndex + 1 + localIndex;

                // ✅ 최종 파일명 포맷
                const newFileName = `${safeUserNm}_${safeElType}_${purchaseDate}_${nextIndex}.${ext}`;

                return new File([blob], newFileName, { type: f.type || 'image/png' });
              })
            );

            // 서버 업로드
            uploadedFiles = await uploadFilesToServer(uploadable, 'nexpense');
            uploadedFiles = uploadedFiles.map((file, i) => ({
              ...file,
              rowIdx: allNewFiles[i]?.rowIdx ?? 0,
            }));

            console.log('✅ 업로드 완료:', uploadedFiles);
          }

          // [3] 파일을 항목별로 매핑
          const fileMap = uploadedFiles.reduce(
            (acc, file) => {
              if (!acc[file.rowIdx]) acc[file.rowIdx] = [];
              acc[file.rowIdx].push(file);
              return acc;
            },
            {} as Record<number, any[]>
          );

          // [4] expense_items에 파일 연결
          const enrichedItems = items.map((item: any, idx: number) => ({
            ...item,
            attachments: fileMap[idx + 1] || [], // rowIndex는 1부터 시작해서 +1
          }));

          console.log('enrichedItems:', enrichedItems);

          // [5] 단일 객체로 데이터 전송
          const payload = {
            header: {
              user_id: user_id!,
              el_method: values.el_method,
              el_attach: files.length > 0 ? 'Y' : 'N',
              el_deposit: values.el_deposit || '',
              bank_account: values.bank_account.replace(/-/g, ''),
              bank_name: values.bank_name,
              bank_code: values.bank_code,
              account_name: values.account_name,
              remark: values.remark || '',
            },
            items: enrichedItems.map((i: any) => ({
              el_type: i.type,
              ei_title: i.title,
              ei_pdate: i.date,
              ei_number: i.number || null,
              ei_amount: Number(i.price),
              ei_tax: Number(i.tax || 0),
              ei_total: Number(i.total),
              pro_id: !i.pro_id || i.pro_id === '0' || isNaN(Number(i.pro_id)) ? null : Number(i.pro_id),
              attachments: (i.attachments || []).map((att: any) => ({
                filename: att.fname,
                savename: att.sname,
                url: att.url,
              })),
            })),
          };

          console.log('📦 최종 payload:', payload);

          // 모든 리스트 병렬 API 호출 (성공/실패 결과 각각 수집)
          const result = await expenseRegister(payload);

          console.log('✅ 등록 성공:', result);

          if (result.ok && result.docs?.inserted) {
            const { list_count, item_count } = result.docs.inserted;

            addAlert({
              title: '비용 등록이 완료되었습니다.',
              message: `<p>총 <span class="text-primary-blue-500">${item_count}개</span> 비용 항목이 <span class="text-primary-blue-500">${list_count}개</span>의 리스트로 등록 되었습니다.</p>`,
              icon: <OctagonAlert />,
              duration: 2000,
            });

            navigate('/expense');
          } else {
            addAlert({
              title: '비용 등록 실패',
              message: `비용 등록 중 오류가 발생했습니다. \n 다시 시도해주세요.`,
              icon: <OctagonAlert />,
              duration: 2000,
            });
          }
        },
      });
    } catch (err) {
      console.error('❌ 등록 실패:', err);

      addAlert({
        title: '비용 등록 실패',
        message: `비용 등록 중 오류가 발생했습니다. \n 다시 시도해주세요.`,
        icon: <OctagonAlert />,
        duration: 2000,
      });
      return;
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid min-h-160 grid-cols-6 grid-rows-1 gap-6">
            <div className="col-span-4">
              <SectionHeader title="기본 정보" className="mb-4" />
              {/* 기본정보 입력 폼 */}
              <div className="mb-6">
                <FormField
                  control={form.control}
                  name="el_method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="gap-.5 h-6 font-bold text-gray-950">
                        증빙 수단<span className="text-primary-blue-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-x-1.5 [&_button]:mb-0">
                          <RadioButton value="PMG" label="PMG" variant="dynamic" iconHide />
                          <RadioButton value="MCS" label="MCS" variant="dynamic" iconHide />
                          <RadioButton value="개인카드" label="개인카드" variant="dynamic" iconHide />
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
                    control={form.control}
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
                              type="button"
                              size="icon"
                              title="내 대표계좌"
                              onClick={handleFillMyMainAccount}
                              className="bg-primary-blue-500/60 hover:bg-primary-blue-500/80 h-full rounded-none">
                              <UserRound className="size-3.5 text-white" />
                            </Button>
                            <Button
                              variant="svgIcon"
                              type="button"
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
                {/* 계좌 선택 */}
                <Dialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen}>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>계좌 선택</DialogTitle>
                    </DialogHeader>

                    <div className="mt-4 max-h-[300px] overflow-y-auto">
                      {accountList.map((acc) => (
                        <Button
                          key={acc.seq}
                          variant="ghost"
                          className="[&]:hover:bg-primary-blue-150 w-full justify-start"
                          onClick={() => handleSelectAccount(acc)}>
                          <div className="flex text-left">
                            <div className="text-primary-blue mr-3 font-semibold">{acc.account_alias || acc.account_name}</div>
                            <span className="mr-1 font-light text-gray-700">{acc.bank_account}</span>
                            <span className="font-light text-gray-700">({acc.bank_name})</span>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>

                <div className="long-v-divider px-5 text-base leading-[1.5] text-gray-700">
                  <FormField
                    control={form.control}
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
                    control={form.control}
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
                    control={form.control}
                    name="el_deposit"
                    render={({ field }) => {
                      const { isOpen, setIsOpen, close } = useToggleState();

                      return (
                        <FormItem className="flex flex-col">
                          <div className="flex h-6 justify-between">
                            <FormLabel className="gap-.5 font-bold text-gray-950">입금희망일</FormLabel>
                          </div>
                          <Popover open={isOpen} onOpenChange={setIsOpen}>
                            <div className="relative w-full">
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={'outline'}
                                    className={cn(
                                      'border-input focus-visible:border-primary-blue-300 h-11 w-full px-3 text-left text-base font-normal text-gray-700 hover:bg-[none]',
                                      !field.value && 'text-muted-foreground hover:text-muted-foreground',
                                      isOpen && 'border-primary-blue-300'
                                    )}>
                                    {field.value ? String(field.value) : <span>YYYY-MM-DD</span>}
                                    <Calendar className="ml-auto size-4.5 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                            </div>

                            <PopoverContent className="w-auto p-0" align="start">
                              <DayPicker
                                captionLayout="dropdown"
                                mode="single"
                                selected={field.value ? new Date(field.value) : undefined}
                                onSelect={(date) => {
                                  const formattedDate = date ? formatDate(date) : null;
                                  field.onChange(formattedDate);

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
                <div className="col-span-4 text-base leading-[1.5] text-gray-700">
                  <FormField
                    control={form.control}
                    name="remark"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex h-6 justify-between">
                          <FormLabel className="gap-.5 font-bold text-gray-950">비고</FormLabel>
                        </div>
                        <FormControl>
                          <Textarea placeholder="추가 기입할 정보가 있으면 입력해 주세요." className="h-16 min-h-16" {...field} />
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
                {fields.map((field, index) => (
                  <ExpenseRow
                    key={field.id}
                    index={index}
                    control={control}
                    expenseTypes={expenseTypes}
                    form={form}
                    onRemove={handleRemoveArticle}
                    handleDropFiles={handleDropFiles}
                    handleAttachUpload={handleAttachUpload}
                    files={files}
                    activeFile={activeFile}
                    setActiveFile={setActiveFile}
                  />
                ))}

                <div className="flex justify-end">
                  <Button type="button" size="sm" onClick={handleAddArticle}>
                    비용 항목 추가
                  </Button>
                </div>
                <div className="bg-primary-blue-100 mt-2 flex justify-between px-4 py-4 text-base font-medium">
                  <div className="flex w-[66%] justify-between">
                    <span>총 비용</span>
                    <span>{formattedTotal ? formattedTotal : 0} 원</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative col-span-2">
              <div className="sticky top-20 left-0 flex h-[calc(100vh-var(--spacing)*22)] flex-col justify-center gap-3 rounded-xl bg-gray-300 p-5">
                <div className="flex flex-none items-center justify-between">
                  <Link to="" className="text-primary-blue-500 flex gap-0.5 text-sm font-medium">
                    <TooltipNoti className="size-5" />
                    비용 관리 증빙자료 업로드 가이드
                  </Link>
                  {hasFiles && (
                    <Button type="button" size="sm" onClick={handleAddUploadClick}>
                      추가 업로드
                    </Button>
                  )}
                </div>
                <UploadArea
                  ref={uploadRef}
                  files={files}
                  setFiles={setFiles}
                  onFilesChange={handleFilesChange}
                  linkedRows={linkedRows}
                  activeFile={activeFile}
                  setActiveFile={setActiveFile}
                />
                <div className="flex flex-none justify-between">
                  <div className="flex gap-1.5">
                    <Button type="button" variant="outline" size="sm" onClick={() => uploadRef.current?.deleteSelectedFiles()}>
                      선택 삭제
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => uploadRef.current?.deleteAllFiles()}>
                      전체 삭제
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="my-10 flex justify-center gap-2">
            <Button type="submit" className="min-w-[120px]">
              등록
            </Button>
            <Button type="button" variant="outline" className="min-w-[120px]" asChild>
              <Link to="/expense">취소</Link>
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
