// ReportMatched.tsx
import { Link } from 'react-router';
import { formatAmount } from '@/utils';
import { Button } from '@components/ui/button';
import { type ReportDTO } from '@/api/expense/proposal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SquareArrowOutUpRight } from 'lucide-react';

interface ReportMatchedProps {
  report: ReportDTO | null;
}

export default function ReportMatched({ report }: ReportMatchedProps) {
  console.log(report);

  return (
    <>
      <Table variant="primary" className="w-full table-fixed">
        <TableHeader>
          <TableRow className="[&_th]:px-2 [&_th]:text-[13px] [&_th]:font-medium">
            <TableHead>기안서</TableHead>
            <TableHead className="w-[28%]">기안서 금액</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {!report ? (
            <TableRow>
              <TableCell colSpan={2} className="h-35 text-center text-[13px] text-gray-700">
                선택된 기안서가 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            <TableRow className="[&_td]:h-11 [&_td]:px-2 [&_td]:text-[12px]">
              <TableCell className="text-left">
                <Link to={`/project/proposal/view/${report.rp_seq}`} target="_blank" className="flex items-center gap-0.5 hover:underline">
                  {report.rp_title} <SquareArrowOutUpRight className="size-3" />
                </Link>
              </TableCell>
              <TableCell className="text-right">{formatAmount(report.rp_cost)}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </>
  );
}
