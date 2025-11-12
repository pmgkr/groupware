import { formatKST, formatPhone, getImageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { SectionHeader } from '@components/ui/SectionHeader';
import { Button } from '@components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@components/ui/badge';
import { PlaceMin, MailMin, PhoneMin, Edit, Add, Delete, Calendar } from '@/assets/images/icons';
import { useEffect, useState } from 'react';
import {
  deleteAccount,
  editMyProfile,
  getBankCodes,
  getMyAccounts,
  getMyProfile,
  registerAccount,
  updateAccount,
  type BankAccount,
  type BankCode,
  type UserDTO,
} from '@/api/mypage';
import { AppPagination } from '@/components/ui/AppPagination';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@components/ui/form';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';
import { useAppDialog } from '@/components/common/ui/AppDialog/AppDialog';
import { BookUser, CheckCircle, Crown, CrownIcon, DeleteIcon, FlagTriangleRight, OctagonAlert } from 'lucide-react';
import { CheckboxButton } from '@/components/ui/checkboxButton';
import { DayPicker } from '@components/daypicker';
import { Popover, PopoverTrigger, PopoverContent } from '@components/ui/popover';

export default function Mypage() {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState<UserDTO | null>(null);
  const [isBirthOpen, setIsBirthOpen] = useState(false);
  const [isHireOpen, setIsHireOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await getMyProfile();
        //console.log('/user/profile 응답:', data);
        setUser(data);
        setEditedUser(data);
      } catch (err) {
        console.error('❌ 사용자 정보 불러오기 실패:', err);
      }
    })();
  }, []);

  //프로필 수정 저장
  const handleEditSave = async () => {
    if (!editedUser) return;
    // 날짜 변환 함수
    const formatDate = (value?: string | null) => {
      if (!value) return '';
      // ISO 문자열인 경우만 처리
      if (value.includes('T')) return value.split('T')[0];
      // "2025-10-10 00:00:00" 같은 경우
      if (value.includes(' ')) return value.split(' ')[0];
      return value;
    };
    try {
      await editMyProfile({
        birth_date: formatDate(editedUser.birth_date),
        hire_date: formatDate(editedUser.hire_date),
        address: editedUser.address || '',
        emergency_phone: editedUser.emergency_phone || '',
        phone: editedUser.phone || '',
      });

      addAlert({
        title: '프로필 수정',
        message: `<p>프로필이 수정되었습니다.</p>`,
        icon: <CheckCircle />,
        duration: 2000,
      });

      setUser(editedUser);
      setIsEditing(false);
    } catch (err) {
      console.error('❌ 프로필 수정 실패:', err);
      addAlert({
        title: '프로필 수정 오류',
        message: `<p>프로필이 수정에 실패하였습니다.</p>`,
        icon: <CheckCircle />,
        duration: 2000,
      });
    }
  };
  // 프로필 수정 취소
  const handleCancel = () => {
    setEditedUser(user); // 원래 값 복원
    setIsEditing(false);
  };

  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    (async () => {
      try {
        const data = await getMyAccounts();

        // 전체 데이터 정렬 (mine 먼저, 그다음 최신순)
        const sorted = [...data].sort((a, b) => {
          if (a.flag === 'mine' && b.flag !== 'mine') return -1;
          if (b.flag === 'mine' && a.flag !== 'mine') return 1;
          return new Date(b.wdate).getTime() - new Date(a.wdate).getTime();
        });
        setTotalPages(Math.ceil(sorted.length / pageSize));

        //현재 페이지에 해당하는 데이터만 잘라서 표시
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        setAccounts(sorted.slice(startIndex, endIndex));
      } catch (err) {
        console.error('❌ 계좌 목록 불러오기 실패:', err);
        setAccounts([]);
      }
    })();
  }, [page]);

  const accountSchema = z.object({
    flag: z.enum(['mine', 'exp']).default('exp').optional(),
    account_alias: z.string().min(1, '계좌 별명을 입력해주세요.'),
    bank_name: z.string().min(1, '은행명을 선택해주세요.'),
    bank_account: z.string().min(1, '계좌번호를 입력해주세요.'),
    account_name: z.string().min(1, '예금주를 입력해주세요.'),
  });
  type AccountFormData = z.infer<typeof accountSchema>;
  const [open, setOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<BankAccount | null>(null);
  const [bankCodes, setBankCodes] = useState<BankCode[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const data = await getBankCodes();

        setBankCodes(data);
      } catch (err) {
        console.error('❌ 은행 코드 목록 불러오기 실패:', err);
      }
    })();
  }, []);
  const form = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      flag: 'exp',
      account_alias: '',
      bank_name: '',
      bank_account: '',
      account_name: '',
    },
  });

  useEffect(() => {
    if (open && editAccount && bankCodes.length > 0) {
      // ⭐ bank_name으로 bank_code 역으로 찾기
      const foundBank = bankCodes.find((b) => b.name === editAccount.bank_name);

      if (!foundBank) {
        console.warn('⚠️ 은행을 찾을 수 없습니다:', editAccount.bank_name);
      }

      form.reset({
        flag: editAccount.flag as 'mine' | 'exp',
        account_alias: editAccount.account_alias,
        bank_name: foundBank?.code || '', // code를 사용
        bank_account: editAccount.bank_account,
        account_name: editAccount.account_name,
      });
    } else if (open && !editAccount) {
      form.reset({
        account_alias: '',
        bank_name: '',
        bank_account: '',
        account_name: '',
      });
    }
  }, [open, editAccount, bankCodes, form]);

  const onSubmit = async (data: AccountFormData) => {
    try {
      const selectedBank = bankCodes.find((b) => b.code === data.bank_name); // code → name 매핑
      const dto = {
        flag: data.flag || 'exp',
        account_alias: data.account_alias,
        bank_code: data.bank_name,
        bank_name: selectedBank?.name || '', // name optional
        bank_account: data.bank_account,
        account_name: data.account_name,
      };

      if (editAccount) {
        //수정
        await updateAccount(editAccount.seq, dto);
        addAlert({
          title: '계좌 수정',
          message: `<p><strong>${dto.account_alias}</strong> 계좌가 수정되었습니다.</p>`,
          icon: <CheckCircle className="text-green-500" />,
          duration: 2000,
        });
      } else {
        //등록
        await registerAccount(dto);
        addAlert({
          title: '계좌 등록',
          message: `<p><strong>${dto.account_alias}</strong> 계좌가 등록되었습니다.</p>`,
          icon: <CheckCircle className="text-green-500" />,
          duration: 2000,
        });
      }
      //console.log('✅ 계좌 등록 성공:', data);

      //닫기 및 초기화
      setOpen(false);
      setEditAccount(null);
      form.reset();
      //리스트 갱신
      const updated = await getMyAccounts();
      setAccounts(updated.slice(0, pageSize));
      setTotalPages(Math.ceil(updated.length / pageSize));
    } catch (err) {
      console.error('❌ 계좌 등록/수정 실패:', err);
      addAlert({
        title: '오류',
        message: `<p>계좌 처리 중 오류가 발생했습니다.</p>`,
        icon: <OctagonAlert className="text-red-500" />,
        duration: 3000,
      });
    }
  };

  //계좌 삭제
  const handleDeleteAccount = async (seq: number) => {
    try {
      await deleteAccount(seq);
      const updated = await getMyAccounts();
      setAccounts(updated.slice(0, pageSize));
      setTotalPages(Math.ceil(updated.length / pageSize));
    } catch (err) {
      console.error('❌ 계좌 삭제 실패:', err);
      alert('계좌 삭제 중 오류가 발생했습니다.');
    }
  };

  const { addAlert } = useAppAlert();
  const { addDialog } = useAppDialog();

  return (
    <>
      <section className="flex flex-col gap-y-5">
        <div className="flex items-center gap-x-14 rounded-md border border-gray-300 px-20 py-6">
          <div className="relative aspect-square w-36 overflow-hidden rounded-[50%]">
            <img src={getImageUrl('dummy/profile')} alt="프로필 이미지" className="h-full w-full object-cover" />
          </div>
          <div className="text-base font-medium tracking-tight text-gray-950">
            <div className="flex items-center gap-x-1.5 text-[.875em] text-gray-500">
              {user?.branch}
              <PlaceMin className="inline-block size-3.5" />
            </div>
            <div className="my-2.5">
              <strong className="block text-[1.5em] font-bold">{user?.user_name_en}</strong>
              {user?.job_role}
            </div>
            <ul className="flex items-center gap-x-4 text-[.875em] font-normal">
              <li className="flex items-center gap-x-1.5">
                <MailMin className="size-5" />
                <span>{user?.user_id}</span>
              </li>
              <li className="flex items-center gap-x-1.5">
                <PhoneMin className="size-5" />
                <span>{formatPhone(user?.phone)}</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="rounded-md border border-gray-300 px-18.5 py-12.5">
          <div className="mb-6 flex items-center justify-between border-b border-b-gray-300 pb-1.5">
            <SectionHeader title="프로필 수정" className="mb-0 border-0" />
            <div className="flex gap-x-2">
              {isEditing ? (
                <>
                  <Button size="sm" onClick={handleEditSave}>
                    수정완료
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancel}>
                    취소
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} className="text-primary-blue-500">
                  <Edit className="mr-1 size-4" />
                  수정
                </Button>
              )}
            </div>
          </div>

          <div className="mb-15 grid grid-cols-3 gap-y-6 tracking-tight">
            <div className="pr-5 text-base leading-[1.5] text-gray-700">
              <strong className="mb-1 block text-[1.14em] font-bold text-gray-950">팀 이름</strong>
              <span>{user?.team_name}</span>
            </div>
            <div className="short-v-divider px-5 text-base leading-[1.5] text-gray-700">
              <strong className="mb-1 block text-[1.14em] font-bold text-gray-950">생년월일</strong>
              {isEditing ? (
                <Popover open={isBirthOpen} onOpenChange={setIsBirthOpen}>
                  <div className="relative w-full">
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'border-input focus-visible:border-primary-blue-300 h-9 w-full px-3 text-left text-sm font-normal text-gray-700 hover:bg-[none]',
                          !editedUser?.birth_date && 'text-muted-foreground hover:text-muted-foreground',
                          isBirthOpen && 'border-primary-blue-300'
                        )}>
                        {editedUser?.birth_date ? String(formatKST(editedUser.birth_date, true)) : <span>YYYY-MM-DD</span>}
                        <Calendar className="ml-auto size-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                  </div>

                  <PopoverContent className="w-auto p-0" align="start">
                    <DayPicker
                      captionLayout="dropdown"
                      mode="single"
                      selected={editedUser?.birth_date ? new Date(editedUser.birth_date) : undefined}
                      onSelect={(date) => {
                        const formatted = date ? formatKST(date) : '';
                        setEditedUser({ ...editedUser!, birth_date: formatted });
                        if (date) setIsBirthOpen(false);
                      }}
                    />
                  </PopoverContent>
                </Popover>
              ) : (
                <span>{formatKST(user?.birth_date, true)}</span>
              )}
            </div>
            <div className="short-v-divider px-5 text-base leading-[1.5] text-gray-700">
              <strong className="mb-1 block text-[1.14em] font-bold text-gray-950">입사일</strong>
              {isEditing ? (
                <Popover open={isHireOpen} onOpenChange={setIsHireOpen}>
                  <div className="relative w-full">
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'border-input focus-visible:border-primary-blue-300 h-9 w-full px-3 text-left text-sm font-normal text-gray-700 hover:bg-[none]',
                          !editedUser?.birth_date && 'text-muted-foreground hover:text-muted-foreground',
                          isHireOpen && 'border-primary-blue-300'
                        )}>
                        {editedUser?.birth_date ? String(formatKST(editedUser.hire_date, true)) : <span>YYYY-MM-DD</span>}
                        <Calendar className="ml-auto size-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                  </div>

                  <PopoverContent className="w-auto p-0" align="start">
                    <DayPicker
                      captionLayout="dropdown"
                      mode="single"
                      selected={editedUser?.hire_date ? new Date(editedUser.hire_date) : undefined}
                      onSelect={(date) => {
                        const formatted = date ? formatKST(date) : '';
                        setEditedUser({ ...editedUser!, hire_date: formatted });
                        if (date) setIsHireOpen(false);
                      }}
                    />
                  </PopoverContent>
                </Popover>
              ) : (
                <span>{formatKST(user?.hire_date, true)}</span>
              )}
            </div>

            <div className="pr-5 text-base leading-[1.5] text-gray-700">
              <strong className="mb-1 block text-[1.14em] font-bold text-gray-950">회원 레벨</strong>
              <span>
                <Badge>{user?.user_level}</Badge>
              </span>
            </div>
            <div className="short-v-divider px-5 text-base leading-[1.5] text-gray-700">
              <strong className="mb-1 block text-[1.14em] font-bold text-gray-950">주소</strong>
              {isEditing ? (
                <Input
                  className="h-9"
                  value={editedUser?.address || ''}
                  onChange={(e) => setEditedUser({ ...editedUser!, address: e.target.value })}
                />
              ) : (
                <span>{user?.address}</span>
              )}
            </div>
            <div className="short-v-divider px-5 text-base leading-[1.5] text-gray-700">
              <strong className="mb-1 block text-[1.14em] font-bold text-gray-950">비상 연락망</strong>
              {isEditing ? (
                <Input
                  className="h-9"
                  value={editedUser?.emergency_phone || ''}
                  onChange={(e) => setEditedUser({ ...editedUser!, emergency_phone: e.target.value })}
                />
              ) : (
                <span>{user?.emergency_phone}</span>
              )}
            </div>
          </div>

          <Dialog
            open={open}
            onOpenChange={(isOpen) => {
              setOpen(isOpen);
              if (!isOpen) {
                setEditAccount(null);
                form.reset();
              }
            }}>
            <div className="mb-6 flex items-center justify-between border-b border-b-gray-300 pb-1.5">
              <SectionHeader title="은행계좌 목록" className="mb-0 border-0" />
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-primary-blue-500"
                  onClick={() => {
                    setEditAccount(null);
                    form.reset();
                  }}>
                  <Add className="size-4" />
                  계좌 추가
                </Button>
              </DialogTrigger>
            </div>
            <DialogContent className="gap-y-6 sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{editAccount ? '은행계좌 수정' : '은행계좌 추가'}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="flex items-end gap-x-3">
                    <FormField
                      control={form.control}
                      name="account_alias"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <div className="flex items-center justify-between">
                            <FormLabel className="leading-5">계좌 별명</FormLabel>
                            <FormMessage />
                          </div>
                          <FormControl>
                            <Input placeholder="계좌 별명을 입력해주세요" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bank_name"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <div className="flex items-center justify-between">
                            <FormLabel className="leading-5">은행명</FormLabel>
                            <FormMessage />
                          </div>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="은행을 선택하세요" />
                              </SelectTrigger>
                              <SelectContent>
                                {bankCodes.map((bank) => (
                                  <SelectItem key={bank.code} value={bank.code}>
                                    {bank.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex items-end gap-x-3">
                    <FormField
                      control={form.control}
                      name="bank_account"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <div className="flex items-center justify-between">
                            <FormLabel className="leading-5">계좌번호</FormLabel>
                            <FormMessage />
                          </div>
                          <FormControl>
                            <Input
                              placeholder="계좌번호를 입력하세요"
                              {...field}
                              onChange={(e) => {
                                // 숫자(0-9)와 하이픈(-)만 허용
                                const filtered = e.target.value.replace(/[^0-9-]/g, '');
                                field.onChange(filtered);
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="account_name"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <div className="flex items-center justify-between">
                            <FormLabel className="leading-5">예금주</FormLabel>
                            <FormMessage />
                          </div>
                          <FormControl>
                            <Input placeholder="예금주 명을 입력하세요" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex">
                    <FormField
                      control={form.control}
                      name="flag"
                      render={({ field }) => (
                        <FormItem>
                          <CheckboxButton
                            id="flag"
                            label="내 계좌 설정"
                            size="md"
                            variant="dynamic"
                            className="mt-2.5 flex-1 text-gray-500"
                            checked={field.value === 'mine'} // ✅ 체크 상태 → mine
                            onCheckedChange={(checked) => field.onChange(checked ? 'mine' : 'exp')}
                          />
                        </FormItem>
                      )}
                    />
                  </div>
                  <DialogFooter className="pt-8">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setOpen(false);
                        form.reset();
                      }}>
                      취소
                    </Button>
                    <Button type="submit">{editAccount ? '수정' : '확인'}</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <div>
            <Table className="mb-6">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[5%] pr-0"></TableHead>
                  <TableHead className="w-[15%]">계좌 별명</TableHead>
                  <TableHead className="w-[16%]">은행명</TableHead>
                  <TableHead className="w-[16%]">계좌 번호</TableHead>
                  <TableHead className="w-[18%]">예금주</TableHead>
                  <TableHead className="w-[22%]">등록일시</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.length > 0 ? (
                  accounts.map((acc) => (
                    <TableRow key={acc.seq}>
                      <TableCell className="pr-0">
                        {acc.flag === 'mine' && <CrownIcon className="inline-block size-5 text-yellow-500" />}
                      </TableCell>
                      <TableCell>{acc.account_alias}</TableCell>
                      <TableCell>{acc.bank_name}</TableCell>
                      <TableCell>{acc.bank_account}</TableCell>
                      <TableCell>{acc.account_name}</TableCell>
                      <TableCell>{formatKST(acc.wdate)}</TableCell>
                      {/* 수정 삭제 버튼 */}
                      <TableCell>
                        <Button
                          variant="svgIcon"
                          size="icon"
                          onClick={() => {
                            setEditAccount(acc);
                            setOpen(true);
                          }}>
                          <Edit className="size-4" />
                        </Button>

                        <Button
                          variant="svgIcon"
                          size="icon"
                          onClick={() =>
                            addDialog({
                              title: '<span class="font-semibold"> 계좌 삭제</span>',
                              message: `${acc.account_alias} 계좌를 삭제하시겠습니까?`,
                              confirmText: '삭제',
                              cancelText: '취소',
                              onConfirm: () => {
                                (handleDeleteAccount(acc.seq),
                                  addAlert({
                                    title: '계좌 삭제',
                                    message: `<p>삭제가 완료되었습니다.</p>`,
                                    icon: <DeleteIcon />,
                                    duration: 2000,
                                  }));
                              },
                            })
                          }>
                          <Delete className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-gray-400">
                      등록된 계좌가 없습니다.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {accounts.length > 0 && (
              <div className="mt-5">
                <AppPagination totalPages={totalPages} initialPage={page} visibleCount={5} onPageChange={(newPage) => setPage(newPage)} />
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
