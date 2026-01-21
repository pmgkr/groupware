// utils.ts (기존 코드 그대로)
import { Badge } from '@/components/ui/badge';

export const statusMap = {
  'in-progress': <Badge variant="secondary">진행중</Badge>,
  Closed: <Badge className="bg-primary-blue">종료됨</Badge>,
  Completed: <Badge variant="grayish">정산완료</Badge>,
  Cancelled: <Badge className="bg-destructive">취소됨</Badge>,
};

export const parseCategories = (cate: string) => cate?.split('|').filter(Boolean) ?? [];
