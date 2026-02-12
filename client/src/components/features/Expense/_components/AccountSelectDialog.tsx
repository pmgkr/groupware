// src/components/account/AccountSelectDialog.tsx
import React from 'react';
import { useIsMobileViewport } from '@/hooks/useViewport';

import type { BankAccount, BankCode } from '@/api/mypage';
import { getBankCodes, getMyAccounts, registerAccount } from '@/api/mypage/profile';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';
import { useAppDialog } from '@/components/common/ui/AppDialog/AppDialog';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { CheckCircle, OctagonAlert, Copy } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: BankAccount[];
  bankList: { name: string; code: string }[];
  onSelect: (acc: BankAccount) => void;
}

function MobileAccountList({ accounts, onSelect }: { accounts: BankAccount[]; onSelect: (acc: BankAccount) => void }) {
  if (accounts.length === 0) {
    return <div className="py-10 text-center text-sm text-gray-500">등록된 계좌가 없습니다.</div>;
  }

  return (
    <div className="mt-4 space-y-3">
      {accounts.map((acc) => (
        <button
          key={acc.seq}
          onClick={() => onSelect(acc)}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-left active:bg-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-primary-blue w-[65%] truncate text-sm font-semibold">{acc.account_alias}</span>
            <span className="text-sm text-gray-500">{acc.bank_name}</span>
          </div>
          <div className="mt-1 text-base text-gray-800">{acc.bank_account}</div>
          <div className="mt-1 text-sm text-gray-800">{acc.account_name}</div>
        </button>
      ))}
    </div>
  );
}

export const AccountSelectDialog: React.FC<Props> = ({ open, onOpenChange, accounts, onSelect }) => {
  const { addAlert } = useAppAlert();
  const { addDialog } = useAppDialog();
  const isMobile = useIsMobileViewport();

  const [tab, setTab] = React.useState<'select' | 'regi'>('select');
  const [bankCodes, setBankCodes] = React.useState<BankCode[]>([]);
  const [localAccounts, setLocalAccounts] = React.useState<BankAccount[]>(accounts);

  React.useEffect(() => {
    (async () => {
      try {
        const data = await getBankCodes();
        setBankCodes(data);
      } catch (err) {
        console.error('❌ 은행 코드 목록 불러오기 실패:', err);
      }
    })();
  }, []);

  // 뱅크 이름으로 뱅크 코드 매핑
  const bankCodeMap = React.useMemo(() => {
    const map = new Map<string, string>();
    bankCodes.forEach((b) => {
      map.set(b.name, b.code);
    });
    return map;
  }, [bankCodes]);

  // accounts 정규화
  const normalizedAccounts = React.useMemo(() => {
    return accounts.map((acc) => ({
      ...acc,
      bank_code: bankCodeMap.get(acc.bank_name),
    }));
  }, [accounts, bankCodeMap]);

  const accountSchema = z.object({
    flag: z.enum(['mine', 'exp']).default('exp').optional(),
    account_alias: z.string().min(1, '계좌 별명을 입력해 주세요.'),
    bank_name: z.string().min(1, '은행명을 선택해 주세요.'),
    bank_account: z.string().min(1, '계좌번호를 입력해 주세요.'),
    account_name: z.string().min(1, '예금주를 입력해 주세요.'),
  });

  type AccountFormData = z.infer<typeof accountSchema>;

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

  const onSubmit = async (data: AccountFormData) => {
    try {
      const dto = {
        flag: data.flag || 'exp',
        account_alias: data.account_alias,
        bank_name: data.bank_name,
        bank_account: data.bank_account,
        account_name: data.account_name,
      };

      console.log('dto', dto);

      await registerAccount(dto);

      addAlert({
        title: '계좌 등록',
        message: `<p><strong>${dto.account_alias}</strong> 계좌가 등록되었습니다.</p>`,
        icon: <CheckCircle className="text-green-500" />,
        duration: 2000,
      });

      // 등록 후 즉시 리스트 반영
      const updated = await getMyAccounts();
      setLocalAccounts(updated);
      // onSelect()

      form.reset();
      setTab('select');
    } catch (err) {
      addAlert({
        title: '오류',
        message: `<p>계좌 처리 중 오류가 발생했습니다.</p>`,
        icon: <OctagonAlert className="text-red-500" />,
        duration: 3000,
      });
    }
  };

  React.useEffect(() => {
    setLocalAccounts(accounts);
  }, [accounts]);

  const hasAccounts = normalizedAccounts.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-h-90 max-w-lg rounded-lg max-md:w-[400px] max-md:max-w-[calc(100%-var(--spacing)*8)]">
        <DialogHeader>
          <DialogTitle>
            <button
              type="button"
              onClick={() => setTab('select')}
              className={`cursor-pointer ${tab === 'select' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-500'}`}>
              계좌 선택
            </button>
            <button
              type="button"
              onClick={() => setTab('regi')}
              className={`short-v-divider ml-2 cursor-pointer pl-2 before:h-full before:bg-gray-400 first:before:block ${tab === 'regi' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-500'} `}>
              신규 계좌 등록
            </button>
          </DialogTitle>
        </DialogHeader>

        {tab === 'select' ? (
          isMobile ? (
            <MobileAccountList accounts={normalizedAccounts} onSelect={onSelect} />
          ) : (
            <div className="h-full">
              <div className="max-h-[300px] space-y-2 overflow-y-auto">
                {!hasAccounts ? (
                  <div>등록된 계좌가 없습니다.</div>
                ) : (
                  normalizedAccounts.map((acc) => (
                    <div
                      key={acc.seq}
                      className="hover:border-primary-blue-150 relative cursor-pointer rounded-sm border-1 border-gray-300 p-3 pl-12">
                      <div className="absolute top-3 left-3 size-6 overflow-hidden rounded-full border-1 border-gray-300/50">
                        <img src={`/src/assets/images/bank_logo/bank_${acc.bank_code}.png`} alt={acc.bank_name} />
                      </div>
                      <dl>
                        <dt className="font-bold">{acc.account_alias}</dt>
                        <dd className="flex items-center gap-2 text-sm text-gray-500 md:text-[13px]">
                          {acc.bank_name} {acc.bank_account} <Copy className="size-3" />
                        </dd>
                        <dd className="text-sm text-gray-500 md:text-[13px]">{acc.account_name}</dd>
                      </dl>
                      <Button type="button" size="sm" onClick={() => onSelect(acc)} className="absolute top-3 right-3">
                        선택
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        ) : (
          <Form {...form}>
            <form className="space-y-4">
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
                              <SelectItem key={bank.code} value={bank.name}>
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

              <div className="flex items-center">
                <FormField
                  control={form.control}
                  name="flag"
                  render={({ field }) => (
                    <FormItem>
                      <Checkbox
                        id="flag"
                        label="대표 설정"
                        size="md"
                        checked={field.value === 'mine'} // ✅ 체크 상태 → mine
                        onCheckedChange={(checked) => field.onChange(checked ? 'mine' : 'exp')}
                      />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    form.reset();
                  }}
                  className="max-sm:flex-1">
                  취소
                </Button>
                <Button type="button" className="max-sm:flex-1" onClick={form.handleSubmit(onSubmit)}>
                  저장 및 적용
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};
