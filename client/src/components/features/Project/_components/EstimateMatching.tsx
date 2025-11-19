import { Input } from '@components/ui/input';
import { Button } from '@components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function EstimateMatching() {
  return (
    <Table variant="primary" align="center">
      <TableHeader>
        <TableRow className="[&_th]:text-[13px] [&_th]:font-medium">
          <TableHead className="text-left">항목명</TableHead>
          <TableHead className="w-[15%]">이전 금액</TableHead>
          <TableHead className="w-[15%]">매칭 금액 (B)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow className="[&_td]:text-[13px]">
          <TableCell className="text-left">키링 부자재</TableCell>
          <TableCell>100,000</TableCell>
          <TableCell>
            <Input inputMode="numeric" placeholder="금액" size="sm" className="rounded-sm text-right" />
          </TableCell>
        </TableRow>
        <TableRow className="bg-primary-blue-50 [&_td]:text-[13px]">
          <TableCell className="text-left font-bold">매칭 계산 (A - B)</TableCell>
          <TableCell></TableCell>
          <TableCell>0</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
