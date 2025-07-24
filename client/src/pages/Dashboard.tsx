import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export default function Dashboard() {
  return (
    <>
      대시보드 페이지
      <div>
        <Switch className="peer" />
        <Label className="peer-data-[state=checked]:text-[color:var(--color-primary-blue-500)]">라벨입니다</Label>
      </div>
    </>
  );
}
