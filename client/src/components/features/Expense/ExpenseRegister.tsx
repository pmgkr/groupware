import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import { useToggleState } from '@/hooks/useToggleState';
import { UploadArea, type UploadAreaHandle, type PreviewFile } from './UploadArea';
import { AttachmentField } from './AttachmentField';
import { useUser } from '@/hooks/useUser';
import { formatAmount, mapExcelToExpenseItems } from '@/utils';
import { uploadFilesToServer, expenseRegister, getBankList, type BankList, getExpenseType, type ExpenseType } from '@/api';

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
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@components/ui/form';
import { Input } from '@components/ui/input';
import { Checkbox } from '@components/ui/checkbox';
import { Textarea } from '@components/ui/textarea';
import { Button } from '@components/ui/button';

import { DayPicker } from '@components/daypicker';
import { RadioButton, RadioGroup } from '@components/ui/radioButton';
import { Popover, PopoverTrigger, PopoverContent } from '@components/ui/popover';
import { Dialog, DialogTrigger, DialogContent } from '@components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectItem } from '@components/ui/select';

import { Add, Calendar, TooltipNoti, Delete } from '@/assets/images/icons';
import { UserRound, FileText } from 'lucide-react';

import { format } from 'date-fns';
import { zodResolver } from '@hookform/resolvers/zod';

const expenseSchema = z.object({
  el_method: z.string().nonempty('결제 수단을 선택해주세요.'),
  account_name: z.string().nonempty('예금주명을 입력해주세요.'),
  bank_code: z.string().nonempty('은행명을 선택해주세요.'),
  bank_name: z.string().optional(),
  bank_account: z
    .string()
    .regex(/^[0-9-]+$/, '계좌번호 형식이 올바르지 않습니다.')
    .nonempty('계좌번호를 입력해주세요.'),
  desired_deposit_date: z.string().optional(),
  expense_remark: z.string().optional(),
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
  const { user_id, user_level } = useUser();
  const uploadRef = useRef<UploadAreaHandle>(null);

  const { state } = useLocation(); // Excel 업로드 시 state.excelData 로 전달
  // 비용 항목 기본 세팅값 : Excel 업로드 시 0으로 세팅, 수기 작성 시 5개로 세팅
  const [articleCount, setArticleCount] = useState(state?.excelData ? 0 : 5);
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]); // 비용 유형 API State
  const [bankList, setBankList] = useState<BankList[]>([]);

  const [files, setFiles] = useState<PreviewFile[]>([]);
  const [selectedRows, setSelectedRows] = useState<number[]>([]); // 선택된 비용 항목 State
  const [hasFiles, setHasFiles] = useState(false); // 추가 업로드 버튼 활성화 State
  const [linkedRows, setLinkedRows] = useState<Record<string, number | null>>({}); // 업로드된 이미지와 연결된 행 번호 저장용
  const [activeFile, setActiveFile] = useState<string | null>(null); // UploadArea & Attachment 연결상태 공유용

  const [successState, setSuccessState] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false); // Alert 오픈 On/Off
  const [alertTitle, setAlertTitle] = useState<string | null>(null); // Alert 타이틀 State
  const [alertDescription, setAlertDescription] = useState<string | null>(null); // Alert 내용 State

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
      desired_deposit_date: '',
      expense_remark: '',
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

  const watchedItems = useWatch({
    control,
    name: 'expense_items',
  });

  const totalSum = useMemo(() => {
    if (!Array.isArray(watchedItems)) return 0;
    return watchedItems.reduce((sum, item) => {
      const value = Number(item?.total || 0);
      return sum + (isNaN(value) ? 0 : value);
    }, 0);
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

  // 체크박스 핸들러 함수
  const handleCheckRow = useCallback((index: number, checked: string | boolean) => {
    setSelectedRows((prev) => (checked ? [...prev, index] : prev.filter((i) => i !== index)));
  }, []);

  // 항목 추가 버튼 클릭 시
  const handleAddArticle = () => {
    setArticleCount((prev) => prev + 1);
    append({ type: '', title: '', number: '', date: '', price: '', tax: '', total: '', pro_id: '' });
  };

  // 항목 삭제 버튼 클릭 시
  const handleRemoveArticle = (index: number) => {
    if (fields.length === 1) {
      setAlertTitle('알림');
      setAlertDescription('최소 1개의 비용 항목이 등록되어야 합니다.');
      setAlertOpen(true);
      return;
    }

    remove(index); // 해당 인덱스 행 삭제
    form.clearErrors('expense_items');
    setArticleCount((prev) => Math.max(prev - 1, 1)); // 상태 동기화
  };

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

  // AttachmentField에 개별 업로드 시
  const handleAttachUpload = (newFiles: PreviewFile[], rowIndex: number | null) => {
    setFiles((prev) => {
      const unique = newFiles.filter((nf) => !prev.some((pf) => pf.name === nf.name));
      return [...prev, ...unique];
    });
    handleDropFiles(newFiles, '', rowIndex);
  };

  // UploadArea → AttachmentField 드롭 시
  const handleDropFiles = (files: PreviewFile[], fieldName: string, rowIndex: number | null) => {
    setLinkedRows((prev) => {
      const updated = { ...prev };

      if (rowIndex === null) {
        files.forEach((file) => {
          if (updated[file.name] !== undefined) {
            updated[file.name] = null;
          }
        });
      } else {
        files.forEach((file) => {
          updated[file.name] = rowIndex;
        });
      }

      return updated;
    });
  };

  // 등록 버튼 클릭 시
  const onSubmit = async (values: any) => {
    try {
      const items = values.expense_items.filter((v: any) => v.title || v.price || v.total);

      if (items.length === 0) {
        setAlertTitle('알림');
        setAlertDescription('최소 1개의 비용 항목이 등록되어야 합니다.');
        setAlertOpen(true);
        return;
      }

      /// [1] 연결된 파일 추출
      const linkedFiles = files.filter((f) => linkedRows[f.name] !== null);
      let uploadedFiles: any[] = [];

      if (linkedFiles.length > 0) {
        // [2] File 객체로 변환 (dataURL → Blob)
        const uploadable = await Promise.all(
          linkedFiles.map(async (f) => {
            const res = await fetch(f.preview);
            const blob = await res.blob();
            return new File([blob], f.name, { type: f.type || 'image/png' });
          })
        );

        // [3] 서버 업로드
        uploadedFiles = await uploadFilesToServer(uploadable, 'nexpense');
        console.log('✅ 업로드 완료:', uploadedFiles);
      }

      // [4] 파일을 행(rowIndex)별로 매핑
      const fileMap = Object.entries(linkedRows).reduce(
        (acc, [fname, row]) => {
          if (row !== null) {
            const uploaded = uploadedFiles.find(
              (u) => u.fname === fname || decodeURIComponent(u.fname) === decodeURIComponent(fname) || u.fname.includes(fname.split('.')[0])
            );

            if (uploaded) {
              if (!acc[row]) acc[row] = [];
              acc[row].push(uploaded);
            } else {
              console.warn('❗파일 매칭 실패:', fname, uploadedFiles);
            }
          }
          return acc;
        },
        {} as Record<number, any[]>
      );

      // [5] expense_items에 파일 연결
      const enrichedItems = items.map((item: any, idx: number) => ({
        ...item,
        attachments: fileMap[idx + 1] || [], // rowIndex는 1부터 시작해서 +1
      }));

      // [6] 유형별로 그룹화
      const grouped = enrichedItems.reduce((acc: any, item: any) => {
        const type = item.type;
        if (!acc[type]) acc[type] = [];
        acc[type].push(item);
        return acc;
      }, {});

      const payload = Object.keys(grouped).map((type) => ({
        header: {
          user_id: user_id!,
          el_method: values.el_method,
          el_attach: files.length > 0 ? 'Y' : 'N',
          el_deposit: values.desired_deposit_date || '',
          bank_account: values.bank_account.replace(/-/g, ''),
          bank_name: values.bank_name,
          bank_code: values.bank_code,
          account_name: values.account_name,
          remark: values.expense_remark || '',
        },
        items: grouped[type].map((i: any) => ({
          el_type: i.type,
          ei_title: i.title,
          ei_pdate: i.date,
          ei_number: i.number || null,
          ei_amount: Number(i.price),
          ei_tax: Number(i.tax || 0),
          ei_total: Number(i.total),
          pro_id: !i.pro_id || i.pro_id === '0' || isNaN(Number(i.pro_id)) ? null : Number(i.pro_id),
          attachments: (i.attachments || []).map((att: any) => ({
            filename: att.fname || att.filename,
            url: att.url,
          })),
        })),
      }));

      console.log('📦 최종 payload:', payload);

      // 모든 리스트 병렬 API 호출 (성공/실패 결과 각각 수집)
      const results = await Promise.allSettled(payload.map((list) => expenseRegister(list)));

      const successResults = results.filter((r) => r.status === 'fulfilled');
      const failedResults = results.filter((r) => r.status === 'rejected');

      console.log('✅ 성공 목록:', successResults);
      console.log('❌ 실패 목록:', failedResults);

      // [8] 사용자 피드백
      if (failedResults.length === 0) {
        setAlertTitle('비용 등록');
        setAlertDescription(`총 ${successResults.length}건의 비용이 성공적으로 등록되었습니다.`);
        setAlertOpen(true);
        setSuccessState(true);
        return;
      } else {
        setAlertTitle('비용 등록 오류');
        setAlertDescription(`총 ${payload.length}건 중 ${successResults.length}건 등록 성공\n${failedResults.length}건 등록 실패했습니다.`);
        setAlertOpen(true);
        setSuccessState(true);

        alert(
          `총 ${payload.length}건 중 ${successResults.length}건 등록 성공, ${failedResults.length}건 실패했습니다.\n\n` +
            '실패한 항목은 관리자에게 문의해주세요.'
        );
      }
    } catch (err) {
      console.error('❌ 등록 실패:', err);

      setAlertTitle('등록 실패');
      setAlertDescription(`등록 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.`);
      setAlertOpen(true);
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
                          <RadioButton value="개인" label="개인카드" variant="dynamic" iconHide />
                          <RadioButton value="기타" label="기타" variant="dynamic" iconHide />
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
                    name="desired_deposit_date"
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
                                      'border-input text-accent-foreground h-11 w-full px-3 text-left text-base font-normal hover:bg-[none]',
                                      !field.value && 'text-muted-foreground hover:text-muted-foreground'
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
                    name="expense_remark"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex h-6 justify-between">
                          <FormLabel className="gap-.5 font-bold text-gray-950">비고</FormLabel>
                        </div>
                        <FormControl>
                          <Textarea placeholder="추가 기입할 정보가 있으면 입력해 주세요." className="hover:shadow-none" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* 비용항목 입력 폼 */}
              <SectionHeader title="비용 항목" className="mb-5" />
              <div>
                {fields.map((field, index) => {
                  return (
                    <article key={field.id} className="border-b border-gray-300 py-6 first:pt-0 last-of-type:border-b-0">
                      <div className="flex items-center justify-between">
                        <div className="flex w-full justify-between gap-x-4">
                          <div className="flex items-center gap-x-2">
                            <Checkbox
                              id={`expense_items.${index}`}
                              className="hover:shadow-none"
                              checked={selectedRows.includes(index)}
                              onCheckedChange={(checked) => handleCheckRow(index, checked)}
                            />
                          </div>
                          <div className="flex w-[32%] gap-2 pl-2">
                            <FormField
                              control={form.control}
                              name={`expense_items.${index}.pro_id`}
                              render={({ field }) => (
                                <FormItem className="flex flex-1 items-center gap-x-2">
                                  <FormControl>
                                    <Select>
                                      <SelectTrigger size="sm" className="w-full">
                                        <SelectValue placeholder="지출 기안서 선택" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectGroup>
                                          <SelectItem value="apple">Apple</SelectItem>
                                          <SelectItem value="banana">Banana</SelectItem>
                                          <SelectItem value="blueberry">Blueberry</SelectItem>
                                          <SelectItem value="grapes">Grapes</SelectItem>
                                          <SelectItem value="pineapple">Pineapple</SelectItem>
                                        </SelectGroup>
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <Button type="button" variant="svgIcon" size="icon" onClick={() => handleRemoveArticle(index)}>
                              <Delete className="size-5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-between">
                        {/* Excel로 로드 시 승인번호 숨김처리로 노출 */}
                        <input type="hidden" name={`expense_items.${index}.number`} value="" />
                        <div className="grid w-[66%] grid-cols-3 gap-4 tracking-tight">
                          <div className="long-v-divider text-base leading-[1.5] text-gray-700">
                            <FormField
                              control={control}
                              name={`expense_items.${index}.type`}
                              render={({ field }) => (
                                <FormItem>
                                  <div className="flex h-6 justify-between">
                                    <FormLabel className="gap-.5 font-bold text-gray-950">비용 유형</FormLabel>
                                  </div>
                                  <FormControl>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} name={field.name}>
                                      <FormControl>
                                        <SelectTrigger className="aria-[invalid=true]:border-destructive w-full">
                                          <SelectValue placeholder={expenseTypes.length ? '비용 유형 선택' : '불러오는 중...'} />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent className="max-h-80 w-full">
                                        {expenseTypes.map((item, i) => (
                                          <SelectItem key={i} value={item.code}>
                                            {item.code}
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
                          <div className="text-base leading-[1.5] text-gray-700">
                            <FormField
                              control={form.control}
                              name={`expense_items.${index}.title`}
                              render={({ field }) => (
                                <FormItem>
                                  <div className="flex h-6 justify-between">
                                    <FormLabel className="gap-.5 font-bold text-gray-950">가맹점명</FormLabel>
                                  </div>
                                  <FormControl>
                                    <Input placeholder="가맹점명" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="text-base leading-[1.5] text-gray-700">
                            <FormField
                              control={form.control}
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
                                                'border-input text-accent-foreground h-11 w-full px-3 text-left text-base font-normal hover:bg-[none]',
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
                              control={form.control}
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
                                        const raw = e.target.value.replace(/[^0-9-]/g, '');
                                        field.onChange(raw); // 실제 값은 콤마 없는 숫자 문자열
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="text-base leading-[1.5] text-gray-700">
                            <FormField
                              control={form.control}
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
                                        field.onChange(raw); // 실제 값은 콤마 없는 숫자 문자열
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="text-base leading-[1.5] text-gray-700">
                            <FormField
                              control={form.control}
                              name={`expense_items.${index}.total`}
                              render={({ field }) => (
                                <FormItem>
                                  <div className="flex h-6 justify-between">
                                    <FormLabel className="gap-.5 font-bold text-gray-950">합계</FormLabel>
                                  </div>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      inputMode="numeric"
                                      placeholder="합계"
                                      value={field.value ? formatAmount(field.value) : ''}
                                      onChange={(e) => {
                                        const raw = e.target.value.replace(/[^0-9-]/g, '');
                                        field.onChange(raw); // 실제 값은 콤마 없는 숫자 문자열
                                      }}
                                      onFocus={() => {
                                        const price =
                                          Number(String(form.getValues(`expense_items.${index}.price`) || '').replace(/,/g, '')) || 0;
                                        const tax =
                                          Number(String(form.getValues(`expense_items.${index}.tax`) || '').replace(/,/g, '')) || 0;
                                        const total = price + tax;
                                        form.setValue(`expense_items.${index}.total`, total.toString(), {
                                          shouldValidate: false,
                                          shouldDirty: true,
                                        });
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                        <div className="w-[32%] pl-2">
                          <AttachmentField
                            control={form.control}
                            name={`expense_attachment${index}`}
                            rowIndex={index + 1}
                            onDropFiles={handleDropFiles}
                            onUploadFiles={handleAttachUpload}
                            activeFile={activeFile}
                            setActiveFile={setActiveFile}
                            files={files}
                          />
                        </div>
                      </div>
                    </article>
                  );
                })}

                <div className="flex justify-between">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (selectedRows.length === 0) {
                        setAlertTitle('알림');
                        setAlertDescription('삭제할 항목을 선택해주세요.');
                        setAlertOpen(true);
                        return;
                      }

                      const sorted = [...selectedRows].sort((a, b) => b - a);
                      sorted.forEach((i) => handleRemoveArticle(i));
                      setSelectedRows([]);
                    }}>
                    선택 항목 삭제
                  </Button>
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
                    <Button size="sm" onClick={handleAddUploadClick}>
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
            <Button type="submit">등록</Button>
            <Button type="button" variant="outline" asChild>
              <Link to="/expense">취소</Link>
            </Button>
          </div>
        </form>
      </Form>

      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertTitle}</AlertDialogTitle>
            <AlertDialogDescription
              className="whitespace-pre-line text-gray-700"
              dangerouslySetInnerHTML={{
                __html: alertDescription || '', // HTML 태그 포함 허용
              }}
            />
          </AlertDialogHeader>
          <AlertDialogFooter>
            {successState ? (
              <AlertDialogAction className="h-8 px-3.5 text-sm" onClick={() => navigate('/expense')}>
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
