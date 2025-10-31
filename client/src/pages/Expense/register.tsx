// 비용 등록 및 수정 페이지
// /pages/Expense/register.tsx
import { useParams } from 'react-router';
import ExpenseRegister from '@components/features/Expense/ExpenseRegister';
import ExpenseEdit from '@components/features/Expense/ExpenseEdit';

type RegisterProps = {
  mode?: 'new' | 'edit';
};

export default function Register({ mode }: RegisterProps) {
  const { expId } = useParams();
  const isEditMode = mode === 'edit' || Boolean(expId);

  return isEditMode ? <ExpenseEdit expId={expId!} /> : <ExpenseRegister />;
}
