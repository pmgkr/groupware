// utils.ts (기존 코드 그대로)
import { Badge } from '@/components/ui/badge';

export const statusMap = {
  'in-progress': (
    <Badge variant="secondary" className="h-6 md:h-auto">
      진행중
    </Badge>
  ),
  Closed: <Badge className="bg-primary-blue h-6 md:h-auto">종료됨</Badge>,
  Completed: (
    <Badge variant="grayish" className="h-6 md:h-auto">
      정산완료
    </Badge>
  ),
  Cancelled: <Badge className="bg-destructive h-6 md:h-auto">취소됨</Badge>,
};

export const parseCategories = (cate: string) => cate?.split('|').filter(Boolean) ?? [];
