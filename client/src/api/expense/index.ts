// /api/expense/index.ts
import { http } from '@/lib/http';

export type ExpenseType = {
  code: string;
};

export async function getExpenseType(type: string): Promise<ExpenseType[]> {
  // 일반비용 유형 가져오기
  return http<ExpenseType[]>(`/user/common/codeList?ctype=${type}`, { method: 'GET' });
}
