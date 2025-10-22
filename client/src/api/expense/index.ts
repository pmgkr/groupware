// /api/expense/index.ts
import { http } from '@/lib/http';

export type ExpenseType = {
  code: string;
};

export type BankList = {
  code: string;
  name: string;
};

export async function getBankList(): Promise<BankList[]> {
  // 일반비용 유형 가져오기
  return http<BankList[]>(`/user/common/codeList?ctype=bank`, { method: 'GET' });
}

export async function getExpenseType(type: string): Promise<ExpenseType[]> {
  // 일반비용 유형 가져오기
  return http<ExpenseType[]>(`/user/common/codeList?ctype=${type}`, { method: 'GET' });
}
