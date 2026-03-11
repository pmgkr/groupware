// src/components/account/AccountSelectDialog.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';

import type { BankAccount, BankCode } from '@/api/mypage';
import { getBankCodes, getMyAccounts, registerAccount } from '@/api/mypage/profile';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { CheckCircle, OctagonAlert, Copy } from 'lucide-react';

// ==========================================
// 공통 타입 및 스키마 정의
// ==========================================
type NormalizedBankAccount = BankAccount & {
  bank_code: string;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: BankAccount[];
  onSelect: (acc: BankAccount) => void;
  onRefresh: () => void;
}

const accountSchema = z.object({
  flag: z.enum(['mine', 'exp']).default('exp').optional(),
  account_alias: z.string().min(1, '계좌 별명을 입력해 주세요.'),
  bank_name: z.string().min(1, '은행명을 선택해 주세요.'),
  bank_account: z.string().min(1, '계좌번호를 입력해 주세요.'),
  account_name: z.string().min(1, '예금주를 입력해 주세요.'),
});

type AccountFormData = z.infer<typeof accountSchema>;

// 이미지 에러 핸들러 (전역 생성으로 메모리 절약)
const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  e.currentTarget.onerror = null;
  e.currentTarget.src = '/images/bank_logo/bank_default.png';
};

// ==========================================
// 하위 컴포넌트: 데스크톱 계좌 리스트 (Memoized)
// ==========================================
const AccountList = React.memo(
  ({
    accounts,
    onSelect,
    copyAccount,
  }: {
    accounts: NormalizedBankAccount[];
    onSelect: (acc: BankAccount) => void;
    copyAccount: (acc: string) => void;
  }) => {
    return (
      <div className="w-full">
        <div className="max-h-[280px] space-y-2 overflow-y-auto">
          {accounts.map((acc, index) => (
            <div
              key={acc.seq}
              className="hover:border-primary-blue-150 relative rounded-sm border-1 border-gray-300 p-3 pl-12 transition-colors">
              <div className="absolute top-3 left-3 size-6 overflow-hidden rounded-full border-1 border-gray-300/50">
                <img
                  src={`/images/bank_logo/bank_${acc.bank_code}.png`}
                  alt={acc.bank_name}
                  loading={index < 5 ? 'eager' : 'lazy'}
                  onError={handleImageError}
                />
              </div>
              <div>
                <strong className="font-bold">{acc.account_alias}</strong>
                <div
                  className="flex cursor-pointer items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-600 md:text-[13px]"
                  onClick={() => copyAccount(acc.bank_account)}>
                  {acc.bank_name} {acc.bank_account}
                  <Copy className="size-3" />
                </div>
                <dd className="text-sm text-gray-500 md:text-[13px]">{acc.account_name}</dd>
              </div>
              <Button type="button" size="sm" onClick={() => onSelect(acc)} className="absolute top-3 right-3">
                선택
              </Button>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

AccountList.displayName = 'AccountList';

// ==========================================
// 하위 컴포넌트: 신규 계좌 등록 폼 (Memoized)
// ==========================================
const AccountRegisterForm = React.memo(
  ({
    bankCodes,
    onRefresh,
    onSelect,
    onCancel,
    onSuccess,
  }: {
    bankCodes: BankCode[];
    onRefresh: () => void;
    onSelect: (acc: BankAccount) => void;
    onCancel: () => void;
    onSuccess: () => void;
  }) => {
    const { addAlert } = useAppAlert();

    const form = useForm<AccountFormData>({
      resolver: zodResolver(accountSchema),
      defaultValues: { flag: 'exp', account_alias: '', bank_name: '', bank_account: '', account_name: '' },
    });

    const onSubmit = async (data: AccountFormData) => {
      try {
        const selectedBank = bankCodes.find((b) => b.code === data.bank_name);
        const dto = {
          flag: data.flag || 'exp',
          account_alias: data.account_alias,
          bank_code: data.bank_name,
          bank_name: selectedBank?.name || '',
          bank_account: data.bank_account,
          account_name: data.account_name,
        };

        await registerAccount(dto);

        addAlert({
          title: '계좌 등록',
          message: `<p><strong>${dto.account_alias}</strong> 계좌가 등록되었습니다.</p>`,
          icon: <CheckCircle className="text-green-500" />,
          duration: 2000,
        });

        // 등록 성공 시 자동 선택 후 부모 목록 갱신
        const updated = await getMyAccounts();
        const newlyCreatedAccount = updated.find((acc) => acc.bank_account === dto.bank_account);

        if (newlyCreatedAccount) {
          onSelect(newlyCreatedAccount);
          onRefresh();
          onSuccess(); // 모달 닫기
        } else {
          onRefresh();
          form.reset();
          onCancel(); // 성공했으나 매칭 안될 시 선택 탭으로 이동
        }
      } catch (err) {
        addAlert({
          title: '오류',
          message: `<p>계좌 처리 중 오류가 발생했습니다.</p>`,
          icon: <OctagonAlert className="text-red-500" />,
          duration: 3000,
        });
      }
    };

    return (
      <Form {...form}>
        <form className="w-full space-y-4">
          <div className="flex items-end gap-x-3">
            <FormField
              control={form.control}
              name="account_alias"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <div className="flex items-center justify-between">
                    <FormLabel className="leading-5">계좌별명</FormLabel>
                    <FormMessage />
                  </div>
                  <FormControl>
                    <Input placeholder="계좌별명을 입력해 주세요" {...field} />
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
                      placeholder="계좌번호를 입력해 주세요"
                      {...field}
                      onChange={(e) => {
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
                    <Input placeholder="예금주를 입력해 주세요" {...field} />
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
                    checked={field.value === 'mine'}
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
                onCancel();
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
    );
  }
);

AccountRegisterForm.displayName = 'AccountRegisterForm';

// ==========================================
// 메인 다이얼로그 컴포넌트
// ==========================================
export const AccountSelectDialog: React.FC<Props> = ({ open, onOpenChange, accounts, onSelect, onRefresh }) => {
  const { addAlert } = useAppAlert();

  const [tab, setTab] = useState<'select' | 'regi'>('select');
  const [bankCodes, setBankCodes] = useState<BankCode[]>([]);

  const handleTabChange = useCallback((newTab: 'select' | 'regi') => {
    setTab(newTab);
  }, []);

  // 모달 오픈 시 은행 코드 최초 1회 로드
  useEffect(() => {
    let isMounted = true;
    if (open && bankCodes.length === 0) {
      getBankCodes()
        .then((data) => {
          if (isMounted) setBankCodes(data);
        })
        .catch((err) => console.error('❌ 은행 코드 불러오기 실패:', err));
    }
    return () => {
      isMounted = false;
    };
  }, [open]); // bankCodes.length는 가드 조건으로 충분하므로 dep에서 제거

  // 클립보드 복사 함수 (재생성 방지)
  const copyAccount = useCallback(
    async (acc: string) => {
      try {
        await navigator.clipboard.writeText(acc);
        addAlert({
          title: '클립보드 복사',
          message: `<p>계좌번호가 클립보드에 복사되었습니다.</p>`,
          icon: <Copy className="text-green-500" />,
          duration: 1500,
        });
      } catch (err) {
        addAlert({ title: '클립보드 복사 실패', message: `<p>클립보드에 복사할 수 없습니다.</p>`, icon: <OctagonAlert />, duration: 1500 });
      }
    },
    [addAlert]
  );

  // 은행 맵핑 최적화
  const bankCodeMap = useMemo(() => {
    const map = new Map<string, string>();
    bankCodes.forEach((b) => map.set(b.name, b.code));
    return map;
  }, [bankCodes]);

  // 계좌 정규화 및 정렬 최적화
  const normalizedAccounts = useMemo(() => {
    return [...accounts]
      .map((acc) => ({
        ...acc,
        bank_code: bankCodeMap.get(acc.bank_name) || '',
      }))
      .sort((a, b) => {
        if (a.flag === 'mine' && b.flag !== 'mine') return -1;
        if (a.flag !== 'mine' && b.flag === 'mine') return 1;

        const dateA = a.wdate ? new Date(a.wdate).getTime() : 0;
        const dateB = b.wdate ? new Date(b.wdate).getTime() : 0;
        return dateB - dateA;
      });
  }, [accounts, bankCodeMap]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex min-h-90 max-w-lg flex-col gap-6 rounded-lg max-md:w-[400px] max-md:max-w-[calc(100%-var(--spacing)*8)] max-md:px-4">
        <DialogHeader className="shrink-0">
          <DialogTitle>
            <button
              type="button"
              onClick={() => handleTabChange('select')}
              className={`cursor-pointer transition-colors ${tab === 'select' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-500'}`}>
              계좌 선택
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('regi')}
              className={`short-v-divider ml-2 cursor-pointer pl-2 transition-colors before:h-full before:bg-gray-400 first:before:block ${tab === 'regi' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-500'}`}>
              신규 계좌 등록
            </button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex w-full flex-1">
          {tab === 'select' ? (
            normalizedAccounts.length === 0 ? (
              <div className="flex w-full flex-col items-center justify-center gap-4 pb-6">
                <p className="text-lg text-gray-600">등록된 계좌가 없습니다.</p>
                <Button type="button" onClick={() => handleTabChange('regi')}>
                  신규 계좌 등록
                </Button>
              </div>
            ) : (
              <AccountList accounts={normalizedAccounts} onSelect={onSelect} copyAccount={copyAccount} />
            )
          ) : (
            <AccountRegisterForm
              bankCodes={bankCodes}
              onRefresh={onRefresh}
              onSelect={onSelect}
              onCancel={() => handleTabChange('select')}
              onSuccess={() => onOpenChange(false)}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
