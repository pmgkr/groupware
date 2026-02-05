// src/components/account/AccountSelectDialog.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import React from 'react';
import type { BankAccount } from '@/api/mypage';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useIsMobileViewport } from '@/hooks/useViewport';

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
  const hasAccounts = accounts.length > 0;
  const isMobile = useIsMobileViewport();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[700px] rounded-lg max-md:w-[400px] max-md:max-w-[calc(100%-var(--spacing)*8)]">
        <DialogHeader>
          <DialogTitle>계좌 선택</DialogTitle>
        </DialogHeader>

        {isMobile ? (
          <MobileAccountList accounts={accounts} onSelect={onSelect} />
        ) : (
          <div>
            {/* HEADER TABLE (고정) */}
            <div className="mt-4">
              <Table>
                <colgroup>
                  <col style={{ width: '20%' }} />
                  <col style={{ width: '20%' }} />
                  <col />
                  <col style={{ width: '20%' }} />
                </colgroup>

                <TableHeader>
                  <TableRow className="text-[13px]">
                    <TableHead>계좌 별명</TableHead>
                    <TableHead>은행명</TableHead>
                    <TableHead>계좌 번호</TableHead>
                    <TableHead>예금주</TableHead>
                  </TableRow>
                </TableHeader>
              </Table>
            </div>

            {/* BODY TABLE (스크롤) */}
            <div className="max-h-[300px] overflow-y-auto">
              <Table>
                <colgroup>
                  <col style={{ width: '20%' }} />
                  <col style={{ width: '20%' }} />
                  <col />
                  <col style={{ width: '20%' }} />
                </colgroup>

                <TableBody>
                  {!hasAccounts ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-10 text-center text-sm text-gray-500">
                        등록된 계좌가 없습니다.
                      </TableCell>
                    </TableRow>
                  ) : (
                    accounts.map((acc) => (
                      <TableRow
                        key={acc.seq}
                        className="hover:bg-primary-blue-100! cursor-pointer text-[13px]"
                        onClick={() => onSelect(acc)}>
                        <TableCell className="text-primary-blue font-semibold whitespace-nowrap">{acc.account_alias}</TableCell>
                        <TableCell className="whitespace-nowrap text-gray-700">{acc.bank_name}</TableCell>
                        <TableCell className="whitespace-nowrap text-gray-700">{acc.bank_account}</TableCell>
                        <TableCell className="whitespace-nowrap text-gray-700">{acc.account_name}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
