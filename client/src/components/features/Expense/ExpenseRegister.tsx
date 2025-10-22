import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { useForm } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToggleState } from '@/hooks/useToggleState';
import { UploadArea, type UploadAreaHandle, type PreviewFile } from './UploadArea';
import { AttachmentField } from './AttachmentField';
import { useUser } from '@/hooks/useUser';
import { uploadFilesToServer, getBankList, type BankList, getExpenseType, type ExpenseType } from '@/api';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@components/ui/alert-dialog';
import { SectionHeader } from '@components/ui/SectionHeader';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@components/ui/form';
import { Input } from '@components/ui/input';
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

export default function ExpenseRegister() {
  const { user_id, user_level } = useUser();
  const form = useForm();
  const uploadRef = useRef<UploadAreaHandle>(null);
  const { state } = useLocation(); // Excel 업로드에서 rowCount 전달받음

  const [articleCount, setArticleCount] = useState(5); // 비용항목 초기값 5개
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]); // 비용 유형 API State
  const [bankList, setBankList] = useState<BankList[]>([]);

  const [files, setFiles] = useState<PreviewFile[]>([]);
  const [hasFiles, setHasFiles] = useState(false); // 추가 업로드 버튼 활성화 State
  const [linkedRows, setLinkedRows] = useState<Record<string, number | null>>({}); // 업로드된 이미지와 연결된 행 번호 저장용
  const [activeFile, setActiveFile] = useState<string | null>(null); // UploadArea & Attachment 연결상태 공유용

  const [alertMsg, setAlertMsg] = useState<string | null>(null); // 얼럿 메세지용
  const [alertOpen, setAlertOpen] = useState(false); // 얼럿 다이얼로그 오픈용

  const formatDate = (d?: Date) => (d ? format(d, 'yyyy-MM-dd') : ''); // YYYY-MM-DD Date 포맷 변경

  useEffect(() => {
    (async () => {
      try {
        // 유저레벨이 staff나 user인 경우 nexp_type2 : manager나 admin인 경우 nexp_type1 호출
        const expenseTypeParam = user_level === 'staff' || user_level === 'user' ? 'nexp_type2' : 'nexp_type1';

        // 페이지 렌더 시 API 병렬 호출
        const results = await Promise.allSettled([getBankList(), getExpenseType(expenseTypeParam)]);
        const [bankResult, expResult] = results;

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
    if (state?.rowCount) {
      setArticleCount(state.rowCount);
    }
  }, [state]);

  // 항목 추가 버튼 클릭 시
  const handleAddArticle = () => {
    setArticleCount((prev) => prev + 1);
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

  const onSubmit = async (values: any) => {
    try {
      // ------------------------------------------
      // 1️⃣ 연결된 파일만 필터링
      const linkedFiles = files.filter((f) => linkedRows[f.name]);
      if (linkedFiles.length > 0) {
        console.log('업로드 대상 파일:', linkedFiles);
      }

      // ------------------------------------------
      // 2️⃣ dataURL → Blob 변환 후 File 생성
      const uploadable = await Promise.all(
        linkedFiles.map(async (f) => {
          const res = await fetch(f.preview);
          const blob = await res.blob();
          return new File([blob], f.name, { type: f.type || 'image/png' });
        })
      );

      // ------------------------------------------
      // 3️⃣ 서버 업로드 (공통 http 기반)
      const uploaded = await uploadFilesToServer(uploadable, 'expense');
      // uploaded = [{ fname, sname, url, subdir }]

      // ------------------------------------------
      // 4️⃣ 항목 데이터 수집
      const items = Array.from({ length: articleCount }).map((_, i) => {
        const rowFiles = files.filter((f) => linkedRows[f.name] === i + 1);
        const matched = rowFiles.map((rf) => {
          const found = uploaded.find((u) => u.fname === rf.name);
          return found ? { fname: found.fname, sname: found.sname } : { fname: rf.name, sname: rf.name };
        });

        return {
          el_type: values[`expense_type${i}`],
          ei_title: values[`expense_title${i}`],
          el_pdate: values[`expense_date${i}`],
          ei_number: values[`expense_number${i}`] || '',
          ei_amount: Number(values[`expense_price${i}`]) || 0,
          ei_tax: Number(values[`expense_tax${i}`]) || 0,
          el_total: Number(values[`expense_total${i}`]) || 0,
          pro_id: values[`project_id${i}`] || '12345',
          attachments: matched[0] || null, // 여러개면 첫 파일만 저장
        };
      });

      // ------------------------------------------
      // 5️⃣ el_type 기준 그룹화
      const grouped = items.reduce(
        (acc, item) => {
          const type = item.el_type || '기타';
          if (!acc[type]) acc[type] = [];
          acc[type].push(item);
          return acc;
        },
        {} as Record<string, typeof items>
      );

      // ------------------------------------------
      // 6️⃣ 상위 리스트 구성
      const lists = Object.keys(grouped).map((type) => ({
        user_id,
        el_method: values.el_method,
        el_attach: files.length > 0 ? 'Y' : 'N',
        el_deposit: values.desired_deposit_date || '',
        bank_account: (values.bank_account || '').replace(/-/g, ''),
        bank_name: values.account_bank,
        bank_code: values.bank_code,
        account_name: values.account_name,
        remark: values.expense_remark || '',
        expense_item: grouped[type],
      }));

      console.log('📦 최종 payload:', lists);

      // ------------------------------------------
      // // 7️⃣ 등록 API 호출
      // const res = await http<{ ok: boolean; list_count: number; item_count: number }>(
      //   '/user/expense/register',
      //   {
      //     method: 'POST',
      //     body: JSON.stringify(lists),
      //   }
      // );

      // if (!res.ok) throw new Error('등록 실패');
      // alert(`${res.list_count ?? lists.length}건의 비용이 등록되었습니다.`);
    } catch (err) {
      console.error('등록 실패:', err);
      // alert('등록 중 오류가 발생했습니다.');
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
                <RadioGroup className="flex gap-x-1.5 [&_button]:mb-0">
                  <RadioButton value="PMG" label="PMG" variant="dynamic" size="xs" iconHide={true} />
                  <RadioButton value="MCS" label="MCS" variant="dynamic" size="xs" iconHide={true} />
                  <RadioButton value="개인" label="개인카드" variant="dynamic" size="xs" iconHide={true} />
                  <RadioButton value="기타" label="기타" variant="dynamic" size="xs" iconHide={true} />
                </RadioGroup>
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
                    name="account_bank"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex h-6 justify-between">
                          <FormLabel className="gap-.5 font-bold text-gray-950">
                            은행명<span className="text-primary-blue-500">*</span>
                          </FormLabel>
                        </div>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value} name={field.name}>
                            <FormControl>
                              <SelectTrigger className="aria-[invalid=true]:border-destructive w-full">
                                <SelectValue placeholder={bankList.length ? '은행 선택' : '불러오는 중...'} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-80 w-full">
                              {bankList.map((item, i) => (
                                <SelectItem key={i} value={item.code}>
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
                                selected={field.value}
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
              <SectionHeader
                title="비용 항목"
                buttonText="항목 추가"
                buttonVariant="outlinePrimary"
                buttonSize="sm"
                buttonIcon={<Add className="size-4" />}
                onButtonClick={handleAddArticle}
                className="mb-4"
              />
              <div>
                {Array.from({ length: articleCount }).map((_, index) => {
                  return (
                    <article key={index} className="border-b border-gray-300 py-5 first:pt-0">
                      <div className="flex items-center justify-between">
                        <Button variant="svgIcon" size="xs" onClick={(e) => {}}>
                          <Delete />
                        </Button>
                      </div>
                      <div className="mt-4 flex justify-between">
                        <div className="grid w-[66%] grid-cols-3 gap-4 tracking-tight">
                          <div className="long-v-divider text-base leading-[1.5] text-gray-700">
                            <FormField
                              control={form.control}
                              name={`expense_type${index}`}
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
                              name={`expense_title${index}`}
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
                              name={`expense_date${index}`}
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
                                          selected={field.value}
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
                          <div className="text-base leading-[1.5] text-gray-700">
                            <FormField
                              control={form.control}
                              name={`expense_price${index}`}
                              render={({ field }) => (
                                <FormItem>
                                  <div className="flex h-6 justify-between">
                                    <FormLabel className="gap-.5 font-bold text-gray-950">금액</FormLabel>
                                  </div>
                                  <FormControl>
                                    <Input placeholder="금액" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="text-base leading-[1.5] text-gray-700">
                            <FormField
                              control={form.control}
                              name={`expense_tax${index}`}
                              render={({ field }) => (
                                <FormItem>
                                  <div className="flex h-6 justify-between">
                                    <FormLabel className="gap-.5 font-bold text-gray-950">세금</FormLabel>
                                  </div>
                                  <FormControl>
                                    <Input placeholder="세금" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="text-base leading-[1.5] text-gray-700">
                            <FormField
                              control={form.control}
                              name={`expense_total${index}`}
                              render={({ field }) => (
                                <FormItem>
                                  <div className="flex h-6 justify-between">
                                    <FormLabel className="gap-.5 font-bold text-gray-950">합계</FormLabel>
                                  </div>
                                  <FormControl>
                                    <Input placeholder="합계" {...field} />
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
                <div className="bg-primary-blue-100">합계</div>
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
                    <Button variant="outline" size="sm" onClick={() => uploadRef.current?.deleteSelectedFiles()}>
                      선택 삭제
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => uploadRef.current?.deleteAllFiles()}>
                      전체 삭제
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="my-10 flex justify-center gap-2">
            <Button type="submit">등록</Button>
            <Button variant="outline">취소</Button>
          </div>
        </form>
      </Form>

      {alertMsg && (
        <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>예약 실패</AlertDialogTitle>
              <AlertDialogDescription>{alertMsg}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="h-8 px-3.5 text-sm" onClick={() => setAlertOpen(false)}>
                닫기
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
