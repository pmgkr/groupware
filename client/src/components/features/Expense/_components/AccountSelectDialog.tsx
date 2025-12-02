// src/components/account/AccountSelectDialog.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import React from 'react';
import type { BankAccount } from '@/api/mypage';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: BankAccount[];
  bankList: { name: string; code: string }[];
  onSelect: (acc: BankAccount) => void;
}

export const AccountSelectDialog: React.FC<Props> = ({ open, onOpenChange, accounts, bankList, onSelect }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>계좌 선택</DialogTitle>
        </DialogHeader>

        {/* 계좌 리스트 */}
        <div className="mt-4 max-h-[300px] overflow-y-auto">
          {accounts.map((acc) => (
            <Button
              key={acc.seq}
              variant="ghost"
              className="[&]:hover:bg-primary-blue-150 w-full justify-start"
              onClick={() => onSelect(acc)}>
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
  );
};
