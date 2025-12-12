// src/components/account/AccountSelectDialog.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import React from 'react';
import type { BankAccount } from '@/api/mypage';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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
      <DialogContent className="max-w-[700px]">
        <DialogHeader>
          <DialogTitle>계좌 선택</DialogTitle>
        </DialogHeader>

        <div className="mt-4 max-h-[200px] overflow-y-auto">
          <Table>
            {/* 테이블 헤더 */}
            <TableHeader>
              <TableRow className="text-[13px]">
                <TableHead className="w-[20%]">계좌 별명</TableHead>
                <TableHead className="w-[20%]">은행명</TableHead>
                <TableHead>계좌 번호</TableHead>
                <TableHead className="w-[20%]">예금주</TableHead>
              </TableRow>
            </TableHeader>

            {/* 테이블 바디 */}
            <TableBody className="overflow-y-scroll">
              {accounts.map((acc) => (
                <TableRow key={acc.seq} className="hover:bg-primary-blue-100! cursor-pointer text-[13px]" onClick={() => onSelect(acc)}>
                  <TableCell className="text-primary-blue font-semibold whitespace-nowrap">{acc.account_alias}</TableCell>
                  <TableCell className="font-light whitespace-nowrap text-gray-700">{acc.bank_name}</TableCell>
                  <TableCell className="font-light whitespace-nowrap text-gray-700">{acc.bank_account}</TableCell>
                  <TableCell className="font-light whitespace-nowrap text-gray-700">{acc.account_name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};
