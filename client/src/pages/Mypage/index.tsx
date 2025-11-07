import { formatKST, formatPhone, getImageUrl } from '@/utils';
import { SectionHeader } from '@components/ui/SectionHeader';
import { Button } from '@components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@components/ui/badge';
import { PlaceMin, MailMin, PhoneMin, Edit, Add, Delete } from '@/assets/images/icons';
import { useEffect, useState } from 'react';
import { getBankCodes, getMyAccounts, getMyProfile, registerMyAccount, type BankAccount, type BankCode, type UserDTO } from '@/api';
import { AppPagination } from '@/components/ui/AppPagination';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@components/ui/form';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';
import { CheckCircle, OctagonAlert } from 'lucide-react';

export default function Mypage() {
  const [user, setUser] = useState<UserDTO | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getMyProfile();
        //console.log('/user/profile 응답:', data);
        setUser(data);
      } catch (err) {
        console.error('❌ 사용자 정보 불러오기 실패:', err);
      }
    })();
  }, []);

  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    (async () => {
      try {
        const data = await getMyAccounts();
        setTotalPages(Math.ceil(data.length / pageSize));

        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;

        setAccounts(data.slice(startIndex, endIndex));
      } catch (err) {
        console.error('❌ 계좌 목록 불러오기 실패:', err);
        setAccounts([]);
      }
    })();
  }, [page]);

  const accountSchema = z.object({
    account_alias: z.string().min(1, '계좌 별명을 입력해주세요.'),
    bank_name: z.string().min(1, '은행명을 선택해주세요.'),
    bank_account: z.string().min(1, '계좌번호를 입력해주세요.'),
    account_name: z.string().min(1, '예금주를 입력해주세요.'),
  });
  type AccountFormData = z.infer<typeof accountSchema>;
  const [open, setOpen] = useState(false);
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
      account_alias: '',
      bank_name: '',
      bank_account: '',
      account_name: '',
    },
  });
  // 제출 핸들러
  const onSubmit = async (data: AccountFormData) => {
    const selectedBank = bankCodes.find((b) => b.code === data.bank_name); // code → name 매핑
    try {
      await registerMyAccount({
        flag: 'mine',
        account_alias: data.account_alias,
        bank_code: data.bank_name,
        bank_name: selectedBank?.name || '', // name optional
        bank_account: data.bank_account,
        account_name: data.account_name,
      });
      //console.log('✅ 계좌 등록 성공:', data);
      addAlert({
        title: '계좌 등록',
        message: `<p><span class="font-semibold">${data.account_alias}</span> 등록이 완료되었습니다.</p>`,
        icon: <CheckCircle />,
        duration: 2000,
      });
      setOpen(false);
      form.reset(); // 닫으면서 초기화
      const updated = await getMyAccounts();
      setAccounts(updated.slice(0, pageSize));
      setTotalPages(Math.ceil(updated.length / pageSize));
    } catch (err) {
      console.error('❌ 계좌 등록 실패:', err);
      alert('계좌 등록 중 오류가 발생했습니다.');
    }
  };
  const { addAlert } = useAppAlert();

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
          <SectionHeader
            title="프로필 수정"
            buttonText="수정"
            buttonIcon={<Edit className="size-4" />}
            onButtonClick={() => console.log('프로필 수정')}
          />
          <div className="mb-12 grid grid-cols-3 gap-y-6 tracking-tight">
            <div className="pr-5 text-base leading-[1.5] text-gray-700">
              <strong className="mb-1 block text-[1.14em] font-bold text-gray-950">팀 이름</strong>
              <span>{user?.team_name}</span>
            </div>
            <div className="short-v-divider px-5 text-base leading-[1.5] text-gray-700">
              <strong className="mb-1 block text-[1.14em] font-bold text-gray-950">생년월일</strong>
              <span>{formatKST(user?.birth_date, true)}</span>
            </div>
            <div className="short-v-divider px-5 text-base leading-[1.5] text-gray-700">
              <strong className="mb-1 block text-[1.14em] font-bold text-gray-950">입사일</strong>
              <span>{formatKST(user?.hire_date, true)}</span>
            </div>

            <div className="pr-5 text-base leading-[1.5] text-gray-700">
              <strong className="mb-1 block text-[1.14em] font-bold text-gray-950">회원 레벨</strong>
              <span>
                <Badge>{user?.user_level}</Badge>
              </span>
            </div>
            <div className="short-v-divider px-5 text-base leading-[1.5] text-gray-700">
              <strong className="mb-1 block text-[1.14em] font-bold text-gray-950">주소</strong>
              <span>{user?.address}</span>
            </div>
            <div className="short-v-divider px-5 text-base leading-[1.5] text-gray-700">
              <strong className="mb-1 block text-[1.14em] font-bold text-gray-950">비상 연락망</strong>
              <span>{user?.emergency_phone}</span>
            </div>
            {/* <div className="short-v-divider px-5 text-base leading-[1.5] text-gray-700">
              <strong className="mb-1 block text-[1.14em] font-bold text-gray-950">대표 은행계좌</strong>
              <span>우리 1000-000-000000 김예지</span>
            </div> */}
          </div>

          <Dialog
            open={open}
            onOpenChange={(isOpen) => {
              setOpen(isOpen);
              if (!isOpen) form.reset();
            }}>
            <div className="mb-6 flex items-center justify-between border-b border-b-gray-300 pb-1.5">
              <SectionHeader title="은행계좌 목록" className="mb-0 border-0" />
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-primary-blue-500">
                  <Add className="size-4" />
                  계좌 추가
                </Button>
              </DialogTrigger>
            </div>
            <DialogContent className="gap-y-6 sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>은행계좌 추가</DialogTitle>
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
                    <Button type="submit">확인</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <div>
            <Table className="mb-6">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[16%]">계좌 별명</TableHead>
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
                      <TableCell>{acc.account_alias}</TableCell>
                      <TableCell>{acc.bank_name}</TableCell>
                      <TableCell>{acc.bank_account}</TableCell>
                      <TableCell>{acc.account_name}</TableCell>
                      <TableCell>{formatKST(acc.wdate)}</TableCell>
                      <TableCell>
                        <Button variant="svgIcon" size="icon">
                          <Edit className="size-4" />
                        </Button>
                        <Button variant="svgIcon" size="icon">
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
